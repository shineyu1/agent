import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  consumeBridgeSession,
  createBridgeSession,
  createWebSessionToken,
  readWebSessionToken,
  resetSessionBridgeStore
} from "@/lib/auth/session-bridge";

const { fsMock } = vi.hoisted(() => {
  let storeContent = "[]";

  return {
    fsMock: {
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      readFileSync: vi.fn(() => storeContent),
      writeFileSync: vi.fn((_path: string, content: string) => {
        storeContent = content;
      })
    }
  };
});

vi.mock("node:fs", () => fsMock);

describe("session bridge store", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.stubEnv("APP_ENCRYPTION_KEY", "test-encryption-key");
    vi.stubEnv("APP_BASE_URL", "https://selleros.example");
    await resetSessionBridgeStore();
  });

  it("creates and consumes a bridge token once", async () => {
    const bridge = await createBridgeSession({
      role: "seller",
      walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
      redirectTo: "/dashboard"
    });

    const firstClaim = await consumeBridgeSession(bridge.bridgeToken);
    const secondClaim = await consumeBridgeSession(bridge.bridgeToken);

    expect(firstClaim.ok).toBe(true);
    expect(secondClaim).toEqual({
      ok: false,
      message: "Bridge token has already been used"
    });
  });

  it("encodes and decodes a web session token", () => {
    const encoded = createWebSessionToken({
      role: "buyer",
      walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
      redirectTo: "/directory"
    });

    const decoded = readWebSessionToken(encoded.sessionToken);

    expect(decoded?.role).toBe("buyer");
    expect(decoded?.redirectTo).toBe("/directory");
  });
});
