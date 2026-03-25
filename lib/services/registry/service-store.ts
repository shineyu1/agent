import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { ZodError, z } from "zod";
import { isPrismaUnavailableError } from "@/lib/db/prisma-availability";
import { decryptSecret, encryptSecret } from "@/lib/security/secret-box";
import { createServiceDefinition } from "./service-registry";
import type { ServiceDefinitionInput } from "./service-schema";

type StoredService = {
  id: string;
  providerId: string;
  providerOwnerWalletAddress?: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  listingState: "LISTED" | "UNLISTED";
  credentialMode: "HOSTED" | "RELAY";
  sourceKind: "MANUAL" | "OPENAPI";
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  priceAmount: string;
  payoutWallet: {
    network: string;
    address: string;
  };
  upstreamUrl?: string;
  httpMethod?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  specUrl?: string;
  operationId?: string;
  authType?: string;
  secretCipher?: string;
  relayUrl?: string;
  signingSecret?: string;
  createdAt: string;
  updatedAt?: string;
  providerName?: string;
  priceCurrency?: string;
  successRate?: number;
  avgLatencyMs?: number;
  recentPaidCallCount?: number;
  isActive?: boolean;
};

export type ProviderServiceView = Omit<
  StoredService,
  "secretCipher" | "signingSecret" | "providerOwnerWalletAddress"
>;

const providerServiceUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  listingState: z.enum(["LISTED", "UNLISTED"]).optional(),
  priceAmount: z
    .string()
    .refine((value) => !Number.isNaN(Number(value)), "Price must be numeric")
    .refine((value) => Number(value) >= 0, "Price must be zero or greater")
    .optional(),
  priceCurrency: z.enum(["USDT", "USDG"]).optional(),
  payoutWallet: z
    .object({
      network: z.string().min(1).optional(),
      address: z.string().min(1).optional()
    })
    .optional(),
  isActive: z.boolean().optional(),
  upstreamUrl: z.string().url().optional(),
  httpMethod: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional(),
  specUrl: z.string().url().optional(),
  operationId: z.string().min(1).optional()
});

export type ProviderServiceUpdateInput = z.infer<typeof providerServiceUpdateSchema>;

const serviceInclude = {
  provider: true,
  payoutWallet: true,
  upstreamCredential: true,
  relayConfiguration: true
} as const;

type PrismaServiceRecord = Prisma.ServiceGetPayload<{
  include: typeof serviceInclude;
}>;
type DbClient = PrismaClient;
type ServiceDefinition = ReturnType<typeof createServiceDefinition>;

function isManualServiceDefinition(
  service: ServiceDefinition
): service is ServiceDefinition & {
  sourceKind: "MANUAL";
  upstreamUrl: string;
  httpMethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
} {
  return service.sourceKind === "MANUAL";
}

function isHostedServiceDefinition(
  service: ServiceDefinition
): service is ServiceDefinition & {
  credentialMode: "HOSTED";
  authType: string;
  secretCipher: string;
} {
  return service.credentialMode === "HOSTED";
}

function isOpenApiServiceDefinition(
  service: ServiceDefinition
): service is ServiceDefinition & {
  sourceKind: "OPENAPI";
  specUrl: string;
  operationId: string;
} {
  return service.sourceKind === "OPENAPI";
}

function isRelayServiceDefinition(
  service: ServiceDefinition
): service is ServiceDefinition & {
  credentialMode: "RELAY";
  relayUrl: string;
  signingSecret: string;
} {
  return service.credentialMode === "RELAY";
}

function getStorePath() {
  const suffix = process.env.VITEST ? `-${process.pid}` : "";
  return join(process.cwd(), ".selleros", `service-store${suffix}.json`);
}

function ensureStoreFile() {
  const storePath = getStorePath();
  const folder = dirname(storePath);
  if (!existsSync(folder)) {
    mkdirSync(folder, { recursive: true });
  }

  if (!existsSync(storePath)) {
    writeFileSync(storePath, "[]", "utf8");
  }
}

function readStore(): StoredService[] {
  const storePath = getStorePath();
  ensureStoreFile();

  const raw = readFileSync(storePath, "utf8").replace(/^\uFEFF/, "").trim();
  return JSON.parse(raw.length === 0 ? "[]" : raw) as StoredService[];
}

function writeStore(services: StoredService[]) {
  const storePath = getStorePath();
  ensureStoreFile();
  writeFileSync(storePath, JSON.stringify(services, null, 2), "utf8");
}

function toJsonRecord(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function normalizeListingState(listingState: PrismaServiceRecord["listingState"]) {
  return listingState === "LISTED" ? "LISTED" : "UNLISTED";
}

function normalizeHttpMethod(httpMethod: string | null | undefined) {
  if (
    httpMethod === "GET" ||
    httpMethod === "POST" ||
    httpMethod === "PUT" ||
    httpMethod === "PATCH" ||
    httpMethod === "DELETE"
  ) {
    return httpMethod;
  }

  return undefined;
}

function normalizeSourceKind(sourceKind: string | null | undefined) {
  return sourceKind === "MANUAL" ? "MANUAL" : "OPENAPI";
}

function mapServiceDefinitionToStoredService(
  service: ServiceDefinition,
  metadata: Pick<StoredService, "id" | "createdAt"> &
    Partial<
      Pick<
        StoredService,
        | "updatedAt"
        | "providerName"
        | "providerOwnerWalletAddress"
        | "priceCurrency"
        | "successRate"
        | "avgLatencyMs"
        | "recentPaidCallCount"
        | "isActive"
      >
    >
): StoredService {
  return {
    id: metadata.id,
    providerId: service.providerId,
    providerName: metadata.providerName ?? service.providerId,
    providerOwnerWalletAddress: metadata.providerOwnerWalletAddress,
    name: service.name,
    slug: service.slug,
    description: service.description,
    category: service.category,
    tags: service.tags,
    listingState: service.listingState,
    credentialMode: service.credentialMode,
    sourceKind: service.sourceKind === "MANUAL" ? "MANUAL" : "OPENAPI",
    inputSchema: service.inputSchema,
    outputSchema: service.outputSchema,
    priceAmount: service.priceAmount,
    priceCurrency: metadata.priceCurrency ?? service.priceCurrency ?? "USDT",
    payoutWallet: service.payoutWallet,
    upstreamUrl: isManualServiceDefinition(service)
      ? service.upstreamUrl
      : undefined,
    httpMethod: isManualServiceDefinition(service)
      ? service.httpMethod
      : undefined,
    specUrl: isOpenApiServiceDefinition(service) ? service.specUrl : undefined,
    operationId: isOpenApiServiceDefinition(service)
      ? service.operationId
      : undefined,
    authType: isHostedServiceDefinition(service) ? service.authType : undefined,
    secretCipher: isHostedServiceDefinition(service)
      ? encryptSecret(service.secretCipher)
      : undefined,
    relayUrl: isRelayServiceDefinition(service) ? service.relayUrl : undefined,
    signingSecret: isRelayServiceDefinition(service)
      ? encryptSecret(service.signingSecret)
      : undefined,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
    successRate: metadata.successRate ?? 0,
    avgLatencyMs: metadata.avgLatencyMs ?? 0,
    recentPaidCallCount: metadata.recentPaidCallCount ?? 0,
    isActive: metadata.isActive ?? true
  };
}

function hydrateStoredService(
  service: StoredService,
  options: { includeSecrets?: boolean } = {}
): StoredService {
  return {
    ...service,
    secretCipher:
      options.includeSecrets && service.secretCipher
        ? decryptSecret(service.secretCipher)
        : undefined,
    signingSecret:
      options.includeSecrets && service.signingSecret
        ? decryptSecret(service.signingSecret)
        : undefined
  };
}

function toProviderServiceView(service: StoredService): ProviderServiceView {
  const { secretCipher, signingSecret, ...rest } = service;
  return rest;
}

function hasProviderServiceUpdates(patch: ProviderServiceUpdateInput) {
  return (
    patch.name !== undefined ||
    patch.description !== undefined ||
    patch.category !== undefined ||
    patch.tags !== undefined ||
    patch.listingState !== undefined ||
    patch.priceAmount !== undefined ||
    patch.priceCurrency !== undefined ||
    patch.payoutWallet?.network !== undefined ||
    patch.payoutWallet?.address !== undefined ||
    patch.isActive !== undefined ||
    patch.upstreamUrl !== undefined ||
    patch.httpMethod !== undefined ||
    patch.specUrl !== undefined ||
    patch.operationId !== undefined
  );
}

function applyProviderServiceUpdates(
  service: StoredService,
  patch: ProviderServiceUpdateInput
): StoredService {
  const next: StoredService = {
    ...service,
    updatedAt: new Date().toISOString()
  };

  if (patch.name !== undefined) {
    next.name = patch.name;
  }

  if (patch.description !== undefined) {
    next.description = patch.description;
  }

  if (patch.category !== undefined) {
    next.category = patch.category;
  }

  if (patch.tags !== undefined) {
    next.tags = patch.tags;
  }

  if (patch.listingState !== undefined) {
    next.listingState = patch.listingState;
  }

  if (patch.priceAmount !== undefined) {
    next.priceAmount = patch.priceAmount;
  }

  if (patch.priceCurrency !== undefined) {
    next.priceCurrency = patch.priceCurrency;
  }

  if (patch.payoutWallet !== undefined) {
    next.payoutWallet = {
      network: patch.payoutWallet.network ?? next.payoutWallet.network,
      address: patch.payoutWallet.address ?? next.payoutWallet.address
    };
  }

  if (patch.isActive !== undefined) {
    next.isActive = patch.isActive;
  }

  if (next.sourceKind === "MANUAL") {
    if (patch.upstreamUrl !== undefined) {
      next.upstreamUrl = patch.upstreamUrl;
    }

    if (patch.httpMethod !== undefined) {
      next.httpMethod = patch.httpMethod;
    }
  }

  if (next.sourceKind === "OPENAPI") {
    if (patch.specUrl !== undefined) {
      next.specUrl = patch.specUrl;
    }

    if (patch.operationId !== undefined) {
      next.operationId = patch.operationId;
    }
  }

  return next;
}

function buildPrismaProviderServiceUpdateData(
  service: ProviderServiceView,
  patch: ProviderServiceUpdateInput
) {
  const data: Prisma.ServiceUpdateInput = {};

  if (patch.name !== undefined) {
    data.name = patch.name;
  }

  if (patch.description !== undefined) {
    data.description = patch.description;
  }

  if (patch.category !== undefined) {
    data.category = patch.category;
  }

  if (patch.tags !== undefined) {
    data.tags = patch.tags;
  }

  if (patch.listingState !== undefined) {
    data.listingState = patch.listingState;
  }

  if (patch.priceAmount !== undefined) {
    data.priceAmount = new Prisma.Decimal(patch.priceAmount);
  }

  if (patch.priceCurrency !== undefined) {
    data.priceCurrency = patch.priceCurrency;
  }

  if (patch.payoutWallet !== undefined) {
    const nextWallet = {
      network: patch.payoutWallet.network ?? service.payoutWallet.network,
      address: patch.payoutWallet.address ?? service.payoutWallet.address
    };

    data.payoutWallet = {
      upsert: {
        create: {
          provider: {
            connect: {
              id: service.providerId
            }
          },
          network: nextWallet.network,
          address: nextWallet.address
        },
        update: {
          network: nextWallet.network,
          address: nextWallet.address
        }
      }
    };
  }

  if (patch.isActive !== undefined) {
    data.isActive = patch.isActive;
  }

  if (service.sourceKind === "MANUAL") {
    if (patch.upstreamUrl !== undefined) {
      data.upstreamUrl = patch.upstreamUrl;
    }

    if (patch.httpMethod !== undefined) {
      data.httpMethod = patch.httpMethod;
    }
  }

  if (service.sourceKind === "OPENAPI") {
    if (patch.specUrl !== undefined) {
      data.specUrl = patch.specUrl;
    }

    if (patch.operationId !== undefined) {
      data.operationId = patch.operationId;
    }
  }

  return data;
}

async function getDbClient(): Promise<DbClient | null> {
  try {
    const dbModule = await import("@/lib/db/client");
    return dbModule.db;
  } catch {
    return null;
  }
}

function mapPrismaService(
  service: PrismaServiceRecord,
  options: { includeSecrets?: boolean } = {}
): StoredService {
  return {
    id: service.id,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
    providerId: service.providerId,
    providerName: service.provider?.name ?? service.providerId,
    providerOwnerWalletAddress: service.provider?.ownerWalletAddress ?? undefined,
    name: service.name,
    slug: service.slug,
    description: service.description,
    category: service.category,
    tags: service.tags,
    listingState: normalizeListingState(service.listingState),
    credentialMode: service.credentialMode,
    sourceKind: normalizeSourceKind(service.sourceKind),
    upstreamUrl: service.upstreamUrl ?? undefined,
    httpMethod: normalizeHttpMethod(service.httpMethod),
    specUrl: service.specUrl ?? undefined,
    operationId: service.operationId ?? undefined,
    inputSchema: toJsonRecord(service.inputSchema),
    outputSchema: toJsonRecord(service.outputSchema),
    priceAmount: service.priceAmount.toString(),
    priceCurrency: service.priceCurrency,
    payoutWallet: service.payoutWallet
      ? {
          network: service.payoutWallet.network,
          address: service.payoutWallet.address
        }
      : {
          network: "xlayer",
          address: ""
        },
    successRate: service.successRate,
    avgLatencyMs: service.avgLatencyMs,
    recentPaidCallCount: service.recentPaidCallCount,
    isActive: service.isActive,
    authType: service.upstreamCredential?.authType,
    secretCipher:
      options.includeSecrets && service.upstreamCredential?.secretCipher
        ? decryptSecret(service.upstreamCredential.secretCipher)
        : undefined,
    relayUrl: service.relayConfiguration?.relayUrl,
    signingSecret:
      options.includeSecrets && service.relayConfiguration?.signingSecret
        ? decryptSecret(service.relayConfiguration.signingSecret)
        : undefined
  };
}

async function listFromPrisma(dbClient: DbClient, ownerWalletAddress?: string) {
  const services = await dbClient.service.findMany({
    where: ownerWalletAddress
      ? {
          provider: {
            ownerWalletAddress
          }
        }
      : undefined,
    include: serviceInclude,
    orderBy: {
      createdAt: "desc"
    }
  });

  return services.map((service) => mapPrismaService(service));
}

async function getFromPrisma(
  dbClient: DbClient,
  slug: string,
  ownerWalletAddress?: string,
  options: { includeSecrets?: boolean } = {}
) {
  const service = await dbClient.service.findFirst({
    where: {
      slug,
      ...(ownerWalletAddress
        ? {
            provider: {
              ownerWalletAddress
            }
          }
        : {})
    },
    include: serviceInclude
  });

  return service ? mapPrismaService(service, options) : null;
}

async function createInPrisma(
  dbClient: DbClient,
  input: ServiceDefinitionInput,
  options: { ownerWalletAddress?: string } = {}
) {
  const service = createServiceDefinition(input);
  const existingProvider = await dbClient.provider.findUnique({
    where: {
      slug: service.providerId
    }
  });

  if (
    existingProvider?.ownerWalletAddress &&
    options.ownerWalletAddress &&
    existingProvider.ownerWalletAddress !== options.ownerWalletAddress
  ) {
    throw new Error("Provider is owned by another wallet");
  }

  const provider =
    existingProvider ??
    (await dbClient.provider.create({
      data: {
        name: service.providerId,
        slug: service.providerId,
        ownerWalletAddress: options.ownerWalletAddress
      }
    }));

  const sourceData =
    isManualServiceDefinition(service)
      ? {
          upstreamUrl: service.upstreamUrl,
          httpMethod: service.httpMethod,
          specUrl: null,
          operationId: null
        }
      : {
          upstreamUrl: null,
          httpMethod: null,
          specUrl: isOpenApiServiceDefinition(service) ? service.specUrl : null,
          operationId: isOpenApiServiceDefinition(service)
            ? service.operationId
            : null
        };
  const hostedCredentialData =
    isHostedServiceDefinition(service) && service.authType && service.secretCipher
      ? {
          upstreamCredential: {
            create: {
              authType: service.authType,
              secretCipher: encryptSecret(service.secretCipher),
              keyHint: null
            }
          }
        }
      : {};
  const relayConfigurationData =
    isRelayServiceDefinition(service) && service.relayUrl && service.signingSecret
      ? {
          relayConfiguration: {
            create: {
              relayUrl: service.relayUrl,
              signingSecret: encryptSecret(service.signingSecret)
            }
          }
        }
      : {};

  const created = await dbClient.service.create({
    data: {
      provider: {
        connect: {
          id: provider.id
        }
      },
      name: service.name,
      slug: service.slug,
      description: service.description,
      category: service.category,
      tags: service.tags,
      listingState: service.listingState,
      credentialMode: service.credentialMode,
      sourceKind: service.sourceKind,
      ...sourceData,
      inputSchema: service.inputSchema,
      outputSchema: service.outputSchema,
      priceAmount: service.priceAmount,
      priceCurrency: service.priceCurrency,
      successRate: 0,
      avgLatencyMs: 0,
      recentPaidCallCount: 0,
      isActive: true,
      payoutWallet: {
        create: {
          provider: {
            connect: {
              id: provider.id
            }
          },
          network: service.payoutWallet.network,
          address: service.payoutWallet.address
        }
      },
      ...hostedCredentialData,
      ...relayConfigurationData
    },
    include: serviceInclude
  });

  return mapPrismaService(created);
}

async function clearPrismaStore(dbClient: DbClient) {
  // Clear child tables explicitly so test resets do not depend on
  // database-level cascade behavior being perfectly in sync with the schema.
  await dbClient.fulfillmentRecord?.deleteMany?.({});
  await dbClient.paymentRecord?.deleteMany?.({});
  await dbClient.paymentAttempt?.deleteMany?.({});
  await dbClient.paymentProofClaim?.deleteMany?.({});
  await dbClient.upstreamCredential?.deleteMany?.({});
  await dbClient.relayConfiguration?.deleteMany?.({});
  await dbClient.payoutWallet?.deleteMany?.({});
  await dbClient.service?.deleteMany?.({});
  await dbClient.provider?.deleteMany?.({});
}

async function withPrismaFallback<T>(
  prismaOperation: (dbClient: DbClient) => Promise<T>,
  fallbackOperation: () => Promise<T>
) {
  const dbClient = await getDbClient();
  if (!dbClient) {
    return fallbackOperation();
  }

  try {
    return await prismaOperation(dbClient);
  } catch (error) {
    if (!isPrismaUnavailableError(error)) {
      throw error;
    }
  }

  return fallbackOperation();
}

export async function listServices() {
  return withPrismaFallback(
    (dbClient) => listFromPrisma(dbClient),
    async () => readStore().map((service) => hydrateStoredService(service))
  );
}

export async function getServiceBySlug(
  slug: string,
  options: { includeSecrets?: boolean } = {}
) {
  return withPrismaFallback(
    (dbClient) => getFromPrisma(dbClient, slug, undefined, options),
    async () => {
      const service = readStore().find((item) => item.slug === slug) ?? null;
      return service ? hydrateStoredService(service, options) : null;
    }
  );
}

export async function getProviderServiceBySlug(slug: string) {
  const service = await getServiceBySlug(slug);
  return service ? toProviderServiceView(service) : null;
}

export async function listProviderServicesByOwnerWallet(ownerWalletAddress: string) {
  return withPrismaFallback(
    (dbClient) => listFromPrisma(dbClient, ownerWalletAddress),
    async () =>
      readStore()
        .map((service) => hydrateStoredService(service))
        .filter((service) => service.providerOwnerWalletAddress === ownerWalletAddress)
  );
}

export async function getProviderServiceBySlugForOwner(
  slug: string,
  ownerWalletAddress: string
) {
  return withPrismaFallback(
    async (dbClient) => {
      const service = await getFromPrisma(dbClient, slug, ownerWalletAddress);
      return service ? toProviderServiceView(service) : null;
    },
    async () => {
      const service =
        readStore().find(
          (item) =>
            item.slug === slug &&
            item.providerOwnerWalletAddress === ownerWalletAddress
        ) ?? null;

      return service ? toProviderServiceView(hydrateStoredService(service)) : null;
    }
  );
}

export async function updateProviderServiceBySlug(
  slug: string,
  input: unknown
) {
  try {
    const patch = providerServiceUpdateSchema.parse(input);

    if (!hasProviderServiceUpdates(patch)) {
      return {
        ok: false as const,
        message: "No editable fields provided",
        issues: []
      };
    }

    return await withPrismaFallback(
      async (dbClient) => {
        const service = await getFromPrisma(dbClient, slug);

        if (!service) {
          return {
            ok: false as const,
            message: "Service not found",
            issues: []
          };
        }

        const data = buildPrismaProviderServiceUpdateData(service, patch);
        const updated = await dbClient.service.update({
          where: {
            slug
          },
          data,
          include: serviceInclude
        });

        return {
          ok: true as const,
          service: toProviderServiceView(mapPrismaService(updated))
        };
      },
      async () => {
        const serviceStore = readStore();
        const index = serviceStore.findIndex((item) => item.slug === slug);

        if (index === -1) {
          return {
            ok: false as const,
            message: "Service not found",
            issues: []
          };
        }

        const updatedService = applyProviderServiceUpdates(serviceStore[index]!, patch);
        const nextStore = [...serviceStore];
        nextStore[index] = updatedService;
        writeStore(nextStore);

        return {
          ok: true as const,
          service: toProviderServiceView(updatedService)
        };
      }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false as const,
        message: "Invalid service update",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      };
    }

    if (error instanceof Error) {
      return {
        ok: false as const,
        message: error.message,
        issues: []
      };
    }

    return {
      ok: false as const,
      message: "Unknown service update error",
      issues: []
    };
  }
}

export async function updateProviderServiceBySlugForOwner(
  slug: string,
  ownerWalletAddress: string,
  input: unknown
) {
  try {
    const patch = providerServiceUpdateSchema.parse(input);

    if (!hasProviderServiceUpdates(patch)) {
      return {
        ok: false as const,
        message: "No editable fields provided",
        issues: []
      };
    }

    return await withPrismaFallback(
      async (dbClient) => {
        const service = await getFromPrisma(dbClient, slug, ownerWalletAddress);

        if (!service) {
          return {
            ok: false as const,
            message: "Service not found",
            issues: []
          };
        }

        const data = buildPrismaProviderServiceUpdateData(service, patch);
        const updated = await dbClient.service.update({
          where: {
            slug
          },
          data,
          include: serviceInclude
        });

        return {
          ok: true as const,
          service: toProviderServiceView(mapPrismaService(updated))
        };
      },
      async () => {
        const serviceStore = readStore();
        const index = serviceStore.findIndex(
          (item) =>
            item.slug === slug &&
            item.providerOwnerWalletAddress === ownerWalletAddress
        );

        if (index === -1) {
          return {
            ok: false as const,
            message: "Service not found",
            issues: []
          };
        }

        const updatedService = applyProviderServiceUpdates(serviceStore[index]!, patch);
        const nextStore = [...serviceStore];
        nextStore[index] = updatedService;
        writeStore(nextStore);

        return {
          ok: true as const,
          service: toProviderServiceView(updatedService)
        };
      }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false as const,
        message: "Invalid service update",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      };
    }

    if (error instanceof Error) {
      return {
        ok: false as const,
        message: error.message,
        issues: []
      };
    }

    return {
      ok: false as const,
      message: "Unknown service update error",
      issues: []
    };
  }
}

export async function resetServiceStore() {
  const dbClient = await getDbClient();
  if (dbClient) {
    try {
      await clearPrismaStore(dbClient);
    } catch (error) {
      if (!isPrismaUnavailableError(error)) {
        throw error;
      }
    }
  }

  writeStore([]);
}

export async function createService(
  input: ServiceDefinitionInput,
  options: { ownerWalletAddress?: string } = {}
) {
  try {
    return await withPrismaFallback(
      async (dbClient) => {
        const service = await createInPrisma(dbClient, input, options);
        return {
          ok: true as const,
          service
        };
      },
      async () => {
        const serviceStore = readStore();
        const service = createServiceDefinition(input);
        const storedService = mapServiceDefinitionToStoredService(service, {
          id: `svc_${serviceStore.length + 1}`,
          createdAt: new Date().toISOString(),
          providerOwnerWalletAddress: options.ownerWalletAddress
        });

        writeStore([storedService, ...serviceStore]);

        return {
          ok: true as const,
          service: storedService
        };
      }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false as const,
        message: "Invalid service definition",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      };
    }

    if (error instanceof Error) {
      return {
        ok: false as const,
        message: error.message,
        issues: []
      };
    }

    return {
      ok: false as const,
      message: "Unknown service creation error",
      issues: []
    };
  }
}
