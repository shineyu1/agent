"use client";

import React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  defaultLanguage,
  isLanguage,
  languageStorageKey,
  type Language
} from "@/lib/content/language";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  initialLanguage
}: {
  children: ReactNode;
  initialLanguage?: Language;
}) {
  const [language, setLanguage] = useState<Language>(initialLanguage ?? defaultLanguage);
  const [hydrated, setHydrated] = useState(initialLanguage !== undefined);

  useEffect(() => {
    if (initialLanguage !== undefined || typeof window === "undefined") {
      return;
    }

    const storedLanguage = window.localStorage.getItem(languageStorageKey);
    if (isLanguage(storedLanguage)) {
      setLanguage(storedLanguage);
    }

    setHydrated(true);
  }, [initialLanguage]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(languageStorageKey, language);
  }, [hydrated, language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => {
        setLanguage((current) => (current === "zh" ? "en" : "zh"));
      }
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}
