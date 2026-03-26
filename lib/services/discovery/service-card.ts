export type DiscoveryServiceRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  listingState: "LISTED" | "UNLISTED" | "DRAFT" | "ARCHIVED";
  priceAmount: string;
  priceCurrency: string;
  successRate: number;
  avgLatencyMs: number;
  recentPaidCallCount: number;
  rejectedProofCount?: number;
  providerName: string;
};

export type ServiceCard = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  providerName: string;
  price: string;
  successRate: number;
  avgLatencyMs: number;
  recentPaidCallCount: number;
  rejectedProofCount: number;
  payablePath: string;
  detailPath: string;
};

export function createServiceCard(service: DiscoveryServiceRecord): ServiceCard {
  return {
    id: service.id,
    slug: service.slug,
    name: service.name,
    description: service.description,
    category: service.category,
    tags: service.tags,
    providerName: service.providerName,
    price: `${service.priceAmount} ${service.priceCurrency}`,
    successRate: service.successRate,
    avgLatencyMs: service.avgLatencyMs,
    recentPaidCallCount: service.recentPaidCallCount,
    rejectedProofCount: service.rejectedProofCount ?? 0,
    payablePath: `/api/services/${service.slug}`,
    detailPath: `/services/${service.slug}`
  };
}

type StoredServiceRecord = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  listingState: "LISTED" | "UNLISTED" | "DRAFT" | "ARCHIVED";
  priceAmount: string;
  priceCurrency?: string;
  successRate?: number;
  avgLatencyMs?: number;
  recentPaidCallCount?: number;
  rejectedProofCount?: number;
  providerName?: string;
  slug: string;
};

export function createDiscoveryRecordFromStoredService(
  service: StoredServiceRecord,
  metrics?: Pick<
    DiscoveryServiceRecord,
    "successRate" | "avgLatencyMs" | "recentPaidCallCount" | "rejectedProofCount"
  >
): DiscoveryServiceRecord {
  return {
    id: service.id,
    slug: service.slug,
    name: service.name,
    description: service.description,
    category: service.category,
    tags: service.tags,
    listingState: service.listingState,
    priceAmount: service.priceAmount,
    priceCurrency: service.priceCurrency ?? "USDT",
    successRate: metrics?.successRate ?? 0,
    avgLatencyMs: metrics?.avgLatencyMs ?? 0,
    recentPaidCallCount: metrics?.recentPaidCallCount ?? 0,
    rejectedProofCount: metrics?.rejectedProofCount ?? 0,
    providerName: service.providerName ?? "Agent Service x402 Provider"
  };
}
