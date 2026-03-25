import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { isPrismaUnavailableError } from "@/lib/db/prisma-availability";

export type PaymentProofClaim = {
  serviceSlug: string;
  proofDigest: string;
  payerAddress?: string;
  verificationSource?: string;
  quoteVersion?: number;
};

type PrismaClientAdapter = Pick<PrismaClient, "service"> & {
  paymentProofClaim: {
    create: (args: {
      data: {
        serviceId: string;
        proofDigest: string;
        payerAddress?: string;
        verificationSource?: string;
        quoteVersion?: number;
      };
    }) => Promise<unknown>;
    findMany: (args: {
      orderBy: {
        createdAt: "desc";
      };
      include: {
        service: {
          select: {
            slug: true;
          };
        };
      };
    }) => Promise<
      Array<{
        proofDigest: string;
        payerAddress: string | null;
        verificationSource: string | null;
        quoteVersion: number | null;
        service: {
          slug: string;
        } | null;
      }>
    >;
    deleteMany: () => Promise<unknown>;
  };
};

let prismaClientPromise: Promise<PrismaClientAdapter | null> | null = null;

function getClaimStorePath() {
  const workerId =
    process.env.VITEST_WORKER_ID ??
    process.env.TEST_WORKER_INDEX ??
    process.env.VITEST_POOL_ID ??
    process.pid;
  const suffix = process.env.VITEST ? `-${workerId}` : "";
  return join(process.cwd(), ".selleros", `payment-proof-claims${suffix}.json`);
}

function ensureClaimStoreFile() {
  const storePath = getClaimStorePath();
  const folder = dirname(storePath);
  if (!existsSync(folder)) {
    mkdirSync(folder, { recursive: true });
  }

  if (!existsSync(storePath)) {
    writeFileSync(storePath, "[]", "utf8");
  }
}

function readClaimStore() {
  const storePath = getClaimStorePath();
  ensureClaimStoreFile();

  return JSON.parse(readFileSync(storePath, "utf8")) as PaymentProofClaim[];
}

function writeClaimStore(claims: PaymentProofClaim[]) {
  const storePath = getClaimStorePath();
  ensureClaimStoreFile();
  writeFileSync(storePath, JSON.stringify(claims, null, 2), "utf8");
}

function getClaimKey(claim: PaymentProofClaim) {
  return `${claim.serviceSlug}|${claim.proofDigest}`;
}

function mergeClaims(primary: PaymentProofClaim[], fallback: PaymentProofClaim[]) {
  const merged = [...primary];
  const seen = new Set(primary.map(getClaimKey));

  for (const claim of fallback) {
    const key = getClaimKey(claim);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(claim);
  }

  return merged;
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

async function getPrismaClient() {
  if (!prismaClientPromise) {
    prismaClientPromise = import("@/lib/db/client")
      .then(({ db }) => db as unknown as PrismaClientAdapter)
      .catch(() => null);
  }

  return prismaClientPromise;
}

async function listPrismaClaims() {
  const db = await getPrismaClient();
  if (!db) {
    throw new Error("Prisma unavailable");
  }

  const claims = await db.paymentProofClaim.findMany({
    orderBy: {
      createdAt: "desc"
    },
    include: {
      service: {
        select: {
          slug: true
        }
      }
    }
  });

  return claims.map((claim) => ({
    serviceSlug: claim.service?.slug ?? "unknown-service",
    proofDigest: claim.proofDigest,
    payerAddress: claim.payerAddress ?? undefined,
    verificationSource: claim.verificationSource ?? undefined,
    quoteVersion: claim.quoteVersion ?? undefined
  }));
}

async function writePrismaClaim(claim: PaymentProofClaim) {
  const db = await getPrismaClient();
  if (!db) {
    throw new Error("Prisma unavailable");
  }

  const service = await db.service.findUnique({
    where: {
      slug: claim.serviceSlug
    },
    select: {
      id: true
    }
  });

  if (!service) {
    throw new Error(`Service not found in Prisma: ${claim.serviceSlug}`);
  }

  await db.paymentProofClaim.create({
    data: {
      serviceId: service.id,
      proofDigest: claim.proofDigest,
      payerAddress: claim.payerAddress,
      verificationSource: claim.verificationSource,
      quoteVersion: claim.quoteVersion
    }
  });
}

async function clearPrismaClaims() {
  const db = await getPrismaClient();
  if (!db) {
    throw new Error("Prisma unavailable");
  }

  await db.paymentProofClaim.deleteMany();
}

export async function listPaymentProofClaims() {
  try {
    const prismaClaims = await listPrismaClaims();
    const fallbackClaims = readClaimStore();

    return mergeClaims(prismaClaims, fallbackClaims);
  } catch (error) {
    if (!isPrismaUnavailableError(error)) {
      throw error;
    }

    return readClaimStore();
  }
}

export async function resetPaymentProofClaimStore() {
  try {
    await clearPrismaClaims();
  } catch (error) {
    if (!isPrismaUnavailableError(error)) {
      throw error;
    }
  }

  writeClaimStore([]);
}

export async function claimPaymentProof(claim: PaymentProofClaim) {
  try {
    await writePrismaClaim(claim);
    const claims = readClaimStore();
    writeClaimStore(mergeClaims([claim], claims));
    return true;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return false;
    }

    if (!isPrismaUnavailableError(error)) {
      throw error;
    }

    const claims = readClaimStore();
    if (claims.some((existingClaim) => getClaimKey(existingClaim) === getClaimKey(claim))) {
      return false;
    }

    writeClaimStore(mergeClaims([claim], claims));
    return true;
  }
}
