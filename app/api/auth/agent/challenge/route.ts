import { NextResponse } from "next/server";
import { z } from "zod";
import { createSellerLoginChallenge } from "@/lib/auth/agent-session";

const challengeSchema = z.object({
  walletAddress: z.string().min(1, "walletAddress is required")
});

export async function POST(request: Request) {
  try {
    const payload = challengeSchema.parse(await request.json().catch(() => ({})));
    const challenge = await createSellerLoginChallenge(payload);

    return NextResponse.json(challenge, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        error: "Invalid agent auth challenge payload"
      },
      { status: 400 }
    );
  }
}
