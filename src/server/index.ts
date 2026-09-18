import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { screenPalisadeCip } from "../shared/cip.js";
import { newId } from "../shared/id.js";
import { palisadeLineItems, swingLineItems, unknownCommercialTerms } from "../shared/lineItems.js";
import { sizePalisade } from "../shared/palisade.js";
import { buildProposalPdf } from "../shared/pdf.js";
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
const logoPath = path.join(root, "public/brand/zyramic-logo.png");

function logoBytes(): Uint8Array | null {
  try {
    return fs.readFileSync(logoPath);
  } catch {
    return null;
  }
}

function oemFlag() {
  const raw = process.env.SWING_OEM_ESTIMATE_USD_PER_M2;
  const n = raw ? Number(raw) : null;
  return { swingOemUsdPerM2: n != null && Number.isFinite(n) && n > 0 ? n : null };
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
  if (product === "palisade") {
    const result = sizePalisade(req.body?.input || {});
    res.json({
      zone: "commercial",
      lineItems: palisadeLineItems(result, oemFlag()),
      terms: unknownCommercialTerms()
    });
    return;
  }
  if (product === "swing") {
    const result = sizeSwing(req.body?.input || {});
    res.json({
      zone: "commercial",
      lineItems: swingLineItems(result, oemFlag()),
      terms: unknownCommercialTerms()
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
  if (product === "palisade") {
    const result = sizePalisade((body.input as never) || {});
    const items = includePricing ? palisadeLineItems(result, oemFlag()) : undefined;
    const terms = unknownCommercialTerms();
    return buildProposalPdf({
      logoBytes: logoBytes(),
      projectName: String((body.input as { projectName?: string })?.projectName || "Palisade draft"),
      siteLocation: (body.input as { siteLocation?: string })?.siteLocation,
      product: "Palisade",
      role,
      includePricing,
      modelStatus: result.modelStatus,
      documentStatus: result.documentStatus,
      summaryRows: [
        { label: "SKU", value: String(result.sales.sku ?? "—") },
        { label: "Modules", value: String(result.sales.moduleCount ?? "—") },
        { label: "Installed area", value: result.sales.areaM2 != null ? `${result.sales.areaM2.toFixed(1)} m²` : "—" },
        { label: "ON-period flux", value: `${result.sales.fluxLmh} LMH` },
        { label: "Cycle-average flux", value: `${result.sales.cycleAverageFluxLmh} LMH` },
        { label: "Capacity", value: result.sales.capacityM3d != null ? `${result.sales.capacityM3d} m³/d` : "—" },
        { label: "Total scour", value: result.scour.totalScourScfm != null ? `${result.scour.totalScourScfm} SCFM` : "—" },
        { label: "Footprint", value: result.footprint.note }
      ],
      assumptions: result.assumptions,
      warnings: result.warnings.map((w) => w.message),
      missingFields: result.missingFields,
      lineItems: items,
      commercialTerms: includePricing
        ? { warranty: terms.warranty.note, leadTime: terms.leadTime.note }
        : undefined
    });
  }
  const result = sizeSwing((body.input as never) || {});
  const items = includePricing ? swingLineItems(result, oemFlag()) : undefined;
  const terms = unknownCommercialTerms();
  return buildProposalPdf({
    logoBytes: logoBytes(),
    projectName: String((body.input as { projectName?: string })?.projectName || "Swing MBR draft"),
    siteLocation: (body.input as { siteLocation?: string })?.siteLocation,
    product: "Swing MBR",
    role,
    includePricing,
    modelStatus: result.modelStatus,
    documentStatus: result.documentStatus,
    summaryRows: [
      { label: "SKU", value: String(result.sales.sku ?? "—") },
      { label: "Modules", value: String(result.sales.moduleCount ?? "—") },
      { label: "Installed area", value: result.sales.areaM2 != null ? `${result.sales.areaM2.toFixed(1)} m²` : "—" },
      { label: "Flux", value: result.sales.fluxLmh != null ? `${result.sales.fluxLmh.toFixed(2)} LMH` : "—" },
      { label: "Capacity", value: `${result.sales.capacityM3d} m³/d` },
      { label: "Footprint", value: result.sales.footprint?.note || "—" }
    ],
    assumptions: result.assumptions,
    warnings: result.warnings.map((w) => w.message),
    missingFields: result.missingFields,
    lineItems: items,
    commercialTerms: includePricing
      ? { warranty: terms.warranty.note, leadTime: terms.leadTime.note }
      : undefined
  });
}

const dist = path.join(root, "dist");
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
