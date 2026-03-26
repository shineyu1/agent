import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readWebSessionToken, SELLEROS_SESSION_COOKIE } from "@/lib/auth/session-bridge";
import { readSellerAgentAccessToken } from "@/lib/auth/agent-session";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    const token = authorization.slice("bearer ".length).trim();
    const session = readSellerAgentAccessToken(token);
    if (session) {
      return NextResponse.json({
        authenticated: true,
        session
      });
    }
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SELLEROS_SESSION_COOKIE);

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false, session: null });
  }

  const session = readWebSessionToken(sessionCookie.value);
  if (!session) {
    return NextResponse.json({ authenticated: false, session: null });
  }

  return NextResponse.json({
    authenticated: true,
    session
  });
}
