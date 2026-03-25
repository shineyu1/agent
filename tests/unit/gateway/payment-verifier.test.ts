import { beforeEach, describe, expect, it, vi } from "vitest";

function encodePaymentHeader(payload: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

describe("verifyPaymentProof", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("returns a service-unavailable result when payment verification is not configured", async () => {
    const { verifyPaymentProof } = await import(
      "@/lib/services/gateway/payment-verifier"
    );

    const result = await verifyPaymentProof({
      requestUrl: "http://localhost/api/services/token-intel-api",
      priceAmount: "0.2",
      payoutAddress: "0x1111111111111111111111111111111111111111",
      paymentHeader: encodePaymentHeader({
        x402Version: 1,
        accepts: [],
        payload: {
          signature: "demo-proof",
          authorization: {
            from: "0xabc",
            to: "0x1111111111111111111111111111111111111111",
            value: "200000",
            validAfter: "1716150000",
            validBefore: "1716153600",
            nonce: "0x1234"
          }
        }
      })
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected verifier to fail when not configured");
    }
    expect(result.status).toBe(503);
    expect(result.invalidReason).toBe("payment_verifier_not_configured");
  });

  it("signs and submits a verification request to OKX when configured", async () => {
    vi.stubEnv("PAYMENT_API_KEY", "test-key");
    vi.stubEnv("PAYMENT_API_SECRET", "test-secret");
    vi.stubEnv("PAYMENT_API_PASSPHRASE", "test-passphrase");
    vi.stubEnv("PAYMENT_API_BASE_URL", "https://web3.okx.com");
    vi.stubEnv("XLAYER_CHAIN_INDEX", "196");
    vi.stubEnv("PAYMENT_ASSET_ADDRESS_USDT", "0xusdt");
    vi.stubEnv("PAYMENT_ASSET_DECIMALS_USDT", "6");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "0",
          msg: "success",
          data: [
            {
              isValid: true,
              payer: "0xabc",
              invalidReason: null
            }
          ]
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json"
          }
        }
      )
    );

    const { verifyPaymentProof } = await import(
      "@/lib/services/gateway/payment-verifier"
    );
    const result = await verifyPaymentProof({
      requestUrl: "http://localhost/api/services/token-intel-api",
      priceAmount: "0.2",
      priceCurrency: "USDT",
      payoutAddress: "0x1111111111111111111111111111111111111111",
      paymentHeader: encodePaymentHeader({
        x402Version: 1,
        accepts: [],
        payload: {
          signature: "demo-proof",
          authorization: {
            from: "0xabc",
            to: "0x1111111111111111111111111111111111111111",
            value: "200000",
            validAfter: "1716150000",
            validBefore: "1716153600",
            nonce: "0x1234"
          }
        }
      })
    });

    expect(result).toEqual({
      ok: true,
      payer: "0xabc",
      source: "okx-verify"
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] ?? [];
    expect(url).toBe("https://web3.okx.com/api/v6/x402/verify");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Headers).get("OK-ACCESS-KEY")).toBe("test-key");
    expect((init?.headers as Headers).get("OK-ACCESS-PASSPHRASE")).toBe(
      "test-passphrase"
    );
    expect((init?.headers as Headers).get("OK-ACCESS-TIMESTAMP")).toBeTruthy();

    const body = JSON.parse(String(init?.body)) as {
      chainIndex: string;
      paymentPayload: {
        x402Version: number;
        scheme: string;
        chainIndex: string;
        payload: {
          signature: string;
          authorization: {
            from: string;
          };
        };
      };
      paymentRequirements: {
        scheme: string;
        chainIndex: string;
        maxAmountRequired: string;
        payTo: string;
        asset: string;
      };
    };
    expect(body.chainIndex).toBe("196");
    expect(body.paymentPayload).toMatchObject({
      x402Version: 1,
      scheme: "exact",
      chainIndex: "196",
      payload: {
        signature: "demo-proof",
        authorization: {
          from: "0xabc"
        }
      }
    });
    expect(body.paymentRequirements.scheme).toBe("exact");
    expect(body.paymentRequirements.chainIndex).toBe("196");
    expect(body.paymentRequirements.maxAmountRequired).toBe("200000");
    expect(body.paymentRequirements.payTo).toBe(
      "0x1111111111111111111111111111111111111111"
    );
    expect(body.paymentRequirements.asset).toBe("0xusdt");
  });

  it("applies local amount, payout, and validity checks when bypass mode is enabled", async () => {
    vi.stubEnv("PAYMENT_VERIFY_BYPASS", "true");
    vi.stubEnv("PAYMENT_ASSET_DECIMALS_USDG", "6");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-22T00:00:00Z"));

    const { verifyPaymentProof } = await import(
      "@/lib/services/gateway/payment-verifier"
    );

    const result = await verifyPaymentProof({
      requestUrl: "http://localhost/api/services/token-intel-api",
      priceAmount: "0.2",
      priceCurrency: "USDG",
      payoutAddress: "0x1111111111111111111111111111111111111111",
      paymentHeader: encodePaymentHeader({
        x402Version: 1,
        accepts: [],
        payload: {
          signature: "demo-proof",
          authorization: {
            from: "0xabc",
            to: "0x1111111111111111111111111111111111111111",
            value: "200000",
            validAfter: "1716150000",
            validBefore: "1775000000",
            nonce: "0x1234"
          }
        }
      })
    });

    expect(result).toEqual({
      ok: true,
      payer: "0xabc",
      source: "bypass"
    });
  });

  it("rejects bypass mode requests with mismatched payout details", async () => {
    vi.stubEnv("PAYMENT_VERIFY_BYPASS", "true");
    vi.stubEnv("PAYMENT_ASSET_DECIMALS_USDT", "6");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-22T00:00:00Z"));

    const { verifyPaymentProof } = await import(
      "@/lib/services/gateway/payment-verifier"
    );

    const result = await verifyPaymentProof({
      requestUrl: "http://localhost/api/services/token-intel-api",
      priceAmount: "0.2",
      priceCurrency: "USDT",
      payoutAddress: "0x1111111111111111111111111111111111111111",
      paymentHeader: encodePaymentHeader({
        x402Version: 1,
        accepts: [],
        payload: {
          signature: "demo-proof",
          authorization: {
            from: "0xabc",
            to: "0x9999999999999999999999999999999999999999",
            value: "200000",
            validAfter: "1716150000",
            validBefore: "1775000000",
            nonce: "0x1234"
          }
        }
      })
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected bypass verification to reject mismatched payout");
    }
    expect(result.status).toBe(402);
    expect(result.invalidReason).toBe("payment_bypass_payout_mismatch");
  });
});
