import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ServiceDetailPage from "@/app/services/[slug]/page";

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

describe("ServiceDetailPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("delegates to notFound when the stored service is missing", async () => {
    getServiceBySlugMock.mockResolvedValue(null);

    await expect(
      ServiceDetailPage({
        params: Promise.resolve({ slug: "missing-service" })
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("renders a consumer decision page for agent users", async () => {
    getServiceBySlugMock.mockResolvedValue({
      id: "svc_1",
      name: "Aurora Search",
      description: "Fast semantic search for agent workflows.",
      listingState: "LISTED",
      credentialMode: "HOSTED",
      sourceKind: "MANUAL",
      priceAmount: "0.05",
      slug: "aurora-search",
      category: "search",
      tags: ["search", "agent"],
      providerName: "Alpha Data",
      payoutWallet: {
        network: "xlayer",
        address: "0x1234567890abcdef1234567890abcdef12345678"
      },
      upstreamUrl: "https://provider.example.com/search",
      isActive: true
    });
    listPaymentEventsMock.mockResolvedValue([
      {
        serviceSlug: "aurora-search",
        amount: 0.05,
        status: "paid",
        latencyMs: 220,
        transactionHash: "0xpaid1",
        payerAddress: "0xabc",
        verificationSource: "okx-verify",
        quoteVersion: 1,
        receipt: {
          settlement: {
            settledOnchain: true
          }
        }
      },
      {
        serviceSlug: "aurora-search",
        amount: 0.05,
        status: "failed_delivery",
        latencyMs: 840,
        transactionHash: "0xfailed1",
        payerAddress: "0xabc",
        verificationSource: "okx-verify",
        quoteVersion: 1,
        receipt: {
          upstream: {
            status: 502
          }
        }
      }
    ]);
    listPaymentAttemptsMock.mockResolvedValue([
      {
        serviceSlug: "aurora-search",
        status: "rejected",
        invalidReason: "invalid_signature",
        payerAddress: "0xrejected",
        verificationSource: "verification_failed",
        quoteVersion: 1
      }
    ]);

    const page = await ServiceDetailPage({
      params: Promise.resolve({ slug: "aurora-search" })
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Aurora Search");
    expect(html).toContain("POST /api/services/aurora-search");
    expect(html).toContain("0.05 USD");
    expect(html).toContain("/install");
    expect(html).toContain("invalid_signature");
    expect(html).toContain("What this service is good for");
    expect(html).toContain("Recent payment records");
  });
});
