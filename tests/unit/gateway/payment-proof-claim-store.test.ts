import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as createProviderService } from "@/app/api/providers/services/route";
import { createWebSessionToken, SELLEROS_SESSION_COOKIE } from "@/lib/auth/session-bridge";
import { resetServiceStore } from "@/lib/services/registry/service-store";

function buildSellerCookie(
  walletAddress = "0xseller111111111111111111111111111111111111",
  providerSlug = "provider_1"
) {
  const session = createWebSessionToken({
    role: "seller",
    walletAddress,
    redirectTo: "/providers",
    providerSlug
  });

  return `${SELLEROS_SESSION_COOKIE}=${encodeURIComponent(session.sessionToken)}`;
}

describe("payment-proof-claim-store", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("APP_ENCRYPTION_KEY", "test-app-encryption-key");
    await resetServiceStore();

    await createProviderService(
      new Request("http://localhost/api/providers/services", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: buildSellerCookie()
        },
        body: JSON.stringify({
          providerId: "provider_1",
          serviceName: "Token Intel API",
          description: "Returns token intelligence snapshots.",
          category: "market-data",
          tags: ["token", "intel"],
          inputSchema: { token: "string" },
          outputSchema: { score: "number" },
          priceAmount: "0.2",
          payoutWallet: {
            network: "xlayer",
            address: "0x1111111111111111111111111111111111111111"
          },
          publishing: {
            visibility: "listed"
          },
          source: {
            kind: "manual",
            method: "POST",
            upstreamUrl: "https://provider.example.com/intel"
          },
          access: {
            mode: "hosted",
            authType: "bearer",
            secretCipher: "ciphertext"
          }
        })
      })
    );
  });

  it("claims a proof once per service slug and rejects duplicate claims", async () => {
    const {
      claimPaymentProof,
      listPaymentProofClaims,
      resetPaymentProofClaimStore
    } = await import("@/lib/services/gateway/payment-proof-claim-store");

    await resetPaymentProofClaimStore();

    const firstClaim = await claimPaymentProof({
      serviceSlug: "token-intel-api",
      proofDigest: "digest-1",
      payerAddress: "0xabc",
      verificationSource: "okx-verify",
      quoteVersion: 1
    });
    const secondClaim = await claimPaymentProof({
      serviceSlug: "token-intel-api",
      proofDigest: "digest-1",
      payerAddress: "0xabc",
      verificationSource: "okx-verify",
      quoteVersion: 1
    });

    expect(firstClaim).toBe(true);
    expect(secondClaim).toBe(false);

    const claims = await listPaymentProofClaims();
    expect(claims).toHaveLength(1);
    expect(claims[0]).toMatchObject({
      serviceSlug: "token-intel-api",
      proofDigest: "digest-1",
      payerAddress: "0xabc",
      verificationSource: "okx-verify",
      quoteVersion: 1
    });
  });
});
