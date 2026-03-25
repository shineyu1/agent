import { describe, expect, it } from "vitest";

describe("toBaseUnits", () => {
  it("converts decimal price strings into exact base units", async () => {
    const { toBaseUnits } = await import("@/lib/services/gateway/payment-amounts");

    expect(toBaseUnits("0.29", 6)).toBe("290000");
    expect(toBaseUnits("1", 6)).toBe("1000000");
    expect(toBaseUnits("0.000001", 6)).toBe("1");
  });

  it("rejects amounts with more precision than the asset supports", async () => {
    const { toBaseUnits } = await import("@/lib/services/gateway/payment-amounts");

    expect(() => toBaseUnits("0.0000001", 6)).toThrow("Invalid price amount");
  });

  it("rejects invalid and negative amounts", async () => {
    const { toBaseUnits } = await import("@/lib/services/gateway/payment-amounts");

    expect(() => toBaseUnits("-1", 6)).toThrow("Invalid price amount");
    expect(() => toBaseUnits("not-a-number", 6)).toThrow("Invalid price amount");
  });
});
