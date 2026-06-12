"use client";

/**
 * Variant G — "Civic Record Card"
 * Official-gazette aesthetic: dense mono-heavy data tables, prominent verification
 * stamps, slim right-edge jump rail. Authority through density.
 */

import { OFFICIAL, Avatar } from "./shared";

function Stamp({ kind }: { kind: "verified" | "unreviewed" | "low" }) {
  const map = {
    verified: ["VERIFIED ✓", "text-emerald-400 border-emerald-400/40 bg-emerald-400/5"],
    unreviewed: ["UNREVIEWED", "text-slate-400 border-slate-400/30 bg-slate-400/5"],
    low: ["LOW CONF", "text-amber-400 border-amber-400/30 bg-amber-400/5"],
  } as const;
  const [text, cls] = map[kind];
  return <span className={`inline-flex font-mono text-[9px] font-semibold tracking-[0.08em] px-1.5 py-px border rounded ${cls}`}>{text}</span>;
}

function Src({ n }: { n: number }) {
  return n > 0 ? <a href="#" className="font-mono text-[10px] text-emerald-400 hover:underline whitespace-nowrap">src: {n}</a> : <span className="font-mono text-[10px] text-slate-600">—</span>;
}

function Table({ id, title, head, red, children }: { id: string; title: string; head: string[]; red?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-9 scroll-mt-8">
      <div className={`font-mono text-[11px] font-semibold uppercase tracking-[0.1em] pb-2 mb-0 border-b-2 ${red ? "text-red-400 border-red-500/60" : "text-emerald-400 border-emerald-400/50"}`}>
        {title}
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="text-left font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-slate-500 py-2 pr-4 border-b border-white/10">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:py-2.5 [&_td]:pr-4 [&_td]:border-b [&_td]:border-white/5 [&_td]:text-[13px] [&_td]:align-top">
          {children}
        </tbody>
      </table>
    </section>
  );
}

const RAIL = ["career", "elections", "education", "business", "assets", "family", "legal"];

export function VariantG() {
  return (
    <div className="min-h-screen bg-[oklch(0.10_0.005_160)] text-slate-300 font-sans relative">
      {/* right-edge jump rail */}
      <nav className="fixed right-3 top-1/2 -translate-y-1/2 z-10 hidden lg:flex flex-col gap-2.5">
        {RAIL.map((id) => (
          <a key={id} href={`#${id}`} title={id}
            className={`w-2 h-2 rounded-full border transition-colors ${id === "legal" ? "border-red-500/60 hover:bg-red-500" : "border-emerald-400/50 hover:bg-emerald-400"}`} />
        ))}
      </nav>

      <div className="max-w-[840px] mx-auto px-6 pt-12 pb-16">
        {/* Record header */}
        <div className="border border-white/10 rounded-xl p-5 mb-10 flex gap-6 bg-white/[0.02]">
          <Avatar size={96} />
          <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-2 max-[560px]:grid-cols-1">
            <div className="col-span-2 max-[560px]:col-span-1">
              <h1 className="font-serif text-[28px] text-white leading-tight">{OFFICIAL.name}</h1>
            </div>
            {[
              ["RECORD NO", "LG-0001"],
              ["TYPE", "ELECTED OFFICIAL"],
              ["CURRENT OFFICE", "GOVERNOR · LAGOS STATE"],
              ["STATUS", "IN OFFICE"],
              ["PARTY", "APC (SINCE 2014)"],
              ["COMPLETENESS", "78%"],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 items-baseline">
                <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-slate-500 w-28 shrink-0">{k}</span>
                <span className={`font-mono text-[12px] ${k === "STATUS" || k === "COMPLETENESS" ? "text-emerald-400" : "text-white"}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <Table id="career" title="§1 · Political Career" head={["Term", "Office", "Party", "Status", "Verification", ""]}>
          <tr>
            <td className="font-mono text-slate-400">2019–</td>
            <td className="text-white">Governor, Lagos State</td>
            <td className="font-mono">APC</td>
            <td className="font-mono text-emerald-400">ACTIVE</td>
            <td><Stamp kind="verified" /></td>
            <td><Src n={4} /></td>
          </tr>
          <tr>
            <td className="font-mono text-slate-400">2016–18</td>
            <td className="text-white">MD, LSDPC</td>
            <td className="font-mono">—</td>
            <td className="font-mono text-slate-500">ENDED</td>
            <td><Stamp kind="verified" /></td>
            <td><Src n={2} /></td>
          </tr>
          <tr>
            <td className="font-mono text-slate-400">2007–11</td>
            <td className="text-white">Commissioner, Commerce &amp; Industry</td>
            <td className="font-mono">AC</td>
            <td className="font-mono text-slate-500">ENDED</td>
            <td><Stamp kind="unreviewed" /></td>
            <td><Src n={1} /></td>
          </tr>
        </Table>

        <Table id="elections" title="§2 · Elections Contested" head={["Year", "Office", "Party", "Result", "Votes", "Verification", ""]}>
          <tr>
            <td className="font-mono text-slate-400">2023</td>
            <td className="text-white">Governor, Lagos</td>
            <td className="font-mono">APC</td>
            <td className="font-mono text-emerald-400 font-semibold">WON</td>
            <td className="font-mono">762,134</td>
            <td><Stamp kind="verified" /></td>
            <td><Src n={3} /></td>
          </tr>
          <tr>
            <td className="font-mono text-slate-400">2019</td>
            <td className="text-white">Governor, Lagos</td>
            <td className="font-mono">APC</td>
            <td className="font-mono text-emerald-400 font-semibold">WON</td>
            <td className="font-mono">739,445</td>
            <td><Stamp kind="verified" /></td>
            <td><Src n={3} /></td>
          </tr>
          <tr>
            <td className="font-mono text-slate-400">2018</td>
            <td className="text-white">APC Primary (Gov.)</td>
            <td className="font-mono">APC</td>
            <td className="font-mono text-emerald-400 font-semibold">WON</td>
            <td className="font-mono">—</td>
            <td><Stamp kind="verified" /></td>
            <td><Src n={2} /></td>
          </tr>
          <tr>
            <td className="font-mono text-slate-400">2003</td>
            <td className="text-white">Senatorial Primary</td>
            <td className="font-mono">—</td>
            <td className="font-mono text-slate-400 font-semibold">LOST</td>
            <td className="font-mono">—</td>
            <td><Stamp kind="low" /></td>
            <td><Src n={1} /></td>
          </tr>
        </Table>

        <Table id="education" title="§3 · Education" head={["Year", "Institution", "Qualification", "Verification", ""]}>
          <tr>
            <td className="font-mono text-slate-400">1988</td>
            <td className="text-white">University of Lagos</td>
            <td>B.Sc. Surveying</td>
            <td><Stamp kind="verified" /></td>
            <td><Src n={3} /></td>
          </tr>
          <tr>
            <td className="font-mono text-slate-400">1994</td>
            <td className="text-white">University of Lagos</td>
            <td>MBA</td>
            <td><Stamp kind="verified" /></td>
            <td><Src n={2} /></td>
          </tr>
          <tr>
            <td className="font-mono text-slate-400">2004</td>
            <td className="text-white">London Business School</td>
            <td>Exec. Programme</td>
            <td><Stamp kind="unreviewed" /></td>
            <td><Src n={1} /></td>
          </tr>
        </Table>

        <Table id="business" title="§4 · Career Before Politics" head={["Period", "Organisation", "Role", "Verification", ""]}>
          <tr>
            <td className="font-mono text-slate-400">1997–03</td>
            <td className="text-white">First Inland Bank</td>
            <td>Deputy General Manager</td>
            <td><Stamp kind="verified" /></td>
            <td><Src n={2} /></td>
          </tr>
          <tr>
            <td className="font-mono text-slate-400">1994–97</td>
            <td className="text-white">Lead Merchant Bank</td>
            <td>Treasurer</td>
            <td><Stamp kind="unreviewed" /></td>
            <td><Src n={1} /></td>
          </tr>
        </Table>

        <Table id="assets" title="§5 · Asset Declarations" head={["Year", "Declared To", "Amount", "Verification", ""]}>
          <tr>
            <td className="font-mono text-slate-400">2019</td>
            <td className="text-white">Code of Conduct Bureau</td>
            <td className="font-mono text-white">₦2,400,000,000</td>
            <td><Stamp kind="low" /></td>
            <td><Src n={1} /></td>
          </tr>
        </Table>

        <Table id="family" title="§6 · Family" head={["Relation", "Name", "Note", "Verification", ""]}>
          <tr>
            <td className="font-mono text-slate-400">SPOUSE</td>
            <td className="text-white">Ibijoke Sanwo-Olu</td>
            <td className="font-mono text-[11px] text-amber-400">PUBLIC FIGURE</td>
            <td><Stamp kind="verified" /></td>
            <td><Src n={2} /></td>
          </tr>
          <tr>
            <td className="font-mono text-slate-400">CHILDREN</td>
            <td className="text-white">3 children</td>
            <td className="font-mono text-[11px] text-slate-500">NAMES WITHHELD</td>
            <td><Stamp kind="unreviewed" /></td>
            <td><Src n={0} /></td>
          </tr>
        </Table>

        <Table id="legal" title="§7 · Legal & Integrity" head={["Period", "Matter", "Forum", "Status", "Verification", ""]} red>
          <tr>
            <td className="font-mono text-slate-400">2020–21</td>
            <td className="text-white">Lekki Toll Gate Inquiry — named party</td>
            <td>Judicial Panel</td>
            <td><span className="inline-flex font-mono text-[9px] font-semibold tracking-[0.08em] px-1.5 py-px border rounded text-red-400 border-red-500/40 bg-red-500/5">CONCLUDED</span></td>
            <td><Stamp kind="verified" /></td>
            <td><a href="#" className="font-mono text-[10px] text-red-400 hover:underline whitespace-nowrap">case →</a></td>
          </tr>
        </Table>
      </div>
    </div>
  );
}
