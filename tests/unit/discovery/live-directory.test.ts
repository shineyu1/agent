import { beforeEach, describe, expect, it, vi } from "vitest";

const listServicesMock = vi.fn();
const listPaymentEventsMock = vi.fn();
const listPaymentAttemptsMock = vi.fn();

vi.mock("@/lib/services/registry/service-store", () => ({
  listServices: listServicesMock
}));
vi.mock("@/lib/services/gateway/payment-event-store", () => ({
  listPaymentEvents: listPaymentEventsMock
}));
vi.mock("@/lib/services/gateway/payment-attempt-store", () => ({
  listPaymentAttempts: listPaymentAttemptsMock
}));

describe("buildLiveDirectory", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns live metrics derived from payment events and attempts", async () => {
    listServicesMock.mockResolvedValue([
      {
        id: "svc_1",
        slug: "token-intel-api",
        name: "Token Intel API",
        description: "Structured token intelligence.",
        category: "market-data",
        tags: ["intel"],
        listingState: "LISTED",
        priceAmount: "0.20",
      priceCurrency: "USDT",
        successRate: 0.99,
        avgLatencyMs: 999,
        recentPaidCallCount: 99,
        providerName: "Alpha Data"
      },
      {
        id: "svc_2",
        slug: "wallet-risk-api",
        name: "Wallet Risk API",
        description: "Wallet scoring.",
        category: "risk",
        tags: ["risk"],
        listingState: "UNLISTED",
        priceAmount: "0.08",
      priceCurrency: "USDT",
        successRate: 0.8,
        avgLatencyMs: 111,
        recentPaidCallCount: 11,
        providerName: "Beta Risk"
      }
    ]);
    listPaymentEventsMock.mockResolvedValue([
      {
        serviceSlug: "token-intel-api",
        amount: 0.2,
        status: "paid",
        latencyMs: 240,
        transactionHash: "0xaaa"
      },
      {
        serviceSlug: "token-intel-api",
        amount: 0.2,
        status: "failed_delivery",
        latencyMs: 900,
        transactionHash: "0xbbb"
      }
    ]);
    listPaymentAttemptsMock.mockResolvedValue([
      {
        serviceSlug: "token-intel-api",
        status: "rejected",
        invalidReason: "invalid_signature",
        proofDigest: "proof-1"
      }
    ]);
    const { buildLiveDirectory } = await import("@/lib/services/discovery/directory");

    const directory = await buildLiveDirectory({ sortBy: "successRate" });

    expect(directory).toHaveLength(1);
    expect(directory[0]).toMatchObject({
      id: "svc_1",
      name: "Token Intel API",
      successRate: 0.5,
      avgLatencyMs: 570,
      recentPaidCallCount: 1,
      rejectedProofCount: 1
    });
  });
});
