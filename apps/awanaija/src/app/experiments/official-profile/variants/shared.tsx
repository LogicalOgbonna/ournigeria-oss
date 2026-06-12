/**
 * Shared sample data + atoms for the official-profile IA experiment.
 * Mock data only — modeled on the schema designed in the official-profile-data plan
 * (OfficialEducation, OfficialCareer, OfficialElection, Evidence, CorruptionCase…).
 */

export type Confidence = "high" | "medium" | "low";

export interface MockEntry {
  title: string;
  sub?: string;
  dates: string;
  confidence: Confidence;
  sources: number;
  provenance?: "agent" | "citizen" | "admin";
  current?: boolean;
}

export const OFFICIAL = {
  name: "Babajide Sanwo-Olu",
  role: "Governor",
  party: "APC",
  state: "Lagos State",
  since: "In office since May 2019",
  completeness: 78,
  initials: "BS",
};

export const POSITIONS: MockEntry[] = [
  { title: "Governor, Lagos State", sub: "All Progressives Congress · 2nd term", dates: "MAY 2019 – PRESENT", confidence: "high", sources: 4, provenance: "agent", current: true },
  { title: "MD, Lagos State Development & Property Corp.", sub: "Appointed", dates: "2016 – 2018", confidence: "high", sources: 2, provenance: "agent" },
  { title: "Commissioner for Commerce & Industry", sub: "Lagos State Executive Council", dates: "2007 – 2011", confidence: "medium", sources: 1, provenance: "citizen" },
  { title: "Commissioner for Establishments & Training", sub: "Lagos State Executive Council", dates: "2005 – 2007", confidence: "medium", sources: 1, provenance: "citizen" },
];

export const ELECTIONS = [
  { title: "2023 Lagos Governorship", result: "won" as const, detail: "762,134 VOTES · 45.6%", sources: 3 },
  { title: "2019 Lagos Governorship", result: "won" as const, detail: "739,445 VOTES · 73.6%", sources: 3 },
  { title: "2018 APC Governorship Primary", result: "won" as const, detail: "PRIMARY · DEF. A. AMBODE", sources: 2 },
  { title: "2003 Lagos East Senatorial Primary", result: "lost" as const, detail: "PRIMARY", sources: 1 },
];

export const EDUCATION: MockEntry[] = [
  { title: "University of Lagos — B.Sc. Surveying", dates: "1988", confidence: "high", sources: 3, provenance: "agent" },
  { title: "University of Lagos — MBA", dates: "1994", confidence: "high", sources: 2, provenance: "agent" },
  { title: "London Business School — Exec. Programme", dates: "2004", confidence: "medium", sources: 1, provenance: "citizen" },
];

export const BUSINESS: MockEntry[] = [
  { title: "Deputy General Manager — First Inland Bank", sub: "Banking · Employee", dates: "1997 – 2003", confidence: "high", sources: 2 },
  { title: "Treasurer — Lead Merchant Bank", sub: "Banking · Employee", dates: "1994 – 1997", confidence: "medium", sources: 1 },
];

export const PARTY_HISTORY: MockEntry[] = [
  { title: "All Progressives Congress (APC)", dates: "2014 – PRESENT", confidence: "high", sources: 2, current: true },
];

export const ASSETS = [
  { amount: "₦2.4B", label: "CCB FILING · 2019", confidence: "medium" as Confidence, sources: 1 },
];

export const AWARDS: MockEntry[] = [
  { title: "Commander of the Order of the Niger (CON)", dates: "2022", confidence: "high", sources: 2 },
];

export const FAMILY = [
  { name: "Ibijoke Sanwo-Olu", relationship: "SPOUSE", publicFigure: true, sources: 2 },
  { name: "3 children", relationship: "CHILDREN", note: "names withheld", sources: 0 },
];

export const LEGAL = [
  { title: "EndSARS Panel — Lekki Toll Gate Inquiry", sub: "Judicial panel of inquiry · named party", status: "Concluded", dates: "2020 – 2021" },
];

export const SECTION_IDS = [
  { id: "career", label: "Career", count: POSITIONS.length },
  { id: "elections", label: "Elections", count: ELECTIONS.length },
  { id: "education", label: "Education", count: EDUCATION.length },
  { id: "business", label: "Business", count: BUSINESS.length },
  { id: "party", label: "Party", count: PARTY_HISTORY.length },
  { id: "assets", label: "Assets", count: ASSETS.length },
  { id: "awards", label: "Awards", count: AWARDS.length },
  { id: "family", label: "Family", count: FAMILY.length },
  { id: "legal", label: "Legal", count: LEGAL.length, red: true },
];

/* ---------- atoms ---------- */

export function ConfidenceBadge({ level }: { level: Confidence }) {
  const styles: Record<Confidence, string> = {
    high: "bg-emerald-400/10 text-emerald-400 border-emerald-400/40",
    medium: "bg-slate-400/10 text-slate-400 border-slate-400/30",
    low: "bg-amber-400/10 text-amber-400 border-amber-400/30",
  };
  return (
    <span className={`inline-flex items-center font-mono text-[10px] font-medium uppercase tracking-[0.06em] px-2 py-px rounded-full border ${styles[level]}`}>
      {level}
    </span>
  );
}

export function ResultBadge({ result }: { result: "won" | "lost" }) {
  return (
    <span
      className={`inline-flex items-center font-mono text-[10px] font-semibold uppercase tracking-[0.06em] px-2 py-px rounded-full border ${
        result === "won"
          ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/40"
          : "bg-slate-400/10 text-slate-400 border-slate-400/30"
      }`}
    >
      {result}
    </span>
  );
}

export function SourcesLink({ n, red }: { n: number; red?: boolean }) {
  if (n === 0) return null;
  return (
    <button className={`font-mono text-[11px] ${red ? "text-red-400" : "text-emerald-400"} opacity-85 hover:opacity-100 hover:underline`}>
      View {n} source{n > 1 ? "s" : ""}
    </button>
  );
}

export function ProvChip({ p }: { p?: string }) {
  if (!p) return null;
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-slate-500">{p}</span>
  );
}

export function Avatar({ size = 120 }: { size?: number }) {
  return (
    <div
      className="rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 border border-white/5 flex items-center justify-center font-serif text-slate-400"
      style={{ width: size, height: size, minWidth: size, fontSize: size / 3 }}
    >
      {OFFICIAL.initials}
    </div>
  );
}

export function CompletenessBar() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-[3px] bg-white/10 rounded-sm overflow-hidden">
        <div className="h-full bg-emerald-400 rounded-sm" style={{ width: `${OFFICIAL.completeness}%` }} />
      </div>
      <span className="font-mono text-[11px] text-emerald-400 whitespace-nowrap">{OFFICIAL.completeness}% complete</span>
    </div>
  );
}
