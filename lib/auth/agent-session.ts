import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { getAddress, verifyMessage } from "viem";
import { z } from "zod";
import { decryptSecret, encryptSecret } from "@/lib/security/secret-box";
import { getBaseUrl } from "@/lib/auth/session-bridge";
import type { ProviderSensitiveAction } from "@/lib/auth/provider-actions";

type SellerAccessTokenPayload = {
  kind: "seller_access";
  role: "seller";
  walletAddress: string;
  expiresAt: string;
};

type SellerActionProofTokenPayload = {
  kind: "seller_action_proof";
  walletAddress: string;
  serviceSlug?: string;
  actions: ProviderSensitiveAction[];
  requestHash: string;
  expiresAt: string;
};

type AgentChallengeRecord = {
  challengeId: string;
  purpose: "seller_login" | "provider_action";
  walletAddress: string;
  message: string;
  nonce: string;
  expiresAt: string;
  createdAt: string;
  consumedAt?: string;
  serviceSlug?: string;
  actions?: ProviderSensitiveAction[];
  requestHash?: string;
};

const loginChallengeSchema = z.object({
  walletAddress: z.string().min(1)
});

const providerActionChallengeSchema = z.object({
  walletAddress: z.string().min(1),
  requestedActions: z.array(
    z.enum(["publish_service", "update_price", "update_payout_wallet", "change_visibility"])
  ),
  requestHash: z.string().min(1),
  serviceSlug: z.string().min(1).optional()
});

function normalizeWalletAddress(walletAddress: string) {
  return getAddress(walletAddress).toLowerCase();
}

function getStorePath() {
  const workerId =
    process.env.VITEST_WORKER_ID ??
    process.env.TEST_WORKER_INDEX ??
    process.env.VITEST_POOL_ID ??
    process.pid;
  const suffix = process.env.VITEST ? `-${workerId}` : "";
  return join(process.cwd(), ".selleros", `agent-auth-challenges${suffix}.json`);
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

function readChallengeStore() {
  ensureStoreFile();
  const raw = readFileSync(getStorePath(), "utf8").replace(/^\uFEFF/, "").trim();
  return JSON.parse(raw.length === 0 ? "[]" : raw) as AgentChallengeRecord[];
}

function writeChallengeStore(records: AgentChallengeRecord[]) {
  ensureStoreFile();
  writeFileSync(getStorePath(), JSON.stringify(records, null, 2), "utf8");
}

function getDomain() {
  return new URL(getBaseUrl()).host;
}

function getChallengeTtlMs() {
  return 10 * 60 * 1000;
}

function getAccessTokenTtlMs() {
  return 60 * 60 * 1000;
}

function getActionProofTtlMs() {
  return 15 * 60 * 1000;
}

function nowIso() {
  return new Date().toISOString();
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() <= Date.now();
}

function pruneExpiredChallenges(records: AgentChallengeRecord[]) {
  return records.filter((record) => !isExpired(record.expiresAt));
}

function buildSellerLoginMessage(walletAddress: string, nonce: string, expiresAt: string) {
  return [
    "Agent Service x402 seller login",
    "",
    `Domain: ${getDomain()}`,
    `Wallet: ${walletAddress}`,
    "Purpose: seller_agent_login",
    `Nonce: ${nonce}`,
    `Expires At: ${expiresAt}`
  ].join("\n");
}

function buildProviderActionMessage(
  walletAddress: string,
  nonce: string,
  expiresAt: string,
  requestHash: string,
  actions: ProviderSensitiveAction[],
  serviceSlug?: string
) {
  return [
    "Agent Service x402 provider action approval",
    "",
    `Domain: ${getDomain()}`,
    `Wallet: ${walletAddress}`,
    `Actions: ${actions.join(",")}`,
    `Service: ${serviceSlug ?? "new-service"}`,
    `Request Hash: ${requestHash}`,
    `Nonce: ${nonce}`,
    `Expires At: ${expiresAt}`
  ].join("\n");
}

export function createSellerAgentAccessToken(input: {
  walletAddress: string;
  expiresAt?: string;
}) {
  const payload: SellerAccessTokenPayload = {
    kind: "seller_access",
    role: "seller",
    walletAddress: normalizeWalletAddress(input.walletAddress),
    expiresAt:
      input.expiresAt ?? new Date(Date.now() + getAccessTokenTtlMs()).toISOString()
  };

  return encryptSecret(JSON.stringify(payload));
}

export function readSellerAgentAccessToken(token: string) {
  try {
    const payload = JSON.parse(decryptSecret(token)) as SellerAccessTokenPayload;
    if (payload.kind !== "seller_access" || payload.role !== "seller" || isExpired(payload.expiresAt)) {
      return null;
    }

    return {
      ...payload,
      walletAddress: normalizeWalletAddress(payload.walletAddress)
    };
  } catch {
    return null;
  }
}

export function createSellerActionProofToken(input: {
  walletAddress: string;
  requestHash: string;
  actions: ProviderSensitiveAction[];
  serviceSlug?: string;
  expiresAt?: string;
}) {
  const payload: SellerActionProofTokenPayload = {
    kind: "seller_action_proof",
    walletAddress: normalizeWalletAddress(input.walletAddress),
    serviceSlug: input.serviceSlug,
    requestHash: input.requestHash,
    actions: input.actions,
    expiresAt:
      input.expiresAt ?? new Date(Date.now() + getActionProofTtlMs()).toISOString()
  };

  return encryptSecret(JSON.stringify(payload));
}

export function readSellerActionProofToken(token: string) {
  try {
    const payload = JSON.parse(decryptSecret(token)) as SellerActionProofTokenPayload;
    if (payload.kind !== "seller_action_proof" || isExpired(payload.expiresAt)) {
      return null;
    }

    return {
      ...payload,
      walletAddress: normalizeWalletAddress(payload.walletAddress)
    };
  } catch {
    return null;
  }
}

export async function createSellerLoginChallenge(input: { walletAddress: string }) {
  const parsed = loginChallengeSchema.parse(input);
  const walletAddress = normalizeWalletAddress(parsed.walletAddress);
  const challengeId = randomBytes(18).toString("base64url");
  const nonce = randomBytes(16).toString("base64url");
  const expiresAt = new Date(Date.now() + getChallengeTtlMs()).toISOString();
  const records = pruneExpiredChallenges(readChallengeStore());
  const message = buildSellerLoginMessage(walletAddress, nonce, expiresAt);

  records.unshift({
    challengeId,
    purpose: "seller_login",
    walletAddress,
    message,
    nonce,
    expiresAt,
    createdAt: nowIso()
  });
  writeChallengeStore(records);

  return {
    challengeId,
    message,
    nonce,
    expiresAt
  };
}

export async function createProviderActionChallenge(input: {
  walletAddress: string;
  requestedActions: ProviderSensitiveAction[];
  requestHash: string;
  serviceSlug?: string;
}) {
  const parsed = providerActionChallengeSchema.parse(input);
  const walletAddress = normalizeWalletAddress(parsed.walletAddress);
  const challengeId = randomBytes(18).toString("base64url");
  const nonce = randomBytes(16).toString("base64url");
  const expiresAt = new Date(Date.now() + getChallengeTtlMs()).toISOString();
  const records = pruneExpiredChallenges(readChallengeStore());
  const actions = Array.from(new Set(parsed.requestedActions));
  const message = buildProviderActionMessage(
    walletAddress,
    nonce,
    expiresAt,
    parsed.requestHash,
    actions,
    parsed.serviceSlug
  );

  records.unshift({
    challengeId,
    purpose: "provider_action",
    walletAddress,
    message,
    nonce,
    expiresAt,
    createdAt: nowIso(),
    serviceSlug: parsed.serviceSlug,
    requestHash: parsed.requestHash,
    actions
  });
  writeChallengeStore(records);

  return {
    challengeId,
    message,
    nonce,
    expiresAt,
    requestHash: parsed.requestHash,
    actions,
    serviceSlug: parsed.serviceSlug ?? null
  };
}

export async function verifyAgentChallenge(input: {
  challengeId: string;
  signature: string;
}) {
  const challengeId = input.challengeId.trim();
  const signature = input.signature.trim();
  const records = pruneExpiredChallenges(readChallengeStore());
  const challenge = records.find((record) => record.challengeId === challengeId);

  if (!challenge) {
    writeChallengeStore(records);
    return {
      ok: false as const,
      message: "Challenge is invalid or expired"
    };
  }

  if (challenge.consumedAt) {
    writeChallengeStore(records);
    return {
      ok: false as const,
      message: "Challenge has already been used"
    };
  }

  const validSignature = await verifyMessage({
    address: getAddress(challenge.walletAddress as `0x${string}`),
    message: challenge.message,
    signature: signature as `0x${string}`
  }).catch(() => false);

  if (!validSignature) {
    writeChallengeStore(records);
    return {
      ok: false as const,
      message: "Invalid wallet signature"
    };
  }

  challenge.consumedAt = nowIso();
  writeChallengeStore(records);

  if (challenge.purpose === "seller_login") {
    const accessToken = createSellerAgentAccessToken({
      walletAddress: challenge.walletAddress
    });
    const session = readSellerAgentAccessToken(accessToken);

    return {
      ok: true as const,
      kind: "seller_access" as const,
      accessToken,
      session: session!
    };
  }

  const actionProofToken = createSellerActionProofToken({
    walletAddress: challenge.walletAddress,
    serviceSlug: challenge.serviceSlug,
    actions: challenge.actions ?? [],
    requestHash: challenge.requestHash ?? ""
  });
  const proof = readSellerActionProofToken(actionProofToken);

  return {
    ok: true as const,
    kind: "provider_action_proof" as const,
    actionProofToken,
    proof: proof!
  };
}

export function validateSellerActionProof(input: {
  proofToken: string | null;
  walletAddress: string;
  requestHash: string;
  requiredActions: ProviderSensitiveAction[];
  serviceSlug?: string;
}) {
  if (!input.proofToken) {
    return {
      ok: false as const,
      message: "Signed approval required"
    };
  }

  const proof = readSellerActionProofToken(input.proofToken);
  if (!proof) {
    return {
      ok: false as const,
      message: "Signed approval is invalid or expired"
    };
  }

  if (proof.walletAddress !== normalizeWalletAddress(input.walletAddress)) {
    return {
      ok: false as const,
      message: "Signed approval wallet does not match the active seller"
    };
  }

  if (proof.requestHash !== input.requestHash) {
    return {
      ok: false as const,
      message: "Signed approval does not match the current request"
    };
  }

  if ((input.serviceSlug ?? null) !== (proof.serviceSlug ?? null)) {
    return {
      ok: false as const,
      message: "Signed approval does not match the targeted service"
    };
  }

  const hasAllRequiredActions = input.requiredActions.every((action) =>
    proof.actions.includes(action)
  );
  if (!hasAllRequiredActions) {
    return {
      ok: false as const,
      message: "Signed approval is missing required actions"
    };
  }

  return {
    ok: true as const,
    proof
  };
}
