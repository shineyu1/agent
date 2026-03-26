import type { Language } from "./language";

type Step = {
  index: string;
  title: string;
  body: string;
};

type Benefit = {
  title: string;
  body: string;
};

type ProviderCopy = {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    commandLabel: string;
    commandMeta: string;
    commands: readonly string[];
    copyPayload: readonly string[];
    followupLabel: string;
    followupBody: string;
  };
  copyButton: {
    idle: string;
    copied: string;
    idleAriaLabel: string;
    copiedAriaLabel: string;
  };
  steps: {
    eyebrow: string;
    title: string;
    description: string;
    items: readonly Step[];
  };
  benefits: {
    eyebrow: string;
    title: string;
    items: readonly Benefit[];
  };
};

const providerCommands = [
  "npx skills add shineyu1/agent --agent openclaw --skill agent-service-layer-provider-skill -y",
  "npx skills add okx/onchainos-skills --agent openclaw --skill '*' -y"
] as const;

const providerCopyPayload = [
  "Install and enable the provider-side x402 skills in the current OpenClaw workspace. Run:",
  "",
  ...providerCommands,
  "",
  "After installation, do not stop at reporting success.",
  "Continue with agent-service-layer-provider-skill, use wallet-signature seller login, and start provider onboarding by connecting one API.",
  "Use the Agent Service x402 backend at https://agentx402.online by default."
] as const;

export const providerCopy: Record<Language, ProviderCopy> = {
  zh: {
    hero: {
      eyebrow: "服务商接入",
      title: "给你的 API 加上 x402",
      subtitle:
        "上线后，你的 API 会被 Agent 发现、按次调用、按次结算。面板里展示两条安装命令，复制按钮会把完整的 OpenClaw 继续指令一起带上。",
      commandLabel: "安装",
      commandMeta: "Terminal",
      commands: providerCommands,
      copyPayload: providerCopyPayload,
      followupLabel: "OpenClaw 下一步",
      followupBody:
        "复制按钮会把安装命令和后续指令一起发给 OpenClaw，包括钱包签名登录、默认使用 Agent Service x402 后端，以及从接入一个 API 开始。"
    },
    copyButton: {
      idle: "复制命令",
      copied: "已复制",
      idleAriaLabel: "复制安装命令",
      copiedAriaLabel: "已复制"
    },
    steps: {
      eyebrow: "接入流程",
      title: "三步完成",
      description: "OpenClaw 主流程不再依赖 claim 页面，服务商认证走钱包签名登录。",
      items: [
        {
          index: "01",
          title: "安装两个 Skill",
          body: "先把服务商 skill 和 OKX OnchainOS skills 装进当前 OpenClaw 工作区。"
        },
        {
          index: "02",
          title: "钱包签名登录",
          body: "OpenClaw 会先完成 seller 登录签名，拿到 bearer token，再继续创建或更新服务。"
        },
        {
          index: "03",
          title: "接入并发布服务",
          body: "普通配置直接继续；发布、改价、改收款钱包、改可见性这些高风险动作会再次触发签名。"
        }
      ]
    },
    benefits: {
      eyebrow: "为什么这样接",
      title: "少一步网页跳转，多一步真实控制",
      items: [
        {
          title: "Agent 内闭环",
          body: "安装、登录、创建服务、更新服务都在 OpenClaw 里完成，不再要求额外打开 claim 页面。"
        },
        {
          title: "高风险动作再签名",
          body: "发布服务、修改价格、修改收款钱包、切换可见性时会再次签名，保持 Web3 风格的强授权。"
        },
        {
          title: "后端默认接好",
          body: "OpenClaw 默认使用 https://agentx402.online 作为平台后端，不需要再向用户追问 provider API 入口。"
        }
      ]
    }
  },
  en: {
    hero: {
      eyebrow: "Provider onboarding",
      title: "Add x402 to your API",
      subtitle:
        "Once live, your API is discoverable by agents, callable on demand, and settled automatically per call. The panel shows the two install commands, while the copy button includes the full OpenClaw continuation prompt.",
      commandLabel: "Install",
      commandMeta: "Terminal",
      commands: providerCommands,
      copyPayload: providerCopyPayload,
      followupLabel: "Then continue",
      followupBody:
        "The copied payload tells OpenClaw to keep going after install, use wallet-signature seller login, and start provider onboarding by connecting one API."
    },
    copyButton: {
      idle: "Copy commands",
      copied: "Copied",
      idleAriaLabel: "Copy install commands",
      copiedAriaLabel: "Copied"
    },
    steps: {
      eyebrow: "How to go live",
      title: "Three steps",
      description: "OpenClaw no longer depends on the claim page for its primary provider flow.",
      items: [
        {
          index: "01",
          title: "Install both Skills",
          body: "Install the provider skill and the OKX OnchainOS skills into the current OpenClaw workspace."
        },
        {
          index: "02",
          title: "Sign in with your wallet",
          body: "OpenClaw performs seller login with a wallet signature, gets a bearer token, and uses that token for normal provider actions."
        },
        {
          index: "03",
          title: "Connect and publish",
          body: "Regular edits continue with the bearer token. Publishing, price changes, payout wallet changes, and visibility changes require a second signature."
        }
      ]
    },
    benefits: {
      eyebrow: "Why this flow",
      title: "Fewer browser detours, stronger control",
      items: [
        {
          title: "Agent-native onboarding",
          body: "Install, sign in, create services, and update services from inside OpenClaw instead of bouncing through a browser claim page."
        },
        {
          title: "High-risk changes re-signed",
          body: "Publishing, pricing, payout wallet changes, and visibility changes require a fresh wallet approval."
        },
        {
          title: "Canonical backend",
          body: "OpenClaw defaults to https://agentx402.online, so it does not need to ask the user for provider API docs before creating a service."
        }
      ]
    }
  }
};
