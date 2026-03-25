import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import DirectoryPage from "@/app/directory/page";
import { LanguageProvider } from "@/components/layout/language-provider";

const { buildLiveDirectoryMock } = vi.hoisted(() => ({
  buildLiveDirectoryMock: vi.fn()
}));

vi.mock("@/lib/services/discovery/directory", () => ({
  buildLiveDirectory: buildLiveDirectoryMock
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
}));

describe("DirectoryPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("supplements the directory with curated API showcases", async () => {
    buildLiveDirectoryMock.mockResolvedValue([
      {
        id: "svc_signal_lens",
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
    ]);

    const page = await DirectoryPage({
      searchParams: Promise.resolve({ sortBy: "recentPaidCalls" })
    });
    const html = renderToStaticMarkup(
      <LanguageProvider initialLanguage="en">{page}</LanguageProvider>
    );

    expect(html).toContain("Signal Lens");
    expect(html).toContain("GPT-5.4");
    expect(html).toContain("Claude Opus 4.6");
    expect(html).toContain("Gemini 3 Pro");
    expect(html).toContain("Google Search");
    expect(html).toContain("Wallet Risk Summary");
    expect(html).toContain("Token Intelligence Snapshot");
    expect(html).toContain("Onchain Risk Scoring");
    expect(html).toContain("Receipt Verifier");
    expect(html).toContain("Model APIs");
    expect(html).toContain("Search &amp; Research");
    expect(html).toContain("Risk &amp; Safety");
    expect(html).toContain("Onchain Data");
    expect(html).toContain("Payments &amp; Receipts");
    expect(html).toContain("Demo");
    expect(html).toContain("Coming soon");
  });
});
