"use client";

/**
 * Variant B — "Dossier"
 * Two-column: sticky left TOC rail with counts/ticks, wider right reading column.
 * Docs-site wayfinding for a civic record.
 */

import { useState } from "react";
import {
  OFFICIAL, POSITIONS, ELECTIONS, EDUCATION, BUSINESS, PARTY_HISTORY, ASSETS, AWARDS, FAMILY, LEGAL, SECTION_IDS,
  ConfidenceBadge, ResultBadge, SourcesLink, ProvChip, Avatar, CompletenessBar, type MockEntry,
} from "./shared";

function Block({ id, label, red, children }: { id: string; label: string; red?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-8">
      <h2 className={`font-mono text-[11px] font-medium uppercase tracking-[0.08em] pb-2 mb-3 border-b ${red ? "text-red-400 border-red-500/30" : "text-emerald-400 border-white/10"}`}>
        {label}
      </h2>
      {children}
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

export function VariantB() {
  const [active, setActive] = useState("career");

  return (
    <div className="min-h-screen bg-[oklch(0.10_0.005_160)] text-slate-300 font-sans">
      <div className="max-w-[1060px] mx-auto px-6 py-12 flex gap-12">
        {/* Sticky TOC rail */}
        <aside className="w-[230px] shrink-0 hidden md:block">
          <div className="sticky top-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500 mb-3">On this record</div>
            <nav className="flex flex-col">
              {SECTION_IDS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setActive(s.id)}
                  className={`flex items-center justify-between py-2 pl-3 border-l-2 text-[13px] transition-colors ${
                    active === s.id
                      ? "border-emerald-400 text-white bg-emerald-400/5"
                      : s.red
                        ? "border-transparent text-red-400/80 hover:border-red-500/40"
                        : "border-transparent text-slate-400 hover:border-white/20 hover:text-slate-200"
                  }`}
                >
                  <span>{s.label}</span>
                  <span className={`font-mono text-[10px] ${s.count ? (s.red ? "text-red-400" : "text-emerald-400") : "text-slate-600"}`}>
                    {s.count ? `${s.count} ✓` : "—"}
                  </span>
                </a>
              ))}
            </nav>
            <div className="mt-6 pt-4 border-t border-white/5">
              <CompletenessBar />
            </div>
          </div>
        </aside>

        {/* Reading column */}
        <main className="flex-1 min-w-0 max-w-[740px]">
          <div className="flex gap-6 mb-2">
            <Avatar />
            <div className="flex-1">
              <div className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-emerald-400 mb-1">
                {OFFICIAL.role} · {OFFICIAL.party}
              </div>
              <h1 className="font-serif text-[34px] text-white leading-[1.1]">{OFFICIAL.name}</h1>
              <p className="text-[13px] text-slate-400">{OFFICIAL.state} · {OFFICIAL.since}</p>
            </div>
          </div>

          <Block id="career" label="Political Career">
            {POSITIONS.map((p) => <Entry key={p.title} e={p} />)}
          </Block>

          <Block id="elections" label="Elections Contested">
            {ELECTIONS.map((e) => (
              <div key={e.title} className="py-3.5 border-b border-white/5 last:border-0 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[15px] font-medium text-white">{e.title}</div>
                  <div className="flex items-center gap-2.5 mt-1">
                    <span className="font-mono text-[11px] text-slate-500">{e.detail}</span>
                    <SourcesLink n={e.sources} />
                  </div>
                </div>
                <ResultBadge result={e.result} />
              </div>
            ))}
          </Block>

          <Block id="education" label="Education">
            {EDUCATION.map((e) => <Entry key={e.title} e={e} />)}
          </Block>

          <Block id="business" label="Career Before Politics">
            {BUSINESS.map((e) => <Entry key={e.title} e={e} />)}
          </Block>

          <Block id="party" label="Party History">
            {PARTY_HISTORY.map((e) => <Entry key={e.title} e={e} />)}
          </Block>

          <Block id="assets" label="Asset Declarations">
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
          </Block>

          <Block id="awards" label="Awards & Honours">
            {AWARDS.map((e) => <Entry key={e.title} e={e} />)}
          </Block>

          <Block id="family" label="Family">
            {FAMILY.map((f) => (
              <div key={f.relationship} className="py-3.5 border-b border-white/5 last:border-0">
                <div className="text-[15px] font-medium text-white flex items-center gap-2">
                  {f.name}
                  {f.publicFigure && <span className="font-mono text-[10px] uppercase px-2 py-px rounded-full border bg-amber-400/10 text-amber-400 border-amber-400/30">Public figure</span>}
                </div>
                <div className="flex items-center gap-2.5 mt-1.5">
                  <span className="font-mono text-[11px] text-slate-500">{f.relationship}</span>
                  {f.note && <span className="font-mono text-[10px] text-slate-500">{f.note}</span>}
                  <SourcesLink n={f.sources} />
                </div>
              </div>
            ))}
          </Block>

          <Block id="legal" label="Legal & Integrity" red>
            {LEGAL.map((l) => (
              <div key={l.title} className="py-3.5 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 mt-1">
                <div className="text-[15px] font-medium text-white">{l.title}</div>
                <div className="text-[13px] text-slate-400">{l.sub}</div>
                <div className="flex items-center gap-2.5 mt-1.5">
                  <span className="inline-flex font-mono text-[10px] font-semibold uppercase px-2 py-px rounded-full border bg-red-500/10 text-red-400 border-red-500/40">{l.status}</span>
                  <span className="font-mono text-[11px] text-slate-500">{l.dates}</span>
                  <SourcesLink n={2} red />
                </div>
              </div>
            ))}
          </Block>
        </main>
      </div>
    </div>
  );
}
