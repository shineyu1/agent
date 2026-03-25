import type { PaymentAttempt } from "@/lib/services/gateway/payment-attempt-store";
import type { PaymentEvent } from "@/lib/services/gateway/payment-event-store";

export type ServiceHealthMetrics = {
  successRate: number;
  avgLatencyMs: number;
  recentPaidCallCount: number;
  rejectedProofCount: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  latestTransactionHash?: string;
};

function createEmptyMetrics(): ServiceHealthMetrics {
  return {
    successRate: 0,
    avgLatencyMs: 0,
    recentPaidCallCount: 0,
    rejectedProofCount: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0
  };
}

function getServiceMetricsBucket(
  buckets: Map<string, ServiceHealthMetrics>,
  serviceSlug: string
) {
  const current = buckets.get(serviceSlug);
  if (current) {
    return current;
  }

  const next = createEmptyMetrics();
  buckets.set(serviceSlug, next);
  return next;
}

export function summarizeServiceHealth(
  events: PaymentEvent[],
  attempts: PaymentAttempt[]
): Record<string, ServiceHealthMetrics> {
  const buckets = new Map<string, ServiceHealthMetrics>();

  for (const event of events) {
    const bucket = getServiceMetricsBucket(buckets, event.serviceSlug);
    bucket.avgLatencyMs += event.latencyMs;
    bucket.latestTransactionHash ??= event.transactionHash;

    if (event.status === "paid") {
      bucket.recentPaidCallCount += 1;
      bucket.successfulDeliveries += 1;
    } else {
      bucket.failedDeliveries += 1;
    }
  }

  for (const attempt of attempts) {
    const bucket = getServiceMetricsBucket(buckets, attempt.serviceSlug);
    bucket.rejectedProofCount += 1;
  }

  const totals = new Map<string, { successful: number; total: number }>();
  for (const event of events) {
    const total = totals.get(event.serviceSlug) ?? { successful: 0, total: 0 };
    total.total += 1;
    if (event.status === "paid") {
      total.successful += 1;
    }
    totals.set(event.serviceSlug, total);
  }

  const summary: Record<string, ServiceHealthMetrics> = {};

  for (const [serviceSlug, bucket] of buckets.entries()) {
    const total = totals.get(serviceSlug) ?? { successful: 0, total: 0 };
    const eventCount = total.total;
    summary[serviceSlug] = {
      successRate: eventCount === 0 ? 0 : total.successful / eventCount,
      avgLatencyMs: eventCount === 0 ? 0 : Math.round(bucket.avgLatencyMs / eventCount),
      recentPaidCallCount: bucket.recentPaidCallCount,
      rejectedProofCount: bucket.rejectedProofCount,
      successfulDeliveries: bucket.successfulDeliveries,
      failedDeliveries: bucket.failedDeliveries,
      latestTransactionHash: bucket.latestTransactionHash
    };
  }

  return summary;
}

export function getServiceHealthMetrics(
  serviceSlug: string,
  events: PaymentEvent[],
  attempts: PaymentAttempt[]
): ServiceHealthMetrics {
  return summarizeServiceHealth(events, attempts)[serviceSlug] ?? createEmptyMetrics();
}
