"use client";

/**
 * MagazineProfile — the official profile page (V9 "Magazine Profile" design),
 * wired to live API data (plan 45f). Editorial longform: hero with contact
 * pills + completeness, biography, computed pull-stat band, two-column section
 * grid, election scoreboard, and a red-register Legal & Integrity band.
 * Every structured fact shows confidence/verification chips and an expandable
 * source list (tier badge, snippet, archived-copy / original-removed states).
 *
 * Sections render only when they have data; contact pills show only present
 * channels — so it degrades gracefully from a fully-enriched profile (e.g.
 * Sanwo-Olu) down to a bare seed record.
 */

import { useState } from "react";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";
import { Show } from "@/components/ui/Show";
import type {
  Official,
  Position,
  Evidence,
  ProvFields,
  ElectionRecord,
} from "@/lib/api";
import { roleLabel } from "@/lib/roles";

const TYPE_LABELS: Record<string, string> = {
  elected: "Elected Official",
  appointed: "Appointed Official",
  civil_servant: "Civil Servant",
  judicial: "Judicial Officer",
  security: "Security Official",
  traditional: "Traditional Ruler",
  other: "Public Official",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthYear(iso: string | null): string | null {
  if (!iso) return null;
  const [y, m] = iso.split("-");
  const mi = Number(m) - 1;
  return MONTHS[mi] ? `${MONTHS[mi]} ${y}` : y;
}

function yearOf(iso: string | null): string | null {
  return iso ? iso.split("-")[0] : null;
}

function yearRange(start: number | null, end: number | null): string {
  if (start && end) return `${start} – ${end}`;
  if (start) return `${start} – present`;
  if (end) return `${end}`;
  return "";
}

function dateRange(start: string | null, end: string | null, current?: boolean): string {
  const s = monthYear(start);
  if (current || (!end && s)) return s ? `${s} – PRESENT` : "PRESENT";
  const e = monthYear(end);
  if (s && e) return `${s} – ${e}`;
  return s ?? e ?? "";
}

function positionScope(p: Position): string | null {
  return p.constituency || p.ward || p.lga || p.state || null;
}

function formatNaira(amount: number | null): string | null {
  if (amount == null) return null;
  const abs = Math.abs(amount);
  if (abs >= 1e12) return `₦${(amount / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `₦${(amount / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `₦${(amount / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `₦${(amount / 1e3).toFixed(0)}K`;
  return `₦${amount}`;
}

function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

/* ---------- verification + evidence atoms ---------- */

const CONF_CLS: Record<string, string> = {
  high: "text-emerald-400 border-emerald-400/35 bg-emerald-400/10",
  medium: "text-slate-400 border-slate-400/35 bg-slate-400/10",
  low: "text-amber-400 border-amber-400/35 bg-amber-400/10",
};

function VChips({ v }: { v: ProvFields }) {
  const status =
    v.reviewStatus === "disputed"
      ? { text: "⚠ disputed", cls: "text-amber-400 border-amber-400/35" }
      : v.reviewStatus === "reviewed"
        ? { text: "✓ verified", cls: "text-emerald-400 border-white/15" }
        : { text: "unreviewed", cls: "text-slate-500 border-white/15" };
  return (
    <span className="inline-flex gap-1.5 items-center flex-wrap">
      <span className={`font-mono text-[9.5px] tracking-[0.1em] uppercase px-[7px] py-px rounded-full border ${CONF_CLS[v.confidence] ?? CONF_CLS.medium}`}>{v.confidence}</span>
      <span className={`font-mono text-[9.5px] tracking-[0.08em] px-[7px] py-px rounded-full border ${status.cls}`}>{status.text}</span>
    </span>
  );
}

const TIER_CLS: Record<string, string> = {
  canonical: "text-emerald-400 border-emerald-400/30",
  official: "text-amber-400 border-amber-400/30",
  web: "text-slate-400 border-slate-400/30",
};

function Sources({ evidence }: { evidence: Evidence[] }) {
  if (!evidence?.length) return null;
  const n = evidence.length;
  return (
    <details className="mt-1.5">
      <summary className="list-none cursor-pointer inline-block font-mono text-[10.5px] tracking-[0.1em] uppercase text-emerald-400 border-b border-dotted border-emerald-400/40 pb-px [&::-webkit-details-marker]:hidden">
        View {n} source{n > 1 ? "s" : ""}
      </summary>
      <div className="mt-2 flex flex-col gap-2">
        {evidence.map((s) => (
          <div key={s.id} className="px-3 py-2.5 rounded-[10px] bg-[oklch(0.12_0.006_160)] border border-[oklch(0.22_0.01_160)]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading text-[12.5px] font-semibold text-slate-100">{s.publisher}</span>
              <span className={`font-mono text-[9px] tracking-[0.12em] uppercase px-1.5 py-px rounded border ${TIER_CLS[s.sourceTier] ?? TIER_CLS.web}`}>{s.sourceTier}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">retrieved {monthYear(s.retrievedAt.split("T")[0]) ?? s.retrievedAt.split("T")[0]}</span>
            </div>
            {s.snippet && <p className="font-sans text-xs leading-[1.55] text-slate-400 italic my-1.5">&ldquo;{s.snippet}&rdquo;</p>}
            <div className="flex gap-3.5 flex-wrap">
              {s.originalAccessible ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-slate-400 hover:text-emerald-400">{(() => { try { return new URL(s.url).hostname.replace(/^www\./, ""); } catch { return s.url; } })()} →</a>
              ) : (
                <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-amber-400">original removed — view archived copy →</span>
              )}
              {s.hasSnapshot && s.originalAccessible && (
                <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-slate-500">archived copy →</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

function ResultPill({ r }: { r: string }) {
  const won = r.toUpperCase() === "WON";
  return (
    <span className={`font-mono text-[10px] font-semibold tracking-[0.14em] uppercase px-2.5 py-[3px] rounded-full border ${
      won ? "bg-emerald-400 text-[#04150d] border-emerald-400" : "text-slate-400 border-slate-400"
    }`}>{r}</span>
  );
}

function SecTitle({ title, count, red, empty }: { title: string; count: number; red?: boolean; empty?: boolean }) {
  return (
    <div className="flex items-center gap-4 mt-11 mb-[18px] max-md:mt-10 max-md:mb-3.5 max-md:gap-3">
      <h2 className={`font-serif italic font-normal text-[28px] max-md:text-[23px] m-0 ${red ? "text-red-500" : empty ? "text-slate-300/80" : "text-slate-100"}`}>{title}</h2>
      <div className={`flex-1 h-px ${red ? "bg-red-500/30" : "bg-[oklch(0.28_0.012_160)]"}`} />
      <span className={`font-mono text-[10px] uppercase tracking-[0.14em] ${red ? "text-red-400" : empty ? "text-emerald-400/70" : "text-slate-500"}`}>{empty ? "add" : count}</span>
    </div>
  );
}

/* ---------- contribution prompts (help-complete / preview) ---------- */

/** Deep-link into the citizen proposal flow, pre-selecting a field when the
 *  gap maps to one the edit form accepts (see FIELD_LABELS in proposals/new). */
function proposalHref(officialId: string, field?: string): string {
  const base = `/proposals/new?officialId=${encodeURIComponent(officialId)}`;
  return field ? `${base}&targetField=${field}` : base;
}

/**
 * Structured sections deep-link to the preview record form (Plan 55):
 * /preview/proposals/new renders the schema-driven multi-record form for that
 * recordType; with `editId` it opens correction mode on one existing row.
 * Scalar gaps (photo/contact/bio) keep proposalHref → the live scalar form.
 */
function recordHref(officialId: string, recordType: string, editId?: string): string {
  const base = `/preview/proposals/new?officialId=${encodeURIComponent(officialId)}&recordType=${encodeURIComponent(recordType)}`;
  return editId ? `${base}&edit=${encodeURIComponent(editId)}` : base;
}

const PLUS_ICON = (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M8 3.5v9M3.5 8h9" /></svg>
);

/** Dashed, tappable "help us add this" card — the invitation shown wherever a
 *  fact is missing. Emerald register (never red): contributing is a hopeful
 *  civic act, not a warning. */
function AddPrompt({ href, title, hint }: { href: string; title: string; hint?: string }) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-xl border border-dashed border-emerald-400/30 bg-emerald-400/[0.025] px-4 py-3.5 transition-all hover:border-emerald-400/60 hover:bg-emerald-400/[0.07]"
    >
      <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-400/40 text-emerald-400 transition-colors group-hover:border-emerald-400/70 group-hover:bg-emerald-400/10">
        {PLUS_ICON}
      </span>
      <span className="min-w-0">
        <span className="block font-heading text-[13.5px] font-semibold text-emerald-400/90 transition-colors group-hover:text-emerald-400">{title}</span>
        {hint && <span className="mt-0.5 block text-[11.5px] leading-snug text-slate-500">{hint}</span>}
      </span>
    </Link>
  );
}

/** A magazine section that renders its rows when populated, or — in contribute
 *  mode — an AddPrompt inviting the first contribution when empty, so the page
 *  reads as a complete template rather than a sparse stub. */
function Section({
  title, count, contribute, href, prompt, hint, children,
}: {
  title: string; count: number; contribute?: boolean;
  href: string; prompt: string; hint?: string; children?: React.ReactNode;
}) {
  if (count === 0 && !contribute) return null;
  return (
    <section>
      <SecTitle title={title} count={count} empty={count === 0} />
      {count > 0 ? children : <AddPrompt href={href} title={prompt} hint={hint} />}
    </section>
  );
}

/* ---------- contact pills ---------- */

const CONTACT_ICONS: Record<string, React.ReactNode> = {
  tel: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2.5h2.5l1 3-1.5 1a8.5 8.5 0 0 0 4.5 4.5l1-1.5 3 1V13a1.5 1.5 0 0 1-1.6 1.5C6.5 14 2 9.5 1.5 4.1A1.5 1.5 0 0 1 3 2.5Z" /></svg>,
  mail: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="3" width="13" height="10" rx="1.5" /><path d="m2 4 6 5 6-5" /></svg>,
  office: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M8 14s5-4.4 5-8a5 5 0 0 0-10 0c0 3.6 5 8 5 8Z" /><circle cx="8" cy="6" r="1.8" /></svg>,
  x: <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M9.3 6.9 14.6 1h-1.3L8.7 6.1 5.1 1H1l5.6 8L1 15h1.3l4.9-5.5L11 15h4.1L9.3 6.9Zm-1.7 2-.6-.8L2.7 2h1.9l3.7 5.2.6.8 4.7 6.7h-1.9L7.6 8.9Z" /></svg>,
  facebook: <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M9.1 15V9.2h2l.3-2.3H9.1V5.4c0-.7.2-1.1 1.1-1.1h1.2V2.1C11.2 2 10.5 2 9.8 2 8 2 6.7 3.1 6.7 5.2v1.7h-2v2.3h2V15h2.4Z" /></svg>,
};

function ContactPills({ official, contribute }: { official: Official; contribute?: boolean }) {
  const tw = official.twitterHandle?.replace(/^@/, "").replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, "");
  const fb = official.facebookUrl;
  const items: { k: string; label: string; href: string | null }[] = [
    official.phoneNumber ? { k: "tel", label: official.phoneNumber, href: `tel:${official.phoneNumber.replace(/[^+\d]/g, "")}` } : null,
    official.email ? { k: "mail", label: official.email, href: `mailto:${official.email}` } : null,
    official.officeAddress ? { k: "office", label: official.officeAddress, href: null } : null,
    tw ? { k: "x", label: `@${tw}`, href: `https://x.com/${tw}` } : null,
    fb ? { k: "facebook", label: fb.replace(/^https?:\/\//, ""), href: /^https?:\/\//.test(fb) ? fb : `https://${fb.replace(/^\/+/, "")}` } : null,
  ].filter(Boolean) as { k: string; label: string; href: string | null }[];

  // Missing channels become dashed "add" pills so the strip reads as complete
  // and every gap is one tap from a proposal.
  const missing: { k: string; field: string; label: string }[] = contribute
    ? ([
        !official.phoneNumber ? { k: "tel", field: "phoneNumber", label: "Add phone" } : null,
        !official.email ? { k: "mail", field: "email", label: "Add email" } : null,
        !official.officeAddress ? { k: "office", field: "officeAddress", label: "Add office" } : null,
        !tw ? { k: "x", field: "twitterHandle", label: "Add X" } : null,
        !fb ? { k: "facebook", field: "facebookUrl", label: "Add Facebook" } : null,
      ].filter(Boolean) as { k: string; field: string; label: string }[])
    : [];

  if (!items.length && !missing.length) return null;
  const cls = "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[oklch(0.28_0.012_160)] bg-[oklch(0.155_0.012_160)]/60 transition-colors hover:border-emerald-400/40 hover:bg-emerald-400/[0.06] max-w-full";
  const addCls = "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-dashed border-emerald-400/35 bg-emerald-400/[0.04] transition-colors hover:border-emerald-400/60 hover:bg-emerald-400/[0.09] max-w-full";
  return (
    <div className="flex flex-wrap gap-2 mt-4 pt-4 max-md:mt-3.5 max-md:pt-3.5 border-t border-[oklch(0.28_0.012_160)] max-md:justify-center">
      {items.map(({ k, label, href }) => {
        const inner = (
          <>
            <span className="text-emerald-400 shrink-0">{CONTACT_ICONS[k]}</span>
            <span className="font-mono text-[11px] text-slate-300/80 truncate">{label}</span>
          </>
        );
        return href ? (
          <a key={k} href={href} target={k === "tel" || k === "mail" ? undefined : "_blank"} rel="noopener noreferrer" className={cls}>{inner}</a>
        ) : (
          <span key={k} className={cls}>{inner}</span>
        );
      })}
      {missing.map(({ k, field, label }) => (
        <Link key={`add-${k}`} href={proposalHref(official.id, field)} className={addCls}>
          <span className="text-emerald-400 shrink-0">{PLUS_ICON}</span>
          <span className="font-mono text-[11px] text-emerald-400/80 truncate">{label}</span>
        </Link>
      ))}
    </div>
  );
}

/* ---------- row renderers ---------- */

function ProvRow({ children, v, fixHref }: { children: React.ReactNode; v: ProvFields; fixHref?: string }) {
  return (
    <div className="py-3.5 border-b border-[oklch(0.22_0.01_160)] last:border-0">
      {children}
      <div className="mt-1.5 flex gap-2.5 items-center flex-wrap">
        <VChips v={v} />
        <Sources evidence={v.evidence} />
        {fixHref && (
          <Link href={fixHref} className="font-mono text-[9px] uppercase tracking-[0.12em] text-emerald-400/60 hover:text-emerald-300">
            fix ·
          </Link>
        )}
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export function MagazineProfile({ official, contribute = true }: { official: Official; contribute?: boolean }) {
  const [imgError, setImgError] = useState(false);
  const hasPhoto = Boolean(official.imageUrl) && !imgError;

  const positions = official.positions ?? [];
  const current = positions.find((p) => p.isCurrent) ?? positions[0];
  const education = official.educationRecords ?? [];
  const careers = official.careerRecords ?? [];
  const parties = official.partyHistory ?? [];
  const committees = official.committees ?? [];
  const bills = official.sponsoredBills ?? [];
  const elections = official.elections ?? [];
  const assets = official.assetDeclarations ?? [];
  const awards = official.awards ?? [];
  const pubs = official.publications ?? [];
  const family = official.familyMembers ?? [];
  const legal = official.legalCases ?? [];
  const corruption = official.corruptionCases ?? [];

  const overline = current
    ? `${roleLabel(current.role).toUpperCase()}${current.party ? ` · ${current.party}` : ""}`
    : (official.officialType ? (TYPE_LABELS[official.officialType] ?? "Public Official").toUpperCase() : "OFFICIAL");
  const jurisdiction = current ? positionScope(current) : null;
  const since = current?.isCurrent ? monthYear(current.startDate) : null;
  const completeness = Math.round((official.completenessScore ?? 0) * 100);
  const bio = official.biography;

  // pull-stat band — the four civic vital signs. When populated a cell shows its
  // figure; in contribute mode empty cells still render (as a muted "—") so the
  // band always reads as the full scoreboard, and the contributable three link
  // to a proposal. Outside contribute mode, only cells with data appear.
  const electionsWon = elections.filter((e) => e.result?.toLowerCase() === "won").length;
  const latestAsset = assets.map((a) => a.amount).find((a) => a != null) ?? null;
  const legalCount = legal.length + corruption.length;
  const stat = (
    has: boolean,
    n: string,
    l: string,
    cls?: string,
    href?: string,
  ): { n: string; l: string; cls?: string; href?: string; empty?: boolean } | null =>
    has ? { n, l, cls } : contribute ? { n: "—", l, empty: true, href } : null;
  const stats = [
    stat(elections.length > 0, `${electionsWon} / ${elections.length}`, "elections won", undefined, recordHref(official.id, "election")),
    stat(positions.length > 0, String(positions.length), "public offices", undefined, proposalHref(official.id)),
    stat(latestAsset != null, latestAsset != null ? formatNaira(latestAsset)! : "—", "assets declared", "text-amber-400", recordHref(official.id, "asset_declaration")),
    // Legal is never an invitation to add (defamation risk) — show the count, or a neutral "—".
    stat(legalCount > 0, String(legalCount), "legal records", "text-red-500"),
  ].filter(Boolean) as { n: string; l: string; cls?: string; href?: string; empty?: boolean }[];

  const sectionDivider = "border-b border-[oklch(0.22_0.01_160)] last:border-0";

  return (
    <div className="bg-[oklch(0.10_0.005_160)] text-slate-100 font-sans">
      {/* hero */}
      <header className="relative pt-6 pb-7 max-md:pt-5 max-md:pb-5 bg-gradient-to-b from-[oklch(0.13_0.015_160)] to-[oklch(0.10_0.005_160)]">
        <div className="max-w-[1040px] mx-auto px-[72px] max-md:px-6">
          <BackButton
            fallbackHref="/officials"
            fallbackLabel="officials"
            className="gap-2.5 whitespace-nowrap text-slate-300/70 hover:text-emerald-400"
          />
          <div className="flex gap-6 items-start mt-5 max-md:flex-col max-md:items-center max-md:text-center max-md:gap-0">
            <div className="shrink-0 flex flex-col items-center gap-1.5">
              <Show when={hasPhoto}>
                <div className="w-[104px] h-[104px] max-md:w-[88px] max-md:h-[88px] rounded-2xl overflow-hidden border border-emerald-400/30 bg-gradient-to-br from-emerald-900 to-[oklch(0.3_0.06_160)] flex items-center justify-center font-serif text-emerald-400 text-[38px] max-md:text-[32px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={official.imageUrl!} alt={official.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
                </div>
              </Show>
              <Show when={!hasPhoto && contribute}>
                <Link
                  href={proposalHref(official.id, "imageUrl")}
                  title="Add a photo"
                  className="group relative w-[104px] h-[104px] max-md:w-[88px] max-md:h-[88px] rounded-2xl overflow-hidden border border-dashed border-emerald-400/40 bg-gradient-to-br from-emerald-900 to-[oklch(0.3_0.06_160)] flex items-center justify-center font-serif text-emerald-400/80 text-[38px] max-md:text-[32px] transition-colors hover:border-emerald-400/70"
                >
                  <span className="group-hover:opacity-0 transition-opacity">{initialsOf(official.name)}</span>
                  <span className="absolute inset-0 flex items-center justify-center bg-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-400">Add photo</span>
                </Link>
              </Show>
              <Show when={!hasPhoto && !contribute}>
                <div className="w-[104px] h-[104px] max-md:w-[88px] max-md:h-[88px] rounded-2xl overflow-hidden border border-emerald-400/30 bg-gradient-to-br from-emerald-900 to-[oklch(0.3_0.06_160)] flex items-center justify-center font-serif text-emerald-400 text-[38px] max-md:text-[32px]">
                  {initialsOf(official.name)}
                </div>
              </Show>
              <Show when={contribute && !hasPhoto}>
                <Link href={proposalHref(official.id, "imageUrl")} className="font-mono text-[9px] uppercase tracking-[0.12em] text-emerald-400/70 hover:text-emerald-400 inline-flex items-center gap-1">
                  {PLUS_ICON} Add photo
                </Link>
              </Show>
            </div>
            <div className="flex-1 pt-0.5 max-md:mt-3.5 max-md:w-full">
              <span className="font-mono text-[11px] max-md:text-[10px] tracking-[0.14em] uppercase text-emerald-400">{overline}</span>
              <h1 className="font-serif font-normal text-[31px] max-md:text-[27px] leading-[1.1] tracking-[-0.01em] mt-1">{official.name}</h1>
              <Show when={!!jurisdiction}><div className="text-[15px] max-md:text-[14px] text-slate-300/70 mt-0.5">{jurisdiction}</div></Show>
              <Show when={!!since}><div className="text-[13px] max-md:text-[12.5px] text-slate-500 mt-1">Since {since}</div></Show>
              <div className="flex items-center gap-4 max-md:gap-3 mt-3.5 max-md:mt-3 w-full">
                <div className="flex-1 h-[5px] rounded-[3px] bg-[oklch(0.22_0.01_160)] overflow-hidden">
                  <div className="h-full rounded-[3px] bg-gradient-to-r from-emerald-900 to-emerald-400" style={{ width: `${completeness}%` }} />
                </div>
                <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-emerald-400 whitespace-nowrap">{completeness}% complete</span>
              </div>
            </div>
          </div>
          <ContactPills official={official} contribute={contribute} />
        </div>
      </header>

      <div className="px-[72px] pb-[70px] max-w-[1040px] mx-auto max-md:px-6 max-md:pb-14 max-md:max-w-full">
        <Show when={contribute}>
          <p className="mt-6 max-md:mt-5 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-emerald-400/70">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-emerald-400/40 text-emerald-400">{PLUS_ICON}</span>
            See a gap? Tap any prompt to help verify this profile.
          </p>
        </Show>

        <Show when={!!bio}>
          <p className="text-[15px] max-md:text-sm leading-[1.7] text-slate-300/80 max-w-[760px] mt-5 max-md:mt-4">{bio}</p>
        </Show>
        <Show when={!bio && contribute}>
          <div className="mt-5 max-md:mt-4 max-w-[760px]">
            <AddPrompt
              href={proposalHref(official.id, "biography")}
              title="Add a biography"
              hint="Their background, career, and what they're known for."
            />
          </div>
        </Show>

        {/* pull-stat band */}
        <Show when={stats.length > 0}>
          <div className="grid mt-[30px] border-y border-[oklch(0.28_0.012_160)] max-md:grid-cols-2" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
            {stats.map((s, i) => {
              const cellCls = `py-[22px] px-[18px] max-md:py-[18px] max-md:px-3 text-center ${i ? "border-l border-[oklch(0.28_0.012_160)] max-md:border-l-0" : ""} ${i % 2 ? "max-md:border-l max-md:border-[oklch(0.28_0.012_160)]" : ""} ${i > 1 ? "max-md:border-t max-md:border-[oklch(0.28_0.012_160)]" : ""}`;
              const inner = (
                <>
                  <div className={`font-serif text-[38px] max-md:text-[32px] ${s.empty ? "text-slate-600" : s.cls ?? "text-emerald-400"}`}>{s.n}</div>
                  <div className={`font-mono text-[9.5px] max-md:text-[9px] uppercase tracking-[0.14em] ${s.empty && s.href ? "text-emerald-400/60 group-hover:text-emerald-400" : "text-slate-500"}`}>{s.empty && s.href ? "add · " : ""}{s.l}</div>
                </>
              );
              return s.empty && s.href ? (
                <Link key={s.l} href={s.href} className={`${cellCls} block transition-colors hover:bg-emerald-400/[0.05] group`}>{inner}</Link>
              ) : (
                <div key={s.l} className={cellCls}>{inner}</div>
              );
            })}
          </div>
        </Show>

        {/* political career — full history */}
        <Section
          title="Political Career"
          count={positions.length}
          contribute={contribute}
          href={proposalHref(official.id)}
          prompt="Add a public office"
          hint="Roles they've held and the dates they served."
        >
            <div className="grid grid-cols-2 max-md:grid-cols-1 gap-x-10 gap-y-1">
              {positions.map((p) => (
                <div key={p.id} className={`py-3.5 ${sectionDivider}`}>
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-heading text-[15px] font-semibold">{roleLabel(p.role)}</span>
                    <span className={`font-mono text-[10px] uppercase tracking-[0.14em] whitespace-nowrap ${p.isCurrent ? "text-emerald-400" : "text-slate-500"}`}>{dateRange(p.startDate, p.endDate, p.isCurrent)}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-[3px]">{[positionScope(p), p.party].filter(Boolean).join(" · ")}{p.endReason ? ` · ${p.endReason}` : ""}</div>
                </div>
              ))}
            </div>
        </Section>

        {/* elections — scoreboard */}
        <Section
          title="Elections Contested"
          count={elections.length}
          contribute={contribute}
          href={recordHref(official.id, "election")}
          prompt="Add an election"
          hint="Elections they've contested and the results."
        >
            <div className="grid grid-cols-4 max-md:grid-cols-1 gap-4 max-md:gap-3">
              {elections.map((e: ElectionRecord) => (
                <div key={e.id} className={`px-[18px] pt-[18px] pb-4 max-md:px-4 max-md:pt-4 max-md:pb-3.5 rounded-xl bg-[oklch(0.14_0.008_160)] border ${e.result?.toLowerCase() === "won" ? "border-emerald-400/30" : "border-[oklch(0.22_0.01_160)]"}`}>
                  <div className="flex justify-between items-baseline">
                    <span className="font-serif text-[26px]">{e.year}</span>
                    <ResultPill r={e.result?.toUpperCase() ?? "—"} />
                  </div>
                  <div className="text-xs text-slate-300/70 mt-1.5 capitalize">{e.electionType?.replace(/_/g, " ")}{e.isPrimary ? " (primary)" : ""}</div>
                  <div className={`font-mono text-[15px] mt-2 ${e.result?.toLowerCase() === "won" ? "text-emerald-400" : "text-slate-400"}`}>
                    {e.votes != null ? e.votes.toLocaleString() : "—"}{e.votePercentage != null ? ` · ${e.votePercentage}%` : ""}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">{[e.state || e.constituency || e.lga, e.party].filter(Boolean).join(" · ")}{e.winnerName ? ` · lost to ${e.winnerName}` : ""}</div>
                  <Sources evidence={e.evidence} />
                </div>
              ))}
            </div>
        </Section>

        {/* two-column editorial grid */}
        <Show when={contribute || education.length > 0 || parties.length > 0 || family.length > 0 || careers.length > 0 || assets.length > 0 || awards.length > 0 || pubs.length > 0}>
          <div className="grid grid-cols-2 max-md:grid-cols-1 gap-x-14">
            <div>
              <Section
                title="Education"
                count={education.length}
                contribute={contribute}
                href={recordHref(official.id, "education")}
                prompt="Add education"
                hint="Schools, degrees, and the years attended."
              >
                  {education.map((e) => (
                    <ProvRow key={e.id} v={e}>
                      <div className="flex justify-between gap-2">
                        <span className="font-heading text-sm font-semibold">{e.institution}</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">{yearRange(e.startYear, e.endYear)}</span>
                      </div>
                      {(e.qualification || e.field) && <div className="text-xs text-slate-500 mt-0.5">{[e.qualification, e.field].filter(Boolean).join(" · ")}</div>}
                    </ProvRow>
                  ))}
              </Section>
              <Section
                title="Party Affiliations"
                count={parties.length}
                contribute={contribute}
                href={recordHref(official.id, "party_affiliation")}
                prompt="Add their political party"
                hint="Current and former parties, with dates."
              >
                  {parties.map((p) => (
                    <ProvRow key={p.id} v={p}>
                      <div className="flex justify-between items-baseline gap-2">
                        <span className={`font-heading text-sm font-bold ${!p.endDate ? "text-emerald-400" : "text-slate-100"}`}>{p.party}</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">{[yearOf(p.startDate), p.endDate ? yearOf(p.endDate) : "present"].filter(Boolean).join(" – ")}</span>
                      </div>
                      {(p.partyName || p.reason) && <div className="text-[11.5px] text-slate-500 mt-0.5">{p.reason || p.partyName}</div>}
                    </ProvRow>
                  ))}
              </Section>
              <Section
                title="Committees"
                count={committees.length}
                contribute={contribute}
                href={recordHref(official.id, "committee")}
                prompt="Add a committee"
                hint="Committees and the role they play on each."
              >
                  {committees.map((c) => (
                    <ProvRow key={c.id} v={c}>
                      <div className="flex justify-between gap-2">
                        <span className="font-heading text-sm font-semibold">{c.committeeName}</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">{c.role}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 capitalize">{c.chamber?.replace(/_/g, " ")}</div>
                    </ProvRow>
                  ))}
              </Section>
              <Section
                title="Family"
                count={family.length}
                contribute={contribute}
                href={recordHref(official.id, "family_member")}
                prompt="Add a family link"
                hint="Notable relatives in public life."
              >
                  {family.map((f) => (
                    <div key={f.id} className="py-2">
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">{f.relationship}</span>
                      <div className={`font-serif text-[17px] mt-0.5 ${f.relatedOfficial?.slug ? "text-emerald-400" : "text-slate-100"}`}>
                        {f.relatedOfficial?.slug ? (
                          <Link href={`/officials/${f.relatedOfficial.slug}`} className="hover:underline">{f.name ?? f.relatedOfficial.name}</Link>
                        ) : (
                          f.name ?? "—"
                        )}
                        {f.isPublicFigure ? " — public figure" : ""}
                      </div>
                    </div>
                  ))}
              </Section>
            </div>
            <div>
              <Section
                title="Career Before Politics"
                count={careers.length}
                contribute={contribute}
                href={recordHref(official.id, "career")}
                prompt="Add earlier career"
                hint="Work and roles before public office."
              >
                  {careers.map((c) => (
                    <ProvRow key={c.id} v={c}>
                      <div className="flex justify-between gap-2">
                        <span className="font-heading text-sm font-semibold">{c.role ?? c.organization}</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">{yearRange(c.startYear, c.endYear)}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{[c.role ? c.organization : null, c.industry].filter(Boolean).join(" · ")}</div>
                    </ProvRow>
                  ))}
              </Section>
              <Section
                title="Sponsored Bills"
                count={bills.length}
                contribute={contribute}
                href={recordHref(official.id, "sponsored_bill")}
                prompt="Add a sponsored bill"
                hint="Bills they've sponsored or co-sponsored."
              >
                  {bills.map((b) => (
                    <ProvRow key={b.id} v={b}>
                      <div className="flex justify-between gap-2">
                        <span className="font-heading text-sm font-semibold">{b.title}</span>
                        {b.status && <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">{b.status}</span>}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{[b.role, b.billNumber].filter(Boolean).join(" · ")}</div>
                    </ProvRow>
                  ))}
              </Section>
              <Section
                title="Asset Declarations"
                count={assets.length}
                contribute={contribute}
                href={recordHref(official.id, "asset_declaration")}
                prompt="Add an asset declaration"
                hint="Declared assets and the year filed."
              >
                  {assets.map((a) => (
                    <ProvRow key={a.id} v={a}>
                      <span className="font-serif text-[26px] text-amber-400">{formatNaira(a.amount) ?? "—"}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500 ml-2.5">{[a.year, a.declaredTo].filter(Boolean).join(" · ")}</span>
                      {a.summary && <div className="text-xs text-slate-500 mt-[3px]">{a.summary}</div>}
                    </ProvRow>
                  ))}
              </Section>
              <Section
                title="Awards & Honours"
                count={awards.length}
                contribute={contribute}
                href={recordHref(official.id, "award")}
                prompt="Add an award"
                hint="Honours and recognitions received."
              >
                  {awards.map((a) => (
                    <ProvRow key={a.id} v={a}>
                      <div className="flex justify-between gap-2">
                        <span className="font-heading text-sm font-semibold">{a.title}</span>
                        {a.year && <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">{a.year}</span>}
                      </div>
                      {a.awardedBy && <div className="text-[11.5px] text-slate-500 mt-0.5">{a.awardedBy}</div>}
                    </ProvRow>
                  ))}
              </Section>
              <Section
                title="Publications"
                count={pubs.length}
                contribute={contribute}
                href={recordHref(official.id, "publication")}
                prompt="Add a publication"
                hint="Books, papers, or articles they've authored."
              >
                  {pubs.map((p) => (
                    <div key={p.id} className="py-2">
                      <div className="font-serif italic text-base">&ldquo;{p.title}&rdquo;</div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">{[p.publisher, p.year].filter(Boolean).join(" · ")}</span>
                    </div>
                  ))}
              </Section>
            </div>
          </div>
        </Show>

        {/* legal & integrity — red register (personal legal + linked corruption) */}
        <Show when={legal.length > 0 || corruption.length > 0}>
          <section>
            <SecTitle title="Legal & Integrity" count={legal.length + corruption.length} red />
            {legal.map((l) => (
              <div key={l.id} className="grid grid-cols-[170px_1fr_auto] max-md:grid-cols-1 gap-6 max-md:gap-2.5 px-[22px] py-[18px] max-md:px-[18px] max-md:py-4 rounded-xl bg-red-500/[0.08] border border-red-500/30 mb-3 items-start">
                <div className="max-md:flex max-md:items-center max-md:justify-between">
                  <span className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-red-400">{l.caseType?.replace(/_/g, " ")}</span>
                  <div className="font-mono text-[11px] text-slate-500 mt-1 max-md:mt-0">{[l.caseNumber, [yearOf(l.filedDate), yearOf(l.resolvedDate)].filter(Boolean).join(" – ")].filter(Boolean).join(" · ")}</div>
                </div>
                <div>
                  <div className="font-heading text-base font-semibold">{l.title}</div>
                  {(l.forum || l.outcome) && <div className="text-[12.5px] text-slate-300/70 mt-1">{[l.forum, l.outcome].filter(Boolean).join(" — ")}</div>}
                  <div className="mt-2"><VChips v={l} /></div>
                  <Sources evidence={l.evidence} />
                </div>
                <div className="text-right max-md:text-left">
                  <span className="font-mono text-[10px] px-2.5 py-[3px] rounded-full text-red-400 border border-red-500/30 whitespace-nowrap capitalize">{l.status?.replace(/_/g, " ")}</span>
                </div>
              </div>
            ))}
            {corruption.map((c) => (
              <div key={c.id} className="grid grid-cols-[170px_1fr_auto] max-md:grid-cols-1 gap-6 max-md:gap-2.5 px-[22px] py-[18px] max-md:px-[18px] max-md:py-4 rounded-xl bg-red-500/[0.08] border border-red-500/30 mb-3 items-start">
                <div className="max-md:flex max-md:items-center max-md:justify-between">
                  <span className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-red-400">{c.case.caseType?.replace(/_/g, " ")}</span>
                  <div className="font-mono text-[11px] text-slate-500 mt-1 max-md:mt-0 capitalize">{c.roleInCase?.replace(/_/g, " ")}</div>
                </div>
                <div>
                  <Link href={`/case/${c.case.slug}`} className="font-heading text-base font-semibold hover:text-red-300">{c.case.title} →</Link>
                  {c.case.forum && <div className="text-[12.5px] text-slate-300/70 mt-1">{c.case.forum}</div>}
                  <div className="mt-2"><VChips v={c} /></div>
                  <Sources evidence={c.evidence} />
                </div>
                <div className="text-right max-md:text-left">
                  <span className="font-mono text-[10px] px-2.5 py-[3px] rounded-full text-red-400 border border-red-500/30 whitespace-nowrap capitalize">{c.case.status?.replace(/_/g, " ")}</span>
                  {c.case.amountInvolved != null && <div className="font-serif text-2xl text-red-500 mt-2">{formatNaira(c.case.amountInvolved)}</div>}
                </div>
              </div>
            ))}
          </section>
        </Show>
      </div>
    </div>
  );
}
