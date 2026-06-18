"use client";

/**
 * Variant H — "Magazine Profile" (the owner's chosen V9 mockup, translated
 * faithfully from the external design: op-v9.jsx + op-v9-mobile.jsx +
 * op-contact.jsx "labels" + op-shared.jsx atoms).
 *
 * Editorial longform: oversized italic-serif section titles with rules,
 * serif lede, pull-stat band, election scoreboard cards, two-column section
 * grid (single column on mobile), red-register Legal & Integrity band.
 * Verification chips (confidence/status), source disclosures with tier
 * badges, snippets, and archived-copy / original-removed states.
 */

const C = {
  bg: "oklch(0.10_0.005_160)",
  border: "oklch(0.22 0.01 160)",
  border2: "oklch(0.28 0.012 160)",
};

type Conf = "HIGH" | "MEDIUM" | "LOW";
type VStatus = "verified" | "unreviewed" | "disputed";

interface Src {
  pub: string;
  url: string;
  tier: "CANONICAL" | "OFFICIAL" | "WEB";
  snippet: string;
  retrieved: string;
  archived: boolean;
  removed?: boolean;
}
interface V {
  conf: Conf;
  status: VStatus;
  prov: string;
  date: string;
  sources: Src[];
}

const SRC_POOL: Src[] = [
  { pub: "INEC", url: "inec.gov.ng/results", tier: "CANONICAL", snippet: "…declared winner of the Lagos State gubernatorial election having scored the highest number of votes…", retrieved: "12 Jan 2026", archived: true },
  { pub: "Premium Times", url: "premiumtimesng.com", tier: "WEB", snippet: "…the governor, who studied surveying at the University of Lagos before a banking career…", retrieved: "03 Feb 2026", archived: true },
  { pub: "Lagos State Govt", url: "lagosstate.gov.ng", tier: "OFFICIAL", snippet: "…served as Commissioner for Establishments, Training and Pensions between 2005 and 2007…", retrieved: "21 Dec 2025", archived: true },
  { pub: "The Guardian NG", url: "guardian.ng", tier: "WEB", snippet: "…filed his asset declaration with the Code of Conduct Bureau upon assumption of office…", retrieved: "30 Nov 2025", archived: false, removed: true },
];

const mkV = (conf: Conf, n: number, status: VStatus = "verified", prov = "agent-verified", date = "Mar 2026"): V => ({
  conf, status, prov, date,
  sources: Array.from({ length: n }, (_, i) => SRC_POOL[i % SRC_POOL.length]),
});

const HERO = {
  name: "Babajide Sanwo-Olu",
  initials: "BS",
  overline: "GOVERNOR · APC",
  jurisdiction: "Lagos State",
  ordinal: "15th Governor of Lagos State",
  since: "Since May 2019",
  completeness: 78,
  contact: [
    ["tel", "+234 700 000 0000"],
    ["mail", "governor@lagosstate.gov.ng"],
    ["office", "Lagos House, Alausa, Ikeja"],
    ["x", "@jidesanwoolu"],
    ["facebook", "fb.com/BabajideSanwoOlu"],
    ["web", "lagosstate.gov.ng"],
  ] as [string, string][],
  bio: "Babajide Olusola Sanwo-Olu is a Nigerian politician and the 15th Governor of Lagos State. A surveyor by training and banker by profession, he held three commissioner portfolios and ran the state's property corporation before winning the governorship in 2019 and re-election in 2023.",
};

const CAREER = [
  { title: "Governor", scope: "Lagos State", party: "APC", kind: "Elected", start: "May 2019", end: "PRESENT", v: mkV("HIGH", 3) },
  { title: "MD / CEO, LSDPC", scope: "Lagos State", party: "APC", kind: "Appointed", start: "2016", end: "2019", v: mkV("HIGH", 2) },
  { title: "Commissioner, Commerce & Industry", scope: "Lagos State", party: "ACN", kind: "Appointed", start: "2007", end: "2009", v: mkV("HIGH", 2) },
  { title: "Commissioner, Establishments & Pensions", scope: "Lagos State", party: "AD", kind: "Appointed", start: "2005", end: "2007", v: mkV("MEDIUM", 1) },
  { title: "Special Adviser, Corporate Matters", scope: "Office of the Deputy Governor", party: "AD", kind: "Appointed", start: "2003", end: "2005", v: mkV("MEDIUM", 1, "verified", "admin") },
];

const ELECTIONS = [
  { type: "Gubernatorial", primary: false, year: "2023", party: "APC", where: "Lagos State", result: "WON", votes: "762,134", pct: "45.6%", winner: null as string | null, v: mkV("HIGH", 3) },
  { type: "Gubernatorial", primary: false, year: "2019", party: "APC", where: "Lagos State", result: "WON", votes: "739,445", pct: "73.6%", winner: null, v: mkV("HIGH", 3) },
  { type: "Gubernatorial", primary: true, year: "2018", party: "APC", where: "Lagos State", result: "WON", votes: "970,851", pct: "—", winner: null, v: mkV("HIGH", 2) },
  { type: "Senatorial", primary: true, year: "2003", party: "AD", where: "Lagos West", result: "LOST", votes: "—", pct: "—", winner: "Musiliu Obanikoro", v: mkV("LOW", 1, "unreviewed", "citizen-submitted") },
];

const EDUCATION = [
  { inst: "University of Lagos", qual: "B.Sc Surveying & Geoinformatics", years: "1984 – 1988", v: mkV("HIGH", 3) },
  { inst: "University of Lagos", qual: "MBA", years: "1992 – 1994", v: mkV("HIGH", 2) },
  { inst: "London Business School", qual: "Executive Programme", years: "2004", v: mkV("MEDIUM", 1) },
  { inst: "St. Gregory's College", qual: "WASC", years: "1977 – 1983", v: mkV("LOW", 1, "unreviewed", "citizen-submitted") },
];

const BEFORE = [
  { org: "First Inland Bank (now FCMB)", role: "Deputy General Manager", industry: "Banking", years: "1997 – 2003" },
  { org: "Lead Merchant Bank", role: "Treasurer", industry: "Banking", years: "1994 – 1997" },
];

const PARTIES = [
  { acr: "APC", start: "2014", end: "PRESENT", note: "ACN merged into APC" },
  { acr: "ACN", start: "2006", end: "2014", note: "Followed AD leadership into ACN" },
  { acr: "AD", start: "1999", end: "2006", note: "Entry into politics" },
];

const ASSETS = [
  { year: "2019", to: "Code of Conduct Bureau", amount: "₦2.4B", summary: "Real estate in Lagos & Abuja, equities portfolio, two private vehicles.", v: mkV("MEDIUM", 2) },
  { year: "2023", to: "Code of Conduct Bureau", amount: "—", summary: "Filed; not yet publicly released.", v: mkV("LOW", 1, "unreviewed") },
];

const AWARDS = [
  { title: "Commander of the Order of the Niger (CON)", by: "Federal Republic of Nigeria", year: "2022" },
  { title: "Governor of the Year", by: "Leadership Newspaper", year: "2021" },
];

const PUBS = [{ title: "Lagos and the next pandemic", publisher: "Financial Times", year: "2021" }];

const FAMILY = [
  { rel: "SPOUSE", name: "Ibijoke Sanwo-Olu", pub: true, link: true },
  { rel: "CHILDREN", name: "3 children — names withheld", pub: false, link: false },
];

const LEGAL = [
  { title: "Lekki Toll Gate Inquiry (EndSARS Panel)", kind: "JUDICIAL PANEL", role: "Named party", status: "Concluded", forum: "Lagos Judicial Panel of Inquiry", caseNo: "LJP/2020/014", dates: "2020 – 2021", amount: null as string | null, outcome: "Panel report submitted; state white paper issued.", v: mkV("HIGH", 3) },
  { title: "COVID-19 palliatives procurement petition", kind: "INVESTIGATION", role: "Subject of petition", status: "Dismissed", forum: "EFCC", caseNo: "EFCC/PET/2021/388", dates: "2021 – 2022", amount: "₦1.2B", outcome: "Petition dismissed for lack of merit.", v: mkV("MEDIUM", 2, "disputed", "citizen-submitted") },
];

const SECTIONS = {
  career: { title: "Political Career", count: CAREER.length },
  elections: { title: "Elections Contested", count: ELECTIONS.length },
  education: { title: "Education", count: EDUCATION.length },
  before: { title: "Career Before Politics", count: BEFORE.length },
  parties: { title: "Party Affiliations", count: PARTIES.length },
  assets: { title: "Asset Declarations", count: ASSETS.length },
  awards: { title: "Awards & Honours", count: AWARDS.length },
  pubs: { title: "Publications", count: PUBS.length },
  family: { title: "Family", count: FAMILY.length },
  legal: { title: "Legal & Integrity", count: LEGAL.length, red: true },
};

/* ---------- atoms ---------- */

const CONF_CLS: Record<Conf, string> = {
  HIGH: "text-emerald-400 border-emerald-400/35 bg-emerald-400/10",
  MEDIUM: "text-slate-400 border-slate-400/35 bg-slate-400/10",
  LOW: "text-amber-400 border-amber-400/35 bg-amber-400/10",
};

function VChips({ v }: { v: V }) {
  const status =
    v.status === "disputed"
      ? { text: "⚠ disputed", cls: "text-amber-400 border-amber-400/35" }
      : v.status === "verified"
        ? { text: "✓ verified", cls: "text-emerald-400 border-white/15" }
        : { text: "unreviewed", cls: "text-slate-500 border-white/15" };
  return (
    <span className="inline-flex gap-1.5 items-center flex-wrap">
      <span className={`font-mono text-[9.5px] tracking-[0.1em] px-[7px] py-px rounded-full border ${CONF_CLS[v.conf]}`}>{v.conf}</span>
      <span className={`font-mono text-[9.5px] tracking-[0.08em] px-[7px] py-px rounded-full border ${status.cls}`}>{status.text}</span>
    </span>
  );
}

const TIER_CLS = { CANONICAL: "text-emerald-400 border-emerald-400/30", OFFICIAL: "text-amber-400 border-amber-400/30", WEB: "text-slate-400 border-slate-400/30" };

function Sources({ v }: { v: V }) {
  const n = v.sources.length;
  return (
    <details className="mt-1.5">
      <summary className="list-none cursor-pointer inline-block font-mono text-[10.5px] tracking-[0.1em] uppercase text-emerald-400 border-b border-dotted border-emerald-400/40 pb-px [&::-webkit-details-marker]:hidden">
        View {n} source{n > 1 ? "s" : ""}
      </summary>
      <div className="mt-2 flex flex-col gap-2">
        {v.sources.map((s, i) => (
          <div key={i} className="px-3 py-2.5 rounded-[10px] bg-[oklch(0.12_0.006_160)] border border-[oklch(0.22_0.01_160)]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading text-[12.5px] font-semibold text-slate-100">{s.pub}</span>
              <span className={`font-mono text-[9px] tracking-[0.12em] px-1.5 py-px rounded border ${TIER_CLS[s.tier]}`}>{s.tier}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">retrieved {s.retrieved}</span>
            </div>
            <p className="font-sans text-xs leading-[1.55] text-slate-400 italic my-1.5">&ldquo;{s.snippet}&rdquo;</p>
            <div className="flex gap-3.5">
              {s.removed ? (
                <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-amber-400">original removed — view archived copy →</span>
              ) : (
                <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-slate-400">{s.url} →</span>
              )}
              {s.archived && !s.removed && <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-slate-500">archived copy →</span>}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

function ResultPill({ r }: { r: string }) {
  const won = r === "WON";
  return (
    <span className={`font-mono text-[10px] font-semibold tracking-[0.14em] px-2.5 py-[3px] rounded-full border ${
      won ? "bg-emerald-400 text-[#04150d] border-emerald-400" : "text-slate-400 border-slate-400"
    }`}>{r}</span>
  );
}

function SecTitle({ s, idPrefix = "h" }: { s: { title: string; count: number; red?: boolean }; idPrefix?: string }) {
  return (
    <div id={`${idPrefix}-${s.title}`} className="flex items-center gap-4 mt-11 mb-[18px] max-md:mt-10 max-md:mb-3.5 max-md:gap-3">
      <h2 className={`font-serif italic font-normal text-[28px] max-md:text-[23px] m-0 ${s.red ? "text-red-500" : "text-slate-100"}`}>{s.title}</h2>
      <div className={`flex-1 h-px ${s.red ? "bg-red-500/30" : "bg-[oklch(0.28_0.012_160)]"}`} />
      <span className={`font-mono text-[10px] uppercase tracking-[0.14em] ${s.red ? "text-red-400" : "text-slate-500"}`}>{s.count}</span>
    </div>
  );
}

const CONTACT_ICONS: Record<string, React.ReactNode> = {
  tel: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2.5h2.5l1 3-1.5 1a8.5 8.5 0 0 0 4.5 4.5l1-1.5 3 1V13a1.5 1.5 0 0 1-1.6 1.5C6.5 14 2 9.5 1.5 4.1A1.5 1.5 0 0 1 3 2.5Z" />
    </svg>
  ),
  mail: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="3" width="13" height="10" rx="1.5" /><path d="m2 4 6 5 6-5" />
    </svg>
  ),
  office: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 14s5-4.4 5-8a5 5 0 0 0-10 0c0 3.6 5 8 5 8Z" /><circle cx="8" cy="6" r="1.8" />
    </svg>
  ),
  x: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M9.3 6.9 14.6 1h-1.3L8.7 6.1 5.1 1H1l5.6 8L1 15h1.3l4.9-5.5L11 15h4.1L9.3 6.9Zm-1.7 2-.6-.8L2.7 2h1.9l3.7 5.2.6.8 4.7 6.7h-1.9L7.6 8.9Z" />
    </svg>
  ),
  facebook: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
      <path d="M9.1 15V9.2h2l.3-2.3H9.1V5.4c0-.7.2-1.1 1.1-1.1h1.2V2.1C11.2 2 10.5 2 9.8 2 8 2 6.7 3.1 6.7 5.2v1.7h-2v2.3h2V15h2.4Z" />
    </svg>
  ),
  web: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5" /><path d="M1.5 8h13M8 1.5c1.8 1.8 2.7 4 2.7 6.5S9.8 12.7 8 14.5C6.2 12.7 5.3 10.5 5.3 8S6.2 3.3 8 1.5Z" />
    </svg>
  ),
};

/** Build a clickable href for a channel (office address stays non-linked). */
function contactHref(kind: string, value: string): string | null {
  switch (kind) {
    case "tel":
      return `tel:${value.replace(/[^+\d]/g, "")}`;
    case "mail":
      return `mailto:${value}`;
    case "x":
      return `https://x.com/${value.replace(/^@/, "")}`;
    case "facebook":
    case "web":
      return /^https?:\/\//.test(value) ? value : `https://${value}`;
    default:
      return null;
  }
}

function ContactPills() {
  return (
    <div className="flex flex-wrap gap-2 max-md:justify-center">
      {HERO.contact.map(([k, vv]) => {
        const href = contactHref(k, vv);
        const inner = (
          <>
            <span className="text-emerald-400 shrink-0">{CONTACT_ICONS[k]}</span>
            <span className="font-mono text-[11px] text-slate-300/80">{vv}</span>
          </>
        );
        const cls =
          "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[oklch(0.28_0.012_160)] bg-[oklch(0.155_0.012_160)]/60 transition-colors hover:border-emerald-400/40 hover:bg-emerald-400/[0.06]";
        return href ? (
          <a key={k} href={href} target={k === "tel" || k === "mail" ? undefined : "_blank"} rel="noopener noreferrer" className={cls}>
            {inner}
          </a>
        ) : (
          <span key={k} className={cls}>{inner}</span>
        );
      })}
    </div>
  );
}

/* ---------- the page ---------- */

export function VariantH() {
  return (
    <div className="bg-[oklch(0.10_0.005_160)] text-slate-100 font-sans min-h-screen">
      {/* full-bleed hero (inner content centered to the reading column) */}
      <header className="relative pt-9 pb-11 max-md:pt-7 max-md:pb-[26px] bg-gradient-to-b from-[oklch(0.13_0.015_160)] to-[oklch(0.10_0.005_160)]">
        <div className="max-w-[1040px] mx-auto px-[72px] max-md:px-6">
        <a href="/officials" className="inline-flex items-center gap-2.5 text-sm text-slate-300/70 whitespace-nowrap">
          <span className="text-base leading-none">←</span><span>Back to officials</span>
        </a>
        <div className="flex gap-9 items-start mt-10 max-md:flex-col max-md:items-center max-md:text-center max-md:mt-[30px] max-md:gap-0">
          <div className="w-[140px] h-[140px] max-md:w-[108px] max-md:h-[108px] shrink-0 rounded-[26px] max-md:rounded-[22px] border border-emerald-400/30 bg-gradient-to-br from-emerald-900 to-[oklch(0.3_0.06_160)] flex items-center justify-center font-serif text-emerald-400 text-[53px] max-md:text-[41px]">
            {HERO.initials}
          </div>
          <div className="flex-1 pt-0.5 max-md:mt-[18px] max-md:w-full">
            <span className="font-mono text-[11px] max-md:text-[10px] tracking-[0.14em] uppercase text-emerald-400">{HERO.overline}</span>
            <h1 className="font-serif font-normal text-[44px] max-md:text-[34px] leading-[1.05] max-md:leading-[1.1] tracking-[-0.01em] mt-2">{HERO.name}</h1>
            <div className="text-base max-md:text-[14.5px] text-slate-300/70 mt-[5px]">{HERO.jurisdiction}</div>
            <div className="mt-[9px] max-md:mt-2"><span className="font-mono text-[10.5px] max-md:text-[9.5px] tracking-[0.14em] uppercase text-emerald-400">{HERO.ordinal}</span></div>
            <div className="text-[13.5px] max-md:text-[12.5px] text-slate-500 mt-1.5">{HERO.since}</div>
            <div className="flex items-center gap-4 max-md:gap-3 mt-[22px] max-md:mt-5 w-full">
              <div className="flex-1 h-[5px] rounded-[3px] bg-[oklch(0.22_0.01_160)] overflow-hidden">
                <div className="h-full rounded-[3px] bg-gradient-to-r from-emerald-900 to-emerald-400" style={{ width: `${HERO.completeness}%` }} />
              </div>
              <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-emerald-400 whitespace-nowrap">{HERO.completeness}% complete</span>
            </div>
          </div>
        </div>
        <div className="mt-[26px] pt-[18px] max-md:mt-[22px] max-md:pt-4 border-t border-[oklch(0.28_0.012_160)] max-md:flex max-md:justify-center">
          <ContactPills />
        </div>
        </div>
      </header>

      <div className="px-[72px] pb-[70px] max-w-[1040px] mx-auto max-md:px-6 max-md:pb-14 max-md:max-w-full">
        {/* lede */}
        <p className="font-serif text-2xl max-md:text-xl leading-[1.5] text-slate-100 mt-3 max-md:mt-5 max-w-[760px]">
          <span className="text-emerald-400">A surveyor by training, a banker by profession,</span> and the
          15th Governor of Lagos — re-elected in 2023 with 762,134 votes.
        </p>
        <p className="text-[14.5px] max-md:text-sm leading-[1.7] text-slate-300/70 max-w-[700px] mt-[18px] max-md:mt-4">{HERO.bio}</p>

        {/* pull-stat band */}
        <div className="grid grid-cols-4 max-md:grid-cols-2 mt-[38px] max-md:mt-[30px] border-y border-[oklch(0.28_0.012_160)]">
          {([["3 / 4", "elections won", ""], ["5", "public offices", ""], ["₦2.4B", "assets declared", "text-amber-400"], ["2", "legal records", "text-red-500"]] as const).map(([n, l, cls], i) => (
            <div key={l} className={`py-[22px] px-[18px] max-md:py-[18px] max-md:px-3 text-center ${i ? "border-l border-[oklch(0.28_0.012_160)] max-md:border-l-0" : ""} ${i % 2 ? "max-md:border-l max-md:border-[oklch(0.28_0.012_160)]" : ""} ${i > 1 ? "max-md:border-t max-md:border-[oklch(0.28_0.012_160)]" : ""}`}>
              <div className={`font-serif text-[38px] max-md:text-[32px] ${cls || "text-emerald-400"}`}>{n}</div>
              <div className="font-mono text-[9.5px] max-md:text-[9px] uppercase tracking-[0.14em] text-slate-500">{l}</div>
            </div>
          ))}
        </div>

        {/* career — two-column grid (single on mobile) */}
        <SecTitle s={SECTIONS.career} />
        <div className="grid grid-cols-2 max-md:grid-cols-1 gap-x-10 gap-y-1">
          {CAREER.map((c) => (
            <div key={c.title} className="py-3.5 border-b border-[oklch(0.22_0.01_160)]">
              <div className="flex justify-between items-baseline gap-2">
                <span className="font-heading text-[15px] font-semibold">{c.title}</span>
                <span className={`font-mono text-[10px] uppercase tracking-[0.14em] whitespace-nowrap ${c.end === "PRESENT" ? "text-emerald-400" : "text-slate-500"}`}>{c.start}–{c.end}</span>
              </div>
              <div className="text-xs text-slate-500 mt-[3px]">{c.scope} · {c.kind} · {c.party}</div>
              <div className="mt-1.5 flex gap-2.5 items-center flex-wrap"><VChips v={c.v} /><Sources v={c.v} /></div>
            </div>
          ))}
        </div>

        {/* elections — scoreboard */}
        <SecTitle s={SECTIONS.elections} />
        <div className="grid grid-cols-4 max-md:grid-cols-1 gap-4 max-md:gap-3">
          {ELECTIONS.map((e) => (
            <div key={e.year + e.type} className={`px-[18px] pt-[18px] pb-4 max-md:px-4 max-md:pt-4 max-md:pb-3.5 rounded-xl bg-[oklch(0.14_0.008_160)] border ${e.result === "WON" ? "border-emerald-400/30" : "border-[oklch(0.22_0.01_160)]"}`}>
              <div className="flex justify-between items-baseline">
                <span className="font-serif text-[26px]">{e.year}</span>
                <ResultPill r={e.result} />
              </div>
              <div className="text-xs text-slate-300/70 mt-1.5">{e.type}{e.primary ? " (primary)" : ""}</div>
              <div className={`font-mono text-[15px] mt-2 ${e.result === "WON" ? "text-emerald-400" : "text-slate-400"}`}>
                {e.votes}{e.pct !== "—" ? ` · ${e.pct}` : ""}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{e.where} · {e.party}{e.winner ? ` · lost to ${e.winner}` : ""}</div>
              <Sources v={e.v} />
            </div>
          ))}
        </div>

        {/* two-column editorial grid */}
        <div className="grid grid-cols-2 max-md:grid-cols-1 gap-x-14">
          <div>
            <SecTitle s={SECTIONS.education} />
            {EDUCATION.map((e, i) => (
              <div key={i} className="py-2.5 max-md:py-3 border-b border-[oklch(0.22_0.01_160)]">
                <div className="flex justify-between gap-2">
                  <span className="font-heading text-sm font-semibold">{e.inst}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">{e.years}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{e.qual}</div>
                <div className="mt-[5px]"><VChips v={e.v} /></div>
              </div>
            ))}
            <SecTitle s={SECTIONS.parties} />
            {PARTIES.map((p) => (
              <div key={p.acr} className="flex justify-between py-[9px] max-md:py-[11px] border-b border-[oklch(0.22_0.01_160)] items-baseline">
                <div>
                  <span className={`font-heading text-sm font-bold ${p.end === "PRESENT" ? "text-emerald-400" : "text-slate-100"}`}>{p.acr}</span>
                  <span className="text-[11.5px] text-slate-500 ml-2">{p.note}</span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">{p.start}–{p.end}</span>
              </div>
            ))}
            <SecTitle s={SECTIONS.family} />
            {FAMILY.map((f) => (
              <div key={f.rel} className="py-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">{f.rel}</span>
                <div className={`font-serif text-[17px] mt-0.5 ${f.link ? "text-emerald-400" : "text-slate-100"}`}>
                  {f.name}{f.pub ? " — public figure" : ""}
                </div>
              </div>
            ))}
          </div>
          <div>
            <SecTitle s={SECTIONS.before} />
            {BEFORE.map((b) => (
              <div key={b.org} className="py-2.5 max-md:py-3 border-b border-[oklch(0.22_0.01_160)]">
                <div className="flex justify-between gap-2">
                  <span className="font-heading text-sm font-semibold">{b.role}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">{b.years}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{b.org} · {b.industry}</div>
              </div>
            ))}
            <SecTitle s={SECTIONS.assets} />
            {ASSETS.map((a) => (
              <div key={a.year} className="py-2.5 max-md:py-3 border-b border-[oklch(0.22_0.01_160)]">
                <span className="font-serif text-[26px] text-amber-400">{a.amount}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500 ml-2.5">{a.year} · {a.to}</span>
                <div className="text-xs text-slate-500 mt-[3px]">{a.summary}</div>
                <Sources v={a.v} />
              </div>
            ))}
            <SecTitle s={SECTIONS.awards} />
            {AWARDS.map((a) => (
              <div key={a.title} className="py-2">
                <span className="font-heading text-sm font-semibold">{a.title}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500 ml-2">{a.year}</span>
                <div className="text-[11.5px] text-slate-500">{a.by}</div>
              </div>
            ))}
            <SecTitle s={SECTIONS.pubs} />
            {PUBS.map((p) => (
              <div key={p.title} className="py-2">
                <div className="font-serif italic text-base">&ldquo;{p.title}&rdquo;</div>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">{p.publisher} · {p.year}</span>
              </div>
            ))}
            <div className="mt-6 flex gap-3 flex-wrap">
              {["+ committees", "+ bills"].map((t) => (
                <span key={t} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-emerald-400 px-[13px] py-[7px] max-md:px-3.5 max-md:py-[9px] rounded-full border border-emerald-400/30 cursor-pointer">{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* legal — full-width red register */}
        <SecTitle s={SECTIONS.legal} />
        {LEGAL.map((l) => (
          <div key={l.caseNo} className="grid grid-cols-[170px_1fr_auto] max-md:grid-cols-1 gap-6 max-md:gap-2.5 px-[22px] py-[18px] max-md:px-[18px] max-md:py-4 rounded-xl bg-red-500/[0.08] border border-red-500/30 mb-3 items-start">
            <div className="max-md:flex max-md:items-center max-md:justify-between">
              <span className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-red-400">{l.kind}</span>
              <div className="font-mono text-[11px] text-slate-500 mt-1 max-md:mt-0">{l.caseNo} <span className="md:block">{l.dates}</span></div>
            </div>
            <div>
              <div className="font-heading text-base font-semibold">{l.title}</div>
              <div className="text-[12.5px] text-slate-300/70 mt-1">{l.role} · {l.forum} — {l.outcome}</div>
              <div className="mt-2"><VChips v={l.v} /></div>
              <Sources v={l.v} />
            </div>
            <div className="text-right max-md:text-left max-md:flex max-md:items-center max-md:gap-3">
              <span className="font-mono text-[10px] px-2.5 py-[3px] rounded-full text-red-400 border border-red-500/30 whitespace-nowrap">{l.status}</span>
              {l.amount && <div className="font-serif text-2xl text-red-500 mt-2 max-md:mt-0">{l.amount}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
