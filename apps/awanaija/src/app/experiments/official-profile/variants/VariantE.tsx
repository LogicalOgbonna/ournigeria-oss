"use client";

/**
 * Variant E — "Open Ledger"
 * Every section an open-by-default collapsible group + compact index strip.
 * All content in DOM (SEO-safe); users collapse what they don't care about.
 */

import { useState } from "react";
import {
  OFFICIAL, POSITIONS, ELECTIONS, EDUCATION, BUSINESS, PARTY_HISTORY, ASSETS, AWARDS, FAMILY, LEGAL,
  ConfidenceBadge, ResultBadge, SourcesLink, ProvChip, Avatar, CompletenessBar, type MockEntry,
} from "./shared";

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

function Group({
  id, label, count, red, defaultOpen = true, children,
}: {
  id: string; label: string; count: number | string; red?: boolean; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section id={id} className="border-b border-white/5 scroll-mt-8">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="flex items-center gap-3">
          <span className={`font-mono text-[11px] font-medium uppercase tracking-[0.08em] ${red ? "text-red-400" : "text-emerald-400"}`}>{label}</span>
          <span className={`font-mono text-[10px] px-2 py-px rounded-full border ${red ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-white/5 text-slate-400 border-white/10"}`}>{count}</span>
        </span>
        <span className={`text-slate-500 text-xs transition-transform ${open ? "" : "-rotate-90"}`}>▼</span>
      </button>
      {/* content stays in DOM when collapsed — hidden visually only (SEO) */}
      <div className={open ? "pb-4" : "hidden"}>{children}</div>
    </section>
  );
}

export function VariantE() {
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

        {/* Index strip */}
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-slate-500 pb-4 mb-2 border-b border-white/10 flex flex-wrap gap-x-1.5 gap-y-1">
          <a href="#career" className="hover:text-emerald-400">CAREER {POSITIONS.length}</a><span>·</span>
          <a href="#elections" className="hover:text-emerald-400">ELECTIONS {ELECTIONS.length}</a><span>·</span>
          <a href="#education" className="hover:text-emerald-400">EDUCATION {EDUCATION.length}</a><span>·</span>
          <a href="#business" className="hover:text-emerald-400">BUSINESS {BUSINESS.length}</a><span>·</span>
          <a href="#party" className="hover:text-emerald-400">PARTY {PARTY_HISTORY.length}</a><span>·</span>
          <a href="#assets" className="hover:text-emerald-400">ASSETS {ASSETS.length}</a><span>·</span>
          <a href="#awards" className="hover:text-emerald-400">AWARDS {AWARDS.length}</a><span>·</span>
          <a href="#family" className="hover:text-emerald-400">FAMILY {FAMILY.length}</a><span>·</span>
          <a href="#legal" className="text-red-400/80 hover:text-red-400">LEGAL {LEGAL.length}</a>
        </div>

        <Group id="career" label="Political Career" count={POSITIONS.length}>
          {POSITIONS.map((p) => <Entry key={p.title} e={p} />)}
        </Group>

        <Group id="elections" label="Elections Contested" count={ELECTIONS.length}>
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
        </Group>

        <Group id="education" label="Education" count={EDUCATION.length}>
          {EDUCATION.map((e) => <Entry key={e.title} e={e} />)}
        </Group>

        <Group id="business" label="Career Before Politics" count={BUSINESS.length}>
          {BUSINESS.map((e) => <Entry key={e.title} e={e} />)}
        </Group>

        <Group id="party" label="Party History" count={PARTY_HISTORY.length}>
          {PARTY_HISTORY.map((e) => <Entry key={e.title} e={e} />)}
        </Group>

        <Group id="assets" label="Asset Declarations" count={ASSETS.length}>
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
        </Group>

        {/* shown collapsed by default to demo the affordance */}
        <Group id="awards" label="Awards & Honours" count={AWARDS.length} defaultOpen={false}>
          {AWARDS.map((e) => <Entry key={e.title} e={e} />)}
        </Group>

        <Group id="family" label="Family" count={FAMILY.length}>
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
        </Group>

        <Group id="legal" label="Legal & Integrity" count={LEGAL.length} red>
          {LEGAL.map((l) => (
            <div key={l.title} className="py-3.5 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4">
              <div className="text-[15px] font-medium text-white">{l.title}</div>
              <div className="text-[13px] text-slate-400">{l.sub}</div>
              <div className="flex items-center gap-2.5 mt-1.5">
                <span className="inline-flex font-mono text-[10px] font-semibold uppercase px-2 py-px rounded-full border bg-red-500/10 text-red-400 border-red-500/40">{l.status}</span>
                <span className="font-mono text-[11px] text-slate-500">{l.dates}</span>
                <SourcesLink n={2} red />
              </div>
            </div>
          ))}
        </Group>
      </div>
    </div>
  );
}
