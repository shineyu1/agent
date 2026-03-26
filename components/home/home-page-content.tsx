"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/layout/language-provider";
import { CommandCopyButton } from "@/components/home/command-copy-button";
import { homeCopy } from "@/lib/content/home-copy";
import type { DirectoryService } from "@/lib/services/discovery/directory-service";

function toPriceLabel(price: string) {
  const [amount] = price.split(" ");
  return `$${amount}`;
}

export function HomePageContent({
  previewServices
}: {
  previewServices: DirectoryService[];
}) {
  const { language } = useLanguage();
  const copy = homeCopy[language];

  return (
    <main className="pb-24 pt-12">

      {/* ── Hero ── */}
      <section
        data-testid="home-hero"
        className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12"
      >

        {/* Left: text */}
        <div className="flex flex-col gap-7 lg:flex-1">
          <div
            className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            {copy.hero.eyebrow}
          </div>

          <h1
            className="m-0 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
            style={{ letterSpacing: "-0.03em" }}
          >
            {copy.hero.title}
          </h1>

          <p className="m-0 text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
            {copy.hero.subtitle}
          </p>

          <p className="m-0 text-sm leading-loose" style={{ color: "var(--muted)" }}>
            {copy.hero.supporting}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {copy.hero.actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold no-underline transition-all hover:-translate-y-px"
                style={
                  action.variant === "primary"
                    ? { background: "#ffffff", color: "#000000" }
                    : { background: "var(--surface)", border: "1px solid var(--border)", color: "#ffffff" }
                }
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: terminal */}
        <div
          data-testid="home-install-panel"
          className="w-full overflow-hidden rounded-2xl lg:w-[420px] lg:flex-shrink-0"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {/* Terminal titlebar */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              {copy.hero.commandMeta}
            </span>
          </div>

          {/* Terminal body */}
          <div className="flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-1.5">
              <span
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--muted)" }}
              >
                {copy.hero.commandLabel}
              </span>
              <div
                className="inline-flex w-fit items-center gap-2 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest"
                style={{
                  background: "rgba(142,164,255,0.08)",
                  border: "1px solid rgba(142,164,255,0.18)",
                  color: "#c7d6ff"
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                {copy.hero.commandStatus}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {copy.hero.commands.map((command) => (
                <div
                  key={command}
                  className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}
                >
                  <span className="mt-[1px] font-mono text-sm" style={{ color: "rgba(142,164,255,0.6)" }}>$</span>
                  <code className="break-all text-[13px] leading-relaxed text-white">
                    {command}
                  </code>
                </div>
              ))}
            </div>

            <div
              className="rounded-xl px-4 py-3 text-sm leading-relaxed"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}
            >
              <p className="m-0 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                {copy.hero.followupLabel}
              </p>
              <p className="m-0 mt-2" style={{ color: "var(--muted)" }}>
                {copy.hero.followupBody}
              </p>
            </div>

            <CommandCopyButton lines={copy.hero.copyPayload} copy={copy.copyButton} />
          </div>
        </div>
      </section>

      {/* ── Value strip ── */}
      <section
        data-testid="home-value-strip"
        className="mt-10 grid grid-cols-2 overflow-hidden rounded-2xl sm:grid-cols-4"
        style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
      >
        {copy.valueStrip.map((item, i) => (
          <div
            key={item.index}
            className="flex flex-col gap-2 px-6 py-5"
            style={i > 0 ? { borderLeft: "1px solid var(--border)" } : undefined}
          >
            <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              {item.index}
            </span>
            <span className="text-xl font-semibold text-white" style={{ letterSpacing: "-0.02em" }}>
              {item.title}
            </span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {item.english}
            </span>
          </div>
        ))}
      </section>

      {/* ── Service preview ── */}
      {previewServices.length > 0 && (
        <section data-testid="home-service-preview" className="mt-20 flex flex-col gap-7">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <p className="m-0 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                {copy.catalog.eyebrow}
              </p>
              <h2
                className="m-0 text-3xl font-semibold text-white sm:text-4xl"
                style={{ letterSpacing: "-0.03em" }}
              >
                {copy.catalog.title}
              </h2>
            </div>
            <Link
              href="/directory"
              className="flex-shrink-0 text-xs font-semibold uppercase tracking-widest no-underline transition-opacity hover:opacity-70"
              style={{ color: "#c7d6ff" }}
            >
              {copy.catalog.linkLabel} →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {previewServices.map((service) => (
              <article
                key={service.id}
                className="flex flex-col gap-4 rounded-2xl p-6 transition-all hover:-translate-y-0.5"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)"
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="m-0 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                      {service.category}
                    </p>
                    <h3
                      className="m-0 text-2xl font-semibold text-white"
                      style={{ letterSpacing: "-0.03em" }}
                    >
                      {service.name}
                    </h3>
                  </div>
                  <span
                    className="flex-shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "#c7d6ff" }}
                  >
                    {toPriceLabel(service.price)}
                  </span>
                </div>

                <p className="m-0 flex-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                  {service.description}
                </p>

                <div
                  className="flex items-center justify-between pt-3 text-xs"
                  style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}
                >
                  <span>{service.providerName}</span>
                  <span>{Math.round(service.successRate * 100)}%</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Trust section ── */}
      <section className="mt-20 flex flex-col gap-7">
        <div className="flex flex-col gap-2">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            {copy.trust.eyebrow}
          </p>
          <h2
            className="m-0 text-3xl font-semibold text-white sm:text-4xl"
            style={{ letterSpacing: "-0.03em" }}
          >
            {copy.trust.title}
          </h2>
          <p className="m-0 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {copy.trust.description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {copy.trust.items.map((item) => (
            <article
              key={item.title}
              className="flex flex-col gap-3 rounded-2xl p-6"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <h3 className="m-0 text-lg font-semibold text-white">{item.title}</h3>
              <p className="m-0 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Provider CTA ── */}
      <section
        className="mt-20 flex flex-col gap-5 rounded-2xl p-8 sm:flex-row sm:items-center sm:justify-between"
        style={{ background: "linear-gradient(135deg, #3b42c0 0%, #1e2540 100%)" }}
      >
        <div className="flex flex-col gap-2">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.6)" }}>
            {copy.providerPanel.eyebrow}
          </p>
          <h2
            className="m-0 text-2xl font-semibold text-white sm:text-3xl"
            style={{ letterSpacing: "-0.03em" }}
          >
            {copy.providerPanel.title}
          </h2>
          <p className="m-0 max-w-lg text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
            {copy.providerPanel.body}
          </p>
        </div>

        <div className="flex flex-shrink-0 flex-col gap-2 sm:items-end">
          <Link
            href={copy.providerPanel.primary.href}
            className="inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold text-white no-underline transition-all hover:-translate-y-px"
            style={{
              background: "rgba(8, 10, 20, 0.82)",
              border: "1px solid rgba(255,255,255,0.16)",
              boxShadow: "0 10px 30px rgba(4, 6, 16, 0.28)"
            }}
          >
            {copy.providerPanel.primary.label}
          </Link>
          <Link
            href={copy.providerPanel.secondary.href}
            className="inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold text-white no-underline transition-all hover:-translate-y-px"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            {copy.providerPanel.secondary.label}
          </Link>
        </div>
      </section>

    </main>
  );
}
