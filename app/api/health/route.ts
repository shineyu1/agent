import { NextResponse } from "next/server";
import { getRuntimeReadiness } from "@/lib/runtime/runtime-readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = await getRuntimeReadiness(process.env);

  return NextResponse.json(
    {
      status: readiness.status,
      checkedAt: new Date().toISOString(),
      checks: readiness.checks
    },
    { status: readiness.status === "ready" ? 200 : 503 }
  );
}
