import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/providers/services/route";
import { createWebSessionToken, SELLEROS_SESSION_COOKIE } from "@/lib/auth/session-bridge";
import {
  createSellerActionProofToken,
  createSellerAgentAccessToken
} from "@/lib/auth/agent-session";
import { hashProviderActionPayload } from "@/lib/auth/provider-actions";
import {
  getProviderServiceBySlugForOwner,
  resetServiceStore,
  updateProviderServiceBySlugForOwner
} from "@/lib/services/registry/service-store";

const SELLER_WALLET = "0x1234567890abcdef1234567890abcdef12345678";

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
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn()
    },
    provider: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn()
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
    name: "Token Intel API",
    slug: "token-intel-api",
    description: "Returns token intelligence snapshots.",
    category: "market-data",
    tags: ["token", "intel"],
    listingState: "LISTED",
    credentialMode: "HOSTED",
    sourceKind: "MANUAL",
    upstreamUrl: "https://provider.example.com/intel",
    httpMethod: "POST",
    specUrl: null,
    operationId: null,
    inputSchema: { token: "string" },
    outputSchema: { score: "number" },
    priceAmount: { toString: () => "0.2" },
    priceCurrency: "USDT",
    successRate: 0.991,
    avgLatencyMs: 240,
    recentPaidCallCount: 21,
    isActive: true,
    createdAt: new Date("2026-03-22T00:00:00.000Z"),
    updatedAt: new Date("2026-03-22T00:00:00.000Z"),
    provider: {
      id: "provider_1",
      name: "Provider One",
      slug: "provider_1",
      ownerWalletAddress: SELLER_WALLET
    },
    payoutWallet: {
      id: "payout_1",
      providerId: "provider_1",
      serviceId: "svc_1",
      network: "xlayer",
      address: "0x1111111111111111111111111111111111111111",
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

async function setPrismaServiceList(services: ReturnType<typeof buildServiceRecord>[]) {
  dbMock.service.findMany.mockImplementation(async ({ where } = {}) => {
    const ownerWallet = where?.provider?.ownerWalletAddress;
    if (!ownerWallet) {
      return services;
    }

    return services.filter((service) => service.provider.ownerWalletAddress === ownerWallet);
  });
  dbMock.service.findFirst.mockImplementation(async ({ where }) => {
    return (
      services.find(
        (service) =>
          service.slug === where?.slug &&
          service.provider.ownerWalletAddress === where?.provider?.ownerWalletAddress
      ) ?? null
    );
  });
  dbMock.service.findUnique.mockImplementation(async ({ where }) => {
    return services.find((service) => service.slug === where.slug) ?? null;
  });
  dbMock.service.create.mockImplementation(async () => services[0] ?? buildServiceRecord());
  dbMock.provider.findUnique.mockImplementation(async ({ where }) => {
    return services.find((service) => service.provider.slug === where.slug)?.provider ?? null;
  });
  dbMock.provider.create.mockImplementation(async ({ data }) => ({
    id: typeof data.slug === "string" ? `${data.slug}_id` : "provider_created_id",
    name: data.name,
    slug: data.slug,
    ownerWalletAddress: data.ownerWalletAddress ?? null
  }));
}

function buildSellerCookie(walletAddress = SELLER_WALLET, providerSlug = "provider_1") {
  const session = createWebSessionToken({
    role: "seller",
    walletAddress,
    redirectTo: "/providers",
    providerSlug
  });

  return `${SELLEROS_SESSION_COOKIE}=${encodeURIComponent(session.sessionToken)}`;
}

function buildSellerAuthHeader(walletAddress = SELLER_WALLET) {
  return `Bearer ${createSellerAgentAccessToken({
    walletAddress
  })}`;
}

beforeEach(async () => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
  vi.stubEnv("APP_ENCRYPTION_KEY", "test-app-encryption-key");
  await resetServiceStore();
});

describe("/api/providers/services", () => {
  it("requires a seller session for provider service reads", async () => {
    const response = await GET(new Request("http://localhost/api/providers/services"));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Seller session required" });
  });

  it("creates a service from a valid manual definition through Prisma", async () => {
    const service = buildServiceRecord({
      id: "svc_manual",
      name: "Token Intel API",
      slug: "token-intel-api",
      sourceKind: "MANUAL",
      credentialMode: "HOSTED",
      listingState: "LISTED",
      priceCurrency: "USDT"
    });
    await setPrismaServiceList([]);
    dbMock.provider.findUnique.mockResolvedValue(null);
    dbMock.service.create.mockResolvedValue(service);

    const createPayload = {
      providerId: "provider_1",
      serviceName: "Token Intel API",
      description: "Returns token intelligence snapshots.",
      category: "market-data",
      tags: ["token", "intel"],
      inputSchema: { token: "string" },
      outputSchema: { score: "number" },
      priceAmount: "0.2",
      priceCurrency: "USDT",
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
    };

    const response = await POST(
      new Request("http://localhost/api/providers/services", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: buildSellerCookie(),
          "x-seller-action-proof": createSellerActionProofToken({
            walletAddress: SELLER_WALLET,
            actions: ["publish_service"],
            requestHash: hashProviderActionPayload(createPayload)
          })
        },
        body: JSON.stringify(createPayload)
      })
    );

    expect(response.status).toBe(201);

    const payload = await response.json();
    expect(payload.service.slug).toBe("token-intel-api");
    expect(payload.service.listingState).toBe("LISTED");
    expect(payload.service.priceCurrency).toBe("USDT");
    expect(
      dbMock.provider.create.mock.calls[0]?.[0]?.data?.ownerWalletAddress
    ).toBe(SELLER_WALLET);
    expect(
      dbMock.service.create.mock.calls[0]?.[0]?.data?.provider?.connect?.id
    ).toBe("provider_1_id");
    expect(
      dbMock.service.create.mock.calls[0]?.[0]?.data?.payoutWallet?.create?.provider?.connect?.id
    ).toBe("provider_1_id");
    expect(dbMock.service.create.mock.calls[0]?.[0]?.data?.priceCurrency).toBe("USDT");
    expect(
      dbMock.service.create.mock.calls[0]?.[0]?.data?.upstreamCredential?.create?.secretCipher
    ).toMatch(/^enc:v1:/);
    expect(
      dbMock.service.create.mock.calls[0]?.[0]?.data?.upstreamCredential?.create?.secretCipher
    ).not.toBe("ciphertext");
    expect(payload.service.secretCipher).toBeUndefined();
  });

  it("creates an unlisted service with bearer-token seller auth", async () => {
    const service = buildServiceRecord({
      id: "svc_manual_bearer",
      name: "Token Intel Draft",
      slug: "token-intel-draft",
      listingState: "UNLISTED"
    });
    await setPrismaServiceList([]);
    dbMock.provider.findUnique.mockResolvedValue(null);
    dbMock.service.create.mockResolvedValue(service);

    const createPayload = {
      providerId: "provider_1",
      serviceName: "Token Intel Draft",
      description: "Returns token intelligence snapshots.",
      category: "market-data",
      tags: ["token", "intel"],
      inputSchema: { token: "string" },
      outputSchema: { score: "number" },
      priceAmount: "0.2",
      priceCurrency: "USDT",
      payoutWallet: {
        network: "xlayer",
        address: "0x1111111111111111111111111111111111111111"
      },
      publishing: {
        visibility: "unlisted"
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
    };

    const response = await POST(
      new Request("http://localhost/api/providers/services", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: buildSellerAuthHeader()
        },
        body: JSON.stringify(createPayload)
      })
    );

    expect(response.status).toBe(201);
  });

  it("rejects publishing a service without a signed action proof", async () => {
    const createPayload = {
      providerId: "provider_1",
      serviceName: "Token Intel API",
      description: "Returns token intelligence snapshots.",
      category: "market-data",
      tags: ["token", "intel"],
      inputSchema: { token: "string" },
      outputSchema: { score: "number" },
      priceAmount: "0.2",
      priceCurrency: "USDT",
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
    };

    const response = await POST(
      new Request("http://localhost/api/providers/services", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: buildSellerAuthHeader()
        },
        body: JSON.stringify(createPayload)
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.requiredActions).toEqual(["publish_service"]);
  });

  it("accepts publishing a service when a signed action proof matches the request", async () => {
    const service = buildServiceRecord({
      id: "svc_listed_bearer",
      slug: "token-intel-api",
      listingState: "LISTED"
    });
    await setPrismaServiceList([]);
    dbMock.provider.findUnique.mockResolvedValue(null);
    dbMock.service.create.mockResolvedValue(service);

    const createPayload = {
      providerId: "provider_1",
      serviceName: "Token Intel API",
      description: "Returns token intelligence snapshots.",
      category: "market-data",
      tags: ["token", "intel"],
      inputSchema: { token: "string" },
      outputSchema: { score: "number" },
      priceAmount: "0.2",
      priceCurrency: "USDT",
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
    };

    const response = await POST(
      new Request("http://localhost/api/providers/services", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: buildSellerAuthHeader(),
          "x-seller-action-proof": createSellerActionProofToken({
            walletAddress: SELLER_WALLET,
            actions: ["publish_service"],
            requestHash: hashProviderActionPayload(createPayload)
          })
        },
        body: JSON.stringify(createPayload)
      })
    );

    expect(response.status).toBe(201);
  });

  it("returns validation errors for invalid payloads", async () => {
    const response = await POST(
      new Request("http://localhost/api/providers/services", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: buildSellerCookie()
        },
        body: JSON.stringify({
          providerId: "provider_1",
          serviceName: "",
          description: "Broken request",
          category: "market-data",
          tags: [],
          inputSchema: {},
          outputSchema: {},
          priceAmount: "-1",
          payoutWallet: {
            network: "xlayer",
            address: "0x1111111111111111111111111111111111111111"
          },
          publishing: {
            visibility: "unlisted"
          },
          source: {
            kind: "manual",
            method: "GET",
            upstreamUrl: "https://provider.example.com/bad"
          },
          access: {
            mode: "hosted",
            authType: "bearer",
            secretCipher: "ciphertext"
          }
        })
      })
    );

    expect(response.status).toBe(400);
  });

  it("lists services from Prisma-backed storage", async () => {
    const service = buildServiceRecord({
      id: "svc_wallet",
      name: "Wallet Risk API",
      slug: "wallet-risk-api",
      category: "risk",
      tags: ["wallet"],
      listingState: "UNLISTED",
      sourceKind: "OPENAPI",
      specUrl: "https://provider.example.com/openapi.json",
      operationId: "scoreWallet",
      credentialMode: "RELAY",
      upstreamCredential: null,
      relayConfiguration: {
        id: "relay_1",
        serviceId: "svc_wallet",
        relayUrl: "https://relay.example.com/wallet-risk",
        signingSecret: "relay-secret",
        createdAt: new Date("2026-03-22T00:00:00.000Z"),
        updatedAt: new Date("2026-03-22T00:00:00.000Z")
      }
    });
    await setPrismaServiceList([service]);

    const response = await GET(
      new Request("http://localhost/api/providers/services", {
        headers: {
          cookie: buildSellerCookie()
        }
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.services).toHaveLength(1);
    expect(payload.services[0]?.name).toBe("Wallet Risk API");
    expect(payload.services[0]?.signingSecret).toBeUndefined();
  });

  it("accepts the lightweight onboarding payload used by the provider form", async () => {
    const service = buildServiceRecord({
      id: "svc_aurora",
      name: "Aurora Search",
      slug: "aurora-search",
      sourceKind: "OPENAPI",
      listingState: "LISTED",
      priceCurrency: "USDG"
    });
    await setPrismaServiceList([service]);
    dbMock.service.create.mockResolvedValue(service);

    const lightweightPayload = {
      providerId: "alpha-data",
      name: "Aurora Search",
      summary: "Fast semantic search for agent workflows.",
      sourceMode: "openapi",
      source: {
        type: "openapi",
        url: "https://example.com/openapi.json",
        operationId: "searchDocuments"
      },
      accessMode: "hosted",
      access: {
        authType: "bearer",
        secret: "sk_live_demo"
      },
      pricing: {
        pricePerCall: 0.05,
        currency: "USDG"
      },
      payoutWallet: "0x1234567890abcdef1234567890abcdef12345678",
      visibility: "listed"
    };

    const response = await POST(
      new Request("http://localhost/api/providers/services", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: buildSellerCookie(undefined, "alpha-data"),
          "x-seller-action-proof": createSellerActionProofToken({
            walletAddress: SELLER_WALLET,
            actions: ["publish_service"],
            requestHash: hashProviderActionPayload(lightweightPayload)
          })
        },
        body: JSON.stringify(lightweightPayload)
      })
    );

    expect(response.status).toBe(201);

    const payload = await response.json();
    expect(payload.slug).toBe("aurora-search");
    expect(payload.service.name).toBe("Aurora Search");
    expect(payload.service.priceCurrency).toBe("USDG");
    expect(payload.service.secretCipher).toBeUndefined();
  });

  it("returns provider-safe service reads without secrets for the owner wallet", async () => {
    dbMock.service.findFirst.mockResolvedValue(buildServiceRecord());

    const service = await getProviderServiceBySlugForOwner("token-intel-api", SELLER_WALLET);

    expect(service?.slug).toBe("token-intel-api");
    expect(service?.secretCipher).toBeUndefined();
    expect(service?.signingSecret).toBeUndefined();
  });

  it("applies only safe editable fields when updating a service", async () => {
    dbMock.service.findFirst.mockResolvedValue(buildServiceRecord());
    dbMock.service.update.mockImplementation(async ({ data }) => ({
      ...buildServiceRecord(),
      ...data
    }));

    const result = await updateProviderServiceBySlugForOwner("token-intel-api", SELLER_WALLET, {
      name: "Token Intel API v2",
      description: "Updated description.",
      category: "market-data",
      tags: ["token", "intel", "v2"],
      listingState: "UNLISTED",
      priceAmount: "0.25",
      payoutWallet: {
        network: "xlayer",
        address: "0x2222222222222222222222222222222222222222"
      },
      isActive: false,
      upstreamUrl: "https://provider.example.com/updated",
      httpMethod: "PATCH",
      specUrl: "https://provider.example.com/openapi.json",
      operationId: "ignored-operation",
      providerId: "malicious-provider",
      slug: "hijacked-slug",
      secretCipher: "plaintext-secret",
      signingSecret: "relay-secret"
    });

    expect(result.ok).toBe(true);
    const updateArgs = dbMock.service.update.mock.calls[0]?.[0];
    expect(updateArgs?.where).toEqual({ slug: "token-intel-api" });
    expect(updateArgs?.data).toMatchObject({
      name: "Token Intel API v2",
      description: "Updated description.",
      category: "market-data",
      tags: ["token", "intel", "v2"],
      listingState: "UNLISTED",
      isActive: false
    });
    expect(updateArgs?.data.priceAmount?.toString()).toBe("0.25");
    expect(updateArgs?.data).not.toHaveProperty("providerId");
    expect(updateArgs?.data).not.toHaveProperty("slug");
    expect(updateArgs?.data).not.toHaveProperty("secretCipher");
    expect(updateArgs?.data).not.toHaveProperty("signingSecret");
  });
});
