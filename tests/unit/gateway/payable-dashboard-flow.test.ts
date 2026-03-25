import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as createProviderService } from "@/app/api/providers/services/route";
import { POST as callPayableService } from "@/app/api/services/[slug]/route";
import { createWebSessionToken, SELLEROS_SESSION_COOKIE } from "@/lib/auth/session-bridge";
import { getLiveDashboardSnapshot } from "@/lib/services/analytics/dashboard";
import { resetPaymentAttemptStore } from "@/lib/services/gateway/payment-attempt-store";
import { resetPaymentEventStore } from "@/lib/services/gateway/payment-event-store";
import { resetPaymentProofClaimStore } from "@/lib/services/gateway/payment-proof-claim-store";
import { resetServiceStore } from "@/lib/services/registry/service-store";

const { verifyPaymentProofMock } = vi.hoisted(() => ({
  verifyPaymentProofMock: vi.fn()
}));
const { settlePaymentProofMock } = vi.hoisted(() => ({
  settlePaymentProofMock: vi.fn()
}));

vi.mock("@/lib/services/gateway/payment-verifier", () => ({
  verifyPaymentProof: verifyPaymentProofMock
}));
vi.mock("@/lib/services/gateway/payment-settlement", () => ({
  settlePaymentProof: settlePaymentProofMock
}));

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

describe("payable service to dashboard flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  beforeEach(async () => {
    vi.stubEnv("APP_ENCRYPTION_KEY", "test-app-encryption-key");
    verifyPaymentProofMock.mockReset();
    settlePaymentProofMock.mockReset();
    settlePaymentProofMock.mockResolvedValue({
      ok: false,
      skipped: true
    });
    await resetServiceStore();
    await resetPaymentAttemptStore();
    await resetPaymentEventStore();
    await resetPaymentProofClaimStore();

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

  it("updates live dashboard metrics after a paid successful call", async () => {
    verifyPaymentProofMock.mockResolvedValue({
      ok: true,
      payer: "0xabc",
      source: "okx-verify"
    });
    const upstreamFetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ score: 91 }), {
          status: 200,
          headers: {
            "content-type": "application/json"
          }
        })
      );

    await callPayableService(
      new Request("http://localhost/api/services/token-intel-api", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-payment": JSON.stringify({
            x402Version: 1,
            scheme: "exact",
            payload: {
              signature: "demo-proof",
              authorization: {
                from: "0xabc",
                to: "0x1111111111111111111111111111111111111111",
                value: "200000",
                validAfter: "1716150000",
                validBefore: "1716153600",
                nonce: "0x1234"
              }
            }
          })
        },
        body: JSON.stringify({ token: "OKB" })
      }),
      {
        params: Promise.resolve({ slug: "token-intel-api" })
      }
    );

    const snapshot = await getLiveDashboardSnapshot();
    expect(snapshot.paidCalls).toBe(1);
    expect(snapshot.totalIncome).toBe("0.20");
    expect(snapshot.successRate).toBe("100.0");
  });
});
