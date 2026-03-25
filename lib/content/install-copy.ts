import type { Language } from "./language";

type InstallAction = {
  href: string;
  label: string;
  variant: "primary" | "secondary";
};

type InstallQuestion = {
  title: string;
  body: string;
};

type InstallCopy = {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  buyer: {
    eyebrow: string;
    title: string;
    description: string;
    commands: readonly string[];
    actions: readonly InstallAction[];
    steps: readonly string[];
  };
  provider: {
    eyebrow: string;
    title: string;
    description: string;
    commands: readonly string[];
    actionLabel: string;
  };
  questions: readonly InstallQuestion[];
};

const userCommands = [
  "npx skills add https://github.com/shineyu1/agent/tree/main/skills --skill buyer-skill",
  "npx skills add okx/onchainos-skills"
] as const;

const providerCommands = [
  "npx skills add https://github.com/shineyu1/agent/tree/main/skills --skill seller-skill",
  "npx skills add okx/onchainos-skills"
] as const;

export const installCopy: Record<Language, InstallCopy> = {
  zh: {
    hero: {
      eyebrow: "How it works",
      title: "先装 Skill，再开始用",
      subtitle: "对用户来说，入口只有一个：装 Skill。服务发现、支付和调用都在 Skill 里完成。"
    },
    buyer: {
      eyebrow: "For users",
      title: "用户安装",
      description: "装完这两条，Agent 就能自己看服务、付款、调用并拿回结果。",
      commands: userCommands,
      actions: [
        { href: "/directory", label: "看服务", variant: "primary" },
        { href: "/dashboard", label: "看记录", variant: "secondary" }
      ],
      steps: [
        "先安装 Skill。",
        "再去服务目录挑能力。",
        "需要时由 Agent 自己支付并调用。"
      ]
    },
    provider: {
      eyebrow: "For providers",
      title: "服务商安装",
      description: "服务商也只保留 Skill 入口，不再在网页里填复杂表单。",
      commands: providerCommands,
      actionLabel: "服务商安装说明"
    },
    questions: [
      {
        title: "需要另外接钱包吗？",
        body: "不用。支付授权在 Skill 里完成。"
      },
      {
        title: "要先买套餐吗？",
        body: "不用。按次付费，用到再付。"
      },
      {
        title: "服务商怎么接入？",
        body: "现在只保留 Provider Skill 安装方式。"
      }
    ]
  },
  en: {
    hero: {
      eyebrow: "How it works",
      title: "Install the Skill, then start",
      subtitle: "For users, there is one entry point: install the Skill. Discovery, payment, and invocation all happen there."
    },
    buyer: {
      eyebrow: "For users",
      title: "User install",
      description: "Install these two commands and let the agent browse, pay, invoke, and return with results.",
      commands: userCommands,
      actions: [
        { href: "/directory", label: "Browse services", variant: "primary" },
        { href: "/dashboard", label: "View records", variant: "secondary" }
      ],
      steps: [
        "Install the Skill first.",
        "Pick capabilities from the directory.",
        "Let the agent pay and invoke when needed."
      ]
    },
    provider: {
      eyebrow: "For providers",
      title: "Provider install",
      description: "Providers now use only the Provider Skill path. No heavy web form.",
      commands: providerCommands,
      actionLabel: "Provider setup"
    },
    questions: [
      {
        title: "Do I need a separate wallet flow?",
        body: "No. Payment authorization happens inside the Skill."
      },
      {
        title: "Do I need a plan first?",
        body: "No. It is pay per use."
      },
      {
        title: "How do providers join?",
        body: "Provider onboarding now stays on the Provider Skill path only."
      }
    ]
  }
};
