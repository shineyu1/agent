import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LanguageProvider } from "@/components/layout/language-provider";
import { HomePageContent } from "@/components/home/home-page-content";

const previewServices = [
  {
    id: "svc_search",
    name: "Google Search",
    description: "Live internet search for agent workflows.",
    category: "search",
    tags: ["search"],
    price: "0.05 USDT",
    successRate: 0.98,
    avgLatencyMs: 380,
    recentPaidCallCount: 412,
    providerName: "Web Index",
    detailPath: "/services/google-search",
    installPath: "/api/services/google-search/install",
    receiptPathTemplate: "/api/receipts/:txHash",
    rejectedProofCount: 0
  },
  {
    id: "svc_risk",
    name: "Onchain Risk Scoring",
    description: "Wallet and contract risk checks.",
    category: "risk",
    tags: ["risk"],
    price: "0.15 USDT",
    successRate: 0.97,
    avgLatencyMs: 420,
    recentPaidCallCount: 284,
    providerName: "OnchainOS",
    detailPath: "/services/onchain-risk",
    installPath: "/api/services/onchain-risk/install",
    receiptPathTemplate: "/api/receipts/:txHash",
    rejectedProofCount: 0
  },
  {
    id: "svc_chat",
    name: "BankOfAI Chat",
    description: "Reasoning and text generation for agent tasks.",
    category: "reasoning",
    tags: ["chat"],
    price: "0.02 USDT",
    successRate: 0.99,
    avgLatencyMs: 260,
    recentPaidCallCount: 198,
    providerName: "BankOfAI",
    detailPath: "/services/bankofai-chat",
    installPath: "/api/services/bankofai-chat/install",
    receiptPathTemplate: "/api/receipts/:txHash",
    rejectedProofCount: 0
  }
];

function renderHomePage(language: "zh" | "en") {
  return renderToStaticMarkup(
    <LanguageProvider initialLanguage={language}>
      <HomePageContent previewServices={previewServices} />
    </LanguageProvider>
  );
}

describe("HomePage", () => {
  it("renders the rebuilt homepage structure in Chinese", () => {
    const html = renderHomePage("zh");

    expect(html).toContain('data-testid="home-hero"');
    expect(html).toContain('data-testid="home-install-panel"');
    expect(html).toContain('data-testid="home-value-strip"');
    expect(html).toContain('data-testid="home-service-preview"');
    expect(html).toContain("让 Agent 直接调用 x402 服务");
    expect(html).toContain("查看可用服务");
    expect(html).toContain("接入我的 API");
    expect(html).toContain("OpenClaw 下一步");
    expect(html).toContain("安装后先接用户任务");
    expect(html).toContain("Google Search");
    expect(html).toContain("Onchain Risk Scoring");
    expect(html).toContain("BankOfAI Chat");
    expect(html).toContain("调用前知道价格");
    expect(html).toContain("结果直接可用");
    expect(html).toContain("每次调用有回执");
  });

  it("renders the rebuilt homepage structure in English", () => {
    const html = renderHomePage("en");

    expect(html).toContain('data-testid="home-service-preview"');
    expect(html).toContain("Let your agent call x402 services");
    expect(html).toContain("The panel shows the install commands");
    expect(html).toContain("Browse services");
    expect(html).toContain("List my API");
    expect(html).toContain("Then continue");
    expect(html).toContain("Price before payment");
    expect(html).toContain("Output ready to use");
    expect(html).toContain("Receipt on every call");
  });
});
