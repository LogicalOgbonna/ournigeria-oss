/**
 * The dashboard's five status tones and their chip classes — one palette, so a
 * status badge reads the same whether it is a campaign ticket, a scouted
 * handle, or the next surface that needs one.
 *
 * The classes are hard-coded rather than themed: these five must stay
 * distinguishable side by side in a dense table, which the semantic
 * foreground/background tokens do not guarantee.
 */
export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  info: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};
