import {
  sortDirectoryServices,
  type DirectoryService,
  type DirectorySortOption
} from "@/lib/services/discovery/directory-service";

const curatedDirectoryServices: DirectoryService[] = [
  {
    id: "showcase_gpt_5_4",
    name: "GPT-5.4",
    description: "General reasoning API for tool-calling agents, structured outputs, and multi-step workflows.",
    category: "reasoning",
    tags: ["llm", "agents", "structured-output"],
    price: "0.18 USDT",
    successRate: 0.996,
    avgLatencyMs: 980,
    recentPaidCallCount: 84,
    providerName: "OpenAI",
    detailPath: null,
    installPath: "/install",
    receiptPathTemplate: "/api/receipts/:txHash",
    rejectedProofCount: 0,
    status: "demo"
  },
  {
    id: "showcase_claude_opus_4_6",
    name: "Claude Opus 4.6",
    description: "Long-context analysis API for complex prompts, document understanding, and agent planning.",
    category: "analysis",
    tags: ["long-context", "analysis", "documents"],
    price: "0.22 USDT",
    successRate: 0.994,
    avgLatencyMs: 1120,
    recentPaidCallCount: 69,
    providerName: "Anthropic",
    detailPath: null,
    installPath: "/install",
    receiptPathTemplate: "/api/receipts/:txHash",
    rejectedProofCount: 0,
    status: "demo"
  },
  {
    id: "showcase_gemini_3_pro",
    name: "Gemini 3 Pro",
    description: "Multimodal model API for long documents, screenshots, and research-heavy agent tasks.",
    category: "research",
    tags: ["multimodal", "research", "long-context"],
    price: "0.16 USDT",
    successRate: 0.992,
    avgLatencyMs: 890,
    recentPaidCallCount: 58,
    providerName: "Google",
    detailPath: null,
    installPath: "/install",
    receiptPathTemplate: "/api/receipts/:txHash",
    rejectedProofCount: 0,
    status: "demo"
  },
  {
    id: "showcase_google_search",
    name: "Google Search",
    description: "Live web search API that gives agents fresh pages, snippets, and source URLs on demand.",
    category: "search",
    tags: ["web", "search", "realtime"],
    price: "0.03 USDT",
    successRate: 0.989,
    avgLatencyMs: 340,
    recentPaidCallCount: 142,
    providerName: "Google",
    detailPath: null,
    installPath: "/install",
    receiptPathTemplate: "/api/receipts/:txHash",
    rejectedProofCount: 0,
    status: "demo"
  },
  {
    id: "showcase_wallet_risk_summary",
    name: "Wallet Risk Summary",
    description: "Address screening API that returns agent-friendly wallet risk signals before execution.",
    category: "risk",
    tags: ["wallet", "risk", "screening"],
    price: "0.08 USDT",
    successRate: 0.985,
    avgLatencyMs: 180,
    recentPaidCallCount: 96,
    providerName: "SellerOS Risk",
    detailPath: null,
    installPath: "/install",
    receiptPathTemplate: "/api/receipts/:txHash",
    rejectedProofCount: 0,
    status: "demo"
  },
  {
    id: "showcase_token_intelligence_snapshot",
    name: "Token Intelligence Snapshot",
    description: "Onchain token snapshot API with pools, activity, and machine-readable metadata for agents.",
    category: "onchain",
    tags: ["token", "intel", "snapshot"],
    price: "0.12 USDT",
    successRate: 0.991,
    avgLatencyMs: 230,
    recentPaidCallCount: 77,
    providerName: "SellerOS Onchain",
    detailPath: null,
    installPath: "/install",
    receiptPathTemplate: "/api/receipts/:txHash",
    rejectedProofCount: 0,
    status: "demo"
  },
  {
    id: "showcase_onchain_risk_scoring",
    name: "Onchain Risk Scoring",
    description: "Contract and address scoring API for safety checks inside transaction-aware agents.",
    category: "security",
    tags: ["security", "scoring", "onchain"],
    price: "0.10 USDT",
    successRate: 0.987,
    avgLatencyMs: 210,
    recentPaidCallCount: 73,
    providerName: "SellerOS Security",
    detailPath: null,
    installPath: "/install",
    receiptPathTemplate: "/api/receipts/:txHash",
    rejectedProofCount: 0,
    status: "demo"
  },
  {
    id: "showcase_receipt_verifier",
    name: "Receipt Verifier",
    description: "Verification API for x402 receipts, settlement checks, and payment proof validation.",
    category: "payments",
    tags: ["x402", "receipt", "verification"],
    price: "0.05 USDT",
    successRate: 0.98,
    avgLatencyMs: 260,
    recentPaidCallCount: 24,
    providerName: "SellerOS x402",
    detailPath: null,
    installPath: "/install",
    receiptPathTemplate: "/api/receipts/:txHash",
    rejectedProofCount: 0,
    status: "comingSoon"
  }
];

function getServiceKey(service: Pick<DirectoryService, "name">) {
  return service.name.trim().toLowerCase();
}

export function buildDirectoryShowcase(
  liveServices: DirectoryService[],
  options: { sortBy?: DirectorySortOption } = {}
) {
  const seen = new Set(liveServices.map(getServiceKey));
  const merged = [
    ...liveServices,
    ...curatedDirectoryServices.filter((service) => !seen.has(getServiceKey(service)))
  ];

  return sortDirectoryServices(merged, options.sortBy);
}
