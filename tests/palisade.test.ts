import { describe, expect, it } from "vitest";
import { sizePalisade, waterViscosityCp } from "../src/shared/palisade.js";

describe("Palisade V29 independent audit case", () => {
  const result = sizePalisade({
    targetPermeateM3d: 1000,
    onPeriodFluxLmh: 15,
    cycleOnMin: 8,
    cycleRelaxMin: 2,
    minTemperatureC: 20,
    selectedModulePlates: 260
  });

  it("uses 0.80 ON fraction and 12 LMH cycle-average flux", () => {
    expect(result.sizing.onFraction).toBeCloseTo(0.8, 6);
    expect(result.sizing.cycleAverageFluxLmh).toBeCloseTo(12, 6);
  });

  it("requires 3472.22 m²", () => {
    expect(result.sizing.requiredAreaM2).toBeCloseTo(3472.22, 2);
  });

  it("selects 13 × 260-plate modules and 3549 m² installed", () => {
    expect(result.selectedModule?.moduleCount).toBe(13);
    expect(result.selectedModule?.installedAreaM2).toBeCloseTo(3549, 6);
  });

  it("aggregates 1248 SCFM and ~2120.4 standard m³/h", () => {
    expect(result.scour.totalScourScfm).toBe(1248);
    expect(result.scour.totalScourStdM3h).toBeCloseTo(2120.4, 1);
  });

  it("reports air/permeate ≈ 50.89 standard L/L", () => {
    expect(result.scour.airPerPermeateStdLL).toBeCloseTo(50.89, 2);
  });

  it("does not invent a 130 envelope", () => {
    const option130 = result.moduleOptions.find((o) => o.plates === 130);
    expect(option130?.envelopeM).toBeNull();
  });
});

describe("Palisade temperature and warranty", () => {
  it("uses the EPA MF/UF viscosity polynomial", () => {
    expect(waterViscosityCp(20)).toBeCloseTo(0.994, 3);
  });

  it("increases cold-temperature area check below 20°C only", () => {
    const cold = sizePalisade({
      targetPermeateM3d: 1000,
      minTemperatureC: 10,
      selectedModulePlates: 260
    });
    const warm = sizePalisade({
      targetPermeateM3d: 1000,
      minTemperatureC: 30,
      selectedModulePlates: 260
    });
    expect(cold.sizing.coldTemperatureAreaM2 ?? 0).toBeGreaterThan(cold.sizing.requiredAreaM2 ?? 0);
    expect(warm.sizing.coldTemperatureAreaM2).toBeCloseTo(warm.sizing.requiredAreaM2 ?? 0, 6);
  });

  it("flags warranty envelope exceedance without calling treatment impossible", () => {
    const result = sizePalisade({
      targetPermeateM3d: 1000,
      minTemperatureC: 20,
      selectedModulePlates: 260,
      codMgL: 800
    });
    expect(result.operating.warranty.warrantyOutside).toBe(true);
    expect(result.operating.warrantyEnvelopeStatus).toMatch(/PROCESS DESIGN REVIEW REQUIRED/);
  });
});
