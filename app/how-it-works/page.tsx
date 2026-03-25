"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/layout/language-provider";

const copy = {
  zh: {
    eyebrow: "How it works",
    title: "先装 Skill，再让 Agent 自己完成发现、支付和调用",
    description:
      "网页不是执行中心，Skill 才是。这个页面只负责把买方真正关心的路径讲清楚：装上之后，Agent 如何找到服务、读取报价、完成支付并拿回结果与回执。",
    steps: [
      {
        index: "01",
        title: "安装用户 Skill",
        body: "把用户侧 Skill 和支付能力装进 agent 运行环境，让后续服务发现和支付闭环真正可用。"
      },
      {
        index: "02",
        title: "发现可买服务",
        body: "Skill 暴露目录、能力边界和单次价格，agent 可以先判断值不值得买，再决定是否继续。"
      },
      {
        index: "03",
        title: "读取报价并支付",
        body: "服务返回报价后，agent 只在需要时完成按次支付，不被套餐、订阅或 seat 模型绑死。"
      },
      {
        index: "04",
        title: "拿回结果和回执",
        body: "结果、支付证明和调用记录一起返回，方便后续回填工作流、复盘、报销和审计。"
      }
    ],
    buyerTitle: "对买方来说，这条路径为什么成立",
    buyerBody:
      "关键不是页面上写了什么，而是 Skill 把购买和调用真的变成了 agent 可执行的一部分。你装的不是一个展示插件，而是一个可购买能力接口。",
    providerTitle: "如果你是服务商",
    providerBody:
      "服务商路径仍然保留，但它是次级入口。首页和使用路径先服务买方，服务商再单独去完成接入与发布。",
    primaryCta: "查看安装页",
    secondaryCta: "浏览服务"
  },
  en: {
    eyebrow: "How it works",
    title: "Install the Skill first, then let the agent handle discovery, payment, and invocation",
    description:
      "The web app is not the execution center. Skill is. This page exists to make the buyer path obvious: once installed, how the agent finds services, reads quotes, pays per use, and returns with output plus receipts.",
    steps: [
      {
        index: "01",
        title: "Install the user skill",
        body: "Put the user skill and payment capability inside the agent runtime so the loop can actually execute."
      },
      {
        index: "02",
        title: "Discover purchasable services",
        body: "The Skill exposes the catalog, capability boundaries, and per-call pricing before the agent commits to anything."
      },
      {
        index: "03",
        title: "Read the quote and pay",
        body: "Once the quote comes back, the agent pays only when needed instead of getting trapped by plans, seats, or quotas."
      },
      {
        index: "04",
        title: "Return output and receipt",
        body: "The result, payment proof, and invocation record return together so the workflow stays reviewable and auditable."
      }
    ],
    buyerTitle: "Why this holds up for buyers",
    buyerBody:
      "The important part is not the page copy. The important part is that Skill turns buying and invoking into something the agent can actually execute inside a live workflow.",
    providerTitle: "If you are a provider",
    providerBody:
      "The provider path still exists, but it stays secondary. Buyer understanding and buyer execution come first; provider onboarding happens on its own dedicated entry.",
    primaryCta: "Open install page",
    secondaryCta: "Browse services"
  }
} as const;

export default function HowItWorksPage() {
  const { language } = useLanguage();
  const page = copy[language];

  return (
    <main className="home-v2-page-shell">
      <div className="home-v2-page-grid">
        <section className="home-v2-section">
          <div className="home-v2-section-heading">
            <p className="home-v2-section-eyebrow">{page.eyebrow}</p>
            <h1 className="home-v2-section-title install-v2-title">{page.title}</h1>
            <p className="home-v2-section-description install-v2-description">{page.description}</p>
          </div>
        </section>

        <section className="home-v2-process-grid" data-testid="home-process-grid">
          {page.steps.map((step) => (
            <article key={step.index} className="home-v2-process-card">
              <span className="home-v2-process-index">{step.index}</span>
              <h2 className="home-v2-process-title">{step.title}</h2>
              <p className="home-v2-process-body">{step.body}</p>
            </article>
          ))}
        </section>

        <section className="install-v2-grid">
          <article className="home-v2-trust-card">
            <h2 className="home-v2-trust-title">{page.buyerTitle}</h2>
            <p className="home-v2-trust-body">{page.buyerBody}</p>
          </article>

          <article className="home-v2-trust-card">
            <h2 className="home-v2-trust-title">{page.providerTitle}</h2>
            <p className="home-v2-trust-body">{page.providerBody}</p>
          </article>
        </section>

        <section className="home-v2-final-panel">
          <div className="home-v2-final-copy">
            <h2 className="home-v2-final-title">{page.title}</h2>
          </div>

          <div className="home-v2-final-actions">
            <Link href="/install" className="home-v2-primary-link">
              {page.primaryCta}
            </Link>
            <Link href="/directory" className="home-v2-secondary-link">
              {page.secondaryCta}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
