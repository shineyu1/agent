import { NextResponse } from "next/server";
import { SELLEROS_SESSION_COOKIE } from "@/lib/auth/session-bridge";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SELLEROS_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 0
  });
  return response;
}
