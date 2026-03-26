import { beforeEach, describe, expect, it, vi } from "vitest";
import { createWebSessionToken, SELLEROS_SESSION_COOKIE } from "@/lib/auth/session-bridge";
import {
  createSellerActionProofToken,
  createSellerAgentAccessToken
} from "@/lib/auth/agent-session";
import { hashProviderActionPayload } from "@/lib/auth/provider-actions";
import { PATCH } from "@/app/api/providers/services/[slug]/route";

const SELLER_WALLET = "0x1234567890abcdef1234567890abcdef12345678";

const { updateProviderServiceBySlugForOwnerMock } = vi.hoisted(() => ({
  updateProviderServiceBySlugForOwnerMock: vi.fn()
}));

vi.mock("@/lib/services/registry/service-store", () => ({
  updateProviderServiceBySlugForOwner: updateProviderServiceBySlugForOwnerMock
}));

function buildSellerCookie() {
  const session = createWebSessionToken({
    role: "seller",
    walletAddress: SELLER_WALLET,
    redirectTo: "/providers",
    providerSlug: "provider_1"
  });

  return `${SELLEROS_SESSION_COOKIE}=${encodeURIComponent(session.sessionToken)}`;
}

function buildSellerAuthHeader() {
  return `Bearer ${createSellerAgentAccessToken({
    walletAddress: SELLER_WALLET
  })}`;
}

describe("/api/providers/services/[slug] PATCH", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("APP_ENCRYPTION_KEY", "test-app-encryption-key");
  });

  it("returns 401 when no seller session is present", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/providers/services/token-intel-api", {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({})
      }),
      {
        params: Promise.resolve({ slug: "token-intel-api" })
      }
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Seller session required" });
  });

  it("returns 400 when the service update is rejected", async () => {
    updateProviderServiceBySlugForOwnerMock.mockResolvedValue({
      ok: false,
      message: "No editable fields provided"
    });

    const response = await PATCH(
      new Request("http://localhost/api/providers/services/token-intel-api", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: buildSellerCookie()
        },
        body: JSON.stringify({})
      }),
      {
        params: Promise.resolve({ slug: "token-intel-api" })
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("No editable fields provided");
  });

  it("returns the updated provider-safe service", async () => {
    updateProviderServiceBySlugForOwnerMock.mockResolvedValue({
      ok: true,
      service: {
        id: "svc_1",
        providerId: "provider_1",
        providerName: "Provider One",
        name: "Token Intel API v2",
        slug: "token-intel-api",
        description: "Updated description.",
        category: "market-data",
        tags: ["token", "intel", "v2"],
        listingState: "UNLISTED",
        credentialMode: "HOSTED",
        sourceKind: "MANUAL",
        inputSchema: {},
        outputSchema: {},
        priceAmount: "0.25",
        priceCurrency: "USDT",
        payoutWallet: {
          network: "xlayer",
          address: "0x2222222222222222222222222222222222222222"
        },
        upstreamUrl: "https://provider.example.com/updated",
        httpMethod: "PATCH",
        createdAt: "2026-03-22T00:00:00.000Z",
        updatedAt: "2026-03-22T00:00:00.000Z"
      }
    });

    const response = await PATCH(
      new Request("http://localhost/api/providers/services/token-intel-api", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: buildSellerCookie()
        },
        body: JSON.stringify({
          name: "Token Intel API v2",
          description: "Updated description."
        })
      }),
      {
        params: Promise.resolve({ slug: "token-intel-api" })
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.service.name).toBe("Token Intel API v2");
  });

  it("accepts bearer-token seller auth for non-sensitive updates", async () => {
    updateProviderServiceBySlugForOwnerMock.mockResolvedValue({
      ok: true,
      service: {
        slug: "token-intel-api",
        name: "Token Intel API v2"
      }
    });

    const response = await PATCH(
      new Request("http://localhost/api/providers/services/token-intel-api", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: buildSellerAuthHeader()
        },
        body: JSON.stringify({
          name: "Token Intel API v2"
        })
      }),
      {
        params: Promise.resolve({ slug: "token-intel-api" })
      }
    );

    expect(response.status).toBe(200);
  });

  it("rejects sensitive updates without a signed action proof", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/providers/services/token-intel-api", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: buildSellerAuthHeader()
        },
        body: JSON.stringify({
          priceAmount: "0.25"
        })
      }),
      {
        params: Promise.resolve({ slug: "token-intel-api" })
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.requiredActions).toEqual(["update_price"]);
    expect(updateProviderServiceBySlugForOwnerMock).not.toHaveBeenCalled();
  });

  it("accepts sensitive updates when a matching signed action proof is present", async () => {
    updateProviderServiceBySlugForOwnerMock.mockResolvedValue({
      ok: true,
      service: {
        slug: "token-intel-api",
        priceAmount: "0.25"
      }
    });

    const patchPayload = {
      priceAmount: "0.25"
    };

    const response = await PATCH(
      new Request("http://localhost/api/providers/services/token-intel-api", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: buildSellerAuthHeader(),
          "x-seller-action-proof": createSellerActionProofToken({
            walletAddress: SELLER_WALLET,
            serviceSlug: "token-intel-api",
            actions: ["update_price"],
            requestHash: hashProviderActionPayload(patchPayload)
          })
        },
        body: JSON.stringify(patchPayload)
      }),
      {
        params: Promise.resolve({ slug: "token-intel-api" })
      }
    );

    expect(response.status).toBe(200);
  });
});
