import { beforeEach, describe, expect, it } from "vitest";
import { recordPaymentAttempt, resetPaymentAttemptStore } from "@/lib/services/gateway/payment-attempt-store";
import { recordPaymentEvent, resetPaymentEventStore } from "@/lib/services/gateway/payment-event-store";
import { getLiveDashboardSnapshot } from "@/lib/services/analytics/dashboard";

describe("getLiveDashboardSnapshot", () => {
  beforeEach(async () => {
    await resetPaymentAttemptStore();
    await resetPaymentEventStore();
  });

  it("builds dashboard metrics from recorded payment events", async () => {
    await recordPaymentEvent({
      serviceSlug: "token-intel-api",
      amount: 0.2,
      status: "paid",
      latencyMs: 240,
      transactionHash: "0xaaa"
    });

    await recordPaymentEvent({
      serviceSlug: "wallet-risk-api",
      amount: 0.08,
      status: "failed_delivery",
      latencyMs: 900,
      transactionHash: "0xbbb"
    });

    await recordPaymentAttempt({
      serviceSlug: "token-intel-api",
      status: "rejected",
      invalidReason: "invalid_signature",
      payerAddress: "0xrejected",
      verificationSource: "verification_failed",
      proofDigest: "proof-sha256",
      quoteVersion: 1,
      receipt: {
        verification: {
          invalidReason: "invalid_signature"
        }
      }
    });

    const snapshot = await getLiveDashboardSnapshot();

    expect(snapshot.totalIncome).toBe("0.20");
    expect(snapshot.paidCalls).toBe(1);
    expect(snapshot.failedDeliveries).toBe(1);
    expect(snapshot.successRate).toBe("50.0");
    expect(snapshot.rejectedAttempts).toBe(1);
    expect(snapshot.recentTransactions[0]?.transactionHash).toBe("0xbbb");
    expect(snapshot.recentAttempts[0]?.invalidReason).toBe("invalid_signature");
  });
});
