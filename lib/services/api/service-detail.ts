type ServiceLike = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  listingState: "LISTED" | "UNLISTED" | "DRAFT" | "ARCHIVED";
  credentialMode: "HOSTED" | "RELAY";
  sourceKind: "MANUAL" | "OPENAPI";
  priceAmount: string;
  priceCurrency?: string;
  successRate?: number;
  avgLatencyMs?: number;
  recentPaidCallCount?: number;
  rejectedProofCount?: number;
  providerName?: string;
  payoutWallet: {
    network: string;
    address: string;
  };
  httpMethod?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  upstreamUrl?: string;
  specUrl?: string;
  operationId?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  isActive?: boolean;
};

type DetailMetrics = {
  paidCallCount: number;
  failedDeliveryCount: number;
  rejectedProofCount: number;
  averageLatencyMs: number;
};

function formatPrice(priceAmount: string, priceCurrency?: string) {
  return `${priceAmount} ${priceCurrency ?? "USDT"}`;
}

function getServiceMethod(service: ServiceLike) {
  return service.httpMethod ?? "POST";
}

export function buildServiceDetailPayload(
  service: ServiceLike,
  metrics: Partial<DetailMetrics> = {}
) {
  return {
    service: {
      id: service.id,
      slug: service.slug,
      name: service.name,
      description: service.description,
      category: service.category,
      tags: service.tags,
      listingState: service.listingState,
      credentialMode: service.credentialMode,
      sourceKind: service.sourceKind,
      providerName: service.providerName ?? "SellerOS Provider",
      priceAmount: service.priceAmount,
      priceCurrency: service.priceCurrency ?? "USDT",
      price: formatPrice(service.priceAmount, service.priceCurrency),
      successRate: service.successRate ?? 0,
      avgLatencyMs: service.avgLatencyMs ?? 0,
      recentPaidCallCount: service.recentPaidCallCount ?? 0,
      rejectedProofCount: service.rejectedProofCount ?? 0,
      isActive: service.isActive ?? true,
      payoutWallet: service.payoutWallet,
      inputSchema: service.inputSchema ?? {},
      outputSchema: service.outputSchema ?? {},
      source:
        service.sourceKind === "MANUAL"
          ? {
              kind: "manual" as const,
              method: getServiceMethod(service),
              upstreamUrl: service.upstreamUrl ?? ""
            }
          : {
              kind: "openapi" as const,
              specUrl: service.specUrl ?? "",
              operationId: service.operationId ?? ""
            },
      payablePath: `/api/services/${service.slug}`,
      detailPath: `/api/services/${service.slug}/detail`,
      installPath: `/api/services/${service.slug}/install`,
      receiptPathTemplate: "/api/receipts/:txHash",
      metrics: {
        paidCallCount: metrics.paidCallCount ?? service.recentPaidCallCount ?? 0,
        failedDeliveryCount: metrics.failedDeliveryCount ?? 0,
        rejectedProofCount:
          metrics.rejectedProofCount ?? service.rejectedProofCount ?? 0,
        averageLatencyMs: metrics.averageLatencyMs ?? service.avgLatencyMs ?? 0
      }
    }
  };
}

export function buildServiceInstallPayload(service: ServiceLike) {
  const method = getServiceMethod(service);
  const endpoint = `/api/services/${service.slug}`;

  return {
    install: {
      slug: service.slug,
      name: service.name,
      endpoint,
      method,
      detailPath: `/api/services/${service.slug}/detail`,
      receiptPathTemplate: "/api/receipts/:txHash",
      headers: {
        "content-type": "application/json",
        "payment-signature": "<x402 payment proof>"
      },
      example: [
        `curl -X ${method} '${endpoint}' \\`,
        "  -H 'content-type: application/json' \\",
        "  -H 'payment-signature: <x402 payment proof>' \\",
        "  -d '{\"query\":\"<payload>\"}'"
      ].join("\n")
    }
  };
}
