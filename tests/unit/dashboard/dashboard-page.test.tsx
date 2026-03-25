import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import DashboardPage from "@/app/dashboard/page";

const { getLiveDashboardSnapshotMock } = vi.hoisted(() => ({
  getLiveDashboardSnapshotMock: vi.fn()
}));

vi.mock("@/lib/services/analytics/dashboard", () => ({
  getLiveDashboardSnapshot: getLiveDashboardSnapshotMock
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders user activity data", async () => {
    getLiveDashboardSnapshotMock.mockResolvedValue({
      totalIncome: "0.20",
      paidCalls: 1,
      rejectedAttempts: 1,
      successRate: "100.0",
      avgLatencyMs: 210,
      failedDeliveries: 2,
      recentTransactions: [
        {
          transactionHash: "0xabc",
          status: "paid",
          latencyMs: 210,
          payerAddress: "0xpayer",
          verificationSource: "okx-verify",
          quoteVersion: 1,
          receipt: {
            settlement: {
              settledOnchain: true
            }
          }
        }
      ],
      recentAttempts: [
        {
          serviceSlug: "token-intel-api",
          status: "rejected",
          invalidReason: "invalid_signature",
          payerAddress: "0xreject",
          verificationSource: "verification_failed",
          quoteVersion: 1
        }
      ]
    });

    const page = await DashboardPage();
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Payments, calls, and receipts");
    expect(html).toContain("0.20 USD");
    expect(html).toContain("0xabc");
    expect(html).toContain("Recent payments and receipts");
  });
});
