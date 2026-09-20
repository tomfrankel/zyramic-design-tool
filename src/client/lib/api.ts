import { screenPalisadeCip, type CipInput } from "../../shared/cip";
import { newId } from "../../shared/id";
import { palisadeLineItems, swingLineItems, unknownCommercialTerms } from "../../shared/lineItems";
import { sizePalisade } from "../../shared/palisade";
import { buildProposalPdf, type ProposalPdfInput } from "../../shared/pdf";
import { canSeePricing, isRole, type Role } from "../../shared/roles";
import { sizeSwing } from "../../shared/swing";
import type { PalisadeInput, SwingInput } from "../../shared/types";

const ROLE_KEY = "zy_role";

export function getRole(): Role | null {
  const v = localStorage.getItem(ROLE_KEY);
  return isRole(v) ? v : null;
}

export function setRole(role: Role | null) {
  if (!role) localStorage.removeItem(ROLE_KEY);
  else localStorage.setItem(ROLE_KEY, role);
}

async function tryFetch(url: string, init?: RequestInit) {
  try {
    const res = await fetch(url, { credentials: "include", ...init });
    if (res.status === 404) return null;
    return res;
  } catch {
    return null;
  }
}

export async function login(role: Role, key: string) {
  const res = await tryFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, key })
  });
  if (res && res.ok) {
    setRole(role);
    return { role, canSeePricing: canSeePricing(role), mode: "server" as const };
  }
  const demo = { customer: "customer", sales: "sales", engineering: "engineering", admin: "admin" };
  if (key !== demo[role]) throw new Error("Demo key does not match role");
  setRole(role);
  return { role, canSeePricing: canSeePricing(role), mode: "local" as const };
}

export async function logout() {
  await tryFetch("/api/auth/logout", { method: "POST" });
  setRole(null);
}

export async function sizePalisadeApi(input: PalisadeInput) {
  const res = await tryFetch("/api/sizing/palisade", json(input));
  if (res?.ok) return (await res.json()).result;
  return sizePalisade(input);
}

export async function sizeSwingApi(input: SwingInput) {
  const res = await tryFetch("/api/sizing/swing", json(input));
  if (res?.ok) return (await res.json()).result;
  return sizeSwing(input);
}

export async function cipApi(input: CipInput) {
  const res = await tryFetch("/api/sizing/palisade/cip", json(input));
  if (res?.ok) return (await res.json()).result;
  return screenPalisadeCip(input);
}

export async function priceApi(product: "palisade" | "swing", input: unknown, sellMarginPct?: number | null) {
  const role = getRole();
  if (!role || !canSeePricing(role)) {
    const err = new Error("Commercial zone is walled to sales, engineering, and admin.");
    throw err;
  }
  const res = await tryFetch("/api/commercial/price", json({ product, input, sellMarginPct }));
  if (res) {
    if (res.status === 403) throw new Error("Commercial zone is walled to sales, engineering, and admin.");
    if (res.ok) return res.json();
  }
  const flags = { sellMarginPct: sellMarginPct ?? null };
  if (product === "palisade") {
    return { lineItems: palisadeLineItems(sizePalisade(input as PalisadeInput), flags), terms: unknownCommercialTerms() };
  }
  return { lineItems: swingLineItems(sizeSwing(input as SwingInput), flags), terms: unknownCommercialTerms() };
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "") as T;
  } catch {
    return fallback;
  }
}

export async function listCustomers() {
  const res = await tryFetch("/api/commercial/customers");
  if (res) {
    if (!res.ok) throw new Error("Commercial zone is walled.");
    return (await res.json()).customers;
  }
  if (!canSeePricing(getRole() || "customer")) throw new Error("Commercial zone is walled.");
  return readLocal("zy_customers", []);
}

export async function createCustomer(name: string) {
  const res = await tryFetch("/api/commercial/customers", json({ name }));
  if (res) {
    if (!res.ok) throw new Error("Commercial zone is walled.");
    return res.json();
  }
  const rec = { id: newId("CUST"), name, createdAt: new Date().toISOString() };
  const all = readLocal<typeof rec[]>("zy_customers", []);
  all.push(rec);
  localStorage.setItem("zy_customers", JSON.stringify(all));
  return rec;
}

export async function listQuotes() {
  const res = await tryFetch("/api/commercial/quotes");
  if (res) {
    if (!res.ok) throw new Error("Commercial zone is walled.");
    return (await res.json()).quotes;
  }
  if (!canSeePricing(getRole() || "customer")) throw new Error("Commercial zone is walled.");
  return readLocal("zy_quotes", []);
}

export async function persistQuote(payload: {
  product: "palisade" | "swing";
  projectName: string;
  rfq: unknown;
  selection: unknown;
}) {
  const res = await tryFetch("/api/commercial/persist", json(payload));
  if (res) {
    if (!res.ok) throw new Error("Commercial zone is walled.");
    return res.json();
  }
  const projectId = newId("PRJ");
  const folder = `/Zyramic Setup Info/Proposal Software/Orders/${projectId}`;
  const quote = {
    id: newId("Q"),
    projectId,
    product: payload.product,
    projectName: payload.projectName,
    createdAt: new Date().toISOString(),
    createdByRole: getRole(),
    rfq: payload.rfq,
    selection: payload.selection,
    includePricing: true,
    dropboxPath: folder,
    hubspot: { adapter: "hubspot", status: "stub", dealId: `STUB-DEAL-${projectId}` }
  };
  const all = readLocal<typeof quote[]>("zy_quotes", []);
  all.unshift(quote);
  localStorage.setItem("zy_quotes", JSON.stringify(all));
  return {
    quote,
    dropbox: {
      adapter: "dropbox",
      status: "stub",
      folder,
      files: [`${folder}/rfq.json`, `${folder}/selection.json`, `${folder}/proposal.pdf`]
    },
    hubspot: quote.hubspot
  };
}

export async function downloadPdf(args: ProposalPdfInput) {
  const bytes = await buildProposalPdf(args);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "proposal.pdf";
  a.click();
  URL.revokeObjectURL(url);
}

async function loadBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function loadLogo(): Promise<Uint8Array | null> {
  return (await loadBytes("/brand/logo-pdf.png")) || (await loadBytes("/brand/logo-header.png")) || loadBytes("/brand/zyramic-logo.png");
}

export async function loadCutsheet(product: "palisade" | "swing"): Promise<Uint8Array | null> {
  return loadBytes(product === "swing" ? "/catalog/swing-cutsheet.pdf" : "/catalog/palisade-cutsheet.pdf");
}

export async function loadShippingFigure(): Promise<Uint8Array | null> {
  return loadBytes("/catalog/swing-shipping-height.png");
}

function json(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-zyramic-role": getRole() || "" },
    body: JSON.stringify(body)
  };
}
