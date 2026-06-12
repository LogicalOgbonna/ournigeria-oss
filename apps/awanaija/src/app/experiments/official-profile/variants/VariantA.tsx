"use client";

/**
 * Variant A — "Jump-Nav Scroll"
 * Single 672px column (today's page), sticky horizontal chip-nav under the hero.
 * All sections in DOM. Closest to the existing OfficialProfile.
 */

import { useState } from "react";
import {
  OFFICIAL, POSITIONS, ELECTIONS, EDUCATION, BUSINESS, PARTY_HISTORY, ASSETS, AWARDS, FAMILY, LEGAL, SECTION_IDS,
  ConfidenceBadge, ResultBadge, SourcesLink, ProvChip, Avatar, CompletenessBar, type MockEntry,
} from "./shared";

function Section({ id, label, count, red, children }: { id: string; label: string; count?: number | string; red?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-9 scroll-mt-16">
      <div className={`border-l-[3px] pl-5 ${red ? "border-red-500" : "border-emerald-400"}`}>
        <div className="flex items-baseline justify-between mb-2.5">
          <span className={`font-mono text-[11px] font-medium uppercase tracking-[0.08em] ${red ? "text-red-400" : "text-emerald-400"}`}>{label}</span>
          {count !== undefined && <span className="font-mono text-[11px] text-slate-500">{count}</span>}
        </div>
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

export function VariantA() {
  const [active, setActive] = useState("career");

  return (
    <div className="min-h-screen bg-[oklch(0.10_0.005_160)] text-slate-300 font-sans">
      <div className="max-w-[672px] mx-auto px-6 pt-12 pb-16">
        {/* Hero */}
        <div className="flex gap-6 mb-6">
          <Avatar />
          <div className="flex-1">
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-emerald-400 mb-1">
              {OFFICIAL.role} · {OFFICIAL.party}
            </div>
            <h1 className="font-serif text-[30px] text-white leading-[1.1]">{OFFICIAL.name}</h1>
            <p className="text-[13px] text-slate-400">{OFFICIAL.state} · {OFFICIAL.since}</p>
            <div className="mt-3.5"><CompletenessBar /></div>
          </div>
        </div>

        {/* Sticky chip jump-nav */}
        <nav className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-[oklch(0.10_0.005_160)]/90 backdrop-blur border-b border-white/5 flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {SECTION_IDS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setActive(s.id)}
              className={`font-mono text-[11px] uppercase tracking-[0.05em] px-3 py-1.5 rounded-full whitespace-nowrap border transition-colors ${
                active === s.id
                  ? "bg-emerald-400 text-emerald-950 border-emerald-400 font-semibold"
                  : s.red
                    ? "border-red-500/40 text-red-400"
                    : "border-white/10 text-slate-400 hover:border-emerald-400/40"
              }`}
            >
              {s.label}
            </a>
          ))}
        </nav>

        <Section id="career" label="Political Career" count={`${POSITIONS.length} positions`}>
          <div className="relative pl-[18px] before:content-[''] before:absolute before:left-1 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
            {POSITIONS.map((p) => (
              <div key={p.title} className="relative before:content-[''] before:absolute before:-left-[18px] before:top-[22px] before:w-[9px] before:h-[9px] before:rounded-full before:border-2 before:border-emerald-400 before:bg-[oklch(0.10_0.005_160)] [&:not(:first-child)]:before:border-slate-500">
                <Entry e={p} />
              </div>
            ))}
          </div>
        </Section>

        <Section id="elections" label="Elections Contested" count={`${ELECTIONS.length} contests`}>
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

        <Section id="education" label="Education" count={`${EDUCATION.length} records`}>
          {EDUCATION.map((e) => <Entry key={e.title} e={e} />)}
        </Section>

        <Section id="business" label="Career Before Politics" count={`${BUSINESS.length} roles`}>
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

        <Section id="awards" label="Awards & Honours">
          {AWARDS.map((e) => <Entry key={e.title} e={e} />)}
        </Section>

        <Section id="family" label="Family" count={`${FAMILY.length} members`}>
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
        </Section>

        <Section id="legal" label="Legal & Integrity" count={`${LEGAL.length} case`} red>
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
