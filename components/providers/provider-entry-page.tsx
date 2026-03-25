"use client";

import React from "react";
import { CommandCopyButton } from "@/components/home/command-copy-button";
import { useLanguage } from "@/components/layout/language-provider";
import { providerCopy } from "@/lib/content/provider-copy";

export function ProviderEntryPage() {
  const { language } = useLanguage();
  const copy = providerCopy[language];

  return (
    <main className="pb-24 pt-12">

      {/* ── Hero ── */}
      <section className="flex flex-col gap-4">
        <p
          className="m-0 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          {copy.hero.eyebrow}
        </p>
        <h1
          className="m-0 text-4xl font-semibold text-white sm:text-5xl"
          style={{ letterSpacing: "-0.03em" }}
        >
          {copy.hero.title}
        </h1>
        <p className="m-0 max-w-2xl text-base leading-relaxed" style={{ color: "var(--muted)" }}>
          {copy.hero.subtitle}
        </p>
      </section>

      {/* ── Main content ── */}
      <section className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">

        {/* Left: steps */}
        <div className="flex flex-col gap-6 lg:flex-1">
          <div className="flex flex-col gap-1">
            <p
              className="m-0 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--muted)" }}
            >
              {copy.steps.eyebrow}
            </p>
            <h2
              className="m-0 text-2xl font-semibold text-white sm:text-3xl"
              style={{ letterSpacing: "-0.03em" }}
            >
              {copy.steps.title}
            </h2>
            <p className="m-0 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              {copy.steps.description}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {copy.steps.items.map((item) => (
              <article
                key={item.index}
                className="flex items-start gap-4 rounded-2xl p-5"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <span
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold text-white"
                  style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}
                >
                  {item.index}
                </span>
                <div className="flex flex-col gap-1">
                  <h3
                    className="m-0 text-base font-semibold text-white"
                    style={{ letterSpacing: "-0.01em" }}
                  >
                    {item.title}
                  </h3>
                  <p className="m-0 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                    {item.body}
                  </p>
                </div>
              </article>
            ))}
          </div>

          {/* Benefits */}
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-1">
              <p
                className="m-0 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--muted)" }}
              >
                {copy.benefits.eyebrow}
              </p>
              <h2
                className="m-0 text-2xl font-semibold text-white"
                style={{ letterSpacing: "-0.03em" }}
              >
                {copy.benefits.title}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {copy.benefits.items.map((item) => (
                <article
                  key={item.title}
                  className="flex flex-col gap-2 rounded-2xl p-5"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <h3 className="m-0 text-sm font-semibold text-white">{item.title}</h3>
                  <p className="m-0 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* Right: terminal */}
        <div
          className="w-full overflow-hidden rounded-2xl lg:w-[400px] lg:flex-shrink-0"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {/* Titlebar */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
            </div>
            <span
              className="font-mono text-[10px] uppercase tracking-widest"
              style={{ color: "var(--muted)" }}
            >
              {copy.hero.commandMeta}
            </span>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-4 p-5">
            <span
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--muted)" }}
            >
              {copy.hero.commandLabel}
            </span>

            <div className="flex flex-col gap-2">
              {copy.hero.commands.map((command) => (
                <div
                  key={command}
                  className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}
                >
                  <span
                    className="mt-[1px] font-mono text-sm"
                    style={{ color: "rgba(142,164,255,0.6)" }}
                  >
                    $
                  </span>
                  <code className="break-all text-[13px] leading-relaxed text-white">
                    {command}
                  </code>
                </div>
              ))}
            </div>

            <CommandCopyButton commands={copy.hero.commands} copy={copy.copyButton} />

            <p className="m-0 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
              {language === "zh"
                ? "两条命令都需要安装。第一条接入服务层，第二条接入 OKX OnchainOS。"
                : "Both commands are required. The first connects to the service layer, the second to OKX OnchainOS."}
            </p>
          </div>
        </div>
      </section>

    </main>
  );
}
