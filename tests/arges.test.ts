import { describe, expect, it } from "vitest";
import { palisadeCapacityTable, sizePalisade } from "../src/shared/palisade.js";
import { applySellMargin, swingLineItems } from "../src/shared/lineItems.js";
import { ARGES_SWING_TANK, sizeSwing, swingCapacityTable } from "../src/shared/swing.js";

const iraq = {
  projectName: "Arges / Ahmet Iraq MBR",
  minTemperatureC: 15,
  tankHeightM: 3.0,
  onPeriodFluxLmh: 15,
  cycleOnMin: 8,
  cycleRelaxMin: 2,
  codMgL: 615,
  bod5MgL: 320,
  tssMgL: 350,
  nh4nMgL: 45,
  ph: 7.9
};

describe("Alper Palisade acceptance", () => {
  it("matches Area@12 and 130-plate counts for 100/150/200/500/600", () => {
    const table = palisadeCapacityTable({ ...iraq, selectedModulePlates: null });
    const expectRow = (flow: number, modules: number, area: number) => {
      const row = table.find((r) => r.flowM3d === flow);
      expect(row?.plates).toBe(130);
      expect(row?.modulesEach).toBe(modules);
      expect(row?.areaEachM2).toBeCloseTo(area, 5);
    };
    expectRow(100, 3, 409.5);
    expectRow(150, 4, 546);
    expectRow(200, 6, 819);
    expectRow(500, 13, 1774.5);
    expectRow(600, 16, 2184);
    expect(table.reduce((s, r) => s + r.units, 0)).toBe(11);
  });

  it("does not upsize module count on 15°C TCF", () => {
    const cold = sizePalisade({ ...iraq, targetPermeateM3d: 150 });
    const warm = sizePalisade({ ...iraq, targetPermeateM3d: 150, minTemperatureC: 20 });
    expect(cold.sizing.temperatureCorrectionFactor).toBeGreaterThan(1.1);
    expect(cold.sizing.coldCheckOnly).toBe(true);
    expect(cold.selectedModule?.moduleCount).toBe(4);
    expect(warm.selectedModule?.moduleCount).toBe(4);
    expect(cold.warnings.some((w) => w.code === "TCF_CHECK_ONLY")).toBe(true);
  });

  it("blocks PAL-260 when tank height is 3.00 m", () => {
    const result = sizePalisade({
      ...iraq,
      targetPermeateM3d: 200,
      selectedModulePlates: 260
    });
    expect(result.sizing.pal260Blocked).toBe(true);
    expect(result.selectedModule?.plates).toBe(130);
    expect(result.selectedModule?.moduleCount).toBe(6);
    expect(result.warnings.some((w) => w.code === "PAL260_HEIGHT_BLOCK")).toBe(true);
  });

  it("flags Iraq influent outside the warranty envelope", () => {
    const result = sizePalisade({ ...iraq, targetPermeateM3d: 200 });
    expect(result.operating.warranty.warrantyOutside).toBe(true);
    expect(result.operating.warranty.nh4Status).toMatch(/WITHIN/);
  });
});

describe("Alper Swing acceptance", () => {
  const base = {
    projectName: "Arges / Ahmet Iraq MBR",
    industry: "Domestic and Municipal" as const,
    fluxMode: "alper_12_lmh" as const,
    packMode: "alper_2wide" as const,
    ...ARGES_SWING_TANK
  };

  it("uses 12 LMH and selects 2 × EPS8-2.5-12 at 200 m³/d", () => {
    const result = sizeSwing({ ...base, capacityM3d: 200 });
    expect(result.sizing.requiredAreaM2).toBeCloseTo(694.44, 2);
    expect(result.selected?.engSku).toBe("EPS8-2.5-12");
    expect(result.selected?.sku).toBe("SWG-8-2.5-12");
    expect(result.selected?.quantity).toBe(2);
    expect(result.selected?.installedAreaM2).toBe(750);
    expect(result.selected?.pack).toBe("alper_2wide");
    expect(result.selected?.modulesPerRow).toBe(2);
  });

  it("selects 6 × EPS8-2.5-10 at 500 m³/d side-by-side", () => {
    const result = sizeSwing({ ...base, capacityM3d: 500 });
    expect(result.sizing.requiredAreaM2).toBeCloseTo(1736.11, 2);
    expect(result.selected?.engSku).toBe("EPS8-2.5-10");
    expect(result.selected?.quantity).toBe(6);
    expect(result.selected?.installedAreaM2).toBe(1875);
    expect(result.selected?.rows).toBe(3);
  });

  it("keeps industry 0.34 map as an alternate mode", () => {
    const result = sizeSwing({
      ...base,
      capacityM3d: 200,
      fluxMode: "industry_map",
      packMode: "linear_design_tool",
      tankLengthMm: 4400,
      tankWidthMm: 2750,
      tankHeightMm: 2800
    });
    expect(result.sizing.requiredAreaM2).toBeCloseTo(588.235, 2);
  });

  it("applies $30/m² stub and sell margin on cost only", () => {
    const result = sizeSwing({ ...base, capacityM3d: 200 });
    const items = swingLineItems(result, { sellMarginPct: 20 });
    const stub = items.find((i) => i.sku === "SWG-OEM-EST-STUB");
    expect(stub?.flag).toBe("OEM_ESTIMATE_STUB");
    expect(stub?.costUnitPrice).toBe(30);
    expect(stub?.extendedPrice).toBe(22500 * 1.2);
    expect(stub?.sellUnitPrice).toBe(36);
    expect(applySellMargin(30, 20)).toBe(36);
  });

  it("rolls up the Arges multi-unit BOM", () => {
    const table = swingCapacityTable(base, [
      { flowM3d: 200, units: 1 },
      { flowM3d: 500, units: 1 }
    ]);
    expect(table[0].engSku).toBe("EPS8-2.5-12");
    expect(table[1].engSku).toBe("EPS8-2.5-10");
  });
});
