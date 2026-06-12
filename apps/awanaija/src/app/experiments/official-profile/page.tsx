"use client";

/**
 * Official-profile IA experiment — 7 layout variants for the redesigned official
 * profile (structured education / business / elections / family / legal sections,
 * all evidence-backed). Pick the IA that best balances SEO (all content in DOM)
 * and ease of use on a dense profile.
 *
 * Plan context: official-profile-data schema design (Section 2 — display).
 * Shareable: /experiments/official-profile?v=c
 */

import { useEffect, useState } from "react";
import { VariantA } from "./variants/VariantA";
import { VariantB } from "./variants/VariantB";
import { VariantC } from "./variants/VariantC";
import { VariantD } from "./variants/VariantD";
import { VariantE } from "./variants/VariantE";
import { VariantF } from "./variants/VariantF";
import { VariantG } from "./variants/VariantG";
import { VariantH } from "./variants/VariantH";

const VARIANTS = [
  { id: "h", name: "Magazine Profile (V9 — chosen)", desc: "Owner's external mockup: editorial longform, pull-stats, election scoreboard, red legal register", component: VariantH },
  { id: "a", name: "Jump-Nav Scroll", desc: "672px column + sticky chip nav (closest to today)", component: VariantA },
  { id: "b", name: "Dossier", desc: "Sticky left TOC rail + wide reading column", component: VariantB },
  { id: "c", name: "Timeline Spine", desc: "One chronological life timeline, category-colored", component: VariantC },
  { id: "d", name: "Stat Dashboard", desc: "Summary stat cards anchor-linking into sections", component: VariantD },
  { id: "e", name: "Open Ledger", desc: "Open-by-default collapsible groups + index strip", component: VariantE },
  { id: "f", name: "Magazine Footnotes", desc: "Editorial prose + superscript citations + sources list", component: VariantF },
  { id: "g", name: "Civic Record Card", desc: "Gazette-style dense tables + verification stamps", component: VariantG },
];

export default function OfficialProfileExperiment() {
  const [variant, setVariant] = useState("h");

  // Read ?v= on mount, keep the URL shareable on switch.
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("v");
    if (v && VARIANTS.some((x) => x.id === v)) setVariant(v);
  }, []);

  function pick(id: string) {
    setVariant(id);
    const url = new URL(window.location.href);
    url.searchParams.set("v", id);
    window.history.replaceState(null, "", url.toString());
  }

  const current = VARIANTS.find((x) => x.id === variant) ?? VARIANTS[0];
  const Active = current.component;

  return (
    <div className="min-h-screen bg-[oklch(0.10_0.005_160)]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[oklch(0.08_0.005_160)]/95 backdrop-blur px-4 py-3">
        <div className="max-w-[1100px] mx-auto flex flex-col gap-2">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-400">Experiment · Official Profile IA</span>
            <span className="font-mono text-[10px] text-slate-500 ml-3">{current.name} — {current.desc}</span>
          </div>
          <nav className="flex flex-wrap gap-1.5">
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                onClick={() => pick(v.id)}
                className={`font-mono text-[11px] uppercase tracking-[0.04em] px-3 py-1.5 rounded-lg border transition-colors ${
                  variant === v.id
                    ? "bg-emerald-400 text-emerald-950 border-emerald-400 font-semibold"
                    : "border-white/10 text-slate-400 hover:border-emerald-400/40 hover:text-slate-200"
                }`}
              >
                {v.id.toUpperCase()} · {v.name}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <Active />
    </div>
  );
}
