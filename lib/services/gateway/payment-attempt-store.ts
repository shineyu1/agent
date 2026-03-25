import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { isPrismaUnavailableError } from "@/lib/db/prisma-availability";

export type PaymentAttempt = {
  serviceSlug: string;
  status: "rejected";
  invalidReason: string;
  payerAddress?: string;
  verificationSource?: string;
  proofDigest?: string;
  quoteVersion?: number;
  receipt?: Record<string, unknown>;
};

type PrismaClientAdapter = Pick<PrismaClient, "paymentAttempt" | "service">;

let prismaClientPromise: Promise<PrismaClientAdapter | null> | null = null;

function getAttemptStorePath() {
  const workerId =
    process.env.VITEST_WORKER_ID ??
    process.env.TEST_WORKER_INDEX ??
    process.env.VITEST_POOL_ID ??
    process.pid;
  const suffix = process.env.VITEST ? `-${workerId}` : "";
  return join(process.cwd(), ".selleros", `payment-attempts${suffix}.json`);
}

function ensureAttemptStoreFile() {
  const storePath = getAttemptStorePath();
  const folder = dirname(storePath);
  if (!existsSync(folder)) {
    mkdirSync(folder, { recursive: true });
  }

  if (!existsSync(storePath)) {
    writeFileSync(storePath, "[]", "utf8");
  }
}

function readAttemptStore() {
  const storePath = getAttemptStorePath();
  ensureAttemptStoreFile();

  return JSON.parse(readFileSync(storePath, "utf8")) as PaymentAttempt[];
}

function writeAttemptStore(attempts: PaymentAttempt[]) {
  const storePath = getAttemptStorePath();
  ensureAttemptStoreFile();
  writeFileSync(storePath, JSON.stringify(attempts, null, 2), "utf8");
}

function toPrismaJsonValue(
  value: Record<string, unknown> | undefined
): Prisma.InputJsonValue | undefined {
  if (!value) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}

function getAttemptKey(attempt: PaymentAttempt) {
  return [
    attempt.proofDigest ?? "",
    attempt.serviceSlug,
    attempt.payerAddress ?? "",
    attempt.invalidReason,
    attempt.quoteVersion ?? ""
  ].join("|");
}

function mergePaymentAttempts(primary: PaymentAttempt[], fallback: PaymentAttempt[]) {
  const merged = [...primary];
  const seen = new Set(primary.map(getAttemptKey));

  for (const attempt of fallback) {
    const key = getAttemptKey(attempt);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(attempt);
  }

  return merged;
}

async function getPrismaClient() {
  if (!prismaClientPromise) {
    prismaClientPromise = import("@/lib/db/client")
      .then(({ db }) => db as PrismaClientAdapter)
      .catch(() => null);
  }

  return prismaClientPromise;
}

export async function listPaymentAttempts() {
  try {
    const db = await getPrismaClient();
    if (!db || !("paymentAttempt" in db) || !("service" in db)) {
      throw new Error("Prisma unavailable");
    }

    const attempts = await db.paymentAttempt.findMany({
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

    const prismaAttempts = attempts.map((attempt) => ({
      serviceSlug: attempt.service?.slug ?? "unknown-service",
      status: "rejected" as const,
      invalidReason: attempt.invalidReason ?? "unknown",
      payerAddress: attempt.payerAddress ?? undefined,
      verificationSource: attempt.verificationSource ?? undefined,
      proofDigest: attempt.proofDigest ?? undefined,
      quoteVersion: attempt.quoteVersion ?? undefined,
      receipt:
        attempt.receiptJson &&
        typeof attempt.receiptJson === "object" &&
        !Array.isArray(attempt.receiptJson)
          ? (attempt.receiptJson as Record<string, unknown>)
          : undefined
    }));
    const fallbackAttempts = readAttemptStore();

    return mergePaymentAttempts(prismaAttempts, fallbackAttempts);
  } catch (error) {
    if (!isPrismaUnavailableError(error)) {
      throw error;
    }

    return readAttemptStore();
  }
}

export async function resetPaymentAttemptStore() {
  try {
    const db = await getPrismaClient();
    if (!db || !("paymentAttempt" in db)) {
      throw new Error("Prisma unavailable");
    }

    await db.paymentAttempt.deleteMany();
  } catch (error) {
    if (!isPrismaUnavailableError(error)) {
      throw error;
    }

    // fall through to file reset
  }

  writeAttemptStore([]);
}

export async function recordPaymentAttempt(attempt: PaymentAttempt) {
  try {
    const db = await getPrismaClient();
    if (!db || !("paymentAttempt" in db) || !("service" in db)) {
      throw new Error("Prisma unavailable");
    }

    const service = await db.service.findUnique({
      where: {
        slug: attempt.serviceSlug
      },
      select: {
        id: true
      }
    });

    if (!service) {
      throw new Error(`Service not found in Prisma: ${attempt.serviceSlug}`);
    }

    await db.paymentAttempt.create({
      data: {
        serviceId: service.id,
        payerAddress: attempt.payerAddress,
        status: attempt.status,
        invalidReason: attempt.invalidReason,
        verificationSource: attempt.verificationSource,
        proofDigest: attempt.proofDigest,
        quoteVersion: attempt.quoteVersion,
        receiptJson: toPrismaJsonValue(attempt.receipt)
      }
    });

    const attempts = readAttemptStore();
    writeAttemptStore(mergePaymentAttempts([attempt], attempts));
    return;
  } catch (error) {
    if (!isPrismaUnavailableError(error)) {
      throw error;
    }

    const attempts = readAttemptStore();
    writeAttemptStore(mergePaymentAttempts([attempt], attempts));
  }
}
