"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Show } from "@/components/ui/Show";
import { FIELD_LABELS } from "./constants";
import posthog from "posthog-js";

export function ChallengeButton({
  officialId,
  fields,
}: {
  officialId: string;
  fields: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mb-9 relative">
      <button
        onClick={() => {
          if (!open) posthog.capture("official_information_challenge_started");
          setOpen(!open);
        }}
        type="button"
        className="inline-flex items-center gap-2 border border-red-500/30 dark:border-red-400/25 rounded-xl px-5 py-3 transition-all hover:bg-red-400/[0.08] hover:border-red-500/50 text-red-600 dark:text-red-400"
      >
        <Pencil className="w-4 h-4" />
        <span className="text-[13px] font-medium">Challenge Information</span>
      </button>

      <Show when={open}>
        <>
          <div role="button" aria-modal="true" className="fixed inset-0 z-40" onClick={() => setOpen(false)} onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }} />
          <div className="absolute left-0 top-full mt-2 z-50 w-64 bg-white dark:bg-slate-900 border border-black/[0.08] dark:border-white/10 rounded-xl shadow-lg py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <p className="px-4 py-2 text-[11px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              What needs correcting?
            </p>
            {fields.map((field) => (
              <Link
                key={field}
                href={`/proposals/new?officialId=${officialId}&targetField=${field}`}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-700 dark:text-slate-300 transition-colors hover:bg-red-400/[0.08] hover:text-red-600 dark:hover:text-red-400"
                onClick={() => setOpen(false)}
              >
                {FIELD_LABELS[field] || field}
              </Link>
            ))}
          </div>
        </>
      </Show>
    </section>
  );
}
