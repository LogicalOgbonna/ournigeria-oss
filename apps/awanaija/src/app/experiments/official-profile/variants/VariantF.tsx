"use client";

/**
 * Variant F — "Magazine Footnotes"
 * Editorial profile: oversized serif headline, mono pull-stat band, flowing sections.
 * Every claim carries a superscript footnote → numbered SOURCES list at the bottom.
 * Citation-grade feel.
 */

import { OFFICIAL, Avatar, CompletenessBar } from "./shared";

function Fn({ n }: { n: number }) {
  return (
    <a href="#sources" className="text-emerald-400 font-mono text-[10px] align-super ml-0.5 hover:underline">
      {n}
    </a>
  );
}

const SOURCES = [
  { n: 1, publisher: "INEC", snippet: "Babajide Olusola Sanwo-Olu (APC) — 762,134 votes, declared winner.", tier: "canonical", archived: true },
  { n: 2, publisher: "University of Lagos", snippet: "Bachelor of Science, Surveying & Geoinformatics, Class of 1988.", tier: "official", archived: true },
  { n: 3, publisher: "Premium Times", snippet: "…served as Deputy General Manager at First Inland Bank before joining the Lagos cabinet.", tier: "web", archived: true },
  { n: 4, publisher: "Lagos State Govt", snippet: "Profile of the Executive Governor of Lagos State.", tier: "official", archived: false },
  { n: 5, publisher: "Judicial Panel Records", snippet: "Lagos State Judicial Panel of Inquiry on Restitution for Victims of SARS-Related Abuses and the Lekki Toll Gate Incident.", tier: "canonical", archived: true },
];

export function VariantF() {
  return (
    <div className="min-h-screen bg-[oklch(0.10_0.005_160)] text-slate-300 font-sans">
      <div className="max-w-[680px] mx-auto px-6 pt-16 pb-16">
        {/* Editorial hero */}
        <div className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-400">
          {OFFICIAL.role} · {OFFICIAL.state} · {OFFICIAL.party}
        </div>
        <h1 className="font-serif text-[52px] leading-[1.02] text-white max-[560px]:text-[38px]">
          Babajide<br />Sanwo-Olu
        </h1>
        <div className="flex items-end gap-6 mt-6 mb-2">
          <Avatar size={140} />
          <p className="text-[15px] leading-[1.7] text-slate-400 pb-1">
            Banker turned administrator turned two-term governor of Nigeria&apos;s commercial
            capital<Fn n={4} />. His public record spans 26 years across the private sector
            and Lagos State government<Fn n={3} />.
          </p>
        </div>
        <div className="mt-4"><CompletenessBar /></div>

        {/* Pull-stat band */}
        <div className="grid grid-cols-3 gap-px bg-white/10 border-y border-white/10 my-10 max-[560px]:grid-cols-1">
          {[
            ["762,134", "VOTES · 2023", 1],
            ["26 YRS", "PUBLIC LIFE", 3],
            ["₦2.4B", "DECLARED · 2019", 4],
          ].map(([big, label, fn]) => (
            <div key={label as string} className="bg-[oklch(0.10_0.005_160)] py-6 px-4 text-center">
              <div className="font-mono text-[24px] font-semibold text-white">{big}<Fn n={fn as number} /></div>
              <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Flowing sections */}
        <h2 className="font-heading text-lg font-semibold text-white mb-3">Political Career</h2>
        <p className="text-[15px] leading-[1.75] mb-8">
          Sanwo-Olu entered government in 2005 as Commissioner for Establishments &amp;
          Training, then Commerce &amp; Industry (2007–2011)<Fn n={4} />. After running the
          Lagos State Development &amp; Property Corporation (2016–2018), he unseated an
          incumbent in the 2018 APC primary<Fn n={3} /> and won the governorship in 2019
          with 739,445 votes — 73.6% of the vote<Fn n={1} />. He was re-elected in 2023
          with 762,134 votes<Fn n={1} />.
        </p>

        <h2 className="font-heading text-lg font-semibold text-white mb-3">Before Politics</h2>
        <p className="text-[15px] leading-[1.75] mb-8">
          He earned a B.Sc. in Surveying from the University of Lagos in 1988<Fn n={2} />,
          followed by an MBA in 1994<Fn n={2} />. His banking career ran through Lead
          Merchant Bank as Treasurer (1994–1997) and First Inland Bank as Deputy General
          Manager (1997–2003)<Fn n={3} />.
        </p>

        <h2 className="font-heading text-lg font-semibold text-white mb-3">Family</h2>
        <p className="text-[15px] leading-[1.75] mb-8">
          He is married to Dr. Ibijoke Sanwo-Olu, First Lady of Lagos State<Fn n={4} />,
          and they have three children (names withheld).
        </p>

        {/* Legal — red register */}
        <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.05] p-6 mb-10">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-red-400 mb-3">Legal &amp; Integrity</h2>
          <p className="text-[15px] leading-[1.75] text-slate-300">
            Sanwo-Olu&apos;s administration was the subject of the Lagos Judicial Panel of
            Inquiry over the 2020 Lekki Toll Gate incident<Fn n={5} />. The panel concluded
            in 2021; he was a named party in proceedings.
            <a href="#" className="font-mono text-[11px] text-red-400 ml-2 hover:underline">View case →</a>
          </p>
        </div>

        {/* Sources */}
        <section id="sources" className="border-t border-white/10 pt-8">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 mb-5">Sources</h2>
          <ol className="space-y-4">
            {SOURCES.map((s) => (
              <li key={s.n} className="flex gap-4">
                <span className="font-mono text-[12px] text-emerald-400 w-4 shrink-0">{s.n}</span>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-[12px] text-white">{s.publisher}</span>
                    <span className={`font-mono text-[9px] uppercase px-1.5 py-px rounded border ${
                      s.tier === "canonical" ? "text-emerald-400 border-emerald-400/40" :
                      s.tier === "official" ? "text-amber-400 border-amber-400/30" :
                      "text-slate-400 border-slate-400/30"
                    }`}>{s.tier}</span>
                    <a href="#" className="font-mono text-[10px] text-emerald-400 hover:underline">link ↗</a>
                    {s.archived
                      ? <a href="#" className="font-mono text-[10px] text-slate-400 hover:underline">archived copy</a>
                      : <span className="font-mono text-[10px] text-amber-400">original removed — archive only</span>}
                  </div>
                  <p className="text-[13px] italic text-slate-400 mt-1">&ldquo;{s.snippet}&rdquo;</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
