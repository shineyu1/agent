import type { DirectoryService } from "@/lib/services/discovery/directory-service";

export const directoryGroupOrder = [
  "models",
  "research",
  "risk",
  "onchain",
  "payments",
  "more"
] as const;

export type DirectoryGroupKey = (typeof directoryGroupOrder)[number];

export type DirectoryServiceGroup = {
  key: DirectoryGroupKey;
  services: DirectoryService[];
};

function includesAny(values: string[], candidates: string[]) {
  return candidates.some((candidate) => values.includes(candidate));
}

export function getDirectoryGroupKey(service: DirectoryService): DirectoryGroupKey {
  const category = service.category.trim().toLowerCase();
  const tags = service.tags.map((tag) => tag.trim().toLowerCase());
  const searchable = [category, ...tags];

  if (includesAny(searchable, ["reasoning", "analysis", "llm", "multimodal"])) {
    return "models";
  }

  if (includesAny(searchable, ["search", "research", "retrieval", "signals", "web", "realtime"])) {
    return "research";
  }

  if (includesAny(searchable, ["risk", "security", "screening", "safety", "scoring"])) {
    return "risk";
  }

  if (includesAny(searchable, ["onchain", "market-data", "token", "snapshot", "intel"])) {
    return "onchain";
  }

  if (includesAny(searchable, ["payments", "receipt", "verification", "x402"])) {
    return "payments";
  }

  return "more";
}

export function groupDirectoryServices(services: DirectoryService[]): DirectoryServiceGroup[] {
  const groups = new Map<DirectoryGroupKey, DirectoryService[]>();

  for (const key of directoryGroupOrder) {
    groups.set(key, []);
  }

  for (const service of services) {
    groups.get(getDirectoryGroupKey(service))?.push(service);
  }

  return directoryGroupOrder
    .map((key) => ({ key, services: groups.get(key) ?? [] }))
    .filter((group) => group.services.length > 0);
}
