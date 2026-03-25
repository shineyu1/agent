import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/auth/session/route";

const { readWebSessionTokenMock } = vi.hoisted(() => ({
  readWebSessionTokenMock: vi.fn()
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === "selleros_session" ? { value: "session-token" } : undefined
  }))
}));

vi.mock("@/lib/auth/session-bridge", () => ({
  readWebSessionToken: readWebSessionTokenMock,
  SELLEROS_SESSION_COOKIE: "selleros_session"
}));

describe("/api/auth/session", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the authenticated session when the cookie is valid", async () => {
    readWebSessionTokenMock.mockReturnValue({
      role: "buyer",
      walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
      redirectTo: "/directory",
      expiresAt: "2026-03-22T20:00:00.000Z"
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.authenticated).toBe(true);
    expect(payload.session.role).toBe("buyer");
  });
});
