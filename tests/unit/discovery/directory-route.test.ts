import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as createProviderService } from "@/app/api/providers/services/route";
import { GET as getDirectory } from "@/app/api/directory/route";
import { POST as postProviderService } from "@/app/api/providers/services/route";
import { createWebSessionToken, SELLEROS_SESSION_COOKIE } from "@/lib/auth/session-bridge";
import { resetServiceStore } from "@/lib/services/registry/service-store";

const { fsMock, dbMock } = vi.hoisted(() => {
  const fsMock = {
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(() => {
      throw new Error("file store should not be used when Prisma is available");
    }),
    writeFileSync: vi.fn()
  };

  const dbMock = {
    service: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn()
    },
    provider: {
      upsert: vi.fn(),
      findUnique: vi.fn()
    }
  };

  return { fsMock, dbMock };
});

vi.mock("node:fs", () => fsMock);
vi.mock("@/lib/db/client", () => ({ db: dbMock }));

function buildServiceRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "svc_1",
    providerId: "provider_1",
    name: "Aurora Search",
    slug: "aurora-search",
    description: "Fast semantic search for agent workflows.",
    category: "search",
    tags: ["search"],
    listingState: "LISTED",
    credentialMode: "HOSTED",
    sourceKind: "OPENAPI",
    upstreamUrl: null,
    httpMethod: null,
    specUrl: "https://example.com/openapi.json",
    operationId: "search",
    inputSchema: {},
    outputSchema: {},
    priceAmount: { toString: () => "0.05" },
    priceCurrency: "USDT",
    successRate: 0.99,
    avgLatencyMs: 220,
    recentPaidCallCount: 1,
    isActive: true,
    createdAt: new Date("2026-03-22T00:00:00.000Z"),
    updatedAt: new Date("2026-03-22T00:00:00.000Z"),
    provider: {
      id: "provider_1",
      name: "Provider One",
      slug: "provider_1"
    },
    payoutWallet: {
      id: "payout_1",
      providerId: "provider_1",
      serviceId: "svc_1",
      network: "xlayer",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      feeBps: 0,
      createdAt: new Date("2026-03-22T00:00:00.000Z"),
      updatedAt: new Date("2026-03-22T00:00:00.000Z")
    },
    upstreamCredential: {
      id: "cred_1",
      serviceId: "svc_1",
      authType: "bearer",
      secretCipher: "ciphertext",
      keyHint: null,
      createdAt: new Date("2026-03-22T00:00:00.000Z"),
      updatedAt: new Date("2026-03-22T00:00:00.000Z")
    },
    relayConfiguration: null,
    ...overrides
  };
}

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

beforeEach(async () => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
  vi.stubEnv("APP_ENCRYPTION_KEY", "test-app-encryption-key");
  dbMock.provider.findUnique.mockResolvedValue(null);
  await resetServiceStore();
});

describe("/api/directory", () => {
  it("includes newly created listed services in the agent directory", async () => {
    const service = buildServiceRecord({
      id: "svc_aurora"
    });
    dbMock.service.create.mockResolvedValue(service);
    dbMock.service.findMany.mockResolvedValue([service]);
    dbMock.service.findUnique.mockResolvedValue(service);

    await postProviderService(
      new Request("http://localhost/api/providers/services", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: buildSellerCookie(undefined, "provider_1")
        },
        body: JSON.stringify({
          name: "Aurora Search",
          summary: "Fast semantic search for agent workflows.",
          sourceMode: "openapi",
          source: {
            type: "openapi",
            url: "https://example.com/openapi.json"
          },
          accessMode: "hosted",
          pricing: {
            pricePerCall: 0.05,
            currency: "USDT"
          },
          payoutWallet: "0x1234567890abcdef1234567890abcdef12345678",
          visibility: "listed"
        })
      })
    );

    const response = await getDirectory(
      new Request("http://localhost/api/directory?sortBy=price")
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(
      payload.services.some((service: { name: string }) => service.name === "Aurora Search")
    ).toBe(true);
    expect(payload.services[0]).toHaveProperty("installPath");
    expect(payload.services[0]).toHaveProperty("receiptPathTemplate");
    expect(payload.services[0]?.price).toContain("USDT");
  });

  it("does not expose unlisted services in the directory payload", async () => {
    const service = buildServiceRecord({
      id: "svc_hidden",
      slug: "hidden-research",
      name: "Hidden Research",
      listingState: "UNLISTED"
    });
    dbMock.service.create.mockResolvedValue(service);
    dbMock.service.findMany.mockResolvedValue([service]);
    dbMock.service.findUnique.mockResolvedValue(service);

    await postProviderService(
      new Request("http://localhost/api/providers/services", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: buildSellerCookie(undefined, "provider_1")
        },
        body: JSON.stringify({
          name: "Hidden Research",
          summary: "Private service.",
          sourceMode: "openapi",
          source: {
            type: "openapi",
            url: "https://example.com/openapi.json"
          },
          accessMode: "hosted",
          pricing: {
            pricePerCall: 0.12
          },
          payoutWallet: "0x1234567890abcdef1234567890abcdef12345678",
          visibility: "unlisted"
        })
      })
    );

    const response = await getDirectory(new Request("http://localhost/api/directory"));
    const payload = await response.json();

    expect(payload.services.some((service: { name: string }) => service.name === "Hidden Research")).toBe(false);
  });

  it("provider services endpoint returns stored services for console use", async () => {
    const service = buildServiceRecord({
      id: "svc_wallet",
      name: "Wallet Lens",
      slug: "wallet-lens",
      sourceKind: "MANUAL",
      httpMethod: "POST",
      upstreamUrl: "https://provider.example.com/wallet-lens",
      specUrl: null,
      operationId: null
    });
    dbMock.service.create.mockResolvedValue(service);
    dbMock.service.findMany.mockResolvedValue([service]);
    dbMock.service.findUnique.mockResolvedValue(service);

    await postProviderService(
      new Request("http://localhost/api/providers/services", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: buildSellerCookie(undefined, "provider_1")
        },
        body: JSON.stringify({
          name: "Wallet Lens",
          summary: "Wallet intelligence.",
          sourceMode: "manual",
          source: {
            type: "manual",
            baseUrl: "https://provider.example.com",
            path: "/wallet-lens"
          },
          accessMode: "relay",
          pricing: {
            pricePerCall: 0.09,
            currency: "USDG"
          },
          payoutWallet: "0x1234567890abcdef1234567890abcdef12345678",
          visibility: "listed"
        })
      })
    );

    const response = await createProviderService(
      new Request("http://localhost/api/providers/services", {
        headers: {
          cookie: buildSellerCookie(undefined, "provider_1")
        }
      })
    );
    const payload = await response.json();

    expect(payload.services).toHaveLength(1);
    expect(payload.services[0]?.slug).toBe("wallet-lens");
    expect(payload.services[0]?.priceCurrency).toBe("USDT");
  });
});
