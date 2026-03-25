import {
  fulfillServiceRequest,
  isServiceFulfillable,
  type StoredServiceLike
} from "@/lib/services/gateway/fulfillment";
import {
  listPaymentEvents,
  updatePaymentEvent,
  type PaymentEvent
} from "@/lib/services/gateway/payment-event-store";
import { getServiceBySlug } from "@/lib/services/registry/service-store";

type ReconciliationReceipt = Record<string, unknown>;

type ReconciliationSummary = {
  scanned: number;
  retryableCandidates: number;
  retried: number;
  recovered: number;
  failedAgain: number;
  nonRetryable: number;
};

export type PaymentReconciliationResult = {
  summary: ReconciliationSummary;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeRecord(
  base: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(patch)) {
    if (isPlainObject(value) && isPlainObject(merged[key])) {
      merged[key] = mergeRecord(merged[key] as Record<string, unknown>, value);
      continue;
    }

    merged[key] = value;
  }

  return merged;
}

function getReceipt(event: PaymentEvent): ReconciliationReceipt {
  return isPlainObject(event.receipt) ? event.receipt : {};
}

function getRetryableRequestBody(event: PaymentEvent) {
  const receipt = getReceipt(event);
  const settlement = isPlainObject(receipt.settlement) ? receipt.settlement : undefined;
  const upstream = isPlainObject(receipt.upstream) ? receipt.upstream : undefined;
  const upstreamStatus =
    typeof upstream?.status === "number" ? upstream.status : undefined;

  if (settlement?.settledOnchain === false) {
    return null;
  }

  if (!upstream || !("requestBody" in upstream)) {
    return null;
  }

  if (
    upstreamStatus === undefined ||
    [408, 409, 425, 429, 500, 502, 503, 504].includes(upstreamStatus)
  ) {
    return upstream.requestBody;
  }

  return null;
}

function buildReconciliationReceipt(
  event: PaymentEvent,
  latencyMs: number,
  status: number
) {
  const receipt = getReceipt(event);
  const existingUpstream = isPlainObject(receipt.upstream) ? receipt.upstream : {};

  return mergeRecord(receipt, {
    upstream: {
      ...existingUpstream,
      status
    },
    reconciliation: {
      retried: true,
      recovered: status >= 200 && status < 300,
      retriedAt: new Date().toISOString(),
      latencyMs
    }
  });
}

function buildFailedReconciliationReceipt(
  event: PaymentEvent,
  latencyMs: number,
  error: unknown
) {
  const receipt = getReceipt(event);

  return mergeRecord(receipt, {
    reconciliation: {
      retried: true,
      recovered: false,
      retriedAt: new Date().toISOString(),
      latencyMs,
      error: error instanceof Error ? error.message : "unknown_reconciliation_error"
    }
  });
}

export async function reconcilePaymentFailures(): Promise<PaymentReconciliationResult> {
  const events = await listPaymentEvents();
  const failedEvents = events.filter((event) => event.status === "failed_delivery");
  const summary: ReconciliationSummary = {
    scanned: failedEvents.length,
    retryableCandidates: 0,
    retried: 0,
    recovered: 0,
    failedAgain: 0,
    nonRetryable: 0
  };

  for (const event of failedEvents) {
    const requestBody = getRetryableRequestBody(event);

    if (requestBody === null) {
      summary.nonRetryable += 1;
      continue;
    }

    const service = await getServiceBySlug(event.serviceSlug, {
      includeSecrets: true
    });
    if (!service || !isServiceFulfillable(service as StoredServiceLike)) {
      summary.nonRetryable += 1;
      continue;
    }

    summary.retryableCandidates += 1;
    const startedAt = Date.now();
    try {
      const fulfillment = await fulfillServiceRequest(
        service as StoredServiceLike,
        requestBody,
        {
          reconciliation: true,
          retryOf: event.transactionHash,
          payerAddress: event.payerAddress,
          verificationSource: event.verificationSource,
          quoteVersion: event.quoteVersion
        }
      );
      const latencyMs = Date.now() - startedAt;

      await updatePaymentEvent(event.transactionHash, {
        status:
          fulfillment.status >= 200 && fulfillment.status < 300
            ? "paid"
            : "failed_delivery",
        latencyMs,
        receipt: buildReconciliationReceipt(event, latencyMs, fulfillment.status)
      });

      summary.retried += 1;
      if (fulfillment.status >= 200 && fulfillment.status < 300) {
        summary.recovered += 1;
      } else {
        summary.failedAgain += 1;
      }
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      await updatePaymentEvent(event.transactionHash, {
        status: "failed_delivery",
        latencyMs,
        receipt: buildFailedReconciliationReceipt(event, latencyMs, error)
      });
      summary.retried += 1;
      summary.failedAgain += 1;
    }
  }

  return { summary };
}
