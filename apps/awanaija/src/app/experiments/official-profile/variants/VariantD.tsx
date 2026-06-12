"use client";

/**
 * Variant D — "Stat Dashboard"
 * Overview band of summary stat cards that anchor-link into full sections below.
 * Scan first, read second.
 */

import {
  OFFICIAL, POSITIONS, ELECTIONS, EDUCATION, BUSINESS, PARTY_HISTORY, ASSETS, FAMILY, LEGAL,
  ConfidenceBadge, ResultBadge, SourcesLink, ProvChip, Avatar, CompletenessBar, type MockEntry,
} from "./shared";

const STATS = [
  { id: "elections", big: "4", label: "ELECTIONS · 3 WON" },
  { id: "career", big: "26", label: "YRS IN POLITICS" },
  { id: "party", big: "1", label: "PARTY · APC" },
  { id: "assets", big: "₦2.4B", label: "DECLARED ASSETS" },
  { id: "education", big: "3", label: "EDUCATION RECORDS" },
  { id: "legal", big: "1", label: "LEGAL CASE", red: true },
];

function Section({ id, label, red, children }: { id: string; label: string; red?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-9 scroll-mt-8">
      <div className={`border-l-[3px] pl-5 ${red ? "border-red-500" : "border-emerald-400"}`}>
        <div className={`font-mono text-[11px] font-medium uppercase tracking-[0.08em] mb-2.5 ${red ? "text-red-400" : "text-emerald-400"}`}>{label}</div>
        {children}
      </div>
    </section>
  );
}

function Entry({ e }: { e: MockEntry }) {
  return (
    <div className="py-3.5 border-b border-white/5 last:border-0">
      <div className="text-[15px] font-medium text-white">{e.title}</div>
      {e.sub && <div className="text-[13px] text-slate-400">{e.sub}</div>}
      <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
        <span className="font-mono text-[11px] text-slate-500">{e.dates}</span>
        <ConfidenceBadge level={e.confidence} />
        <SourcesLink n={e.sources} />
        <ProvChip p={e.provenance} />
      </div>
    </div>
  );
}

export function VariantD() {
  return (
    <div className="min-h-screen bg-[oklch(0.10_0.005_160)] text-slate-300 font-sans">
      <div className="max-w-[860px] mx-auto px-6 pt-12 pb-16">
        {/* Hero */}
        <div className="flex gap-6 mb-8">
          <Avatar />
          <div className="flex-1">
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-emerald-400 mb-1">
              {OFFICIAL.role} · {OFFICIAL.party}
            </div>
            <h1 className="font-serif text-[32px] text-white leading-[1.1]">{OFFICIAL.name}</h1>
            <p className="text-[13px] text-slate-400">{OFFICIAL.state} · {OFFICIAL.since}</p>
            <div className="mt-3.5"><CompletenessBar /></div>
          </div>
        </div>

        {/* Stat band */}
        <div className="grid grid-cols-3 gap-3 mb-4 max-[640px]:grid-cols-2">
          {STATS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`group rounded-xl border p-4 transition-colors ${
                s.red
                  ? "border-red-500/25 bg-red-500/[0.05] hover:border-red-500/50"
                  : "border-white/8 bg-white/[0.03] hover:border-emerald-400/40"
              }`}
            >
              <div className={`font-mono text-[26px] font-semibold leading-none ${s.red ? "text-red-400" : "text-white"}`}>{s.big}</div>
              <div className="flex items-center justify-between mt-2">
                <span className={`font-mono text-[10px] uppercase tracking-[0.08em] ${s.red ? "text-red-400/80" : "text-slate-500"}`}>{s.label}</span>
                <span className={`text-[12px] transition-transform group-hover:translate-y-0.5 ${s.red ? "text-red-400" : "text-emerald-400"}`}>↓</span>
              </div>
            </a>
          ))}
        </div>

        {/* Detail sections */}
        <Section id="career" label="Political Career">
          {POSITIONS.map((p) => <Entry key={p.title} e={p} />)}
        </Section>

        <Section id="elections" label="Elections Contested">
          {ELECTIONS.map((e) => (
            <div key={e.title} className="py-3.5 border-b border-white/5 last:border-0">
              <div className="text-[15px] font-medium text-white">{e.title}</div>
              <div className="flex items-center gap-2.5 mt-1.5">
                <ResultBadge result={e.result} />
                <span className="font-mono text-[11px] text-slate-500">{e.detail}</span>
                <SourcesLink n={e.sources} />
              </div>
            </div>
          ))}
        </Section>

        <Section id="education" label="Education">
          {EDUCATION.map((e) => <Entry key={e.title} e={e} />)}
        </Section>

        <Section id="business" label="Career Before Politics">
          {BUSINESS.map((e) => <Entry key={e.title} e={e} />)}
        </Section>

        <Section id="party" label="Party History">
          {PARTY_HISTORY.map((e) => <Entry key={e.title} e={e} />)}
        </Section>

        <Section id="assets" label="Asset Declarations">
          {ASSETS.map((a) => (
            <div key={a.label} className="py-3.5">
              <div className="font-mono text-lg text-white">{a.amount} <span className="text-xs text-slate-500">declared</span></div>
              <div className="flex items-center gap-2.5 mt-1.5">
                <span className="font-mono text-[11px] text-slate-500">{a.label}</span>
                <ConfidenceBadge level={a.confidence} />
                <SourcesLink n={a.sources} />
              </div>
            </div>
          ))}
        </Section>

        <Section id="family" label="Family">
          {FAMILY.map((f) => (
            <div key={f.relationship} className="py-3.5 border-b border-white/5 last:border-0">
              <div className="text-[15px] font-medium text-white flex items-center gap-2">
                {f.name}
                {f.publicFigure && <span className="font-mono text-[10px] uppercase px-2 py-px rounded-full border bg-amber-400/10 text-amber-400 border-amber-400/30">Public figure</span>}
              </div>
              <div className="flex items-center gap-2.5 mt-1.5">
                <span className="font-mono text-[11px] text-slate-500">{f.relationship}</span>
                <SourcesLink n={f.sources} />
              </div>
            </div>
          ))}
        </Section>

        <Section id="legal" label="Legal & Integrity" red>
          {LEGAL.map((l) => (
            <div key={l.title} className="py-3.5">
              <div className="text-[15px] font-medium text-white">{l.title}</div>
              <div className="text-[13px] text-slate-400">{l.sub}</div>
              <div className="flex items-center gap-2.5 mt-1.5">
                <span className="inline-flex font-mono text-[10px] font-semibold uppercase px-2 py-px rounded-full border bg-red-500/10 text-red-400 border-red-500/40">{l.status}</span>
                <span className="font-mono text-[11px] text-slate-500">{l.dates}</span>
                <SourcesLink n={2} red />
              </div>
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
}
