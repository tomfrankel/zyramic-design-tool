import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { LineItem } from "./types.js";

const NAVY = rgb(0x0b / 255, 0x1f / 255, 0x33 / 255);
const NAVY_DEEP = rgb(0x07 / 255, 0x14 / 255, 0x1f / 255);
const TEAL = rgb(0x0e / 255, 0x7c / 255, 0x7b / 255);
const COPPER = rgb(0xc4 / 255, 0x84 / 255, 0x2a / 255);
const PAPER = rgb(0xf4 / 255, 0xef / 255, 0xe4 / 255);
const CREAM = rgb(1, 0xfb / 255, 0xf3 / 255);
const MUTED = rgb(0x4a / 255, 0x55 / 255, 0x60 / 255);
const LINE = rgb(0xd4 / 255, 0xcb / 255, 0xb8 / 255);
const INK = NAVY;

export interface CapacityRow {
  flowM3d: number;
  units: number;
  requiredAreaM2?: number | null;
  sku?: string | null;
  engSku?: string | null;
  modulesEach?: number | null;
  areaEachM2?: number | null;
  modulesProject?: number | null;
  areaProjectM2?: number | null;
}

export interface ProposalPdfInput {
  logoBytes?: Uint8Array | null;
  headerLogoBytes?: Uint8Array | null;
  cutsheetBytes?: Uint8Array | null;
  extraCutsheetBytes?: Uint8Array | null;
  shippingFigureBytes?: Uint8Array | null;
  projectName: string;
  siteLocation?: string;
  application?: string;
  product: "Palisade" | "Swing MBR";
  role: string;
  includePricing: boolean;
  sellMarginPct?: number | null;
  modelStatus: string;
  documentStatus: string;
  summaryRows: { label: string; value: string }[];
  capacityTable?: CapacityRow[];
  assumptions: { id: string; topic: string; value: string; status: string }[];
  warnings: string[];
  missingFields: string[];
  lineItems?: LineItem[];
  commercialTerms?: { warranty: string; leadTime: string };
  narrative?: string[];
}

function money(v: number | null | undefined): string {
  if (v == null) return "-";
  return `$${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function pdfSafe(text: string): string {
  return text
    .replace(/[≤⩽]/g, "<=")
    .replace(/[≥⩾]/g, ">=")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/×/g, "x")
    .replace(/³/g, "3")
    .replace(/²/g, "2")
    .replace(/·/g, "-")
    .replace(/•/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?");
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = pdfSafe(text).split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > width) {
      if (cur) lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

export async function buildProposalPdf(input: ProposalPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [612, 792];

  let logo = null as Awaited<ReturnType<PDFDocument["embedPng"]>> | null;
  const logoSrc = input.logoBytes || input.headerLogoBytes;
  if (logoSrc) {
    try {
      logo = await doc.embedPng(logoSrc);
    } catch {
      logo = null;
    }
  }

  const chrome = (page: PDFPage, title: string, pageNo: number) => {
    page.drawRectangle({ x: 0, y: 0, width: 612, height: 792, color: CREAM });
    page.drawRectangle({ x: 0, y: 752, width: 612, height: 40, color: NAVY_DEEP });
    page.drawRectangle({ x: 0, y: 748, width: 612, height: 4, color: COPPER });
    if (logo) {
      const h = 26;
      const w = (logo.width / logo.height) * h;
      page.drawImage(logo, { x: 28, y: 758, width: w, height: h });
    } else {
      page.drawText("ZYRAMIC", { x: 28, y: 766, size: 12, font: bold, color: CREAM });
    }
    page.drawText("PROPOSAL SOFTWARE  -  DRAFT", { x: 320, y: 768, size: 8, font: bold, color: COPPER });
    page.drawText(pdfSafe(title), { x: 28, y: 728, size: 14, font: bold, color: NAVY });
    page.drawRectangle({ x: 0, y: 0, width: 612, height: 32, color: NAVY_DEEP });
    page.drawText(`10 Tucker Dr, Poughkeepsie, NY  -  zyramic.com  -  page ${pageNo} of 5`, {
      x: 28,
      y: 12,
      size: 8,
      font,
      color: CREAM
    });
    page.drawText("Art slot - Muse graphics can replace this chrome later", {
      x: 340,
      y: 12,
      size: 7,
      font,
      color: LINE
    });
  };

  // 1 Cover
  const cover = doc.addPage(pageSize);
  cover.drawRectangle({ x: 0, y: 0, width: 612, height: 792, color: NAVY_DEEP });
  cover.drawRectangle({ x: 0, y: 0, width: 18, height: 792, color: TEAL });
  cover.drawRectangle({ x: 18, y: 0, width: 6, height: 792, color: COPPER });
  if (logo) {
    const h = 72;
    const w = (logo.width / logo.height) * h;
    cover.drawImage(logo, { x: 48, y: 680, width: w, height: h });
  } else {
    cover.drawText("ZYRAMIC", { x: 48, y: 720, size: 28, font: bold, color: CREAM });
  }
  cover.drawText("PROPOSAL SOFTWARE", { x: 48, y: 640, size: 11, font: bold, color: COPPER });
  cover.drawText("Budgetary module proposal", { x: 48, y: 610, size: 22, font: bold, color: CREAM });
  cover.drawText(input.product, { x: 48, y: 578, size: 16, font, color: TEAL });
  cover.drawText(pdfSafe(input.projectName || "Untitled project"), { x: 48, y: 540, size: 14, font: bold, color: CREAM });
  cover.drawText(pdfSafe(input.siteLocation || "Site TBD"), { x: 48, y: 520, size: 11, font, color: LINE });
  if (input.application) cover.drawText(pdfSafe(input.application), { x: 48, y: 504, size: 10, font, color: LINE });

  const coverNotes = [
    "DRAFT / PRELIMINARY — not a final customer or field issue.",
    "Modules only. Not a complete treatment system.",
    "Palisade and Swing MBR public names only.",
    input.documentStatus,
    `Model status: ${input.modelStatus}`,
    `Prepared for role: ${input.role}`
  ];
  let cy = 430;
  for (const n of coverNotes) {
    for (const line of wrap(n, font, 10, 480)) {
      cover.drawText(line, { x: 48, y: cy, size: 10, font, color: CREAM });
      cy -= 16;
    }
  }
  cover.drawText("zyramic.com  ·  10 Tucker Dr, Poughkeepsie, NY 12603", {
    x: 48,
    y: 48,
    size: 9,
    font,
    color: LINE
  });

  // 2 Technical
  const tech = doc.addPage(pageSize);
  chrome(tech, "2  -  Technical", 2);
  let y = 708;
  const left = 36;
  const write = (text: string, size = 9, useBold = false, color = INK) => {
    for (const line of wrap(text, useBold ? bold : font, size, 540)) {
      if (y < 50) return;
      tech.drawText(line, { x: left, y, size, font: useBold ? bold : font, color });
      y -= size + 4;
    }
  };
  write("PRELIMINARY engineering basis. Sizing uses Area@12 = Q / 12 LMH cycle-average unless an alternate Swing industry map is selected.", 9, false, MUTED);
  y -= 4;
  write("Project summary", 12, true, TEAL);
  for (const row of input.summaryRows.slice(0, 12)) write(`${row.label}: ${row.value}`, 9);
  if (input.narrative?.length) {
    y -= 6;
    write("Engineering notes", 12, true, TEAL);
    for (const n of input.narrative) write(n, 9);
  }
  if (input.capacityTable?.length) {
    y -= 8;
    write("Multi-capacity / multi-unit table", 12, true, TEAL);
    write("Flow   Units   Area@12   SKU   Mods/unit   Area/unit   Mods project   Area project", 8, true, MUTED);
    for (const r of input.capacityTable) {
      write(
        `${r.flowM3d} m³/d   ×${r.units}   ${r.requiredAreaM2?.toFixed(2) ?? "—"}   ${r.engSku || r.sku || "—"}   ${r.modulesEach ?? "—"}   ${r.areaEachM2?.toFixed(1) ?? "—"}   ${r.modulesProject ?? "—"}   ${r.areaProjectM2?.toFixed(1) ?? "—"}`,
        8
      );
    }
  }
  y -= 6;
  write("Warnings / warranty", 12, true, TEAL);
  for (const w of input.warnings.slice(0, 8)) write(`• ${w}`, 8, false, COPPER);
  if (input.missingFields.length) write(`Missing: ${input.missingFields.join(", ")}`, 8);
  y -= 4;
  write("Assumptions (selected)", 11, true, TEAL);
  for (const a of input.assumptions.slice(0, 6)) write(`${a.id} [${a.status}] ${a.topic}: ${a.value}`, 8);

  // 3 Drawings
  const draw = doc.addPage(pageSize);
  chrome(draw, "3  -  Drawings / cut sheets", 3);
  draw.drawText("Published product cut sheets. Do not treat this page as project CAD.", {
    x: left,
    y: 708,
    size: 9,
    font,
    color: MUTED
  });
  let embedded = false;
  if (input.cutsheetBytes) {
    try {
      const src = await PDFDocument.load(input.cutsheetBytes);
      const [page] = await doc.embedPdf(src, [0]);
      const maxW = 540;
      const maxH = input.shippingFigureBytes ? 360 : 620;
      const scale = Math.min(maxW / page.width, maxH / page.height);
      draw.drawPage(page, {
        x: 36,
        y: input.shippingFigureBytes ? 330 : 80,
        width: page.width * scale,
        height: page.height * scale
      });
      embedded = true;
    } catch {
      embedded = false;
    }
  }
  if (!embedded) {
    draw.drawRectangle({ x: 36, y: 200, width: 540, height: 480, borderColor: LINE, borderWidth: 1, color: PAPER });
    draw.drawText("Cut sheet not embedded in this build.", { x: 56, y: 440, size: 11, font, color: MUTED });
  }
  if (input.shippingFigureBytes) {
    try {
      const img = await doc.embedPng(input.shippingFigureBytes);
      const h = 180;
      const w = Math.min(540, (img.width / img.height) * h);
      draw.drawImage(img, { x: 36, y: 80, width: w, height: h });
      draw.drawText("Optional Swing shipping-height split figure (not CAD).", {
        x: 36,
        y: 68,
        size: 8,
        font,
        color: MUTED
      });
    } catch {
      /* optional */
    }
  }

  // 4 Price
  const price = doc.addPage(pageSize);
  chrome(price, "4  -  Price", 4);
  y = 708;
  const pwrite = (text: string, size = 9, useBold = false, color = INK) => {
    for (const line of wrap(text, useBold ? bold : font, size, 540)) {
      if (y < 50) return;
      price.drawText(line, { x: left, y, size, font: useBold ? bold : font, color });
      y -= size + 4;
    }
  };
  if (!input.includePricing) {
    pwrite("Sizing-zone PDF. Pricing, cost stubs, and sell margin are omitted for this role.", 11, true, COPPER);
    pwrite("Customer sessions never see cost or margin. Request a commercial-zone issue from sales or engineering.", 9);
  } else {
    pwrite("Commercial zone only. Stubs and TBD flags stay visible. No invented warranty or lead time.", 9, false, MUTED);
    if (input.sellMarginPct == null) {
      pwrite("Sell margin % was not entered. Sell prices are not calculated. Do not invent a company default margin.", 10, true, COPPER);
    } else {
      pwrite(`Sell margin applied: ${input.sellMarginPct}% on top of cost stubs where a stub exists.`, 10, true, TEAL);
    }
    y -= 4;
    pwrite("SKU                  Qty        Flag              Cost stub     Sell (if margin)", 8, true, MUTED);
    for (const item of input.lineItems || []) {
      pwrite(
        `${item.sku}   ${item.qty} ${item.unit}   ${item.flag}   ${money(item.costUnitPrice ?? item.unitPrice)}   ${money(item.sellUnitPrice)}`,
        8
      );
      pwrite(item.note, 7, false, MUTED);
    }
    if (input.commercialTerms) {
      y -= 8;
      pwrite("Commercial terms", 11, true, TEAL);
      pwrite(`Warranty: ${input.commercialTerms.warranty}`, 9);
      pwrite(`Lead time: ${input.commercialTerms.leadTime}`, 9);
    }
  }

  // 5 Terms
  const terms = doc.addPage(pageSize);
  chrome(terms, "5  -  Terms and conditions", 5);
  const clauses = [
    "DRAFT modular terms — placeholder only. Not a negotiated contract and not a final Zyramic offer.",
    "1. Scope. This document prices or sizes modules only. It is not a complete MBR plant, civil, biological process, or installation package.",
    "2. Budgetary. Any dollar figures are stubs or sell-margin overlays on stubs. They are subject to a final Zyramic quote.",
    "3. Validation. Palisade flux, CIP, and complete-assembly compatibility remain validation-gated. Swing industry flux is a design-tool menu unless Alper 12 LMH mode is selected for municipal budgetary comparison.",
    "4. Warranty envelope. Biological-process influent screens (COD, BOD5, TSS, NH4-N, pH) are operating-envelope checks. An exceedance requires process-design review; it does not mean treatment is impossible. No warranty duration is published here.",
    "5. Lead time and freight. Not published. Do not invent them.",
    "6. Drawings. Cut sheets are catalog documents. Project CAD, tank steel, and connections are by others unless separately contracted.",
    "7. Confidential. Customer lists, OEM sheets, and live pricing systems are outside this draft.",
    "8. Governing issue. A later signed Zyramic quotation supersedes this PDF."
  ];
  y = 708;
  for (const c of clauses) {
    for (const line of wrap(c, font, 10, 540)) {
      terms.drawText(line, { x: left, y, size: 10, font, color: INK });
      y -= 14;
    }
    y -= 6;
  }

  return doc.save();
}
