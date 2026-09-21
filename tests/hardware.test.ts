import { describe, expect, it } from "vitest";
import { palisadeHardware, swingHardware, swingModuleHardware } from "../src/shared/hardware.js";
import { SWING_MODULES } from "../src/shared/swingCatalog.js";

describe("hardware catalog merge", () => {
  it("marks SWG-8-2.5-12 as area-scaled ESTIMATED", () => {
    const spec = SWING_MODULES.find((m) => m.sku === "SWG-8-2.5-12");
    expect(spec?.uncratedDryWeightKg).toBeCloseTo(542.4, 5);
    expect(spec?.weightStatus).toBe("ESTIMATED");
    expect(spec?.dimsStatus).toBe("ESTIMATED");
    const takeoff = swingHardware(spec!, 2);
    expect(takeoff.totalDryWeightKg).toBeCloseTo(1084.8, 5);
  });

  it("keeps EPS9 module dry weight UNKNOWN (sheet is series 8 only)", () => {
    const spec = SWING_MODULES.find((m) => m.sku === "SWG-9-2-6");
    expect(spec?.weightStatus).toBe("UNKNOWN");
    expect(spec?.uncratedDryWeightKg ?? null).toBeNull();
    expect(swingModuleHardware("SWG-9-2-6").weightStatus).toBe("UNKNOWN");
  });

  it("does not invent a PAL-130 envelope", () => {
    const pal130 = palisadeHardware("PAL-130", 6);
    const pal260 = palisadeHardware("PAL-260", 1);
    expect(pal130.unitDims).toBe("UNKNOWN");
    expect(pal130.dimsStatus).toBe("UNKNOWN");
    expect(pal130.unitDryWeightKg).toBeNull();
    expect(pal130.totalDryWeightKg).toBeNull();
    expect(pal130.weightStatus).toBe("UNKNOWN");
    expect(pal260.unitDims).toBe("2.12 x 0.96 x 3.05 m");
    expect(pal260.dimsStatus).toBe("CONFIRMED");
    expect(pal260.unitDryWeightKg).toBeNull();
    expect(pal130.publicNote).toMatch(/pending catalog update/i);
    expect(pal130.publicNote).not.toMatch(/Qianli|Henry|Liren|273|546/i);
  });
});
