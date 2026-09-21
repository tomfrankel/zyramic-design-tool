import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { screenPalisadeCip } from "../shared/cip.js";
import { newId } from "../shared/id.js";
import { ALPER_SWING_BUDGETARY_USD_PER_M2, palisadeLineItems, swingLineItems, unknownCommercialTerms } from "../shared/lineItems.js";
import { sizePalisade } from "../shared/palisade.js";
import { buildProposalPdf } from "../shared/pdf.js";
import { palisadeProposal, swingProposal } from "../shared/proposal.js";
import { canSeePricing, isRole } from "../shared/roles.js";
import { sizeSwing } from "../shared/swing.js";
import { persistOrderFolder } from "./adapters/dropbox.js";
import { attachToDealStub } from "./adapters/hubspot.js";
import { demoKeys, parseRole, requireRole, requireZone, setRoleCookie, type AuthedRequest } from "./auth.js";
import { store } from "./store.js";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "4mb" }));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function readPublic(rel: string): Uint8Array | null {
  try {
    return fs.readFileSync(path.join(root, "public", rel));
  } catch {
    return null;
  }
}

function logoBytes(): Uint8Array | null {
  return readPublic("brand/logo-bw-white-official.png") || readPublic("brand/logo-official.png");
}

function headerLogoBytes(): Uint8Array | null {
  return readPublic("brand/logo-bw-white-official.png") || logoBytes();
}

function brandFonts() {
  return {
    serifFontBytes: readPublic("fonts/SourceSerif4-Semibold.ttf"),
    kickerFontBytes: readPublic("fonts/Archivo-Regular.ttf")
  };
}

function oemFlag(sellMarginPct?: number | null) {
  const raw = process.env.SWING_OEM_ESTIMATE_USD_PER_M2;
  const n = raw ? Number(raw) : ALPER_SWING_BUDGETARY_USD_PER_M2;
  return {
    swingOemUsdPerM2: n != null && Number.isFinite(n) && n > 0 ? n : ALPER_SWING_BUDGETARY_USD_PER_M2,
    sellMarginPct: sellMarginPct ?? null
  };
}

app.get("/api/health", (_req, res) => {
  res.json({
    name: "Zyramic Proposal Software",
    status: "draft",
    zones: ["sizing", "commercial"],
    products: ["Palisade", "Swing MBR"]
  });
});

app.get("/api/session", (req, res) => {
  const role = parseRole(req);
  res.json({
    role,
    canSeePricing: role ? canSeePricing(role) : false,
    demoRoles: Object.keys(demoKeys())
  });
});

app.post("/api/auth/login", (req, res) => {
  const role = req.body?.role;
  const key = String(req.body?.key || "");
  if (!isRole(role)) {
    res.status(400).json({ error: "Unknown role" });
    return;
  }
  if (key !== demoKeys()[role]) {
    res.status(401).json({ error: "Demo key does not match role" });
    return;
  }
  setRoleCookie(res, role);
  res.json({ role, canSeePricing: canSeePricing(role) });
});

app.post("/api/auth/logout", (_req, res) => {
  res.setHeader("Set-Cookie", "zy_role=; Path=/; Max-Age=0");
  res.json({ ok: true });
});

app.post("/api/sizing/palisade", requireRole, (req: AuthedRequest, res) => {
  const result = sizePalisade(req.body || {});
  res.json({ zone: "sizing", role: req.role, result });
});

app.post("/api/sizing/palisade/cip", requireRole, (req: AuthedRequest, res) => {
  res.json({ zone: "sizing", role: req.role, result: screenPalisadeCip(req.body || {}) });
});

app.post("/api/sizing/swing", requireRole, (req: AuthedRequest, res) => {
  const result = sizeSwing(req.body || {});
  res.json({ zone: "sizing", role: req.role, result });
});

app.post("/api/sizing/proposal.pdf", requireRole, async (req: AuthedRequest, res) => {
  try {
    const bytes = await makePdf(req.body || {}, req.role!, false);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=proposal.pdf");
    res.send(Buffer.from(bytes));
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

app.get("/api/commercial/customers", requireRole, requireZone("commercial"), (_req, res) => {
  res.json({ customers: store.listCustomers() });
});

app.post("/api/commercial/customers", requireRole, requireZone("commercial"), (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) {
    res.status(400).json({ error: "Customer name required" });
    return;
  }
  res.json(store.createCustomer(name));
});

app.get("/api/commercial/quotes", requireRole, requireZone("commercial"), (_req, res) => {
  res.json({ quotes: store.listQuotes() });
});

app.get("/api/commercial/quotes/:id", requireRole, requireZone("commercial"), (req, res) => {
  const rec = store.getQuote(req.params.id);
  if (!rec) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(rec);
});

app.post("/api/commercial/price", requireRole, requireZone("commercial"), (req: AuthedRequest, res) => {
  const product = req.body?.product;
  const flags = oemFlag(req.body?.sellMarginPct);
  if (product === "palisade") {
    const result = sizePalisade(req.body?.input || {});
    res.json({
      zone: "commercial",
      lineItems: palisadeLineItems(result, flags),
      terms: unknownCommercialTerms(),
      sellMarginPct: flags.sellMarginPct
    });
    return;
  }
  if (product === "swing") {
    const result = sizeSwing(req.body?.input || {});
    res.json({
      zone: "commercial",
      lineItems: swingLineItems(result, flags),
      terms: unknownCommercialTerms(),
      sellMarginPct: flags.sellMarginPct
    });
    return;
  }
  res.status(400).json({ error: "product must be palisade or swing" });
});

app.post("/api/commercial/persist", requireRole, requireZone("commercial"), async (req: AuthedRequest, res) => {
  const product = req.body?.product === "swing" ? "swing" : "palisade";
  const projectId = String(req.body?.projectId || newId("PRJ"));
  const projectName = String(req.body?.projectName || "Untitled project");
  const rfq = req.body?.rfq || {};
  const selection = req.body?.selection || {};
  const dropbox = await persistOrderFolder({
    projectId,
    files: [
      { name: "rfq.json", contentType: "application/json" },
      { name: "selection.json", contentType: "application/json" },
      { name: "proposal.pdf", contentType: "application/pdf" }
    ]
  });
  const hubspot = await attachToDealStub({
    projectId,
    dealId: req.body?.dealId,
    files: dropbox.files
  });
  const saved = store.saveQuote({
    projectId,
    product,
    projectName,
    createdByRole: req.role || "sales",
    rfq,
    selection,
    includePricing: true,
    dropboxPath: dropbox.folder,
    hubspot
  });
  res.json({ quote: saved, dropbox, hubspot });
});

app.post("/api/commercial/proposal.pdf", requireRole, requireZone("commercial"), async (req: AuthedRequest, res) => {
  try {
    const bytes = await makePdf(req.body || {}, req.role!, true);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=proposal.pdf");
    res.send(Buffer.from(bytes));
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

async function makePdf(body: Record<string, unknown>, role: string, includePricing: boolean) {
  const product = body.product === "swing" ? "swing" : "palisade";
  const flags = oemFlag(typeof body.sellMarginPct === "number" ? body.sellMarginPct : null);
  const brand = {
    logoBytes: logoBytes(),
    headerLogoBytes: headerLogoBytes()
  };
  if (product === "palisade") {
    const result = sizePalisade((body.input as never) || {});
    return buildProposalPdf({
      ...palisadeProposal(result, {
        role,
        includePricing,
        flags,
        ...brand,
        cutsheetBytes: readPublic("catalog/palisade-cutsheet.pdf")
      }),
      ...brandFonts()
    });
  }
  const result = sizeSwing((body.input as never) || {});
  return buildProposalPdf({
    ...swingProposal(result, {
      role,
      includePricing,
      flags,
      ...brand,
      cutsheetBytes: readPublic("catalog/swing-cutsheet.pdf"),
      shippingFigureBytes: readPublic("catalog/swing-shipping-height.png")
    }),
    ...brandFonts()
  });
}

const dist = path.join(root, "dist");
const pub = path.join(root, "public");
if (fs.existsSync(pub)) app.use(express.static(pub));
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(["/", "/select", "/proposal", "/proposal/*"], (_req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.type("html").send(`<!doctype html>
<html><body style="font-family:sans-serif;padding:2rem">
<h1>Zyramic Proposal Software</h1>
<p>API is running. Build the UI with <code>npm run build</code> or open the Vite dev server.</p>
</body></html>`);
  });
}

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`Zyramic Proposal Software draft listening on http://localhost:${port}`);
});
