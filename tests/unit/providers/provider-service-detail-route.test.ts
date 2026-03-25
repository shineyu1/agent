import { beforeEach, describe, expect, it, vi } from "vitest";
import { createWebSessionToken, SELLEROS_SESSION_COOKIE } from "@/lib/auth/session-bridge";
import { GET } from "@/app/api/providers/services/[slug]/route";

const { getProviderServiceBySlugForOwnerMock } = vi.hoisted(() => ({
  getProviderServiceBySlugForOwnerMock: vi.fn()
}));

vi.mock("@/lib/services/registry/service-store", () => ({
  getProviderServiceBySlugForOwner: getProviderServiceBySlugForOwnerMock
}));

function buildSellerCookie() {
  const session = createWebSessionToken({
    role: "seller",
    walletAddress: "0xseller111111111111111111111111111111111111",
    redirectTo: "/providers",
    providerSlug: "provider_1"
  });

  return `${SELLEROS_SESSION_COOKIE}=${encodeURIComponent(session.sessionToken)}`;
}

describe("/api/providers/services/[slug]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("APP_ENCRYPTION_KEY", "test-app-encryption-key");
  });

  it("returns 401 when no seller session is present", async () => {
    const response = await GET(new Request("http://localhost/api/providers/services/missing"), {
      params: Promise.resolve({ slug: "missing" })
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Seller session required" });
  });

  it("returns a 404 when the service cannot be found", async () => {
    getProviderServiceBySlugForOwnerMock.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/providers/services/missing", {
        headers: {
          cookie: buildSellerCookie()
        }
      }),
      {
        params: Promise.resolve({ slug: "missing" })
      }
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Service not found" });
  });

  it("returns the provider-safe service payload", async () => {
    getProviderServiceBySlugForOwnerMock.mockResolvedValue({
      id: "svc_1",
      providerId: "provider_1",
      providerName: "Provider One",
      name: "Token Intel API",
      slug: "token-intel-api",
      description: "Returns token intelligence snapshots.",
      category: "market-data",
      tags: ["token", "intel"],
      listingState: "LISTED",
      credentialMode: "HOSTED",
      sourceKind: "MANUAL",
      inputSchema: {},
      outputSchema: {},
      priceAmount: "0.20",
      priceCurrency: "USDT",
      payoutWallet: {
        network: "xlayer",
        address: "0x1111111111111111111111111111111111111111"
      },
      upstreamUrl: "https://provider.example.com/intel",
      httpMethod: "POST",
      createdAt: "2026-03-22T00:00:00.000Z",
      updatedAt: "2026-03-22T00:00:00.000Z"
    });

    const response = await GET(
      new Request("http://localhost/api/providers/services/token-intel-api", {
        headers: {
          cookie: buildSellerCookie()
        }
      }),
      {
        params: Promise.resolve({ slug: "token-intel-api" })
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.service.slug).toBe("token-intel-api");
    expect(payload.service.secretCipher).toBeUndefined();
    expect(payload.service.signingSecret).toBeUndefined();
  });
});
