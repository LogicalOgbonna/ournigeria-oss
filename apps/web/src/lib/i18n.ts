import type { Language } from "@/types";

/**
 * Centralized UI strings map.
 * Add new languages (e.g. "ig", "ha", "yo") by extending Language and adding entries here.
 */
const strings = {
  // ─── Welcome hero ───
  "welcome.subtitle": {
    en: "Explore how Nigeria spends your money",
    pcm: "See how Nigeria dey spend your money",
  },
  "welcome.tryAsking": {
    en: "Try asking...",
    pcm: "Try ask...",
  },
} satisfies Record<string, Record<Language, string>>;

export type StringKey = keyof typeof strings;

/** Look up a translated string by key and language. Falls back to English. */
export function t(key: StringKey, language: Language): string {
  const entry = strings[key];
  return entry[language] ?? entry.en;
}
