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

    expect(html).toContain("先装 Skill，再继续执行");
    expect(html).toContain(
      "npx skills add shineyu1/agent --agent openclaw --skill agent-service-layer-user-skill -y"
    );
    expect(html).toContain("复制内容已经包含“安装后继续使用 user skill 先接任务，只有任务不清楚时再回退浏览服务”的后续提示。");
    expect(html).toContain("服务商复制后会继续走钱包签名登录和 API 接入");
    expect(html).toContain('aria-label="复制安装命令"');
  });

  it("renders the simplified install page in English", () => {
    const html = renderInstallPage("en");

    expect(html).toContain("Install the Skill, then keep going");
    expect(html).toContain(
      "npx skills add shineyu1/agent --agent openclaw --skill agent-service-layer-user-skill -y"
    );
    expect(html).toContain("The copied payload already tells OpenClaw to keep going after install");
    expect(html).toContain("Provider copy now continues into wallet-signature seller login");
    expect(html).toContain('aria-label="Copy install commands"');
  });
});
