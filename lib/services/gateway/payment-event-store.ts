import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { isPrismaUnavailableError } from "@/lib/db/prisma-availability";

export type PaymentEvent = {
  serviceSlug: string;
  amount: number;
  status: "paid" | "failed_delivery";
  latencyMs: number;
  transactionHash: string;
  payerAddress?: string;
  assetAddress?: string;
  verificationSource?: string;
  proofDigest?: string;
  quoteVersion?: number;
  receipt?: Record<string, unknown>;
};

export type PaymentEventPatch = {
  status?: PaymentEvent["status"];
  latencyMs?: number;
  receipt?: Record<string, unknown>;
};

function getEventStorePath() {
  const workerId =
    process.env.VITEST_WORKER_ID ??
    process.env.TEST_WORKER_INDEX ??
    process.env.VITEST_POOL_ID ??
    process.pid;
  const suffix = process.env.VITEST ? `-${workerId}` : "";
  return join(process.cwd(), ".selleros", `payment-events${suffix}.json`);
}

function ensureEventStoreFile() {
  const storePath = getEventStorePath();
  const folder = dirname(storePath);
  if (!existsSync(folder)) {
    mkdirSync(folder, { recursive: true });
  }

  if (!existsSync(storePath)) {
    writeFileSync(storePath, "[]", "utf8");
  }
}

function readEventStore() {
  const storePath = getEventStorePath();
  ensureEventStoreFile();

  return JSON.parse(readFileSync(storePath, "utf8")) as PaymentEvent[];
}

function writeEventStore(events: PaymentEvent[]) {
  const storePath = getEventStorePath();
  ensureEventStoreFile();
  writeFileSync(storePath, JSON.stringify(events, null, 2), "utf8");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeRecord(
  base: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(patch)) {
    if (isPlainObject(value) && isPlainObject(merged[key])) {
      merged[key] = mergeRecord(merged[key] as Record<string, unknown>, value);
      continue;
    }

    merged[key] = value;
  }

  return merged;
}

function mergePaymentEvents(primary: PaymentEvent[], fallback: PaymentEvent[]) {
  const merged = [...primary];
  const seen = new Set(primary.map((event) => event.transactionHash));

  for (const event of fallback) {
    if (seen.has(event.transactionHash)) {
      continue;
    }

    seen.add(event.transactionHash);
    merged.push(event);
  }

  return merged;
}

function toPrismaJsonValue(
  value: Record<string, unknown> | undefined
): Prisma.InputJsonValue | undefined {
  if (!value) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}

type PrismaClientAdapter = Pick<
  PrismaClient,
  "paymentRecord" | "service" | "fulfillmentRecord" | "$transaction"
>;

let prismaClientPromise: Promise<PrismaClientAdapter | null> | null = null;

async function getPrismaClient() {
  if (!prismaClientPromise) {
    prismaClientPromise = import("@/lib/db/client")
      .then(({ db }) => db as PrismaClientAdapter)
      .catch(() => null);
  }

  return prismaClientPromise;
}

function mapPrismaPaymentRecord(record: {
  amount: unknown;
  status: string;
  transactionHash: string | null;
  payerAddress?: string | null;
  assetAddress?: string | null;
  verificationSource?: string | null;
  proofDigest?: string | null;
  quoteVersion?: number | null;
  service: {
    slug: string;
  } | null;
  fulfillment: {
    latencyMs: number | null;
    receiptJson?: unknown;
  } | null;
}): PaymentEvent {
  return {
    serviceSlug: record.service?.slug ?? "unknown-service",
    amount: Number(record.amount),
    status: record.status === "paid" ? "paid" : "failed_delivery",
    latencyMs: record.fulfillment?.latencyMs ?? 0,
    transactionHash: record.transactionHash ?? `tx_${Date.now()}`,
    payerAddress: record.payerAddress ?? undefined,
    assetAddress: record.assetAddress ?? undefined,
    verificationSource: record.verificationSource ?? undefined,
    proofDigest: record.proofDigest ?? undefined,
    quoteVersion: record.quoteVersion ?? undefined,
    receipt:
      record.fulfillment?.receiptJson &&
      typeof record.fulfillment.receiptJson === "object" &&
      !Array.isArray(record.fulfillment.receiptJson)
        ? (record.fulfillment.receiptJson as Record<string, unknown>)
        : undefined
  };
}

async function readPrismaEventStore(): Promise<PaymentEvent[]> {
  const db = await getPrismaClient();

  if (!db || !("paymentRecord" in db) || !("service" in db) || !("fulfillmentRecord" in db)) {
    throw new Error("Prisma is unavailable");
  }

  const records = await db.paymentRecord.findMany({
    orderBy: {
      createdAt: "desc"
    },
    include: {
      service: {
        select: {
          slug: true
        }
      },
      fulfillment: {
        select: {
          latencyMs: true,
          receiptJson: true
        }
      }
    }
  });

  return records.map(mapPrismaPaymentRecord);
}

async function writePrismaEventStore(event: PaymentEvent) {
  const db = await getPrismaClient();

  if (!db || !("paymentRecord" in db) || !("service" in db) || !("fulfillmentRecord" in db)) {
    throw new Error("Prisma is unavailable");
  }

  const service = await db.service.findUnique({
    where: {
      slug: event.serviceSlug
    },
    select: {
      id: true
    }
  });

  if (!service) {
    throw new Error(`Service not found in Prisma: ${event.serviceSlug}`);
  }

  await db.$transaction(async (tx) => {
    const paymentRecord = await tx.paymentRecord.create({
      data: {
        serviceId: service.id,
        amount: event.amount,
        assetAddress: event.assetAddress,
        payerAddress: event.payerAddress,
        status: event.status,
        transactionHash: event.transactionHash,
        verificationSource: event.verificationSource,
        proofDigest: event.proofDigest,
        quoteVersion: event.quoteVersion
      }
    });

    await tx.fulfillmentRecord.create({
      data: {
        serviceId: service.id,
        paymentRecordId: paymentRecord.id,
        status: event.status === "paid" ? "SUCCEEDED" : "FAILED",
        latencyMs: event.latencyMs,
        responseCode: event.status === "paid" ? 200 : 502,
        receiptJson: toPrismaJsonValue(event.receipt)
      }
    });
  });
}

async function clearPrismaEventStore() {
  const db = await getPrismaClient();

  if (!db || !("paymentRecord" in db)) {
    throw new Error("Prisma is unavailable");
  }

  await db.paymentRecord.deleteMany();
}

async function updatePrismaEventStore(
  transactionHash: string,
  patch: PaymentEventPatch
) {
  const db = await getPrismaClient();

  if (!db || !("paymentRecord" in db) || !("fulfillmentRecord" in db)) {
    throw new Error("Prisma is unavailable");
  }

  const paymentRecord = await db.paymentRecord.findUnique({
    where: {
      transactionHash
    },
    include: {
      service: {
        select: {
          slug: true
        }
      },
      fulfillment: {
        select: {
          id: true
        }
      }
    }
  });

  if (!paymentRecord) {
    throw new Error(`Payment event not found in Prisma: ${transactionHash}`);
  }

  if (patch.status) {
    await db.paymentRecord.update({
      where: {
        transactionHash
      },
      data: {
        status: patch.status
      }
    });
  }

  if (paymentRecord.fulfillment) {
    await db.fulfillmentRecord.update({
      where: {
        paymentRecordId: paymentRecord.id
      },
      data: {
        status:
          patch.status === undefined
            ? undefined
            : patch.status === "paid"
              ? "SUCCEEDED"
              : "FAILED",
        latencyMs: patch.latencyMs,
        responseCode:
          patch.status === undefined ? undefined : patch.status === "paid" ? 200 : 502,
        receiptJson: toPrismaJsonValue(patch.receipt)
      }
    });
  }
}

function updateFallbackEventStore(
  transactionHash: string,
  patch: PaymentEventPatch
) {
  const events = readEventStore();
  const updatedEvents = events.map((event) => {
    if (event.transactionHash !== transactionHash) {
      return event;
    }

    return {
      ...event,
      status: patch.status ?? event.status,
      latencyMs: patch.latencyMs ?? event.latencyMs,
      receipt:
        patch.receipt && event.receipt
          ? mergeRecord(event.receipt, patch.receipt)
          : patch.receipt ?? event.receipt
    };
  });

  writeEventStore(updatedEvents);
}

export async function listPaymentEvents() {
  try {
    const prismaEvents = await readPrismaEventStore();
    const fallbackEvents = readEventStore();

    return mergePaymentEvents(prismaEvents, fallbackEvents);
  } catch (error) {
    if (!isPrismaUnavailableError(error)) {
      throw error;
    }

    return readEventStore();
  }
}

export async function findPaymentEventByTransactionHash(transactionHash: string) {
  const events = await listPaymentEvents();
  return events.find((event) => event.transactionHash === transactionHash) ?? null;
}

export async function resetPaymentEventStore() {
  try {
    await clearPrismaEventStore();
  } catch (error) {
    if (!isPrismaUnavailableError(error)) {
      throw error;
    }

    // Prisma/db is unavailable in some environments; fall back to the file store.
  }

  writeEventStore([]);
}

export async function recordPaymentEvent(event: PaymentEvent) {
  try {
    await writePrismaEventStore(event);
    const events = readEventStore();
    writeEventStore(mergePaymentEvents([event], events));
  } catch (error) {
    if (!isPrismaUnavailableError(error)) {
      throw error;
    }

    const events = readEventStore();
    writeEventStore(mergePaymentEvents([event], events));
  }
}

export async function updatePaymentEvent(
  transactionHash: string,
  patch: PaymentEventPatch
) {
  try {
    await updatePrismaEventStore(transactionHash, patch);
    updateFallbackEventStore(transactionHash, patch);
  } catch (error) {
    if (!isPrismaUnavailableError(error)) {
      throw error;
    }

    updateFallbackEventStore(transactionHash, patch);
  }
}
