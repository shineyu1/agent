import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ProviderServicePage from "@/app/providers/[slug]/page";

const {
  getServiceBySlugMock,
  listPaymentEventsMock,
  listPaymentAttemptsMock,
  notFoundMock
} = vi.hoisted(() => ({
  getServiceBySlugMock: vi.fn(),
  listPaymentEventsMock: vi.fn(),
  listPaymentAttemptsMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  })
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock
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

describe("ProviderServicePage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("delegates to notFound when the stored service is missing", async () => {
    getServiceBySlugMock.mockResolvedValue(null);

    await expect(
      ProviderServicePage({
        params: Promise.resolve({ slug: "missing-service" })
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("renders recent payment and rejected-proof metadata for the service", async () => {
    getServiceBySlugMock.mockResolvedValue({
      name: "Token Intel API",
      description: "Returns token intelligence snapshots.",
      listingState: "LISTED",
      credentialMode: "HOSTED",
      priceAmount: "0.20",
      slug: "token-intel-api",
      sourceKind: "MANUAL",
      httpMethod: "POST",
      upstreamUrl: "https://provider.example.com/intel",
      payoutWallet: {
        network: "xlayer",
        address: "0x1111111111111111111111111111111111111111"
      }
    });
    listPaymentEventsMock.mockResolvedValue([
      {
        serviceSlug: "token-intel-api",
        amount: 0.2,
        status: "paid",
        latencyMs: 240,
        transactionHash: "0xrealhash",
        payerAddress: "0xabc",
        verificationSource: "okx-verify",
        quoteVersion: 1,
        receipt: {
          settlement: {
            settledOnchain: true
          }
        }
      }
    ]);
    listPaymentAttemptsMock.mockResolvedValue([
      {
        serviceSlug: "token-intel-api",
        status: "rejected",
        invalidReason: "invalid_signature",
        payerAddress: "0xrejected",
        verificationSource: "verification_failed",
        quoteVersion: 1
      }
    ]);

    const page = await ProviderServicePage({
      params: Promise.resolve({ slug: "token-intel-api" })
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("最近支付活动");
    expect(html).toContain("0xrealhash");
    expect(html).toContain("OKX 验签");
    expect(html).toContain("被拒绝证明");
    expect(html).toContain("invalid_signature");
    expect(html).toContain("/api/services/token-intel-api");
    expect(html).toContain("/services/token-intel-api");
    expect(html).toContain("https://provider.example.com/intel");
    expect(html).toContain("已完成调用");
  });
});
