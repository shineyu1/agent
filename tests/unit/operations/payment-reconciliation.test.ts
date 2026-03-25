import { beforeEach, describe, expect, it, vi } from "vitest";

const { listPaymentEventsMock, updatePaymentEventMock } = vi.hoisted(() => ({
  listPaymentEventsMock: vi.fn(),
  updatePaymentEventMock: vi.fn()
}));

const { getServiceBySlugMock } = vi.hoisted(() => ({
  getServiceBySlugMock: vi.fn()
}));

const { fulfillServiceRequestMock, isServiceFulfillableMock } = vi.hoisted(() => ({
  fulfillServiceRequestMock: vi.fn(),
  isServiceFulfillableMock: vi.fn()
}));

vi.mock("@/lib/services/gateway/payment-event-store", () => ({
  listPaymentEvents: listPaymentEventsMock,
  updatePaymentEvent: updatePaymentEventMock
}));

vi.mock("@/lib/services/registry/service-store", () => ({
  getServiceBySlug: getServiceBySlugMock
}));

vi.mock("@/lib/services/gateway/fulfillment", () => ({
  fulfillServiceRequest: fulfillServiceRequestMock,
  isServiceFulfillable: isServiceFulfillableMock
}));

describe("reconcilePaymentFailures", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("retries retryable failed deliveries and updates the existing ledger record in place", async () => {
    listPaymentEventsMock.mockResolvedValue([
      {
        serviceSlug: "token-intel-api",
        amount: 0.2,
        status: "failed_delivery",
        latencyMs: 950,
        transactionHash: "0xretryable",
        payerAddress: "0xabc",
        verificationSource: "okx-verify",
        quoteVersion: 1,
        receipt: {
          settlement: {
            skipped: true
          },
          upstream: {
            status: 429,
            requestBody: {
              token: "OKB"
            }
          }
        }
      }
    ]);
    getServiceBySlugMock.mockResolvedValue({
      id: "svc_1",
      slug: "token-intel-api",
      name: "Token Intel API",
      credentialMode: "HOSTED",
      sourceKind: "MANUAL",
      upstreamUrl: "https://provider.example.com/intel",
      httpMethod: "POST"
    });
    isServiceFulfillableMock.mockReturnValue(true);
    fulfillServiceRequestMock.mockResolvedValue({
      status: 200,
      payload: {
        score: 81
      }
    });

    const { reconcilePaymentFailures } = await import(
      "@/lib/services/operations/payment-reconciliation"
    );

    const result = await reconcilePaymentFailures();

    expect(result.summary.retryableCandidates).toBe(1);
    expect(result.summary.retried).toBe(1);
    expect(result.summary.recovered).toBe(1);
    expect(fulfillServiceRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "token-intel-api"
      }),
      { token: "OKB" },
      expect.objectContaining({
        retryOf: "0xretryable",
        reconciliation: true
      })
    );
    expect(updatePaymentEventMock).toHaveBeenCalledWith(
      "0xretryable",
      expect.objectContaining({
        status: "paid",
        receipt: expect.objectContaining({
          reconciliation: expect.objectContaining({
            retried: true,
            recovered: true
          }),
          upstream: expect.objectContaining({
            status: 200,
            requestBody: {
              token: "OKB"
            }
          })
        })
      })
    );
  });

  it("skips non-retryable settlement failures", async () => {
    listPaymentEventsMock.mockResolvedValue([
      {
        serviceSlug: "token-intel-api",
        amount: 0.2,
        status: "failed_delivery",
        latencyMs: 0,
        transactionHash: "0xsettlement-failed",
        receipt: {
          settlement: {
            settledOnchain: false,
            invalidReason: "payment_settlement_failed"
          }
        }
      }
    ]);

    const { reconcilePaymentFailures } = await import(
      "@/lib/services/operations/payment-reconciliation"
    );

    const result = await reconcilePaymentFailures();

    expect(result.summary.retryableCandidates).toBe(0);
    expect(result.summary.nonRetryable).toBe(1);
    expect(fulfillServiceRequestMock).not.toHaveBeenCalled();
    expect(updatePaymentEventMock).not.toHaveBeenCalled();
  });

  it("continues scanning when one retry attempt throws", async () => {
    listPaymentEventsMock.mockResolvedValue([
      {
        serviceSlug: "token-intel-api",
        amount: 0.2,
        status: "failed_delivery",
        latencyMs: 950,
        transactionHash: "0xthrows",
        receipt: {
          settlement: {
            skipped: true
          },
          upstream: {
            status: 503,
            requestBody: {
              token: "BAD"
            }
          }
        }
      },
      {
        serviceSlug: "wallet-risk-api",
        amount: 0.08,
        status: "failed_delivery",
        latencyMs: 910,
        transactionHash: "0xrecovers",
        receipt: {
          settlement: {
            skipped: true
          },
          upstream: {
            status: 429,
            requestBody: {
              wallet: "0xabc"
            }
          }
        }
      }
    ]);
    getServiceBySlugMock.mockResolvedValue({
      id: "svc_1",
      slug: "shared-service",
      name: "Shared Service",
      credentialMode: "HOSTED",
      sourceKind: "MANUAL",
      upstreamUrl: "https://provider.example.com/retry",
      httpMethod: "POST"
    });
    isServiceFulfillableMock.mockReturnValue(true);
    fulfillServiceRequestMock
      .mockRejectedValueOnce(new Error("upstream timeout"))
      .mockResolvedValueOnce({
        status: 200,
        payload: {
          score: 99
        }
      });

    const { reconcilePaymentFailures } = await import(
      "@/lib/services/operations/payment-reconciliation"
    );

    const result = await reconcilePaymentFailures();

    expect(result.summary.retryableCandidates).toBe(2);
    expect(result.summary.retried).toBe(2);
    expect(result.summary.failedAgain).toBe(1);
    expect(result.summary.recovered).toBe(1);
    expect(updatePaymentEventMock).toHaveBeenCalledTimes(2);
  });
});
