import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { LineItem } from "./types.js";

export interface ProposalPdfInput {
  logoBytes?: Uint8Array | null;
  projectName: string;
  siteLocation?: string;
  product: "Palisade" | "Swing MBR";
  role: string;
  includePricing: boolean;
  modelStatus: string;
  documentStatus: string;
  summaryRows: { label: string; value: string }[];
  assumptions: { id: string; topic: string; value: string; status: string }[];
  warnings: string[];
  missingFields: string[];
  lineItems?: LineItem[];
  commercialTerms?: { warranty: string; leadTime: string };
}

function money(v: number | null): string {
  if (v == null) return "—";
  return `$${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export async function buildProposalPdf(input: ProposalPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const pageSize: [number, number] = [612, 792];
  let page = doc.addPage(pageSize);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.04, 0.145, 0.251);
  const teal = rgb(0.0, 0.67, 0.75);
  const amber = rgb(0.72, 0.45, 0.05);
  const gray = rgb(0.25, 0.3, 0.35);
  const muted = rgb(0.45, 0.48, 0.52);

  let y = 760;
  const left = 40;
  const width = 532;

  const newPage = () => {
    page = doc.addPage(pageSize);
    y = 760;
  };

  const ensure = (need: number) => {
    if (y - need < 48) newPage();
  };

  if (input.logoBytes) {
    try {
      const png = await doc.embedPng(input.logoBytes);
      const h = 42;
      const w = (png.width / png.height) * h;
      page.drawImage(png, { x: left, y: y - h + 8, width: w, height: h });
    } catch {
      page.drawText("ZYRAMIC", { x: left, y: y, size: 18, font: bold, color: navy });
    }
  } else {
    page.drawText("ZYRAMIC", { x: left, y: y, size: 18, font: bold, color: navy });
  }

  page.drawText("PROPOSAL SOFTWARE", { x: 360, y: y + 8, size: 11, font: bold, color: teal });
  page.drawText("DRAFT / PRELIMINARY", { x: 360, y: y - 8, size: 9, font, color: amber });
  y -= 56;

  page.drawRectangle({ x: left, y: y - 6, width, height: 28, color: rgb(1, 0.95, 0.86) });
  page.drawText(input.documentStatus, { x: left + 8, y: y + 4, size: 8, font: bold, color: amber });
  y -= 28;

  const heading = (text: string) => {
    ensure(28);
    page.drawText(text, { x: left, y, size: 12, font: bold, color: navy });
    y -= 16;
  };

  const line = (text: string, color = gray, size = 9) => {
    const words = text.split(" ");
    let current = "";
    for (const w of words) {
      const next = current ? `${current} ${w}` : w;
      if (font.widthOfTextAtSize(next, size) > width) {
        ensure(14);
        page.drawText(current, { x: left, y, size, font, color });
        y -= 12;
        current = w;
      } else {
        current = next;
      }
    }
    if (current) {
      ensure(14);
      page.drawText(current, { x: left, y, size, font, color });
      y -= 12;
    }
  };

  heading("Project");
  line(`Project: ${input.projectName || "—"}`);
  line(`Site: ${input.siteLocation || "—"}`);
  line(`Product: ${input.product} modules (not a complete system)`);
  line(`Model status: ${input.modelStatus}`);
  line(`Prepared for role: ${input.role}`);
  line(`Pricing included: ${input.includePricing ? "yes (commercial zone)" : "no (sizing zone)"}`);
  y -= 6;

  heading("Engineering summary");
  for (const row of input.summaryRows) {
    line(`${row.label}: ${row.value}`);
  }
  y -= 6;

  heading("Warnings");
  if (!input.warnings.length) line("None recorded.");
  for (const w of input.warnings) line(`• ${w}`, amber);

  y -= 6;
  heading("Missing fields");
  if (!input.missingFields.length) line("No required sizing fields missing.");
  for (const m of input.missingFields) line(`• ${m}`);

  y -= 6;
  heading("Assumptions / validation");
  for (const a of input.assumptions.slice(0, 12)) {
    line(`${a.id} [${a.status}] ${a.topic} — ${a.value}`);
  }

  if (input.includePricing && input.lineItems) {
    y -= 6;
    heading("Priceable line items");
    line("Unknown and TBD items are flagged. No invented warranty or lead time.");
    for (const item of input.lineItems) {
      line(
        `${item.sku}  qty ${item.qty} ${item.unit}  ${item.flag}  unit ${money(item.unitPrice)}  ext ${money(item.extendedPrice)}`
      );
      line(`    ${item.note}`, muted, 8);
    }
    if (input.commercialTerms) {
      y -= 4;
      line(`Warranty: ${input.commercialTerms.warranty}`);
      line(`Lead time: ${input.commercialTerms.leadTime}`);
    }
  } else {
    y -= 6;
    heading("Commercial");
    line("Pricing, customer lists, and past quotes are omitted from this sizing-zone PDF.");
  }

  y -= 10;
  heading("Scope notes");
  line("This draft covers Palisade and Swing MBR modules only. Ceramics are out of scope.");
  line("Scour is module scour-air demand, not aeration, diffuser, or bubble equipment.");
  line("CIP content is validation-gated and is not a Zyramic-approved procedure.");
  line("Persist path (stub): /Zyramic Setup Info/Proposal Software/Orders/{projectId}/");

  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawText(`Zyramic Proposal Software  ·  page ${i + 1} of ${pages.length}  ·  DRAFT`, {
      x: left,
      y: 28,
      size: 8,
      font,
      color: muted
    });
  });

  return doc.save();
}
