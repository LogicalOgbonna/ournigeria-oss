"use client";

/**
 * Verification banner shown ABOVE a full OfficialProfile when a citizen lands
 * on the seat-verification path (a name is already proposed for the seat).
 * Reuses the confirm/suggest-different/add-source actions from
 * SeatVerificationView, but as a top-of-page banner rather than a standalone
 * card, so the full official profile can render beneath it.
 */

import { useState } from "react";
import { Check, Link2, Loader2 } from "lucide-react";
import { roleConfig, SourceField, ErrorBox, type IdentifyForm } from "@/components/proposals/identify-form";
import { Show } from "@/components/ui/Show";
import type { SeatCandidate } from "@/lib/api";

export function SeatVerifyBar({
  form,
  candidates,
  onSuggestDifferent,
}: {
  form: IdentifyForm;
  candidates: SeatCandidate[];
  onSuggestDifferent: () => void;
}) {
  const [showSource, setShowSource] = useState(false);
  const [leader, ...others] = candidates;
  const roleLabel = roleConfig(form.role)?.label || "official";

  if (!leader) return null;

  return (
    <div className="mb-8 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 px-5 py-5">
      <div className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-400 mb-2">
        Seat verification
      </div>
      <h2 className="font-heading text-lg font-semibold text-slate-900 dark:text-white mb-1">
        Is this the {roleLabel}?
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
        Someone proposed this person. Confirm it&apos;s right, or tell us who it should be.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => form.confirmName(leader.name)}
          disabled={form.submitting}
          className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Show when={form.submitting}>
            <><Loader2 className="w-4 h-4 animate-spin" /> Confirming...</>
          </Show>
          <Show when={!form.submitting}>
            <><Check className="w-4 h-4" /> Yes, confirm this</>
          </Show>
        </button>
        <button
          type="button"
          onClick={onSuggestDifferent}
          disabled={form.submitting}
          className="flex-1 py-2.5 px-4 border border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          Suggest a different name
        </button>
      </div>

      <div className="mt-3">
        <Show when={!showSource}>
          <button
            type="button"
            onClick={() => setShowSource(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            <Link2 className="w-3.5 h-3.5" /> Add a source
          </button>
        </Show>
        <Show when={showSource}>
          <SourceField form={form} />
        </Show>
      </div>

      <Show when={others.length > 0}>
        <div className="mt-4 pt-4 border-t border-emerald-200/70 dark:border-emerald-800/50">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium mb-2">
            Other names proposed
          </p>
          <ul className="space-y-1.5">
            {others.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700"
              >
                <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                  {c.name}
                  {c.partyAcronym && (
                    <span className="text-slate-400"> · {c.partyAcronym}</span>
                  )}
                </span>
                <span className="text-xs text-slate-400 shrink-0 ml-2">
                  {c.confirmCount === 1 ? "1 confirm" : `${c.confirmCount} confirms`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Show>

      <div className="mt-3">
        <ErrorBox message={form.error} />
      </div>
    </div>
  );
}
