import { NextResponse } from "next/server";
import { reconcilePaymentFailures } from "@/lib/services/operations/payment-reconciliation";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const expectedToken = process.env.OPS_API_TOKEN;
  if (!expectedToken) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${expectedToken}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        error: "Unauthorized"
      },
      { status: 401 }
    );
  }

  const result = await reconcilePaymentFailures();

  return NextResponse.json(result);
}
