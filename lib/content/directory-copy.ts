import type { DirectoryGroupKey } from "@/lib/services/discovery/directory-groups";
import type { DirectoryServiceStatus } from "@/lib/services/discovery/directory-service";
import type { Language } from "./language";

export const directorySortOptions = {
  recentPaidCalls: "recentPaidCalls",
  successRate: "successRate",
  latency: "latency",
  price: "price"
} as const;

export function getDirectorySort(value: string | null | undefined) {
  return value === "recentPaidCalls" ||
    value === "successRate" ||
    value === "latency" ||
    value === "price"
    ? value
    : "recentPaidCalls";
}

type DirectoryCopy = {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  sorting: {
    prefix: string;
    labels: Record<keyof typeof directorySortOptions, string>;
  };
  sections: {
    eyebrow: string;
    title: string;
    subtitle: string;
    labels: Record<
      DirectoryGroupKey,
      {
        title: string;
        description: string;
      }
    >;
  };
  card: {
    priceLabel: string;
    successRateLabel: string;
    latencyLabel: string;
    recentPaidCallsLabel: string;
    useHint: string;
    detailLabel: string;
    statusLabels: Record<DirectoryServiceStatus, string>;
  };
  empty: {
    title: string;
    body: string;
  };
};

export const directoryCopy: Record<Language, DirectoryCopy> = {
  zh: {
    hero: {
      eyebrow: "x402 服务目录",
      title: "支持 x402 的 API 能力",
      subtitle: "这里先展示适合 Agent 按次调用的能力，再逐步接入更多真实供应。"
    },
    sorting: {
      prefix: "",
      labels: {
        recentPaidCalls: "最近调用",
        successRate: "成功率",
        latency: "响应速度",
        price: "单价"
      }
    },
    sections: {
      eyebrow: "能力分组",
      title: "按能力挑服务",
      subtitle: "不是堆数量，而是先把 Agent 真会用到的能力排清楚。",
      labels: {
        models: {
          title: "模型 API",
          description: "通用推理、长上下文和多模态能力。"
        },
        research: {
          title: "搜索与研究",
          description: "实时检索、网页信息和研究型工作流。"
        },
        risk: {
          title: "风险与安全",
          description: "地址筛查、风险评分和执行前安全判断。"
        },
        onchain: {
          title: "链上数据",
          description: "代币快照、结构化情报和链上状态。"
        },
        payments: {
          title: "支付与回执",
          description: "x402 支付校验、回执验证和结算相关能力。"
        },
        more: {
          title: "更多能力",
          description: "其他正在接入的 API 能力。"
        }
      }
    },
    card: {
      priceLabel: "单价",
      successRateLabel: "成功率",
      latencyLabel: "平均延迟",
      recentPaidCallsLabel: "最近调用",
      useHint: "装好 Skill 后，Agent 会自动发现并按次支付调用。",
      detailLabel: "查看服务详情",
      statusLabels: {
        demo: "Demo",
        comingSoon: "即将接入"
      }
    },
    empty: {
      title: "服务即将上线",
      body: "第一批 x402 服务正在接入，稍后这里会出现可调用能力。"
    }
  },
  en: {
    hero: {
      eyebrow: "x402 directory",
      title: "API capabilities with x402",
      subtitle: "Start with the agent-ready capabilities that matter, then expand into the full provider directory over time."
    },
    sorting: {
      prefix: "",
      labels: {
        recentPaidCalls: "Most called",
        successRate: "Success rate",
        latency: "Speed",
        price: "Price"
      }
    },
    sections: {
      eyebrow: "Capability groups",
      title: "Browse by capability",
      subtitle: "A tighter catalog helps buyers understand what agents can do before the marketplace gets large.",
      labels: {
        models: {
          title: "Model APIs",
          description: "General reasoning, long-context analysis, and multimodal tasks."
        },
        research: {
          title: "Search & Research",
          description: "Live retrieval, web search, and research-oriented agent workflows."
        },
        risk: {
          title: "Risk & Safety",
          description: "Screening, scoring, and safety checks before execution."
        },
        onchain: {
          title: "Onchain Data",
          description: "Token snapshots, structured market context, and chain-aware metadata."
        },
        payments: {
          title: "Payments & Receipts",
          description: "x402 payment verification, receipt validation, and settlement-aware services."
        },
        more: {
          title: "More APIs",
          description: "Everything else that does not fit the main capability buckets yet."
        }
      }
    },
    card: {
      priceLabel: "Price",
      successRateLabel: "Success rate",
      latencyLabel: "Avg latency",
      recentPaidCallsLabel: "Recent calls",
      useHint: "Install the Skill and your agent can discover and pay per call automatically.",
      detailLabel: "View details",
      statusLabels: {
        demo: "Demo",
        comingSoon: "Coming soon"
      }
    },
    empty: {
      title: "Services coming soon",
      body: "The first x402 services are being onboarded now."
    }
  }
};
