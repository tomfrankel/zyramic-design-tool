import { describe, expect, it } from "vitest";
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
});
