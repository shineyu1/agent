export const languages = ["zh", "en"] as const;

export type Language = (typeof languages)[number];

export const defaultLanguage: Language = "zh";

export const languageStorageKey = "agent-service-layer-language";

export function isLanguage(value: string | null | undefined): value is Language {
  return value === "zh" || value === "en";
}
