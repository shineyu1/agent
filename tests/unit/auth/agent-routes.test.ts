import { beforeEach, describe, expect, it, vi } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { POST as challengePOST } from "@/app/api/auth/agent/challenge/route";
import { POST as verifyPOST } from "@/app/api/auth/agent/verify/route";

const { fsMock } = vi.hoisted(() => {
  const fileStore = new Map<string, string>();

  return {
    fsMock: {
      existsSync: vi.fn((target: string) => {
        const normalized = String(target);
        return !normalized.endsWith(".json") || fileStore.has(normalized);
      }),
      mkdirSync: vi.fn(),
      readFileSync: vi.fn((target: string) => fileStore.get(String(target)) ?? "[]"),
      writeFileSync: vi.fn((target: string, content: string) => {
        fileStore.set(String(target), String(content));
      }),
      reset: () => {
        fileStore.clear();
      }
    }
  };
});

vi.mock("node:fs", () => fsMock);

const sellerAccount = privateKeyToAccount(
  "0x8b3a350cf5c34c9194ca85829f7d8c2c39d35b2e1f00d0ebc9d4fd6f9f0f1b2a"
);

describe("/api/auth/agent", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("APP_ENCRYPTION_KEY", "test-app-encryption-key");
    vi.stubEnv("APP_BASE_URL", "https://agentx402.online");
    fsMock.reset();
  });

  it("creates a login challenge and exchanges a valid signature for a seller token", async () => {
    const challengeResponse = await challengePOST(
      new Request("http://localhost/api/auth/agent/challenge", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          walletAddress: sellerAccount.address
        })
      })
    );
    const challengePayload = await challengeResponse.json();

    expect(challengeResponse.status).toBe(201);
    expect(challengePayload.challengeId).toBeTruthy();

    const signature = await sellerAccount.signMessage({
      message: challengePayload.message
    });

    const verifyResponse = await verifyPOST(
      new Request("http://localhost/api/auth/agent/verify", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          challengeId: challengePayload.challengeId,
          signature
        })
      })
    );
    const verifyPayload = await verifyResponse.json();

    expect(verifyResponse.status).toBe(200);
    expect(verifyPayload.authenticated).toBe(true);
    expect(verifyPayload.accessToken).toBeTruthy();
    expect(verifyPayload.session.walletAddress).toBe(sellerAccount.address.toLowerCase());
  });
});
