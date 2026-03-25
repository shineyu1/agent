import { listPaymentAttempts } from "@/lib/services/gateway/payment-attempt-store";
import { listPaymentEvents, type PaymentEvent } from "@/lib/services/gateway/payment-event-store";

export type PaymentOperationsSnapshot = {
  failedDeliveries: number;
  recoveredDeliveries: number;
  retryableFailures: number;
  rejectedProofs: number;
  latestFailedTransactions: Array<{
    transactionHash: string;
    serviceSlug: string;
    reason: string;
  }>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getFailureReason(event: PaymentEvent) {
  const receipt = isPlainObject(event.receipt) ? event.receipt : {};
  const reconciliation = isPlainObject(receipt.reconciliation)
    ? receipt.reconciliation
    : undefined;
  const upstream = isPlainObject(receipt.upstream) ? receipt.upstream : undefined;
  const settlement = isPlainObject(receipt.settlement) ? receipt.settlement : undefined;

  if (typeof reconciliation?.error === "string") {
    return reconciliation.error;
  }

  if (typeof upstream?.status === "number") {
    return `upstream_${upstream.status}`;
  }

  if (typeof settlement?.invalidReason === "string") {
    return settlement.invalidReason;
  }

  return "delivery_failed";
}

function isRetryableFailure(event: PaymentEvent) {
  if (event.status !== "failed_delivery") {
    return false;
  }

  const receipt = isPlainObject(event.receipt) ? event.receipt : {};
  const settlement = isPlainObject(receipt.settlement) ? receipt.settlement : undefined;
  const upstream = isPlainObject(receipt.upstream) ? receipt.upstream : undefined;
  const upstreamStatus =
    typeof upstream?.status === "number" ? upstream.status : undefined;

  if (settlement?.settledOnchain === false) {
    return false;
  }

  if (!upstream || !("requestBody" in upstream)) {
    return false;
  }

  return (
    upstreamStatus === undefined ||
    [408, 409, 425, 429, 500, 502, 503, 504].includes(upstreamStatus)
  );
}

function wasRecovered(event: PaymentEvent) {
  if (event.status !== "paid") {
    return false;
  }

  const receipt = isPlainObject(event.receipt) ? event.receipt : {};
  const reconciliation = isPlainObject(receipt.reconciliation)
    ? receipt.reconciliation
    : undefined;

  return reconciliation?.recovered === true;
}

export async function getPaymentOperationsSnapshot(): Promise<PaymentOperationsSnapshot> {
  const [events, attempts] = await Promise.all([
    listPaymentEvents(),
    listPaymentAttempts()
  ]);
  const failedEvents = events.filter((event) => event.status === "failed_delivery");

  return {
    failedDeliveries: failedEvents.length,
    recoveredDeliveries: events.filter(wasRecovered).length,
    retryableFailures: failedEvents.filter(isRetryableFailure).length,
    rejectedProofs: attempts.length,
    latestFailedTransactions: failedEvents.slice(0, 5).map((event) => ({
      transactionHash: event.transactionHash,
      serviceSlug: event.serviceSlug,
      reason: getFailureReason(event)
    }))
  };
}
