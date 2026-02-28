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
  "status.searchingGovspend": {
    en: "Searching government payment records...",
    pcm: "I dey search government payment records...",
  },
  "status.analyzingGovspend": {
    en: "Analyzing payment data...",
    pcm: "I dey analyze di payment data...",
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

  "followUp.govspendJuliusBerger": {
    en: "How much was paid to Julius Berger?",
    pcm: "How much dem pay Julius Berger?",
  },
  "followUp.govspendMinistryWorks": {
    en: "Show me payments by the Ministry of Works",
    pcm: "Show me payments by Ministry of Works",
  },
  "followUp.govspendTopMDA": {
    en: "Which MDA spends the most money?",
    pcm: "Which MDA dey spend the most money?",
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

  // ─── No data messages ───
  "noData.budget": {
    en: 'I don\'t have budget data that matches your question in our records yet. Our database covers state and federal budgets from 2019 to 2025 — try asking about a specific state and year, for example: "What is Lagos State\'s 2024 budget?" or "Compare Kano and Rivers education spending."',
    pcm: 'I no get budget data wey match your question for our records yet. Our database cover state and federal budgets from 2019 to 2025 — try ask about specific state and year, like: "Wetin be Lagos State 2024 budget?" or "Compare Kano and Rivers education spending."',
  },
  "noData.corruption": {
    en: 'I don\'t have EFCC case data that matches your question in our records. Our database covers cases involving former governors and officials investigated by the EFCC. Try asking about a specific official, for example: "What happened to James Ibori?" or "Tell me about Diezani\'s case."',
    pcm: 'I no get EFCC case data wey match your question for our records. Our database cover cases wey involve former governors and officials wey EFCC investigate. Try ask about specific official, like: "Wetin happen to James Ibori?" or "Tell me about Diezani case."',
  },
  "noData.govspend": {
    en: 'I don\'t have government payment records that match your question. Our database contains over 891,000 payment records across MDAs. Try asking about a specific ministry, contractor, or beneficiary — for example: "How much was paid to Julius Berger?" or "Show me payments by the Ministry of Works."',
    pcm: 'I no get government payment records wey match your question. Our database get over 891,000 payment records across MDAs. Try ask about specific ministry, contractor, or beneficiary — like: "How much dem pay Julius Berger?" or "Show me payments by Ministry of Works."',
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
