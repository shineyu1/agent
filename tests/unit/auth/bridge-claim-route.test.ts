import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/bridge/claim/route";

const { consumeBridgeSessionMock, createWebSessionTokenMock } = vi.hoisted(() => ({
  consumeBridgeSessionMock: vi.fn(),
  createWebSessionTokenMock: vi.fn()
}));

vi.mock("@/lib/auth/session-bridge", () => ({
  consumeBridgeSession: consumeBridgeSessionMock,
  createWebSessionToken: createWebSessionTokenMock,
  SELLEROS_SESSION_COOKIE: "selleros_session"
}));

describe("/api/auth/bridge/claim", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("claims a bridge token and sets a session cookie", async () => {
    consumeBridgeSessionMock.mockResolvedValue({
      ok: true,
      bridge: {
        role: "seller",
        walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
        redirectTo: "/dashboard",
        expiresAt: "2026-03-22T12:10:00.000Z"
      }
    });
    createWebSessionTokenMock.mockReturnValue({
      sessionToken: "session-token",
      expiresAt: "2026-03-22T20:00:00.000Z"
    });

    const response = await POST(
      new Request("http://localhost/api/auth/bridge/claim", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          bridgeToken: "bridge-token"
        })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.session.role).toBe("seller");
    expect(response.headers.get("set-cookie")).toContain("selleros_session=session-token");
  });

  it("returns 409 when the bridge token cannot be consumed", async () => {
    consumeBridgeSessionMock.mockResolvedValue({
      ok: false,
      message: "Bridge token has already been used"
    });

    const response = await POST(
      new Request("http://localhost/api/auth/bridge/claim", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          bridgeToken: "used-token"
        })
      })
    );

    expect(response.status).toBe(409);
  });
});
