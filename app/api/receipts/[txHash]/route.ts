import { NextResponse } from "next/server";
import { findPaymentEventByTransactionHash } from "@/lib/services/gateway/payment-event-store";

type ReceiptRouteProps = {
  params: Promise<{
    txHash: string;
  }>;
};

export async function GET(request: Request, { params }: ReceiptRouteProps) {
  const { txHash } = await params;
  const event = await findPaymentEventByTransactionHash(txHash);

  if (!event) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  return NextResponse.json({
    receipt: {
      transactionHash: event.transactionHash,
      serviceSlug: event.serviceSlug,
      status: event.status,
      amount: event.amount,
      latencyMs: event.latencyMs,
      payerAddress: event.payerAddress ?? null,
      assetAddress: event.assetAddress ?? null,
      verificationSource: event.verificationSource ?? null,
      proofDigest: event.proofDigest ?? null,
      quoteVersion: event.quoteVersion ?? null,
      receipt: event.receipt ?? null
    }
  });
}
