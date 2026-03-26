import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { z } from "zod";
import { decryptSecret, encryptSecret } from "@/lib/security/secret-box";

export const SELLEROS_SESSION_COOKIE = "selleros_session";

const bridgeRoleSchema = z.enum(["buyer", "seller"]);

const bridgeStartSchema = z.object({
  role: bridgeRoleSchema,
  walletAddress: z.string().min(1, "walletAddress is required"),
  redirectTo: z
    .string()
    .optional()
    .transform((value) => sanitizeRedirect(value)),
  providerSlug: z.string().min(1).optional(),
  serviceSlug: z.string().min(1).optional(),
  txHash: z.string().min(1).optional()
});

type BridgeStartInput = z.infer<typeof bridgeStartSchema>;

type BridgeRecord = {
  tokenDigest: string;
  role: "buyer" | "seller";
  walletAddress: string;
  redirectTo: string;
  providerSlug?: string;
  serviceSlug?: string;
  txHash?: string;
  expiresAt: string;
  consumedAt?: string;
  createdAt: string;
};

type WebSessionPayload = {
  role: "buyer" | "seller";
  walletAddress: string;
  redirectTo: string;
  providerSlug?: string;
  serviceSlug?: string;
  txHash?: string;
  expiresAt: string;
};

function getBridgeStorePath() {
  const workerId =
    process.env.VITEST_WORKER_ID ??
    process.env.TEST_WORKER_INDEX ??
    process.env.VITEST_POOL_ID ??
    process.pid;
  const suffix = process.env.VITEST ? `-${workerId}` : "";
  return join(process.cwd(), ".selleros", `session-bridges${suffix}.json`);
}

function ensureBridgeStoreFile() {
  const storePath = getBridgeStorePath();
  const folder = dirname(storePath);
  if (!existsSync(folder)) {
    mkdirSync(folder, { recursive: true });
  }

  if (!existsSync(storePath)) {
    writeFileSync(storePath, "[]", "utf8");
  }
}

function readBridgeStore() {
  ensureBridgeStoreFile();
  const raw = readFileSync(getBridgeStorePath(), "utf8").replace(/^\uFEFF/, "").trim();
  return JSON.parse(raw.length === 0 ? "[]" : raw) as BridgeRecord[];
}

function writeBridgeStore(records: BridgeRecord[]) {
  ensureBridgeStoreFile();
  writeFileSync(getBridgeStorePath(), JSON.stringify(records, null, 2), "utf8");
}

function sanitizeRedirect(redirectTo?: string) {
  if (!redirectTo || !redirectTo.startsWith("/")) {
    return "/";
  }

  if (redirectTo.startsWith("//")) {
    return "/";
  }

  return redirectTo;
}

export function getBaseUrl() {
  return (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function resolveAppUrl(path: string) {
  return new URL(path, `${getBaseUrl()}/`);
}

function getBridgeTtlMs() {
  return 10 * 60 * 1000;
}

function getSessionTtlMs() {
  return 24 * 60 * 60 * 1000;
}

function digestToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function nowIso() {
  return new Date().toISOString();
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() <= Date.now();
}

function pruneExpired(records: BridgeRecord[]) {
  return records.filter((record) => !isExpired(record.expiresAt));
}

export function parseBridgeStartInput(input: unknown) {
  return bridgeStartSchema.parse(input);
}

export async function createBridgeSession(input: BridgeStartInput) {
  const parsed = bridgeStartSchema.parse(input);
  const bridgeToken = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + getBridgeTtlMs()).toISOString();
  const records = pruneExpired(readBridgeStore());

  records.unshift({
    tokenDigest: digestToken(bridgeToken),
    role: parsed.role,
    walletAddress: parsed.walletAddress,
    redirectTo: parsed.redirectTo,
    providerSlug: parsed.providerSlug,
    serviceSlug: parsed.serviceSlug,
    txHash: parsed.txHash,
    expiresAt,
    createdAt: nowIso()
  });
  writeBridgeStore(records);

  return {
    bridgeToken,
    claimUrl: `${getBaseUrl()}/auth/claim?token=${encodeURIComponent(bridgeToken)}`,
    expiresAt,
    redirectTo: parsed.redirectTo
  };
}

export async function consumeBridgeSession(bridgeToken: string) {
  const tokenDigest = digestToken(bridgeToken);
  const records = pruneExpired(readBridgeStore());
  const record = records.find((item) => item.tokenDigest === tokenDigest);

  if (!record) {
    writeBridgeStore(records);
    return {
      ok: false as const,
      message: "Bridge token is invalid or expired"
    };
  }

  if (record.consumedAt) {
    writeBridgeStore(records);
    return {
      ok: false as const,
      message: "Bridge token has already been used"
    };
  }

  record.consumedAt = nowIso();
  writeBridgeStore(records);

  return {
    ok: true as const,
    bridge: {
      role: record.role,
      walletAddress: record.walletAddress,
      redirectTo: record.redirectTo,
      providerSlug: record.providerSlug,
      serviceSlug: record.serviceSlug,
      txHash: record.txHash,
      expiresAt: record.expiresAt
    }
  };
}

export function createWebSessionToken(
  payload: Omit<WebSessionPayload, "expiresAt"> & { expiresAt?: string }
) {
  const sessionPayload: WebSessionPayload = {
    ...payload,
    expiresAt:
      payload.expiresAt ?? new Date(Date.now() + getSessionTtlMs()).toISOString()
  };

  return {
    sessionToken: encryptSecret(JSON.stringify(sessionPayload)),
    expiresAt: sessionPayload.expiresAt
  };
}

export function readWebSessionToken(sessionToken: string) {
  try {
    const payload = JSON.parse(decryptSecret(sessionToken)) as WebSessionPayload;
    if (isExpired(payload.expiresAt)) {
      return null;
    }

    return {
      ...payload,
      redirectTo: sanitizeRedirect(payload.redirectTo)
    };
  } catch {
    return null;
  }
}

export async function resetSessionBridgeStore() {
  writeBridgeStore([]);
}
