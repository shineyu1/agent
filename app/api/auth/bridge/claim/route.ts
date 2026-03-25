import { NextResponse } from "next/server";
import { z } from "zod";
import {
  consumeBridgeSession,
  createWebSessionToken,
  SELLEROS_SESSION_COOKIE
} from "@/lib/auth/session-bridge";

const claimSchema = z.object({
  bridgeToken: z.string().min(1, "bridgeToken is required")
});

export async function POST(request: Request) {
  const parsed = claimSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid bridge claim payload" }, { status: 400 });
  }

  const claimResult = await consumeBridgeSession(parsed.data.bridgeToken);
  if (!claimResult.ok) {
    return NextResponse.json(
      {
        error: claimResult.message
      },
      {
        status:
          claimResult.message === "Bridge token has already been used" ? 409 : 400
      }
    );
  }

  const session = createWebSessionToken({
    role: claimResult.bridge.role,
    walletAddress: claimResult.bridge.walletAddress,
    redirectTo: claimResult.bridge.redirectTo,
    providerSlug: claimResult.bridge.providerSlug,
    serviceSlug: claimResult.bridge.serviceSlug,
    txHash: claimResult.bridge.txHash
  });

  const response = NextResponse.json({
    authenticated: true,
    session: {
      role: claimResult.bridge.role,
      walletAddress: claimResult.bridge.walletAddress,
      redirectTo: claimResult.bridge.redirectTo,
      providerSlug: claimResult.bridge.providerSlug ?? null,
      serviceSlug: claimResult.bridge.serviceSlug ?? null,
      txHash: claimResult.bridge.txHash ?? null,
      expiresAt: session.expiresAt
    }
  });

  response.cookies.set(SELLEROS_SESSION_COOKIE, session.sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    expires: new Date(session.expiresAt)
  });

  return response;
}
