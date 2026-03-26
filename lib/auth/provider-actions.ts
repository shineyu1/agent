import { createHash } from "node:crypto";

export type ProviderSensitiveAction =
  | "publish_service"
  | "update_price"
  | "update_payout_wallet"
  | "change_visibility";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function normalizeVisibility(value: unknown) {
  if (value === "listed" || value === "LISTED") {
    return "listed" as const;
  }

  if (value === "unlisted" || value === "UNLISTED") {
    return "unlisted" as const;
  }

  return null;
}

function getRequestedVisibility(payload: unknown) {
  const record = asRecord(payload);
  if (!record) {
    return null;
  }

  const publishing = asRecord(record.publishing);
  const topLevelVisibility = normalizeVisibility(record.visibility);
  const publishingVisibility = normalizeVisibility(publishing?.visibility);
  const listingStateVisibility = normalizeVisibility(record.listingState);

  return topLevelVisibility ?? publishingVisibility ?? listingStateVisibility;
}

function stableSerialize(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right)
    );

    return `{${entries
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableSerialize(entryValue)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function dedupeActions(actions: ProviderSensitiveAction[]) {
  return Array.from(new Set(actions));
}

export function hashProviderActionPayload(payload: unknown) {
  return `sha256:${createHash("sha256")
    .update(stableSerialize(payload))
    .digest("hex")}`;
}

export function getSensitiveCreateActions(payload: unknown): ProviderSensitiveAction[] {
  const visibility = getRequestedVisibility(payload);

  if (visibility === "listed") {
    return ["publish_service"];
  }

  return [];
}

export function getSensitiveUpdateActions(payload: unknown): ProviderSensitiveAction[] {
  const record = asRecord(payload);
  if (!record) {
    return [];
  }

  const actions: ProviderSensitiveAction[] = [];

  if (record.priceAmount !== undefined || record.priceCurrency !== undefined) {
    actions.push("update_price");
  }

  if (record.payoutWallet !== undefined) {
    actions.push("update_payout_wallet");
  }

  const visibility = getRequestedVisibility(payload);
  if (visibility === "listed") {
    actions.push("publish_service");
  } else if (visibility === "unlisted") {
    actions.push("change_visibility");
  }

  return dedupeActions(actions);
}
