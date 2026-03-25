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
      "接入之后，你的 API 就能被 Agent 发现，按次调用，自动结算。两条命令，完成接入。"
    );
    expect(html).toContain(
      "npx skills add https://github.com/shineyu1/agent/tree/main/skills --skill seller-skill"
    );
    expect(html).toContain("安装两个 Skill");
    expect(html).toContain("声明你的服务");
    expect(html).toContain("上线，等 Agent 来调用");
    expect(html).toContain('aria-label="复制安装命令"');
  });

  it("renders the provider entry page in English", () => {
    const html = renderProvidersPage("en");

    expect(html).toContain("Add x402 to your API");
    expect(html).toContain(
      "Once live, your API is discoverable by agents, callable on demand, and settled automatically per call. Two commands to get there."
    );
    expect(html).toContain(
      "npx skills add https://github.com/shineyu1/agent/tree/main/skills --skill seller-skill"
    );
    expect(html).toContain("Install both Skills");
    expect(html).toContain("Declare your service");
    expect(html).toContain("Go live. Agents call you.");
    expect(html).toContain('aria-label="Copy install commands"');
  });
});
