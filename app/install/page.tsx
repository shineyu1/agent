"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/layout/language-provider";
import { CommandCopyButton } from "@/components/home/command-copy-button";
import { installCopy } from "@/lib/content/install-copy";

export default function InstallPage() {
  const { language } = useLanguage();
  const copy = installCopy[language];

  return (
    <main className="home-v2-page-shell">
      <div className="home-v2-page-grid">
        <section className="home-v2-section install-v2-hero">
          <div className="home-v2-section-heading">
            <p className="home-v2-section-eyebrow">{copy.hero.eyebrow}</p>
            <h1 className="home-v2-section-title install-v2-title">{copy.hero.title}</h1>
            <p className="home-v2-section-description install-v2-description">
              {copy.hero.subtitle}
            </p>
          </div>
        </section>

        <section className="install-v2-grid">
          <article className="install-v2-primary">
            <div className="home-v2-section-heading">
              <p className="home-v2-section-eyebrow">{copy.buyer.eyebrow}</p>
              <h2 className="home-v2-section-title install-v2-subtitle">{copy.buyer.title}</h2>
              <p className="home-v2-section-description">{copy.buyer.description}</p>
            </div>

            <div className="install-v2-command-panel">
              <pre className="install-v2-code">{copy.buyer.commands.join("\n")}</pre>
            </div>

            <p className="home-v2-section-description">{copy.buyer.followupLabel}</p>
            <p className="install-v2-step-body">{copy.buyer.followupBody}</p>
            <CommandCopyButton lines={copy.buyer.copyPayload} copy={copy.copyButton} />

            <div className="home-v2-hero-actions">
              {copy.buyer.actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={
                    action.variant === "primary"
                      ? "home-v2-primary-link"
                      : "home-v2-secondary-link"
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>

            <div className="install-v2-steps">
              {copy.buyer.steps.map((step, index) => (
                <article key={step} className="install-v2-step-card">
                  <span className="home-v2-process-index">{String(index + 1).padStart(2, "0")}</span>
                  <p className="install-v2-step-body">{step}</p>
                </article>
              ))}
            </div>
          </article>

          <aside className="install-v2-sidebar">
            <div className="home-v2-section-heading">
              <p className="home-v2-section-eyebrow">{copy.provider.eyebrow}</p>
              <h2 className="home-v2-section-title install-v2-sidebar-title">{copy.provider.title}</h2>
              <p className="home-v2-section-description">{copy.provider.description}</p>
            </div>

            <div className="install-v2-command-panel">
              <pre className="install-v2-code">{copy.provider.commands.join("\n")}</pre>
            </div>

            <p className="home-v2-section-description">{copy.provider.followupLabel}</p>
            <p className="install-v2-step-body">{copy.provider.followupBody}</p>
            <CommandCopyButton lines={copy.provider.copyPayload} copy={copy.copyButton} />

            <Link href="/providers/new" className="home-v2-secondary-link">
              {copy.provider.actionLabel}
            </Link>
          </aside>
        </section>

        <section className="home-v2-trust-grid install-v2-faq">
          {copy.questions.map((item) => (
            <article key={item.title} className="home-v2-trust-card">
              <h2 className="home-v2-trust-title">{item.title}</h2>
              <p className="home-v2-trust-body">{item.body}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
