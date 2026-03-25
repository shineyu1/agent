import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/auth/claim/route";

const { consumeBridgeSessionMock, createWebSessionTokenMock } = vi.hoisted(() => ({
  consumeBridgeSessionMock: vi.fn(),
  createWebSessionTokenMock: vi.fn()
}));

vi.mock("@/lib/auth/session-bridge", () => ({
  consumeBridgeSession: consumeBridgeSessionMock,
  createWebSessionToken: createWebSessionTokenMock,
  SELLEROS_SESSION_COOKIE: "selleros_session"
}));

describe("/auth/claim", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("claims a bridge token and redirects to the bridged destination", async () => {
    consumeBridgeSessionMock.mockResolvedValue({
      ok: true,
      bridge: {
        role: "seller",
        walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
        redirectTo: "/dashboard"
      }
    });
    createWebSessionTokenMock.mockReturnValue({
      sessionToken: "session-token",
      expiresAt: "2026-03-22T20:00:00.000Z"
    });

    const response = await GET(
      new Request("http://localhost/auth/claim?token=bridge-token")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
    expect(response.headers.get("set-cookie")).toContain("selleros_session=session-token");
  });

  it("redirects invalid bridge tokens back to the install page with an error code", async () => {
    consumeBridgeSessionMock.mockResolvedValue({
      ok: false,
      message: "Bridge token is invalid or expired"
    });

    const response = await GET(new Request("http://localhost/auth/claim?token=bad-token"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/install?bridge=invalid"
    );
  });
});
