import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/auth/claim/route";

const { consumeBridgeSessionMock, createWebSessionTokenMock } = vi.hoisted(() => ({
  consumeBridgeSessionMock: vi.fn(),
  createWebSessionTokenMock: vi.fn()
}));

vi.mock("@/lib/auth/session-bridge", () => ({
  consumeBridgeSession: consumeBridgeSessionMock,
  createWebSessionToken: createWebSessionTokenMock,
  resolveAppUrl: (path: string) =>
    new URL(path, `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/`),
  SELLEROS_SESSION_COOKIE: "selleros_session"
}));

describe("/auth/claim", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
  });

  it("redirects to the public app host instead of the internal request host", async () => {
    vi.stubEnv("APP_BASE_URL", "https://agentx402.online");
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
      new Request("http://localhost:3000/auth/claim?token=bridge-token")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://agentx402.online/dashboard");
    expect(response.headers.get("set-cookie")).toContain("selleros_session=session-token");
  });

  it("redirects invalid bridge tokens back to the install page with an error code", async () => {
    vi.stubEnv("APP_BASE_URL", "https://agentx402.online");
    consumeBridgeSessionMock.mockResolvedValue({
      ok: false,
      message: "Bridge token is invalid or expired"
    });

    const response = await GET(
      new Request("http://localhost:3000/auth/claim?token=bad-token")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://agentx402.online/install?bridge=invalid"
    );
  });
});
