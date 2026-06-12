"use client";

/**
 * Variant C — "Timeline Spine"
 * One unified chronological life-timeline (education + business + politics + elections
 * interleaved, category-colored markers). Reference sections below.
 */

import {
  OFFICIAL, ASSETS, AWARDS, FAMILY,
  ConfidenceBadge, SourcesLink, Avatar, CompletenessBar, type Confidence,
} from "./shared";

interface Node {
  year: string;
  category: "education" | "business" | "politics" | "election" | "party" | "legal";
  title: string;
  sub?: string;
  badge?: { text: string; tone: "won" | "lost" | "red" | "gold" };
  confidence: Confidence;
  sources: number;
}

const NODES: Node[] = [
  { year: "2023", category: "election", title: "Lagos Governorship", sub: "762,134 votes · 45.6%", badge: { text: "WON", tone: "won" }, confidence: "high", sources: 3 },
  { year: "2020", category: "legal", title: "EndSARS Panel — Lekki Toll Gate Inquiry", sub: "Judicial panel of inquiry · named party", badge: { text: "CONCLUDED", tone: "red" }, confidence: "high", sources: 2 },
  { year: "2019", category: "politics", title: "Governor, Lagos State", sub: "All Progressives Congress", confidence: "high", sources: 4 },
  { year: "2019", category: "election", title: "Lagos Governorship", sub: "739,445 votes · 73.6%", badge: { text: "WON", tone: "won" }, confidence: "high", sources: 3 },
  { year: "2018", category: "election", title: "APC Governorship Primary", sub: "def. A. Ambode", badge: { text: "WON", tone: "won" }, confidence: "high", sources: 2 },
  { year: "2016", category: "politics", title: "MD, Lagos State Development & Property Corp.", confidence: "high", sources: 2 },
  { year: "2014", category: "party", title: "Joined All Progressives Congress", badge: { text: "PARTY", tone: "gold" }, confidence: "high", sources: 2 },
  { year: "2007", category: "politics", title: "Commissioner for Commerce & Industry", sub: "Lagos State Executive Council", confidence: "medium", sources: 1 },
  { year: "2003", category: "election", title: "Lagos East Senatorial Primary", badge: { text: "LOST", tone: "lost" }, confidence: "medium", sources: 1 },
  { year: "1997", category: "business", title: "Deputy General Manager — First Inland Bank", sub: "Banking", confidence: "high", sources: 2 },
  { year: "1994", category: "education", title: "MBA, University of Lagos", confidence: "high", sources: 2 },
  { year: "1994", category: "business", title: "Treasurer — Lead Merchant Bank", sub: "Banking", confidence: "medium", sources: 1 },
  { year: "1988", category: "education", title: "B.Sc. Surveying, University of Lagos", confidence: "high", sources: 3 },
];

const CAT_COLOR: Record<Node["category"], string> = {
  education: "border-cyan-400",
  business: "border-amber-400",
  politics: "border-emerald-400",
  election: "border-emerald-400",
  party: "border-yellow-400",
  legal: "border-red-500",
};

const LEGEND = [
  { label: "Education", cls: "bg-cyan-400" },
  { label: "Business", cls: "bg-amber-400" },
  { label: "Politics & Elections", cls: "bg-emerald-400" },
  { label: "Party", cls: "bg-yellow-400" },
  { label: "Legal", cls: "bg-red-500" },
];

function NodeBadge({ badge }: { badge: NonNullable<Node["badge"]> }) {
  const tones = {
    won: "bg-emerald-400/10 text-emerald-400 border-emerald-400/40",
    lost: "bg-slate-400/10 text-slate-400 border-slate-400/30",
    red: "bg-red-500/10 text-red-400 border-red-500/40",
    gold: "bg-amber-400/10 text-amber-400 border-amber-400/30",
  };
  return (
    <span className={`inline-flex font-mono text-[10px] font-semibold uppercase tracking-[0.06em] px-2 py-px rounded-full border ${tones[badge.tone]}`}>
      {badge.text}
    </span>
  );
}

export function VariantC() {
  return (
    <div className="min-h-screen bg-[oklch(0.10_0.005_160)] text-slate-300 font-sans">
      <div className="max-w-[720px] mx-auto px-6 pt-12 pb-16">
        {/* Compact hero */}
        <div className="flex gap-5 items-center mb-6">
          <Avatar size={88} />
          <div className="flex-1">
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-emerald-400 mb-0.5">
              {OFFICIAL.role} · {OFFICIAL.party} · {OFFICIAL.state}
            </div>
            <h1 className="font-serif text-[30px] text-white leading-[1.1]">{OFFICIAL.name}</h1>
            <div className="mt-2.5"><CompletenessBar /></div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-8 pb-4 border-b border-white/5">
          {LEGEND.map((l) => (
            <span key={l.label} className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.05em] text-slate-400">
              <span className={`w-2 h-2 rounded-full ${l.cls}`} /> {l.label}
            </span>
          ))}
        </div>

        {/* The spine */}
        <div className="relative pl-24 before:content-[''] before:absolute before:left-[72px] before:top-2 before:bottom-2 before:w-px before:bg-white/10">
          {NODES.map((n, i) => (
            <div key={i} className="relative pb-7">
              <span className="absolute -left-24 top-1 w-14 text-right font-mono text-[12px] text-slate-500">{n.year}</span>
              <span className={`absolute -left-[29px] top-[7px] w-[11px] h-[11px] rounded-full border-2 bg-[oklch(0.10_0.005_160)] ${CAT_COLOR[n.category]}`} />
              <div className={n.category === "legal" ? "rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-3 -mt-2" : ""}>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[15px] font-medium text-white">{n.title}</span>
                  {n.badge && <NodeBadge badge={n.badge} />}
                </div>
                {n.sub && <div className="text-[13px] text-slate-400 mt-0.5">{n.sub}</div>}
                <div className="flex items-center gap-2.5 mt-1.5">
                  <ConfidenceBadge level={n.confidence} />
                  <SourcesLink n={n.sources} red={n.category === "legal"} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reference grid below */}
        <div className="grid grid-cols-2 gap-4 mt-10 max-[560px]:grid-cols-1">
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-emerald-400 mb-3">Asset Declarations</div>
            {ASSETS.map((a) => (
              <div key={a.label}>
                <div className="font-mono text-lg text-white">{a.amount}</div>
                <div className="flex items-center gap-2 mt-1"><span className="font-mono text-[11px] text-slate-500">{a.label}</span><SourcesLink n={a.sources} /></div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-emerald-400 mb-3">Awards</div>
            {AWARDS.map((a) => (
              <div key={a.title}>
                <div className="text-[14px] text-white">{a.title}</div>
                <div className="flex items-center gap-2 mt-1"><span className="font-mono text-[11px] text-slate-500">{a.dates}</span><SourcesLink n={a.sources} /></div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-5 col-span-2 max-[560px]:col-span-1">
            <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-emerald-400 mb-3">Family</div>
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              {FAMILY.map((f) => (
                <div key={f.relationship}>
                  <span className="text-[14px] text-white">{f.name}</span>
                  <span className="font-mono text-[10px] uppercase text-slate-500 ml-2">{f.relationship}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
