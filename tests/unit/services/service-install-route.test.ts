import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/services/[slug]/install/route";

const { getServiceBySlugMock } = vi.hoisted(() => ({
  getServiceBySlugMock: vi.fn()
}));

vi.mock("@/lib/services/registry/service-store", () => ({
  getServiceBySlug: getServiceBySlugMock
}));

describe("/api/services/[slug]/install", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns a copyable install payload for agents and docs", async () => {
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

    const response = await GET(
      new Request("http://localhost/api/services/aurora-search/install"),
      {
        params: Promise.resolve({ slug: "aurora-search" })
      }
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.install).toMatchObject({
      slug: "aurora-search",
      endpoint: "/api/services/aurora-search",
      detailPath: "/api/services/aurora-search/detail",
      receiptPathTemplate: "/api/receipts/:txHash"
    });
    expect(payload.install.example).toContain("payment-signature");
    expect(payload.install.example).toContain("/api/services/aurora-search");
  });

  it("returns 404 when the service is missing", async () => {
    getServiceBySlugMock.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/services/missing/install"),
      {
        params: Promise.resolve({ slug: "missing" })
      }
    );

    expect(response.status).toBe(404);
  });
});
