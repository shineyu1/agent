import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LanguageProvider } from "@/components/layout/language-provider";
import ProvidersIndexPage from "@/app/providers/page";

function renderProvidersPage(language: "zh" | "en") {
  return renderToStaticMarkup(
    <LanguageProvider initialLanguage={language}>
      <ProvidersIndexPage />
    </LanguageProvider>
  );
}

describe("ProvidersPage", () => {
  it("renders the provider entry page in Chinese", () => {
    const html = renderProvidersPage("zh");

    expect(html).toContain("给你的 API 加上 x402");
    expect(html).toContain(
      "npx skills add shineyu1/agent --agent openclaw --skill agent-service-layer-provider-skill -y"
    );
    expect(html).toContain("钱包签名登录");
    expect(html).toContain("OpenClaw 下一步");
    expect(html).toContain('aria-label="复制安装命令"');
  });

  it("renders the provider entry page in English", () => {
    const html = renderProvidersPage("en");

    expect(html).toContain("Add x402 to your API");
    expect(html).toContain(
      "npx skills add shineyu1/agent --agent openclaw --skill agent-service-layer-provider-skill -y"
    );
    expect(html).toContain("Sign in with your wallet");
    expect(html).toContain("Then continue");
    expect(html).toContain('aria-label="Copy install commands"');
  });
});
