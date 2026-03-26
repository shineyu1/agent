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
    copyPayload: readonly string[];
    followupLabel: string;
    followupBody: string;
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
  "npx skills add shineyu1/agent --agent openclaw --skill agent-service-layer-user-skill -y",
  "npx skills add okx/onchainos-skills --agent openclaw --skill '*' -y"
] as const;

const installCopyPayload = [
  "Install and enable the user-side x402 skills in the current OpenClaw workspace. Run:",
  "",
  ...installCommands,
  "",
  "After installation, do not stop at reporting success.",
  "Continue with agent-service-layer-user-skill, ask what the user wants to get done, and only fall back to browsing services if the task is still unclear."
] as const;

export const homeCopy: Record<Language, HomeCopy> = {
  zh: {
    hero: {
      eyebrow: "x402 按次付费",
      title: "让 Agent 直接调用 x402 服务",
      subtitle: "先装两个 Skill。之后由 Agent 自己发现服务、处理支付、拿回结果和回执。",
      supporting:
        "首页展示两条安装命令，复制按钮会把安装后的下一步提示一起带给 OpenClaw，避免停在“装好了”。",
      commandLabel: "安装",
      commandMeta: "Terminal",
      commandStatus: "Ready",
      commands: installCommands,
      copyPayload: installCopyPayload,
      followupLabel: "OpenClaw 下一步",
      followupBody: "复制内容已经包含“安装后先接用户任务，只有任务不清楚时再回退浏览 x402 服务”的后续提示。",
      actions: [
        { href: "/directory", label: "查看可用服务", variant: "primary" },
        { href: "/providers", label: "接入我的 API", variant: "secondary" }
      ]
    },
    valueStrip: [
      { index: "01", title: "发现", english: "Discover" },
      { index: "02", title: "报价", english: "Quote" },
      { index: "03", title: "支付", english: "Pay" },
      { index: "04", title: "回执", english: "Receipt" }
    ],
    catalog: {
      eyebrow: "精选能力",
      title: "这些 API 已支持 x402",
      description: "按次计费，调用前能先看到价格，调用后留下回执。",
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
          title: "Onchain Risk Score",
          eyebrow: "风控",
          description: "链上地址风险评分，适合钱包筛查和安全判断。",
          meta: "Risk Control",
          price: "$0.15 / call"
        },
        {
          title: "BankOfAI Chat",
          eyebrow: "推理",
          description: "适合 Agent 工作流的通用推理与文本生成。",
          meta: "Financial AI",
          price: "$0.02 / call"
        }
      ]
    },
    trust: {
      eyebrow: "为什么 x402",
      title: "按次付费，每笔可查",
      description: "x402 让 Agent 调 API 的方式更像访问网页：先看到价格，再付款，再拿结果。",
      items: [
        { title: "调用前知道价格", body: "每个服务都先展示单价，真正支付前就能判断值不值得。"},
        { title: "结果直接可用", body: "标准化输出回到 Agent 上下文，不需要额外整理。"},
        { title: "每次调用有回执", body: "支付和调用记录都会留下可追踪回执。"}
      ]
    },
    providerPanel: {
      eyebrow: "服务商",
      title: "给你的 API 接上 x402",
      body: "Provider 侧现在默认走 OpenClaw 钱包签名登录，不再把 claim 页面当主流程。",
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
      eyebrow: "x402 Pay per call",
      title: "Let your agent call x402 services",
      subtitle: "Install two Skills. Your agent discovers services, handles payment, and returns results plus receipts.",
      supporting:
        "The panel shows the install commands, while the copy button includes the post-install continuation prompt so OpenClaw does not stop at success.",
      commandLabel: "Install",
      commandMeta: "Terminal",
      commandStatus: "Ready",
      commands: installCommands,
      copyPayload: installCopyPayload,
      followupLabel: "Then continue",
      followupBody:
        "The copied payload already tells OpenClaw to keep going after install, ask what the user wants done first, and only fall back to browsing services if the task is still unclear.",
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
      eyebrow: "Featured capabilities",
      title: "APIs that already support x402",
      description: "Per-call pricing, visible before payment, with receipts after delivery.",
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
          description: "Real-time address risk scoring for wallet screening and safety checks.",
          meta: "Risk Control",
          price: "$0.15 / call"
        },
        {
          title: "BankOfAI Chat",
          eyebrow: "Reasoning",
          description: "General reasoning and text generation tuned for agent workflows.",
          meta: "Financial AI",
          price: "$0.02 / call"
        }
      ]
    },
    trust: {
      eyebrow: "Why x402",
      title: "Pay per call. Every call traceable.",
      description: "x402 makes agent API usage feel like loading a webpage: see the price, pay once, get the result.",
      items: [
        { title: "Price before payment", body: "Every service shows its per-call price before the agent pays." },
        { title: "Output ready to use", body: "Normalized responses go straight back into the agent context." },
        { title: "Receipt on every call", body: "Payments and calls leave a verifiable receipt trail." }
      ]
    },
    providerPanel: {
      eyebrow: "For providers",
      title: "Add x402 to your API",
      body: "Provider onboarding now defaults to OpenClaw wallet-signature login instead of treating the claim page as the main path.",
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
