import {
  createDiscoveryRecordFromStoredService,
  createServiceCard,
  type DiscoveryServiceRecord
} from "./service-card";
import {
  sortDirectoryServices,
  type DirectorySortOption
} from "./directory-service";
import { listPaymentAttempts } from "@/lib/services/gateway/payment-attempt-store";
import { listPaymentEvents } from "@/lib/services/gateway/payment-event-store";
import { summarizeServiceHealth } from "@/lib/services/analytics/service-health";
import { listServices } from "@/lib/services/registry/service-store";

export function buildDirectory(
  services: DiscoveryServiceRecord[],
  options: { sortBy?: DirectorySortOption } = {}
) {
  return sortDirectoryServices(
    services.filter((service) => service.listingState === "LISTED").map((service) => ({
      ...createServiceCard(service),
      installPath: `/api/services/${service.slug}/install`,
      receiptPathTemplate: "/api/receipts/:txHash"
    })),
    options.sortBy
  );
}

export async function buildLiveDirectory(options: { sortBy?: DirectorySortOption } = {}) {
  const [storedServicesResult, eventsResult, attemptsResult] = await Promise.allSettled([
    listServices(),
    listPaymentEvents(),
    listPaymentAttempts()
  ]);
  const storedServices = storedServicesIsFulfilled(storedServicesResult)
    ? storedServicesResult.value
    : [];
  const events = settledArray(eventsResult);
  const attempts = settledArray(attemptsResult);
  const serviceHealth = summarizeServiceHealth(events, attempts);
  const enrichedServices = storedServices.map((service) =>
    createDiscoveryRecordFromStoredService(service, serviceHealth[service.slug])
  );

  return buildDirectory(enrichedServices, options);
}

function storedServicesIsFulfilled<T>(
  result: PromiseSettledResult<T>
): result is PromiseFulfilledResult<T> {
  return result.status === "fulfilled";
}

function settledArray<T>(result: PromiseSettledResult<T[]>): T[] {
  return result.status === "fulfilled" ? result.value : [];
}

export const demoDirectoryServices: DiscoveryServiceRecord[] = [
  {
    id: "svc_token_intel",
    slug: "token-intelligence-snapshot",
    name: "Token Intelligence Snapshot",
    description: "Returns a machine-readable token snapshot for agents.",
    category: "market-data",
    tags: ["token", "intel"],
    listingState: "LISTED",
    priceAmount: "0.20",
    priceCurrency: "USDT",
    successRate: 0.991,
    avgLatencyMs: 240,
    recentPaidCallCount: 21,
    providerName: "Alpha Data"
  },
  {
    id: "svc_wallet_risk",
    slug: "wallet-risk-summary",
    name: "Wallet Risk Summary",
    description: "Scores a wallet address for agent-side screening.",
    category: "risk",
    tags: ["wallet", "risk"],
    listingState: "LISTED",
    priceAmount: "0.08",
    priceCurrency: "USDT",
    successRate: 0.984,
    avgLatencyMs: 180,
    recentPaidCallCount: 64,
    providerName: "Beta Risk"
  },
  {
    id: "svc_private_research",
    slug: "private-research-api",
    name: "Private Research API",
    description: "Unlisted research service.",
    category: "research",
    tags: ["private"],
    listingState: "UNLISTED",
    priceAmount: "0.12",
    priceCurrency: "USDT",
    successRate: 0.999,
    avgLatencyMs: 120,
    recentPaidCallCount: 8,
    providerName: "Gamma Labs"
  }
];
