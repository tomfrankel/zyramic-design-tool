import { describe, expect, it } from "vitest";
import { clampRequiredAreaM2, sizeSwing } from "../src/shared/swing.js";

describe("Swing design-tool replication", () => {
  it("clamps required area like Design Tool A6", () => {
    expect(clampRequiredAreaM2(4)).toBe(6.25);
    expect(clampRequiredAreaM2(10)).toBe(12.5);
    expect(clampRequiredAreaM2(588.235294117647)).toBeCloseTo(588.235294117647, 8);
  });

  it("matches the 200 m³/d municipal example shortlist", () => {
    const result = sizeSwing({
      capacityM3d: 200,
      tankLengthMm: 4400,
      tankWidthMm: 2750,
      tankHeightMm: 2800,
      industry: "Domestic and Municipal",
      fluxMode: "industry_map",
      packMode: "linear_design_tool"
    });
    expect(result.sizing.fluxM3m2d).toBeCloseTo(0.34, 6);
    expect(result.sizing.requiredAreaM2).toBeCloseTo(588.235294117647, 5);
    const skus = result.matches.map((m) => m.sku);
    expect(skus).toContain("SWG-8-2-6");
    expect(skus).toContain("SWG-8-2-7");
    expect(skus).toContain("SWG-8-2.5-5");
    expect(skus).toContain("SWG-8-2.5-6");
    expect(skus).toContain("SWG-8-2.5-7");
    const selected = result.matches.find((m) => m.sku === "SWG-8-2-6");
    expect(selected?.quantity).toBe(4);
    expect(selected?.installedAreaM2).toBe(600);
    expect(selected?.totalScourM3h).toBe(324);
    expect(selected?.safetyFactor).toBeCloseTo(1.02, 2);
    expect(selected?.alternativeTankLengthMm).toBe(4400);
    expect(selected?.topClearanceMm).toBe(970);
  });

  it("returns no match when the tank is too small", () => {
    const result = sizeSwing({
      capacityM3d: 200,
      tankLengthMm: 1000,
      tankWidthMm: 1000,
      tankHeightMm: 1200,
      industry: "Domestic and Municipal",
      fluxMode: "industry_map",
      packMode: "linear_design_tool"
    });
    expect(result.matches).toHaveLength(0);
    expect(result.warnings.some((w) => w.code === "NO_MATCH")).toBe(true);
  });
});
