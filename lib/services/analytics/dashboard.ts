import { listPaymentAttempts, type PaymentAttempt } from "@/lib/services/gateway/payment-attempt-store";
import { listPaymentEvents } from "@/lib/services/gateway/payment-event-store";

export type DashboardEvent = {
  amount: number;
  status: "paid" | "failed_delivery";
  latencyMs: number;
  transactionHash: string;
  payerAddress?: string;
  verificationSource?: string;
  quoteVersion?: number;
  receipt?: Record<string, unknown>;
};

export function createDashboardSnapshot(
  events: DashboardEvent[],
  attempts: PaymentAttempt[] = []
) {
  const successes = events.filter((event) => event.status === "paid");
  const failures = events.filter((event) => event.status === "failed_delivery");
  const totalIncome = successes.reduce((sum, event) => sum + event.amount, 0);
  const avgLatencyMs =
    events.length === 0
      ? 0
      : Math.round(
          events.reduce((sum, event) => sum + event.latencyMs, 0) / events.length
        );

  return {
    totalIncome: totalIncome.toFixed(2),
    paidCalls: successes.length,
    failedDeliveries: failures.length,
    rejectedAttempts: attempts.length,
    successRate:
      events.length === 0 ? "0.0" : ((successes.length / events.length) * 100).toFixed(1),
    avgLatencyMs,
    recentTransactions: [...events],
    recentAttempts: [...attempts]
  };
}

export async function getLiveDashboardSnapshot() {
  return createDashboardSnapshot(
    await listPaymentEvents(),
    await listPaymentAttempts()
  );
}

export const demoDashboardEvents: DashboardEvent[] = [
  {
    amount: 0.08,
    status: "failed_delivery",
    latencyMs: 900,
    transactionHash: "0xa420feed003",
    payerAddress: "0x8feed",
    verificationSource: "okx-verify",
    quoteVersion: 1
  },
  {
    amount: 0.2,
    status: "paid",
    latencyMs: 240,
    transactionHash: "0xa420feed001",
    payerAddress: "0x7paid",
    verificationSource: "okx-verify",
    quoteVersion: 1,
    receipt: {
      settlement: {
        settledOnchain: true
      }
    }
  },
  {
    amount: 0.08,
    status: "paid",
    latencyMs: 180,
    transactionHash: "0xa420feed002",
    payerAddress: "0x6paid",
    verificationSource: "bypass",
    quoteVersion: 1,
    receipt: {
      settlement: {
        skipped: true
      }
    }
  }
];

export const demoDashboardAttempts: PaymentAttempt[] = [
  {
    serviceSlug: "token-intel-api",
    status: "rejected",
    invalidReason: "invalid_signature",
    payerAddress: "0xdeadbeef",
    verificationSource: "verification_failed",
    proofDigest: "proof-demo",
    quoteVersion: 1,
    receipt: {
      verification: {
        invalidReason: "invalid_signature"
      }
    }
  }
];
