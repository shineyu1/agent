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
  "npx skills add https://github.com/shineyu1/agent/tree/main/skills --skill agent-service-layer-provider-skill",
  "npx skills add okx/onchainos-skills"
] as const;

export const providerCopy: Record<Language, ProviderCopy> = {
  zh: {
    hero: {
      eyebrow: "服务商接入",
      title: "给你的 API 加上 x402",
      subtitle:
        "接入之后，你的 API 就能被 Agent 发现，按次调用，自动结算。两条命令，完成接入。",
      commandLabel: "安装",
      commandMeta: "Terminal",
      commands: providerCommands
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
      description: "",
      items: [
        {
          index: "01",
          title: "安装两个 Skill",
          body: "运行上面两条命令，把 x402 接入能力装进你的环境。"
        },
        {
          index: "02",
          title: "声明你的服务",
          body: "在 Agent 环境里配置服务描述、单价和接口信息，不用回到网页。"
        },
        {
          index: "03",
          title: "上线，等 Agent 来调用",
          body: "服务出现在目录里，买方 Agent 自动发现并按次付费调用。"
        }
      ]
    },
    benefits: {
      eyebrow: "为什么用 x402",
      title: "一次接入，持续收入",
      items: [
        {
          title: "按次结算",
          body: "每次调用自动完成 x402 支付，不用处理订阅或账单。"
        },
        {
          title: "零对接成本",
          body: "不改现有 API 架构，包一层就能支持 Agent 调用。"
        },
        {
          title: "自动被发现",
          body: "接入后自动出现在服务目录，买方 Agent 主动找上门。"
        }
      ]
    }
  },
  en: {
    hero: {
      eyebrow: "Provider onboarding",
      title: "Add x402 to your API",
      subtitle:
        "Once live, your API is discoverable by agents, callable on demand, and settled automatically per call. Two commands to get there.",
      commandLabel: "Install",
      commandMeta: "Terminal",
      commands: providerCommands
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
      description: "",
      items: [
        {
          index: "01",
          title: "Install both Skills",
          body: "Run the two commands above to add x402 publishing capability to your environment."
        },
        {
          index: "02",
          title: "Declare your service",
          body: "Set your description, per-call price, and endpoint inside the agent. No web form."
        },
        {
          index: "03",
          title: "Go live. Agents call you.",
          body: "Your service appears in the directory. Buyer agents discover it and pay per call automatically."
        }
      ]
    },
    benefits: {
      eyebrow: "Why x402",
      title: "List once. Earn per call.",
      items: [
        {
          title: "Per-call billing",
          body: "Every call triggers an automatic x402 payment. No subscriptions, no invoicing."
        },
        {
          title: "No API changes",
          body: "Wrap your existing API with x402. No architecture changes required."
        },
        {
          title: "Automatic discovery",
          body: "Listed services appear in the directory. Agents find you without any marketing."
        }
      ]
    }
  }
};
