import { beforeEach, describe, expect, it, vi } from "vitest";

function encodePaymentHeader(payload: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

describe("settlePaymentProof", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns skipped when onchain settlement is not enabled", async () => {
    const { settlePaymentProof } = await import(
      "@/lib/services/gateway/payment-settlement"
    );

    const result = await settlePaymentProof({
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

    expect(result).toEqual({
      ok: false,
      skipped: true
    });
  });

  it("submits settlement and returns the real tx hash when configured", async () => {
    vi.stubEnv("PAYMENT_SETTLE_ONCHAIN", "true");
    vi.stubEnv("PAYMENT_API_KEY", "test-key");
    vi.stubEnv("PAYMENT_API_SECRET", "test-secret");
    vi.stubEnv("PAYMENT_API_PASSPHRASE", "test-passphrase");
    vi.stubEnv("PAYMENT_API_BASE_URL", "https://web3.okx.com");
    vi.stubEnv("XLAYER_CHAIN_INDEX", "196");
    vi.stubEnv("PAYMENT_ASSET_ADDRESS_USDG", "0xusdg");
    vi.stubEnv("PAYMENT_ASSET_DECIMALS_USDG", "6");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "0",
          msg: "success",
          data: [
            {
              success: true,
              txHash: "0xrealhash",
              payer: "0xabc",
              errorReason: null,
              chainIndex: "196",
              chainName: "X Layer"
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

    const { settlePaymentProof } = await import(
      "@/lib/services/gateway/payment-settlement"
    );
    const result = await settlePaymentProof({
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
            validBefore: "1716153600",
            nonce: "0x1234"
          }
        }
      })
    });

    expect(result).toEqual({
      ok: true,
      txHash: "0xrealhash",
      source: "okx-settle"
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("https://web3.okx.com/api/v6/x402/settle");
    const body = JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body)) as {
      chainIndex: string;
      syncSettle: boolean;
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
        asset: string;
        maxAmountRequired: string;
      };
    };
    expect(body.chainIndex).toBe("196");
    expect(body.syncSettle).toBe(true);
    expect(body.paymentPayload).toMatchObject({
      x402Version: 1,
      scheme: "exact",
      payload: {
        signature: "demo-proof",
        authorization: {
          from: "0xabc"
        }
      }
    });
    expect(body.paymentRequirements.scheme).toBe("exact");
    expect(body.paymentRequirements.chainIndex).toBe("196");
    expect(body.paymentRequirements.asset).toBe("0xusdg");
    expect(body.paymentRequirements.maxAmountRequired).toBe("200000");
  });
});
