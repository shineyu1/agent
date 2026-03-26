import { NextResponse } from "next/server";
import { z } from "zod";
import { createProviderActionChallenge } from "@/lib/auth/agent-session";
import {
  getSensitiveCreateActions,
  getSensitiveUpdateActions,
  hashProviderActionPayload
} from "@/lib/auth/provider-actions";
import { readSellerSessionFromRequest } from "@/lib/auth/request-session";

const challengeSchema = z.object({
  serviceSlug: z.string().min(1).optional(),
  payload: z.unknown()
});

export async function POST(request: Request) {
  const sessionResult = readSellerSessionFromRequest(request);
  if (!sessionResult.ok) {
    return NextResponse.json({ error: sessionResult.message }, { status: sessionResult.status });
  }

  const parsed = challengeSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid provider action challenge payload" }, { status: 400 });
  }

  const requiredActions = parsed.data.serviceSlug
    ? getSensitiveUpdateActions(parsed.data.payload)
    : getSensitiveCreateActions(parsed.data.payload);

  if (requiredActions.length === 0) {
    return NextResponse.json(
      {
        error: "No signature-required provider changes detected"
      },
      { status: 400 }
    );
  }

  const requestHash = hashProviderActionPayload(parsed.data.payload);
  const challenge = await createProviderActionChallenge({
    walletAddress: sessionResult.session.walletAddress,
    serviceSlug: parsed.data.serviceSlug,
    requestedActions: requiredActions,
    requestHash
  });

  return NextResponse.json(challenge, { status: 201 });
}
