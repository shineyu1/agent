import { beforeEach, describe, expect, it, vi } from "vitest";

const { fsMock, dbMock } = vi.hoisted(() => {
  const fsMock = {
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(() => "[]"),
    writeFileSync: vi.fn()
  };

  const dbMock = {
    service: {
      findFirst: vi.fn(),
      deleteMany: vi.fn()
    }
  };

  return { fsMock, dbMock };
});

vi.mock("node:fs", () => fsMock);
vi.mock("@/lib/db/client", () => ({ db: dbMock }));

describe("service-store", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("APP_ENCRYPTION_KEY", "test-app-encryption-key");
  });

  it("clears the fallback file even when Prisma reset succeeds", async () => {
    dbMock.service.deleteMany.mockResolvedValue({ count: 1 });

    const { resetServiceStore } = await import("@/lib/services/registry/service-store");

    await resetServiceStore();

    expect(dbMock.service.deleteMany).toHaveBeenCalledTimes(1);
    expect(fsMock.writeFileSync).toHaveBeenCalledTimes(1);
    expect(fsMock.writeFileSync.mock.calls[0]?.[1]).toBe("[]");
  });

  it("does not decrypt persisted upstream credentials for public service reads", async () => {
    const { encryptSecret } = await import("@/lib/security/secret-box");
    const encryptedHostedSecret = encryptSecret("ciphertext");
    const encryptedRelaySecret = encryptSecret("relay-secret");

    dbMock.service.findFirst.mockResolvedValue({
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
      inputSchema: {},
      outputSchema: {},
      priceAmount: { toString: () => "0.2" },
      priceCurrency: "USDT",
      successRate: 0,
      avgLatencyMs: 0,
      recentPaidCallCount: 0,
      isActive: true,
      createdAt: new Date("2026-03-22T00:00:00.000Z"),
      updatedAt: new Date("2026-03-22T00:00:00.000Z"),
      provider: {
        id: "provider_1",
        name: "Provider One",
        slug: "provider_1"
      },
      payoutWallet: {
        network: "xlayer",
        address: "0x1111111111111111111111111111111111111111"
      },
      upstreamCredential: {
        authType: "bearer",
        secretCipher: encryptedHostedSecret
      },
      relayConfiguration: {
        relayUrl: "https://relay.example.com/intel",
        signingSecret: encryptedRelaySecret
      }
    });

    const { getServiceBySlug } = await import("@/lib/services/registry/service-store");
    const service = await getServiceBySlug("token-intel-api");

    expect(service?.secretCipher).toBeUndefined();
    expect(service?.signingSecret).toBeUndefined();
  });

  it("decrypts persisted upstream credentials for internal service reads", async () => {
    const { encryptSecret } = await import("@/lib/security/secret-box");
    const encryptedHostedSecret = encryptSecret("ciphertext");
    const encryptedRelaySecret = encryptSecret("relay-secret");

    dbMock.service.findFirst.mockResolvedValue({
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
      inputSchema: {},
      outputSchema: {},
      priceAmount: { toString: () => "0.2" },
      priceCurrency: "USDT",
      successRate: 0,
      avgLatencyMs: 0,
      recentPaidCallCount: 0,
      isActive: true,
      createdAt: new Date("2026-03-22T00:00:00.000Z"),
      updatedAt: new Date("2026-03-22T00:00:00.000Z"),
      provider: {
        id: "provider_1",
        name: "Provider One",
        slug: "provider_1"
      },
      payoutWallet: {
        network: "xlayer",
        address: "0x1111111111111111111111111111111111111111"
      },
      upstreamCredential: {
        authType: "bearer",
        secretCipher: encryptedHostedSecret
      },
      relayConfiguration: {
        relayUrl: "https://relay.example.com/intel",
        signingSecret: encryptedRelaySecret
      }
    });

    const { getServiceBySlug } = await import("@/lib/services/registry/service-store");
    const service = await getServiceBySlug("token-intel-api", { includeSecrets: true });

    expect(service?.secretCipher).toBe("ciphertext");
    expect(service?.signingSecret).toBe("relay-secret");
  });
});
