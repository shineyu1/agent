import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readWebSessionToken, SELLEROS_SESSION_COOKIE } from "@/lib/auth/session-bridge";

export async function GET() {
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
