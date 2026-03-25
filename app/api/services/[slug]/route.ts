import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { recordPaymentAttempt } from "@/lib/services/gateway/payment-attempt-store";
import { recordPaymentEvent } from "@/lib/services/gateway/payment-event-store";
import {
  fulfillServiceRequest,
  isServiceFulfillable,
  type StoredServiceLike
} from "@/lib/services/gateway/fulfillment";
import { claimPaymentProof } from "@/lib/services/gateway/payment-proof-claim-store";
import { getPaymentAssetConfig } from "@/lib/services/gateway/payment-assets";
import { createPaymentQuote } from "@/lib/services/gateway/quote";
import { settlePaymentProof } from "@/lib/services/gateway/payment-settlement";
import { verifyPaymentProof } from "@/lib/services/gateway/payment-verifier";
import {
  createX402PaymentPayload,
  encodeX402PaymentPayload,
  parseX402PaymentHeader
} from "@/lib/services/gateway/x402-payload";
import { getServiceBySlug } from "@/lib/services/registry/service-store";

type PayableRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

function extractPaymentAttemptContext(paymentProof: string) {
  try {
    const parsed = parseX402PaymentHeader(paymentProof) as {
      x402Version?: number | string;
      payload?: {
        authorization?: {
          from?: string;
        };
      };
    };

    return {
      payerAddress:
        typeof parsed.payload?.authorization?.from === "string"
          ? parsed.payload.authorization.from
          : "unknown-payer",
      quoteVersion:
        typeof parsed.x402Version === "number"
          ? parsed.x402Version
          : Number(parsed.x402Version ?? 1)
    };
  } catch {
    return {
      payerAddress: "unknown-payer",
      quoteVersion: 1
    };
  }
}

function buildSettlementReceipt(
  settlement: Awaited<ReturnType<typeof settlePaymentProof>>
) {
  if (settlement.ok) {
    return {
      txHash: settlement.txHash,
      source: settlement.source,
      settledOnchain: true
    };
  }

  if (settlement.skipped) {
    return {
      skipped: true
    };
  }

  return {
    settledOnchain: false,
    invalidReason: settlement.invalidReason ?? "payment_settlement_failed",
    status: settlement.status
  };
}


export async function POST(request: Request, { params }: PayableRouteProps) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug, { includeSecrets: true });

  if (!service) {
    return NextResponse.json(
      {
        error: "Service not found"
      },
      { status: 404 }
    );
  }

  const paymentProof =
    request.headers.get("payment-signature") ?? request.headers.get("x-payment");
  const paymentAsset = getPaymentAssetConfig(service.priceCurrency);
  const quote = createPaymentQuote({
    serviceId: service.id,
    serviceSlug: service.slug,
    priceAmount: service.priceAmount,
    payoutAddress: service.payoutWallet.address,
    priceCurrency: service.priceCurrency
  });

  if (!paymentProof) {
    const x402Payload = createX402PaymentPayload({
      requestUrl: request.url,
      serviceId: service.id,
      serviceSlug: service.slug,
      description: service.description,
      priceAmount: service.priceAmount,
      priceCurrency: service.priceCurrency,
      payoutAddress: service.payoutWallet.address,
      outputSchema: service.outputSchema
    });

    return new NextResponse(encodeX402PaymentPayload(x402Payload), {
      status: 402,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-agent-service-layer-quote": JSON.stringify(quote)
      }
    });
  }

  if (!isServiceFulfillable(service as StoredServiceLike)) {
    return NextResponse.json(
      {
        error: "Service source is not yet wired for direct fulfillment"
      },
      { status: 501 }
    );
  }

  const proofDigest = createHash("sha256").update(paymentProof).digest("hex");
  const attemptContext = extractPaymentAttemptContext(paymentProof);
  const proofClaimed = await claimPaymentProof({
    serviceSlug: service.slug,
    proofDigest,
    payerAddress: attemptContext.payerAddress,
    verificationSource: "payment_claimed",
    quoteVersion: attemptContext.quoteVersion
  });

  if (!proofClaimed) {
    await recordPaymentAttempt({
      serviceSlug: service.slug,
      status: "rejected",
      invalidReason: "payment_proof_replayed",
      payerAddress: attemptContext.payerAddress,
      verificationSource: "replay_guard",
      proofDigest,
      quoteVersion: attemptContext.quoteVersion,
      receipt: {
        verification: {
          payer: attemptContext.payerAddress,
          invalidReason: "payment_proof_replayed"
        }
      }
    });

    return NextResponse.json(
      {
        error: "Payment proof has already been used",
        invalidReason: "payment_proof_replayed",
        quote
      },
      { status: 409 }
    );
  }

  const verification = await verifyPaymentProof({
    requestUrl: request.url,
    priceAmount: service.priceAmount,
    priceCurrency: service.priceCurrency,
    payoutAddress: service.payoutWallet.address,
    paymentHeader: paymentProof,
    description: service.description,
    outputSchema: service.outputSchema
  });

  if (!verification.ok) {
    await recordPaymentAttempt({
      serviceSlug: service.slug,
      status: "rejected",
      invalidReason: verification.invalidReason,
      payerAddress: attemptContext.payerAddress,
      verificationSource: "verification_failed",
      proofDigest,
      quoteVersion: attemptContext.quoteVersion,
      receipt: {
        verification: {
          payer: attemptContext.payerAddress,
          invalidReason: verification.invalidReason
        }
      }
    });

    return NextResponse.json(
      {
        error: "Payment verification failed",
        invalidReason: verification.invalidReason,
        quote
      },
      { status: verification.status }
    );
  }

  const body = await request.json().catch(() => ({}));
  const startedAt = Date.now();
  const settlement = await settlePaymentProof({
    requestUrl: request.url,
    priceAmount: service.priceAmount,
    priceCurrency: service.priceCurrency,
    payoutAddress: service.payoutWallet.address,
    paymentHeader: paymentProof
  });
  const settlementReceipt = buildSettlementReceipt(settlement);

  if (!settlement.ok && !settlement.skipped) {
    const transactionReference = `settlement_failed_${service.slug}_${Date.now()}`;
    await recordPaymentEvent({
      serviceSlug: service.slug,
      amount: Number(service.priceAmount),
      status: "failed_delivery",
      latencyMs: 0,
      transactionHash: transactionReference,
      payerAddress: verification.payer,
      assetAddress: paymentAsset.assetAddress,
      verificationSource: verification.source,
      proofDigest,
      quoteVersion: quote.x402Version,
      receipt: {
        verification: {
          payer: verification.payer,
          source: verification.source
        },
        settlement: settlementReceipt
      }
    });

    return NextResponse.json(
      {
        error: "Payment settlement failed",
        invalidReason: settlement.invalidReason ?? "payment_settlement_failed",
        transactionReference
      },
      { status: settlement.status ?? 502 }
    );
  }

  try {
    const fulfillment = await fulfillServiceRequest(service as StoredServiceLike, body, {
      payerAddress: verification.payer,
      verificationSource: verification.source,
      proofDigest,
      quoteVersion: quote.x402Version,
      settlement: settlementReceipt
    });
    const latencyMs = Date.now() - startedAt;
    const transactionReference =
      settlement.ok ? settlement.txHash : `tx_${service.slug}_${Date.now()}`;

    await recordPaymentEvent({
      serviceSlug: service.slug,
      amount: Number(service.priceAmount),
      status: fulfillment.status >= 200 && fulfillment.status < 300 ? "paid" : "failed_delivery",
      latencyMs,
      transactionHash: transactionReference,
      payerAddress: verification.payer,
      assetAddress: paymentAsset.assetAddress,
      verificationSource: verification.source,
      proofDigest,
      quoteVersion: quote.x402Version,
      receipt: {
        verification: {
          payer: verification.payer,
          source: verification.source
        },
        settlement: settlementReceipt,
        upstream: {
          status: fulfillment.status,
          requestBody: body
        }
      }
    });

    if (fulfillment.status < 200 || fulfillment.status >= 300) {
      return NextResponse.json(
        {
          error: "Upstream fulfillment failed",
          status: fulfillment.status,
          transactionReference
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      service: service.slug,
      request: body,
      result: fulfillment.payload,
      transactionReference
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SERVICE_NOT_FULFILLABLE") {
      return NextResponse.json(
        {
          error: "Service source is not yet wired for direct fulfillment"
        },
        { status: 501 }
      );
    }

    const transactionReference =
      settlement.ok ? settlement.txHash : `tx_${service.slug}_${Date.now()}`;
    await recordPaymentEvent({
      serviceSlug: service.slug,
      amount: Number(service.priceAmount),
      status: "failed_delivery",
      latencyMs: Date.now() - startedAt,
      transactionHash: transactionReference,
      payerAddress: verification.payer,
      assetAddress: paymentAsset.assetAddress,
      verificationSource: verification.source,
      proofDigest,
      quoteVersion: quote.x402Version,
      receipt: {
        verification: {
          payer: verification.payer,
          source: verification.source
        },
        settlement: settlementReceipt,
        upstream: {
          requestBody: body
        }
      }
    });

    return NextResponse.json(
      {
        error: "Upstream fulfillment failed",
        transactionReference
      },
      { status: 502 }
    );
  }
}
