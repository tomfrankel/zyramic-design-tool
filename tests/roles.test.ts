import { describe, expect, it } from "vitest";
import { stripCommercialSecrets } from "../src/shared/lineItems.js";
import { canAccessZone, canSeePricing } from "../src/shared/roles.js";

describe("role wall", () => {
  it("allows every role into sizing", () => {
    expect(canAccessZone("customer", "sizing")).toBe(true);
    expect(canAccessZone("sales", "sizing")).toBe(true);
  });

  it("keeps customers out of commercial/pricing", () => {
    expect(canAccessZone("customer", "commercial")).toBe(false);
    expect(canSeePricing("customer")).toBe(false);
    expect(canSeePricing("sales")).toBe(true);
    expect(canSeePricing("engineering")).toBe(true);
    expect(canSeePricing("admin")).toBe(true);
  });

  it("strips cost and margin before a customer surface", () => {
    const hidden = stripCommercialSecrets([
      {
        sku: "SWG-OEM-EST-STUB",
        description: "stub",
        qty: 750,
        unit: "m²",
        unitPrice: 36,
        extendedPrice: 27000,
        costUnitPrice: 30,
        sellUnitPrice: 36,
        sellExtendedPrice: 27000,
        marginPct: 20,
        flag: "OEM_ESTIMATE_STUB",
        note: "hidden",
        commercialOnly: true
      }
    ]);
    expect(hidden[0].unitPrice).toBeNull();
    expect(hidden[0].costUnitPrice).toBeNull();
    expect(hidden[0].sellUnitPrice).toBeNull();
    expect(hidden[0].marginPct).toBeNull();
  });
});
