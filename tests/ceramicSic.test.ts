import { describe, expect, it } from "vitest";
import { ceramicCapacityPerModuleM3d, ceramicModuleCount, sizeCeramicSic } from "../src/shared/ceramicSic.js";
import { ceramicSicLineItems } from "../src/shared/lineItems.js";
import { buildProposalPdf } from "../src/shared/pdf.js";
import { ceramicSicProposal } from "../src/shared/proposal.js";

describe("Ceramic / SiC TDS sizing", () => {
  it("uses 60 LMH municipal design flux and 10.8 m3/d per module", () => {
    expect(ceramicCapacityPerModuleM3d(60)).toBeCloseTo(10.8, 8);
    expect(ceramicModuleCount(108, 60)).toBe(10);
    expect(ceramicModuleCount(200, 60)).toBe(19);
  });

  it("sizes 200 m3/d municipal as 19 x SICFS-module42 with TDS dims and dry weight", () => {
    const result = sizeCeramicSic({
      projectName: "Ceramic / SiC municipal example",
      capacityM3d: 200,
      application: "municipal_ww_mbr"
    });
    expect(result.product).toBe("ceramic_sic");
    expect(result.publicName).toBe("Ceramic / SiC");
    expect(result.sizing.designFluxLmh).toBe(60);
    expect(result.sizing.requiredAreaM2).toBeCloseTo(200 * 1000 / (24 * 60), 5);
    expect(result.sales.moduleCount).toBe(19);
    expect(result.sales.areaM2).toBeCloseTo(142.5, 5);
    expect(result.sales.hardware.unitDims).toBe("746 x 715 x 160 mm");
    expect(result.sales.hardware.unitDryWeightKg).toBeCloseTo(44.8, 5);
    expect(result.sales.hardware.totalDryWeightKg).toBeCloseTo(851.2, 5);
    expect(result.sales.hardware.dimsStatus).toBe("CONFIRMED");
    expect(result.sales.hardware.weightStatus).toBe("CONFIRMED");
    expect(result.sizing.towers).toBe(2);
    expect(result.sales.hardware.publicNote).not.toMatch(/Semicorex|Amy Zhang/i);
  });

  it("holds other-application flux and price as UNKNOWN", () => {
    const result = sizeCeramicSic({ capacityM3d: 200, application: "other_held" });
    expect(result.sizing.designFluxLmh).toBeNull();
    expect(result.sales.moduleCount).toBeNull();
    const items = ceramicSicLineItems(sizeCeramicSic({ capacityM3d: 200, application: "municipal_ww_mbr" }));
    expect(items[0].flag).toBe("UNKNOWN");
    expect(items[0].unitPrice).toBeNull();
  });

  it("keeps Semicorex off the customer PDF and prints dims, weight, flux, count", async () => {
    const result = sizeCeramicSic({
      projectName: "Ceramic / SiC municipal example",
      capacityM3d: 200,
      application: "municipal_ww_mbr"
    });
    const input = ceramicSicProposal(result, { role: "customer", includePricing: false });
    expect(input.product).toBe("Ceramic / SiC");
    expect(input.includePricing).toBe(false);
    expect(input.lineItems).toBeUndefined();
    const blob = JSON.stringify(input);
    expect(blob).not.toMatch(/Semicorex|Amy Zhang/i);
    expect(input.summaryRows.some((r) => r.label === "Design operating flux" && r.value.includes("60"))).toBe(true);
    expect(input.summaryRows.some((r) => r.label === "Modules" && r.value === "19")).toBe(true);
    expect(input.hardwareTable?.rows[0]?.sku).toBe("SICFS-module42");
    expect(input.hardwareTable?.rows[0]?.unitDims).toMatch(/746 x 715 x 160/);
    expect(input.hardwareTable?.rows[0]?.unitWeightKg).toMatch(/44\.8/);
    expect(input.hardwareTable?.rows[0]?.totalWeightKg).toMatch(/851\.2/);
    const bytes = await buildProposalPdf(input);
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(5);
  });
});
