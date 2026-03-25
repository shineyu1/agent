import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LanguageProvider } from "@/components/layout/language-provider";
import InstallPage from "@/app/install/page";

function renderInstallPage(language: "zh" | "en") {
  return renderToStaticMarkup(
    <LanguageProvider initialLanguage={language}>
      <InstallPage />
    </LanguageProvider>
  );
}

describe("InstallPage", () => {
  it("renders the simplified install page in Chinese", () => {
    const html = renderInstallPage("zh");

    expect(html).toContain("How it works");
    expect(html).toContain("先装 Skill，再开始用");
    expect(html).toContain("用户安装");
    expect(html).toContain(
      "npx skills add https://github.com/shineyu1/agent/tree/main/skills --skill buyer-skill"
    );
    expect(html).toContain("看服务");
    expect(html).toContain("看记录");
    expect(html).toContain("服务商安装");
    expect(html).toContain("现在只保留 Provider Skill 安装方式");
  });

  it("renders the simplified install page in English", () => {
    const html = renderInstallPage("en");

    expect(html).toContain("How it works");
    expect(html).toContain("Install the Skill, then start");
    expect(html).toContain("User install");
    expect(html).toContain(
      "npx skills add https://github.com/shineyu1/agent/tree/main/skills --skill buyer-skill"
    );
    expect(html).toContain("Browse services");
    expect(html).toContain("View records");
    expect(html).toContain("Provider install");
    expect(html).toContain("Provider onboarding now stays on the Provider Skill path only.");
  });
});
