import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteShell } from "@/components/layout/site-shell";
import { LanguageProvider } from "@/components/layout/language-provider";

vi.mock("next/navigation", () => ({
  usePathname: () => "/"
}));

function renderShell(language?: "zh" | "en") {
  return renderToStaticMarkup(
    <LanguageProvider initialLanguage={language}>
      <SiteShell>
        <main>content</main>
      </SiteShell>
    </LanguageProvider>
  );
}

describe("SiteShell", () => {
  it("renders the Chinese navigation by default", () => {
    const html = renderShell();

    expect(html).toContain("首页");
    expect(html).toContain("服务目录");
    expect(html).toContain("服务商入驻");
    expect(html).toContain("语言");
    expect(html).toContain("中文 / EN");
  });

  it("renders the English navigation when language is set to English", () => {
    const html = renderShell("en");

    expect(html).toContain("Home");
    expect(html).toContain("Directory");
    expect(html).toContain("Providers");
    expect(html).toContain("Language");
    expect(html).toContain("English / 中文");
  });
});
