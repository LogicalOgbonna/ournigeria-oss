import type { Language } from "../types";

/**
 * Centralized UI strings map.
 * Add new languages (e.g. "ig", "ha", "yo") by extending Language and adding entries here.
 */
const strings = {
  // ─── Equivalents section titles ───
  "equivalents.budget": {
    en: "What {0} Could Fund",
    pcm: "Wetin {0} Fit Fund",
  },
  "equivalents.corruption": {
    en: "What {0} Looted Funds Could Have Built",
    pcm: "Wetin {0} Money Wey Dem Thief Fit Don Build",
  },
  "equivalents.impact": {
    en: "Real-World Impact",
    pcm: "Wetin Di Money Fit Do For Real Life",
  },

  // ─── Status messages ───
  "status.searchingBudget": {
    en: "Searching budget documents...",
    pcm: "I dey search budget documents...",
  },
  "status.analyzingBudget": {
    en: "Analyzing budget data...",
    pcm: "I dey analyze di budget...",
  },
  "status.searchingCorruption": {
    en: "Searching EFCC case files...",
    pcm: "I dey check EFCC case files...",
  },
  "status.reviewingCorruption": {
    en: "Reviewing case details...",
    pcm: "I dey review di case...",
  },
  "status.calculatingImpact": {
    en: "Calculating real-world impact...",
    pcm: "I dey calculate wetin di money fit do...",
  },

  // ─── General / fallback responses ───
  "general.greeting": {
    en: "I'm Aje, your Nigerian budget and accountability assistant. How can I help you today?",
    pcm: "I be Aje, your Nigerian budget and accountability assistant. How I fit help you today?",
  },

  // ─── Fallback follow-ups ───
  "followUp.educationSpending": {
    en: "Which state spends the most on education?",
    pcm: "Which state dey spend di most on education?",
  },
  "followUp.compareBudgets": {
    en: "Compare Lagos and Kano budgets",
    pcm: "Compare Lagos and Kano budgets",
  },
  "followUp.budgetBuy": {
    en: "What could Rivers State's budget buy?",
    pcm: "Wetin Rivers State budget fit buy?",
  },
  "followUp.convictedGovernors": {
    en: "Which governors have been convicted of corruption?",
    pcm: "Which governors dem don convict for corruption?",
  },
  "followUp.largestEFCC": {
    en: "What are the largest amounts alleged in EFCC cases?",
    pcm: "Wetin be di largest amounts wey EFCC allege?",
  },
  "followUp.compareAnother": {
    en: "Compare this to another state's budget",
    pcm: "Compare am with another state budget",
  },
  "followUp.biggestCorruption": {
    en: "What are the biggest corruption cases in Nigeria?",
    pcm: "Wetin be di biggest corruption cases for Nigeria?",
  },

  // ─── Dynamic follow-ups (use {0}, {1} for interpolation) ───
  "followUp.caseStatus": {
    en: "What is the current status of {0}'s case?",
    pcm: "Wetin be di current status of {0} case?",
  },
  "followUp.compareCases": {
    en: "Compare the cases of {0} and {1}",
    pcm: "Compare {0} and {1} cases",
  },
  "followUp.educationCompare": {
    en: "How does {0}'s education spending compare to other states?",
    pcm: "How {0} education spending compare with other states?",
  },
  "followUp.budgetTrends": {
    en: "Show {0} budget trends from 2019 to 2025",
    pcm: "Show me {0} budget trends from 2019 to 2025",
  },

  // ─── Language directive (for agent prompts) ───
  "prompt.languageDirective": {
    en: "",
    pcm: "IMPORTANT: You MUST respond ENTIRELY in Nigerian Pidgin English (Naija Pidgin). Use Pidgin grammar and vocabulary throughout your ENTIRE response. Keep all numbers, monetary values, proper names, and technical terms in standard form. Do NOT write any sentence in standard English.\n\n",
  },
  "prompt.languageReminder": {
    en: "",
    pcm: "\n\nREMINDER: Your ENTIRE response must be in Nigerian Pidgin English. Every sentence must use Pidgin grammar. Do NOT switch to standard English.",
  },
} satisfies Record<string, Record<Language, string>>;

export type StringKey = keyof typeof strings;

/** Look up a translated string by key and language. Falls back to English. */
export function t(key: StringKey, language: Language): string {
  const entry = strings[key];
  return entry[language] ?? entry.en;
}

/**
 * Template version of `t` — replaces `{0}`, `{1}`, etc. with positional args.
 */
export function tf(
  key: StringKey,
  language: Language,
  ...args: string[]
): string {
  let result = t(key, language);
  for (let i = 0; i < args.length; i++) {
    result = result.replace(`{${i}}`, args[i]);
  }
  return result;
}
