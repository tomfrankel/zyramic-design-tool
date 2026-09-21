import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { sizePalisade } from "../src/shared/palisade.js";
import { ARGES_SWING_TANK, sizeSwing } from "../src/shared/swing.js";
import { buildProposalPdf } from "../src/shared/pdf.js";
import { palisadeProposal, swingProposal } from "../src/shared/proposal.js";

describe("5-page branded proposal PDF", () => {
  it("emits five pages for Palisade commercial with sell margin", async () => {
    const result = sizePalisade({
      projectName: "Arges / Ahmet Iraq MBR",
      targetPermeateM3d: 200,
      minTemperatureC: 15,
      tankHeightM: 3,
      trains: [
        { flowM3d: 100, units: 3 },
        { flowM3d: 200, units: 1 }
      ]
    });
    const bytes = await buildProposalPdf(
      palisadeProposal(result, {
        role: "engineering",
        includePricing: true,
        flags: { sellMarginPct: 20 }
      })
    );
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(5);
  });

  it("omits sell figures for a customer sizing PDF", async () => {
    const result = sizeSwing({
      projectName: "Arges / Ahmet Iraq MBR",
      capacityM3d: 200,
      industry: "Domestic and Municipal",
      fluxMode: "alper_12_lmh",
      packMode: "alper_2wide",
      ...ARGES_SWING_TANK
    });
    const input = swingProposal(result, {
      role: "customer",
      includePricing: false,
      flags: { sellMarginPct: 20 }
    });
    expect(input.includePricing).toBe(false);
    expect(input.lineItems).toBeUndefined();
    const publicBlob = JSON.stringify(input);
    expect(publicBlob).not.toMatch(/EPS8|EPSMEM|OmniScour|On-Board Scour|Thermo Fisher|Liren|Henry|aeration|diffuser|bubble/i);
    expect(input.summaryRows.some((r) => r.label === "Engineering SKU")).toBe(false);
    const bytes = await buildProposalPdf(input);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(5);
  });
});
