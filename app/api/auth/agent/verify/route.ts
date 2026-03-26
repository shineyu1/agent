import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAgentChallenge } from "@/lib/auth/agent-session";

const verifySchema = z.object({
  challengeId: z.string().min(1, "challengeId is required"),
  signature: z.string().min(1, "signature is required")
});

export async function POST(request: Request) {
  const parsed = verifySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid agent auth verification payload" }, { status: 400 });
  }

  const result = await verifyAgentChallenge(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 401 });
  }

  if (result.kind === "seller_access") {
    return NextResponse.json({
      authenticated: true,
      accessToken: result.accessToken,
      session: result.session
    });
  }

  return NextResponse.json({
    approved: true,
    actionProofToken: result.actionProofToken,
    proof: result.proof
  });
}
