import { describe, expect, it } from "vitest";
import { getServiceHealthMetrics, summarizeServiceHealth } from "@/lib/services/analytics/service-health";

describe("service health metrics", () => {
  it("aggregates live success rate, latency, paid calls, and rejected proofs per service", () => {
    const summary = summarizeServiceHealth(
      [
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
        },
        {
          serviceSlug: "wallet-risk-api",
          amount: 0.08,
          status: "paid",
          latencyMs: 180,
          transactionHash: "0xccc"
        }
      ],
      [
        {
          serviceSlug: "token-intel-api",
          status: "rejected",
          invalidReason: "invalid_signature",
          proofDigest: "proof-1"
        }
      ]
    );

    expect(summary["token-intel-api"]).toEqual({
      successRate: 0.5,
      avgLatencyMs: 570,
      recentPaidCallCount: 1,
      rejectedProofCount: 1,
      successfulDeliveries: 1,
      failedDeliveries: 1,
      latestTransactionHash: "0xaaa"
    });
    expect(summary["wallet-risk-api"]).toEqual({
      successRate: 1,
      avgLatencyMs: 180,
      recentPaidCallCount: 1,
      rejectedProofCount: 0,
      successfulDeliveries: 1,
      failedDeliveries: 0,
      latestTransactionHash: "0xccc"
    });
  });

  it("returns zeroed metrics when a service has no events", () => {
    const metrics = getServiceHealthMetrics("missing-service", [], []);

    expect(metrics).toEqual({
      successRate: 0,
      avgLatencyMs: 0,
      recentPaidCallCount: 0,
      rejectedProofCount: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0
    });
  });
});
