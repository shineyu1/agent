import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LanguageProvider } from "@/components/layout/language-provider";
import { DirectoryDiscoveryView } from "@/components/directory/directory-discovery-view";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
}));

const services = [
  {
    id: "svc_1",
    name: "Signal Lens",
    description: "Turn onchain activity into quick signal snapshots for agents.",
    category: "research",
    tags: ["signals", "wallet"],
    price: "0.03 USDT",
    successRate: 0.982,
    avgLatencyMs: 420,
    recentPaidCallCount: 128,
    providerName: "Northstar Data",
    detailPath: "/services/signal-lens",
    installPath: "/api/services/signal-lens/install",
    receiptPathTemplate: "/api/receipts/:txHash",
    rejectedProofCount: 2
  }
];

function renderDirectory(language: "zh" | "en") {
  return renderToStaticMarkup(
    <LanguageProvider initialLanguage={language}>
      <DirectoryDiscoveryView services={services} selectedSort="recentPaidCalls" />
    </LanguageProvider>
  );
}

describe("DirectoryDiscoveryView", () => {
  it("renders grouped directory sections in Chinese", () => {
    const html = renderDirectory("zh");

    expect(html).toContain("支持 x402 的 API 能力");
    expect(html).toContain("最近调用");
    expect(html).toContain("按能力挑服务");
    expect(html).toContain("搜索与研究");
    expect(html).toContain("Signal Lens");
    expect(html).toContain("单价");
    expect(html).toContain("成功率");
    expect(html).toContain("响应速度");
    expect(html).toContain("装好 Skill 后，Agent 会自动发现并按次支付调用。");
    expect(html).toContain("查看服务详情");
    expect(html).toContain('href="/services/signal-lens"');
  });

  it("switches grouped directory copy to English", () => {
    const html = renderDirectory("en");

    expect(html).toContain("API capabilities with x402");
    expect(html).toContain("Most called");
    expect(html).toContain("Browse by capability");
    expect(html).toContain("Search &amp; Research");
    expect(html).toContain("Price");
    expect(html).toContain("Success rate");
    expect(html).toContain("Speed");
    expect(html).toContain(
      "Install the Skill and your agent can discover and pay per call automatically."
    );
    expect(html).toContain("View details");
  });
});
