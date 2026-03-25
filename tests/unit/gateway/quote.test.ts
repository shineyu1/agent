import { describe, expect, it } from "vitest";
import { createPaymentQuote } from "@/lib/services/gateway/quote";

describe("createPaymentQuote", () => {
  it("creates a fixed-price X Layer quote for a service", () => {
    const quote = createPaymentQuote({
      serviceId: "svc_1",
      serviceSlug: "token-intel-api",
      priceAmount: "0.20",
      payoutAddress: "0x1111111111111111111111111111111111111111",
      priceCurrency: "USDT"
    });

    expect(quote.x402Version).toBe(1);
    expect(quote.serviceId).toBe("svc_1");
    expect(quote.amount).toBe("0.20");
    expect(quote.scheme).toBe("exact");
    expect(quote.asset).toBe("USDT");
    expect(quote.network).toBe("eip155:196");
    expect(quote.payTo).toBe("0x1111111111111111111111111111111111111111");
  });
});
