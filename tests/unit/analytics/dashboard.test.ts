import { describe, expect, it } from "vitest";
import { createDashboardSnapshot } from "@/lib/services/analytics/dashboard";

describe("createDashboardSnapshot", () => {
  it("aggregates paid calls, income, and recent transaction entries", () => {
    const snapshot = createDashboardSnapshot([
      {
        amount: 0.2,
        status: "paid",
        latencyMs: 240,
        transactionHash: "0xaaa"
      },
      {
        amount: 0.08,
        status: "paid",
        latencyMs: 180,
        transactionHash: "0xbbb"
      },
      {
        amount: 0.08,
        status: "failed_delivery",
        latencyMs: 900,
        transactionHash: "0xccc"
      }
    ]);

    expect(snapshot.totalIncome).toBe("0.28");
    expect(snapshot.paidCalls).toBe(2);
    expect(snapshot.failedDeliveries).toBe(1);
    expect(snapshot.successRate).toBe("66.7");
    expect(snapshot.avgLatencyMs).toBe(440);
    expect(snapshot.recentTransactions[0]?.transactionHash).toBe("0xaaa");
  });
});
