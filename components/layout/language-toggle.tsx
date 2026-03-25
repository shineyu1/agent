"use client";

import React from "react";
import { useLanguage } from "./language-provider";
import { siteCopy } from "@/lib/content/site-copy";

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();
  const copy = siteCopy[language];

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
      aria-label={copy.languageToggle}
    >
      <span>{copy.languageToggle}</span>
      <span className="text-[var(--muted)]">{copy.languageToggleHint}</span>
    </button>
  );
}
