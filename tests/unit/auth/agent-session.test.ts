import { beforeEach, describe, expect, it, vi } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import {
  createProviderActionChallenge,
  createSellerLoginChallenge,
  readSellerActionProofToken,
  readSellerAgentAccessToken,
  verifyAgentChallenge
} from "@/lib/auth/agent-session";

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
  "0x59c6995e998f97a5a0044966f0945382d8c6d8f7f70b8bc02d54f52e6a8f1a11"
);

describe("agent session auth", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("APP_ENCRYPTION_KEY", "test-app-encryption-key");
    vi.stubEnv("APP_BASE_URL", "https://agentx402.online");
    fsMock.reset();
  });

  it("issues a seller bearer token after a valid login signature", async () => {
    const challenge = await createSellerLoginChallenge({
      walletAddress: sellerAccount.address
    });
    const signature = await sellerAccount.signMessage({
      message: challenge.message
    });

    const result = await verifyAgentChallenge({
      challengeId: challenge.challengeId,
      signature
    });

    expect(result.ok).toBe(true);
    if (!result.ok || result.kind !== "seller_access") {
      throw new Error("expected seller access token");
    }

    const session = readSellerAgentAccessToken(result.accessToken);
    expect(session?.walletAddress).toBe(sellerAccount.address.toLowerCase());
    expect(session?.role).toBe("seller");
  });

  it("issues an action proof token that is bound to the request hash", async () => {
    const challenge = await createProviderActionChallenge({
      walletAddress: sellerAccount.address,
      requestedActions: ["update_price", "update_payout_wallet"],
      requestHash: "sha256:test-payload",
      serviceSlug: "token-intel-api"
    });
    const signature = await sellerAccount.signMessage({
      message: challenge.message
    });

    const result = await verifyAgentChallenge({
      challengeId: challenge.challengeId,
      signature
    });

    expect(result.ok).toBe(true);
    if (!result.ok || result.kind !== "provider_action_proof") {
      throw new Error("expected provider action proof token");
    }

    const proof = readSellerActionProofToken(result.actionProofToken);
    expect(proof?.walletAddress).toBe(sellerAccount.address.toLowerCase());
    expect(proof?.serviceSlug).toBe("token-intel-api");
    expect(proof?.requestHash).toBe("sha256:test-payload");
    expect(proof?.actions).toEqual(["update_price", "update_payout_wallet"]);
  });
});
