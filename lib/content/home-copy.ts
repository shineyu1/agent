import type { Language } from "./language";

type HeroAction = {
  href: string;
  label: string;
  variant: "primary" | "secondary" | "ghost";
};

type ValueItem = {
  index: string;
  title: string;
  english: string;
};

type CapabilityCard = {
  title: string;
  eyebrow: string;
  description: string;
  meta: string;
  price: string;
};

type TrustItem = {
  title: string;
  body: string;
};

type HomeCopy = {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    supporting: string;
    commandLabel: string;
    commandMeta: string;
    commandStatus: string;
    commands: readonly string[];
    actions: readonly HeroAction[];
  };
  valueStrip: readonly ValueItem[];
  catalog: {
    eyebrow: string;
    title: string;
    description: string;
    linkLabel: string;
    cards: readonly CapabilityCard[];
  };
  trust: {
    eyebrow: string;
    title: string;
    description: string;
    items: readonly TrustItem[];
  };
  providerPanel: {
    eyebrow: string;
    title: string;
    body: string;
    primary: HeroAction;
    secondary: HeroAction;
  };
  copyButton: {
    idle: string;
    copied: string;
    idleAriaLabel: string;
    copiedAriaLabel: string;
  };
};

const installCommands = [
  "npx skills add https://github.com/shineyu1/agent/tree/main/skills --skill agent-service-layer-user-skill",
  "npx skills add okx/onchainos-skills"
] as const;

export const homeCopy: Record<Language, HomeCopy> = {
  zh: {
    hero: {
      eyebrow: "x402 · 按次付费",
      title: "让 Agent 直接调用 x402 服务",
      subtitle: "装两个 Skill，Agent 就能自动发现、付费、调用所有接入了 x402 的服务。",
      supporting: "不用对接 API，不用管支付流程。发现、询价、付款、拿结果，全在 Skill 里。",
      commandLabel: "安装",
      commandMeta: "Terminal",
      commandStatus: "Ready",
      commands: installCommands,
      actions: [
        { href: "/directory", label: "查看可用服务", variant: "primary" },
        { href: "/providers", label: "接入我的 API", variant: "secondary" }
      ]
    },
    valueStrip: [
      { index: "01", title: "发现", english: "Discover" },
      { index: "02", title: "询价", english: "Quote" },
      { index: "03", title: "支付", english: "Pay" },
      { index: "04", title: "回执", english: "Receipt" }
    ],
    catalog: {
      eyebrow: "已接入服务",
      title: "这些 API 已支持 x402",
      description: "按次计费，调用前可以看到价格，Agent 自动完成支付。",
      linkLabel: "查看全部",
      cards: [
        {
          title: "Google Search",
          eyebrow: "搜索",
          description: "实时网页搜索，结果直接回到 Agent 上下文。",
          meta: "Web Index",
          price: "$0.05 / call"
        },
        {
          title: "链上风险评分",
          eyebrow: "风控",
          description: "OnchainOS 地址风险评分，实时返回合规检查结果。",
          meta: "Risk Control",
          price: "$0.15 / call"
        },
        {
          title: "BankOfAI Chat",
          eyebrow: "推理",
          description: "金融级对话推理，专为 Agent 工作流优化。",
          meta: "Financial AI",
          price: "$0.02 / call"
        }
      ]
    },
    trust: {
      eyebrow: "x402 的好处",
      title: "按次付费，每笔清晰",
      description: "x402 协议让 Agent 调用服务的方式变得和访问网页一样简单。",
      items: [
        { title: "调用前知道价格", body: "每个服务的单价在目录里公开，Agent 付款前就能看到。" },
        { title: "结果即拿即用", body: "标准化输出，直接进入 Agent 上下文，不需要二次处理。" },
        { title: "每笔都有凭证", body: "x402 支付凭证链上可查，每一笔调用都留有记录。" }
      ]
    },
    providerPanel: {
      eyebrow: "服务商",
      title: "给你的 API 接入 x402",
      body: "包一层 x402，你的 API 就能被所有 Agent 发现并按次付费调用。两条命令，上线。",
      primary: { href: "/providers", label: "查看接入方式", variant: "primary" },
      secondary: { href: "/directory", label: "先看现有服务", variant: "ghost" }
    },
    copyButton: {
      idle: "复制命令",
      copied: "已复制",
      idleAriaLabel: "复制安装命令",
      copiedAriaLabel: "已复制"
    }
  },
  en: {
    hero: {
      eyebrow: "x402 · Pay per call",
      title: "Let your agent call x402 services",
      subtitle: "Install two Skills. Your agent discovers, pays, and calls any x402-enabled service automatically.",
      supporting: "No API integration. No payment plumbing. Discovery, quoting, payment, and receipts — all inside the Skill.",
      commandLabel: "Install",
      commandMeta: "Terminal",
      commandStatus: "Ready",
      commands: installCommands,
      actions: [
        { href: "/directory", label: "Browse services", variant: "primary" },
        { href: "/providers", label: "List my API", variant: "secondary" }
      ]
    },
    valueStrip: [
      { index: "01", title: "Discover", english: "Discover" },
      { index: "02", title: "Quote", english: "Quote" },
      { index: "03", title: "Pay", english: "Pay" },
      { index: "04", title: "Receipt", english: "Receipt" }
    ],
    catalog: {
      eyebrow: "Live services",
      title: "APIs that already support x402",
      description: "Pay per call. Prices are visible before the agent pays.",
      linkLabel: "View all",
      cards: [
        {
          title: "Google Search",
          eyebrow: "Search",
          description: "Live web search results, straight into agent context.",
          meta: "Web Index",
          price: "$0.05 / call"
        },
        {
          title: "Onchain Risk Score",
          eyebrow: "Risk",
          description: "Real-time address risk scoring via OnchainOS.",
          meta: "Risk Control",
          price: "$0.15 / call"
        },
        {
          title: "BankOfAI Chat",
          eyebrow: "Reasoning",
          description: "Financial-grade reasoning, tuned for agent workflows.",
          meta: "Financial AI",
          price: "$0.02 / call"
        }
      ]
    },
    trust: {
      eyebrow: "Why x402",
      title: "Pay per call. Every call on record.",
      description: "x402 makes calling an API as simple as loading a webpage — for agents.",
      items: [
        { title: "Price before payment", body: "Every service lists its per-call price. The agent sees it before paying." },
        { title: "Output ready to use", body: "Normalized responses go straight back into the agent context." },
        { title: "On-chain receipts", body: "Every x402 payment generates a verifiable on-chain receipt." }
      ]
    },
    providerPanel: {
      eyebrow: "For providers",
      title: "Add x402 to your API",
      body: "Wrap your API with x402 and it becomes discoverable and payable by any agent. Two commands to go live.",
      primary: { href: "/providers", label: "See how to list", variant: "primary" },
      secondary: { href: "/directory", label: "Browse live services", variant: "ghost" }
    },
    copyButton: {
      idle: "Copy commands",
      copied: "Copied",
      idleAriaLabel: "Copy install commands",
      copiedAriaLabel: "Copied"
    }
  }
};
