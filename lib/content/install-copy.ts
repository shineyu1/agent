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

type CopyButtonLabels = {
  idle: string;
  copied: string;
  idleAriaLabel: string;
  copiedAriaLabel: string;
};

type InstallCopy = {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  copyButton: CopyButtonLabels;
  buyer: {
    eyebrow: string;
    title: string;
    description: string;
    commands: readonly string[];
    copyPayload: readonly string[];
    followupLabel: string;
    followupBody: string;
    actions: readonly InstallAction[];
    steps: readonly string[];
  };
  provider: {
    eyebrow: string;
    title: string;
    description: string;
    commands: readonly string[];
    copyPayload: readonly string[];
    followupLabel: string;
    followupBody: string;
    actionLabel: string;
  };
  questions: readonly InstallQuestion[];
};

const userCommands = [
  "npx skills add shineyu1/agent --agent openclaw --skill agent-service-layer-user-skill -y",
  "npx skills add okx/onchainos-skills --agent openclaw --skill '*' -y"
] as const;

const providerCommands = [
  "npx skills add shineyu1/agent --agent openclaw --skill agent-service-layer-provider-skill -y",
  "npx skills add okx/onchainos-skills --agent openclaw --skill '*' -y"
] as const;

const userCopyPayload = [
  "Install and enable the user-side x402 skills in the current OpenClaw workspace. Run:",
  "",
  ...userCommands,
  "",
  "After installation, do not stop at reporting success.",
  "Continue with agent-service-layer-user-skill, ask what the user wants to get done, and only fall back to browsing services if the task is still unclear."
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

export const installCopy: Record<Language, InstallCopy> = {
  zh: {
    hero: {
      eyebrow: "How it works",
      title: "先装 Skill，再继续执行",
      subtitle: "现在复制的不只是两条命令，还包含安装完成后的下一步指令，避免 OpenClaw 停在“装好了”。"
    },
    copyButton: {
      idle: "复制命令",
      copied: "已复制",
      idleAriaLabel: "复制安装命令",
      copiedAriaLabel: "已复制"
    },
    buyer: {
      eyebrow: "For users",
      title: "用户安装",
      description: "复制后会同时告诉 OpenClaw 安装 skill，并在安装完成后先接住用户任务，而不是先甩服务菜单。",
      commands: userCommands,
      copyPayload: userCopyPayload,
      followupLabel: "OpenClaw 下一步",
      followupBody: "复制内容已经包含“安装后继续使用 user skill 先接任务，只有任务不清楚时再回退浏览服务”的后续提示。",
      actions: [
        { href: "/directory", label: "看服务", variant: "primary" },
        { href: "/dashboard", label: "看记录", variant: "secondary" }
      ],
      steps: [
        "先安装用户 skill 和 OKX skills。",
        "让 OpenClaw 继续承接用户任务，不要停在安装成功。",
        "真正遇到 402 时再触发支付。"
      ]
    },
    provider: {
      eyebrow: "For providers",
      title: "服务商安装",
      description: "服务商复制后会继续走钱包签名登录和 API 接入，不再依赖 claim 页面。",
      commands: providerCommands,
      copyPayload: providerCopyPayload,
      followupLabel: "OpenClaw 下一步",
      followupBody:
        "复制内容已经包含 seller 钱包签名登录、默认平台后端和“从接入一个 API 开始”的后续提示。",
      actionLabel: "服务商接入说明"
    },
    questions: [
      {
        title: "为什么不是只给命令？",
        body: "因为很多人会把整段内容直接发给 OpenClaw。复制内容必须把“安装后继续做什么”一起带上。"
      },
      {
        title: "还要打开网页登录吗？",
        body: "OpenClaw 主流程不再依赖网页登录，服务商侧默认走钱包签名登录。"
      },
      {
        title: "哪些动作会再次签名？",
        body: "发布服务、修改价格、修改收款钱包、切换可见性。"
      }
    ]
  },
  en: {
    hero: {
      eyebrow: "How it works",
      title: "Install the Skill, then keep going",
      subtitle:
        "The copied payload now includes both the install commands and the post-install continuation prompt, so OpenClaw does not stop at “installed successfully”."
    },
    copyButton: {
      idle: "Copy commands",
      copied: "Copied",
      idleAriaLabel: "Copy install commands",
      copiedAriaLabel: "Copied"
    },
    buyer: {
      eyebrow: "For users",
      title: "User install",
      description: "Copy once and tell OpenClaw both how to install the skills and what to do next.",
      commands: userCommands,
      copyPayload: userCopyPayload,
      followupLabel: "Then continue",
      followupBody:
        "The copied payload already tells OpenClaw to keep going after install, ask what the user wants done first, and only fall back to browsing services if the task is still unclear.",
      actions: [
        { href: "/directory", label: "Browse services", variant: "primary" },
        { href: "/dashboard", label: "View records", variant: "secondary" }
      ],
      steps: [
        "Install the user skill and the OKX skills.",
        "Let OpenClaw continue instead of stopping at installation success.",
        "Only trigger payment when a real 402 appears."
      ]
    },
    provider: {
      eyebrow: "For providers",
      title: "Provider install",
      description:
        "Provider copy now continues into wallet-signature seller login and API onboarding instead of bouncing through a claim page.",
      commands: providerCommands,
      copyPayload: providerCopyPayload,
      followupLabel: "Then continue",
      followupBody:
        "The copied payload already tells OpenClaw to use wallet-signature seller login, default to the Agent Service x402 backend, and start by connecting one API.",
      actionLabel: "Provider setup"
    },
    questions: [
      {
        title: "Why not copy only the commands?",
        body: "Because many users paste the whole payload directly into OpenClaw. The payload needs to include what should happen after install."
      },
      {
        title: "Do providers still need the claim page?",
        body: "Not for the OpenClaw primary flow. Provider auth now defaults to wallet-signature login."
      },
      {
        title: "Which actions require a second signature?",
        body: "Publish service, change price, change payout wallet, and change visibility."
      }
    ]
  }
};
