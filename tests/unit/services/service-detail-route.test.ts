import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/services/[slug]/detail/route";

const { getServiceBySlugMock, listPaymentAttemptsMock, listPaymentEventsMock } =
  vi.hoisted(() => ({
    getServiceBySlugMock: vi.fn(),
    listPaymentAttemptsMock: vi.fn(),
    listPaymentEventsMock: vi.fn()
  }));

vi.mock("@/lib/services/registry/service-store", () => ({
  getServiceBySlug: getServiceBySlugMock
}));
vi.mock("@/lib/services/gateway/payment-event-store", () => ({
  listPaymentEvents: listPaymentEventsMock
}));
vi.mock("@/lib/services/gateway/payment-attempt-store", () => ({
  listPaymentAttempts: listPaymentAttemptsMock
}));

describe("/api/services/[slug]/detail", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns stable service detail metadata for buyer tools", async () => {
    getServiceBySlugMock.mockResolvedValue({
      id: "svc_1",
      slug: "aurora-search",
      name: "Aurora Search",
      description: "Fast semantic search for agent workflows.",
      category: "search",
      tags: ["search", "agent"],
      listingState: "LISTED",
      credentialMode: "HOSTED",
      sourceKind: "MANUAL",
      priceAmount: "0.05",
      priceCurrency: "USDT",
      successRate: 0.99,
      avgLatencyMs: 220,
      recentPaidCallCount: 7,
      rejectedProofCount: 1,
      providerName: "Alpha Data",
      payoutWallet: {
        network: "xlayer",
        address: "0x1234567890abcdef1234567890abcdef12345678"
      },
      httpMethod: "POST",
      upstreamUrl: "https://provider.example.com/search",
      inputSchema: { query: "string" },
      outputSchema: { results: "array" },
      isActive: true
    });
    listPaymentEventsMock.mockResolvedValue([
      {
        serviceSlug: "aurora-search",
        amount: 0.05,
        status: "paid",
        latencyMs: 220,
        transactionHash: "0xpaid1"
      }
    ]);
    listPaymentAttemptsMock.mockResolvedValue([
      {
        serviceSlug: "aurora-search",
        status: "rejected",
        invalidReason: "invalid_signature"
      }
    ]);

    const response = await GET(
      new Request("http://localhost/api/services/aurora-search/detail"),
      {
        params: Promise.resolve({ slug: "aurora-search" })
      }
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.service).toMatchObject({
      slug: "aurora-search",
      payablePath: "/api/services/aurora-search",
      detailPath: "/api/services/aurora-search/detail",
      installPath: "/api/services/aurora-search/install",
      receiptPathTemplate: "/api/receipts/:txHash",
      priceAmount: "0.05",
      priceCurrency: "USDT",
      providerName: "Alpha Data"
    });
  });

  it("returns 404 when the service slug does not exist", async () => {
    getServiceBySlugMock.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/services/missing/detail"),
      {
        params: Promise.resolve({ slug: "missing" })
      }
    );

    expect(response.status).toBe(404);
  });
});
