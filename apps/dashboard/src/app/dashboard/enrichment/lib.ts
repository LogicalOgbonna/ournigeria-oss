/** Like adminFetch, but surfaces the API's JSON error message (needed for apply failures). */
export async function enrichmentFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`/api/admin/enrichment${path}`, {
    ...opts,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || body.error || `API error: ${res.status}`);
  }
  return body;
}

export const STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  needs_human: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  needs_more_sources: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export const TIER_STYLES: Record<string, string> = {
  canonical: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  official: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  web: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

/** Render a JSON value for display: strings as-is, everything else stringified. */
export function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  return typeof v === "string" ? v : JSON.stringify(v);
}
