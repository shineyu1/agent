import { NextResponse } from "next/server";
import { getLiveDashboardSnapshot } from "@/lib/services/analytics/dashboard";
import { getRuntimeReadiness } from "@/lib/runtime/runtime-readiness";
import { getPaymentOperationsSnapshot } from "@/lib/services/operations/payment-operations";

export const dynamic = "force-dynamic";

export async function GET() {
  const [snapshot, readiness, operations] = await Promise.all([
    getLiveDashboardSnapshot(),
    getRuntimeReadiness(process.env),
    getPaymentOperationsSnapshot()
  ]);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    snapshot,
    readiness,
    operations
  });
}
