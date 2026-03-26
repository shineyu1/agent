import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { POST } from "@/app/api/auth/bridge/start/route";

const { createBridgeSessionMock, parseBridgeStartInputMock } = vi.hoisted(() => ({
  createBridgeSessionMock: vi.fn(),
  parseBridgeStartInputMock: vi.fn((input) => input)
}));

vi.mock("@/lib/auth/session-bridge", () => ({
  createBridgeSession: createBridgeSessionMock,
  parseBridgeStartInput: parseBridgeStartInputMock
}));

describe("/api/auth/bridge/start", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    parseBridgeStartInputMock.mockImplementation((input) => input);
  });

  it("creates a bridge token for a seller session", async () => {
    createBridgeSessionMock.mockResolvedValue({
      bridgeToken: "bridge-token",
      claimUrl: "/auth/claim?token=bridge-token",
      expiresAt: "2026-03-22T12:10:00.000Z",
      redirectTo: "/dashboard"
    });

    const response = await POST(
      new Request("http://localhost/api/auth/bridge/start", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          role: "seller",
          walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
          redirectTo: "/dashboard"
        })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.claimUrl).toBe("/auth/claim?token=bridge-token");
    expect(payload.redirectTo).toBe("/dashboard");
  });

  it("returns 400 for invalid payloads", async () => {
    parseBridgeStartInputMock.mockImplementation(() => {
      throw new ZodError([]);
    });

    const response = await POST(
      new Request("http://localhost/api/auth/bridge/start", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          role: "seller"
        })
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 for malformed json bodies", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/bridge/start", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: "{"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      error: "Invalid bridge payload"
    });
    expect(createBridgeSessionMock).not.toHaveBeenCalled();
  });
});
