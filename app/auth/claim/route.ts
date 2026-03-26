import { NextResponse } from "next/server";
import {
  consumeBridgeSession,
  createWebSessionToken,
  resolveAppUrl,
  SELLEROS_SESSION_COOKIE
} from "@/lib/auth/session-bridge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(resolveAppUrl("/install?bridge=missing"));
  }

  const claimResult = await consumeBridgeSession(token);
  if (!claimResult.ok) {
    return NextResponse.redirect(resolveAppUrl("/install?bridge=invalid"));
  }

  const session = createWebSessionToken({
    role: claimResult.bridge.role,
    walletAddress: claimResult.bridge.walletAddress,
    redirectTo: claimResult.bridge.redirectTo,
    providerSlug: claimResult.bridge.providerSlug,
    serviceSlug: claimResult.bridge.serviceSlug,
    txHash: claimResult.bridge.txHash
  });

  const response = NextResponse.redirect(resolveAppUrl(claimResult.bridge.redirectTo));
  response.cookies.set(SELLEROS_SESSION_COOKIE, session.sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    expires: new Date(session.expiresAt)
  });

  return response;
}
