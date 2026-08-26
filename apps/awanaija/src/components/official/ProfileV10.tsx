"use client";

/**
 * ProfileV10 — the official profile redesigned to the Figma card system
 * (Our Nigeria file p3jbyNLxvYaup0DwYgbLTH: nodes 299-986 / 245-485 /
 * 194-11859 / 299-1130). Successor candidate to MagazineProfile (V9), which
 * stays untouched — this component is swapped in on /preview/officials/[slug].
 *
 * Same data contract and contribution flows as V9, new presentation:
 * near-black page, #060a08 cards with thin #3c4a3f borders, serif-italic card
 * titles, an accent-green name, a 4-cell stats band (desktop), and per-section
 * cards laid on a 6-column grid. Empty sections render the Figma "Submit a
 * Record" card variant; filled sections carry a small ⊕ add-record corner
 * link. Verification chips, expandable source lists, and the red Legal &
 * Integrity register are kept from V9, restyled to fit the card look.
 */

import { useEffect, useRef, useState } from "react";
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

/* ---------- palette (Figma tokens) ---------- */

// The branded CV PDF (cv-pdf.tsx) works end-to-end but its design is not yet
// concluded — flip to true to bring the Download CV button back.
const SHOW_DOWNLOAD_CV = false;

const CARD = "bg-[#060a08] border border-[#3c4a3f] rounded-lg";
const DIVIDER = "border-b border-[rgba(60,74,63,0.3)] last:border-0";
const ACCENT = "#43ee94";

/* ---------- labels + formatters (same semantics as V9) ---------- */

const ROLE_LABELS: Record<string, string> = {
  governor: "Governor",
  deputy_governor: "Deputy Governor",
  senator: "Senator",
  representative: "Federal Representative",
  rep: "Federal Representative",
  mha: "State Assembly Member",
  lga_chairman: "LGA Chairman",
  councilor: "Councilor",
};

const TYPE_LABELS: Record<string, string> = {
  elected: "Elected Official",
  appointed: "Appointed Official",
  civil_servant: "Civil Servant",
  judicial: "Judicial Officer",
  security: "Security Official",
  traditional: "Traditional Ruler",
  other: "Public Official",
};

function yearOf(iso: string | null): string | null {
  return iso ? iso.split("-")[0] : null;
}

function roleLabel(role?: string | null): string {
  if (!role) return "Official";
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function yearRange(start: number | null, end: number | null): string {
  if (start && end) return `${start} – ${end}`;
  if (start) return `${start} – Present`;
  if (end) return `${end}`;
  return "";
}

function dateRange(start: string | null, end: string | null, current?: boolean): string {
  const s = yearOf(start);
  if (current || (!end && s)) return s ? `${s} – Present` : "Present";
  const e = yearOf(end);
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

/* ---------- contribution hrefs (same routes as V9) ---------- */

function proposalHref(officialId: string, field?: string): string {
  const base = `/proposals/new?officialId=${encodeURIComponent(officialId)}`;
  return field ? `${base}&targetField=${field}` : base;
}

function recordHref(officialId: string, recordType: string): string {
  return `/preview/proposals/new?officialId=${encodeURIComponent(officialId)}&recordType=${encodeURIComponent(recordType)}`;
}

/* ---------- icons ---------- */

const PLUS_ICON = (
  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 3.5v9M3.5 8h9" /></svg>
);

const PIN_ICON = (
  <svg width="10" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 14s5-4.4 5-8a5 5 0 0 0-10 0c0 3.6 5 8 5 8Z" /><circle cx="8" cy="6" r="1.8" /></svg>
);

const DOWNLOAD_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5" /><path d="M12 11v6" /><path d="m9.5 14.5 2.5 2.5 2.5-2.5" /></svg>
);

const CONTACT_ICONS: Record<string, React.ReactNode> = {
  tel: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2.5h2.5l1 3-1.5 1a8.5 8.5 0 0 0 4.5 4.5l1-1.5 3 1V13a1.5 1.5 0 0 1-1.6 1.5C6.5 14 2 9.5 1.5 4.1A1.5 1.5 0 0 1 3 2.5Z" /></svg>,
  mail: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="3" width="13" height="10" rx="1.5" /><path d="m2 4 6 5 6-5" /></svg>,
  office: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M8 14s5-4.4 5-8a5 5 0 0 0-10 0c0 3.6 5 8 5 8Z" /><circle cx="8" cy="6" r="1.8" /></svg>,
  x: <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M9.3 6.9 14.6 1h-1.3L8.7 6.1 5.1 1H1l5.6 8L1 15h1.3l4.9-5.5L11 15h4.1L9.3 6.9Zm-1.7 2-.6-.8L2.7 2h1.9l3.7 5.2.6.8 4.7 6.7h-1.9L7.6 8.9Z" /></svg>,
  facebook: <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M9.1 15V9.2h2l.3-2.3H9.1V5.4c0-.7.2-1.1 1.1-1.1h1.2V2.1C11.2 2 10.5 2 9.8 2 8 2 6.7 3.1 6.7 5.2v1.7h-2v2.3h2V15h2.4Z" /></svg>,
};

/* ---------- verification + evidence atoms (kept from V9, restyled) ---------- */

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
        ? { text: "✓ verified", cls: "text-emerald-400 border-[#3c4a3f]" }
        : { text: "unreviewed", cls: "text-slate-500 border-[#3c4a3f]" };
  return (
    <span className="inline-flex gap-1.5 items-center flex-wrap">
      <span className={`font-mono text-[9px] tracking-[0.1em] uppercase px-1.5 py-px rounded-full border ${CONF_CLS[v.confidence] ?? CONF_CLS.medium}`}>{v.confidence}</span>
      <span className={`font-mono text-[9px] tracking-[0.08em] px-1.5 py-px rounded-full border ${status.cls}`}>{status.text}</span>
    </span>
  );
}

/** Per-row verification footer: chips only. Source access lives in the
 *  card-level seal popover (VerifyBadge) everywhere, including Legal. */
function ProvFooter({ v }: { v: ProvFields }) {
  return (
    <div className="mt-1.5 flex gap-2.5 items-center flex-wrap">
      <VChips v={v} />
    </div>
  );
}

/* ---------- verification badge (Figma 386-487) ---------- */

// lucide badge-check — the rosette seal used across the design system
const SEAL_ICON = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const ARROW_ICON = (
  <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
);

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Tiny favicon with a first-letter fallback (favicon fetched from the
 *  DuckDuckGo icon service — source domains are public records, low risk). */
function SourceFavicon({ domain }: { domain: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[2px] bg-[#3c4a3f] font-mono text-[8px] uppercase text-[#bbcbbc]">
        {domain[0]}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
      alt=""
      className="h-[14px] w-[14px] shrink-0 rounded-[2px] object-contain"
      onError={() => setFailed(true)}
    />
  );
}

/**
 * Per-card verification seal. Green when the card's records carry evidence —
 * hovering/tapping opens the "Verified from" popover listing source domains.
 * Grey when the card has data but no evidence yet — the popover invites
 * verification ("Help us verify" → the section's record form).
 */
function VerifyBadge({ evidence, helpHref, title }: { evidence: Evidence[]; helpHref?: string; title: string }) {
  // Hover opens transiently (desktop); click/tap pins it open (touch, and
  // keeps it up after the pointer leaves). Kept separate so the click doesn't
  // fight the hover-open that a mouse click always triggers first.
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;
  const rootRef = useRef<HTMLDivElement>(null);

  // A pinned popover dismisses on tap/click anywhere outside it, or Escape.
  useEffect(() => {
    if (!pinned) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setPinned(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPinned(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pinned]);
  const seen = new Set<string>();
  const domains: { domain: string; url: string }[] = [];
  for (const e of evidence) {
    const domain = hostnameOf(e.url);
    if (domain && !seen.has(domain)) {
      seen.add(domain);
      domains.push({ domain, url: e.url });
    }
  }
  const verified = domains.length > 0;
  const shown = domains.slice(0, 4);
  const extra = domains.length - shown.length;

  return (
    <div
      ref={rootRef}
      className="relative mt-4 inline-block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-label={verified ? `${title}: verified — view sources` : `${title}: unverified — help us verify`}
        onClick={() => setPinned((p) => !p)}
        className={`flex items-center transition-colors ${verified ? "text-[#43ee94] hover:text-emerald-300" : "text-[#5c6b63] hover:text-[#bbcbbc]"}`}
      >
        {SEAL_ICON}
      </button>
      <Show when={open}>
        <div className="absolute left-0 top-full z-50 mt-1.5 w-[220px] rounded-[5px] bg-[#131813] border border-[#242e24] p-3 shadow-lg shadow-black/50">
          <div className="font-sans text-[11px] text-white mb-2">{verified ? "Verified from" : "Unverified"}</div>
          <div className="flex flex-col gap-1">
            {verified ? (
              <>
                {shown.map(({ domain, url }) => (
                  <a
                    key={domain}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-7 items-center gap-2 rounded-[3px] bg-[#242e24] px-2 transition-colors hover:bg-[#2e3a2e]"
                  >
                    <SourceFavicon domain={domain} />
                    <span className="flex-1 truncate font-sans text-[10px] font-light text-white">{domain}</span>
                    <span className="shrink-0 text-[#bbcbbc]">{ARROW_ICON}</span>
                  </a>
                ))}
                {extra > 0 && (
                  <div className="px-2 pt-1 font-sans text-[9px] text-[#5c6b63]">+{extra} more source{extra > 1 ? "s" : ""}</div>
                )}
              </>
            ) : helpHref ? (
              <Link
                href={helpHref}
                className="flex h-7 items-center gap-2 rounded-[3px] bg-[#242e24] px-2 transition-colors hover:bg-[#2e3a2e]"
              >
                <span className="flex-1 truncate font-sans text-[10px] font-light text-white">Help us verify</span>
                <span className="shrink-0 text-[#bbcbbc]">{ARROW_ICON}</span>
              </Link>
            ) : (
              <div className="px-2 py-1 font-sans text-[10px] font-light text-[#bbcbbc]">No public sources on file yet.</div>
            )}
          </div>
        </div>
      </Show>
    </div>
  );
}

/** Party flag circle for affiliation rows — logo when available (white disc so
 *  transparent PNGs stay legible), acronym fallback when missing or broken. */
function PartyFlag({ acronym, logo, current }: { acronym: string; logo?: string; current: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-[#2a2a2a] font-sans text-[8px] font-bold ${current ? "border-[#43ee94] text-[#43ee94]" : "border-[#3c4a3f] text-[#bbcbbc]"}`}>
      {logo && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={acronym} className="h-full w-full bg-white object-contain p-0.5" onError={() => setFailed(true)} />
      ) : (
        acronym.slice(0, 3).toUpperCase()
      )}
    </span>
  );
}

/* ---------- card system ---------- */

/** "Submit a Record" pill — the Figma empty-state action. */
function SubmitRecordPill({ href, label = "Submit a Record" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center px-[18px] py-[7px] rounded-full bg-[#2a2a2a] border border-[#3c4a3f] font-sans text-xs text-[#e5e2e1] transition-colors hover:border-emerald-400/60 hover:text-emerald-300"
    >
      {label}
    </Link>
  );
}

/** Dashed inline add-prompt (V9's AddPrompt style) — kept for scalar gaps
 *  (photo, bio, contact channels) where a centered card would be too heavy. */
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

/**
 * A profile section card. Empty + contribute → the Figma empty variant
 * (centered serif-italic title, hint, Submit a Record pill). Filled → header
 * with a small ⊕ corner link to add another record, then the rows.
 */
function SectionCard({
  title, count, hint, href, contribute, span, records, children,
}: {
  title: string;
  count: number;
  hint: string;
  href: string;
  contribute?: boolean;
  span?: string;
  /** The card's provenance-bearing rows — drives the verification seal.
   *  Omit to render the card without a seal (e.g. no provenance model). */
  records?: ProvFields[];
  children?: React.ReactNode;
}) {
  if (count === 0 && !contribute) return null;
  if (count === 0) {
    return (
      <section className={`${CARD} ${span ?? ""} flex flex-col items-center justify-center text-center gap-3.5 px-6 py-10`}>
        <h2 className="font-serif italic font-normal text-xl text-[#e5e2e1] m-0">{title}</h2>
        <p className="font-sans text-xs text-[#bbcbbc] m-0">{hint}</p>
        <SubmitRecordPill href={href} />
      </section>
    );
  }
  return (
    <section className={`${CARD} ${span ?? ""} p-6`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="font-serif italic font-normal text-xl text-[#e5e2e1] m-0">{title}</h2>
        <Show when={!!contribute}>
          <Link
            href={href}
            title={`Add to ${title}`}
            className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#3c4a3f] text-[#bbcbbc] transition-colors hover:border-emerald-400/60 hover:text-emerald-400"
          >
            {PLUS_ICON}
          </Link>
        </Show>
      </div>
      {children}
      <Show when={!!records}>
        <VerifyBadge
          evidence={(records ?? []).flatMap((r) => r.evidence ?? [])}
          helpHref={href}
          title={title}
        />
      </Show>
    </section>
  );
}

/* ---------- hero pieces ---------- */

function ContactPills({ official, contribute }: { official: Official; contribute?: boolean }) {
  const tw = official.twitterHandle?.replace(/^@/, "").replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, "");
  const fb = official.facebookUrl;
  const items: { k: string; label: string; href: string | null }[] = [
    official.phoneNumber ? { k: "tel", label: official.phoneNumber, href: `tel:${official.phoneNumber.replace(/[^+\d]/g, "")}` } : null,
    official.email ? { k: "mail", label: official.email, href: `mailto:${official.email}` } : null,
    official.officeAddress ? { k: "office", label: official.officeAddress, href: null } : null,
    tw ? { k: "x", label: "X (Twitter)", href: `https://x.com/${tw}` } : null,
    fb ? { k: "facebook", label: "Facebook", href: /^https?:\/\//.test(fb) ? fb : `https://${fb.replace(/^\/+/, "")}` } : null,
  ].filter(Boolean) as { k: string; label: string; href: string | null }[];

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
  const cls = "inline-flex items-center gap-1.5 px-3 py-[7px] rounded-full bg-[#201f1f] border border-[#3c4a3f] transition-colors hover:border-emerald-400/50 max-w-full";
  const addCls = "inline-flex items-center gap-1.5 px-3 py-[7px] rounded-full border border-dashed border-emerald-400/35 bg-emerald-400/[0.04] transition-colors hover:border-emerald-400/60 hover:bg-emerald-400/[0.09] max-w-full";
  return (
    <div className="flex flex-wrap gap-2.5 mt-4 pt-4 border-t border-[rgba(60,74,63,0.3)] justify-center md:justify-start w-full">
      {items.map(({ k, label, href }) => {
        const inner = (
          <>
            <span className="text-[#e5e2e1] shrink-0">{CONTACT_ICONS[k]}</span>
            <span className="font-sans text-[11px] font-semibold text-[#e5e2e1] truncate">{label}</span>
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
          <span className="font-sans text-[11px] font-semibold text-emerald-400/80 truncate">{label}</span>
        </Link>
      ))}
    </div>
  );
}

function CompletenessBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2.5 mt-4 w-full max-w-[280px] mx-auto md:mx-0">
      <div className="flex-1 h-[5px] rounded-full bg-[#3c4a3f] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundImage: "linear-gradient(90deg, #013525 0%, #4cffc9 100%)" }}
        />
      </div>
      <span className="font-sans text-[11px] text-[#bbcbbc] whitespace-nowrap">{pct}% complete</span>
    </div>
  );
}

function HeroPhoto({ official, contribute }: { official: Official; contribute?: boolean }) {
  const [imgError, setImgError] = useState(false);
  const hasPhoto = Boolean(official.imageUrl) && !imgError;
  const box = "w-[170px] h-[180px] md:w-[265px] md:h-[278px] rounded-2xl overflow-hidden";

  if (hasPhoto) {
    return (
      <div className={`${box} border border-[#3c4a3f] bg-[#060a08]`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={official.imageUrl!} alt={official.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
      </div>
    );
  }
  const block = (
    <div className={`${box} relative bg-gradient-to-b from-[#43ee94] to-[#0f9d64] flex items-center justify-center`}>
      <span className="font-serif text-[52px] md:text-[68px] text-[#04150d]/70">{initialsOf(official.name)}</span>
      <Show when={!!contribute}>
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0f9d64] shadow-md transition-transform group-hover:scale-105">
          <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3.5v9M3.5 8h9" /></svg>
        </span>
      </Show>
    </div>
  );
  return contribute ? (
    <Link href={proposalHref(official.id, "imageUrl")} title="Add a photo" className="group block">
      {block}
    </Link>
  ) : (
    block
  );
}

/* ---------- download CV ---------- */

function DownloadCvButton({ official }: { official: Official }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const { downloadOfficialCv } = await import("./cv-pdf");
          await downloadOfficialCv(official);
        } finally {
          setBusy(false);
        }
      }}
      className="flex items-end gap-1.5 text-[#e5e2e1] transition-colors hover:text-emerald-400 disabled:opacity-60"
    >
      {DOWNLOAD_ICON}
      <span className="font-sans text-[13px] leading-none">{busy ? "Preparing CV…" : "Download CV"}</span>
    </button>
  );
}

/* ---------- stats band (desktop) ---------- */

function StatsBand({
  official, elections, positions, latestAsset, legalCount, contribute,
}: {
  official: Official;
  elections: ElectionRecord[];
  positions: Position[];
  latestAsset: number | null;
  legalCount: number;
  contribute?: boolean;
}) {
  const electionsWon = elections.filter((e) => e.result?.toLowerCase() === "won").length;
  const cells: { n: string; l: string; cls?: string; href?: string; empty?: boolean }[] = [
    elections.length > 0
      ? { n: `${electionsWon} / ${elections.length}`, l: "Elections Won" }
      : { n: "--", l: "Elections Won", empty: true, href: contribute ? recordHref(official.id, "election") : undefined },
    positions.length > 0
      ? { n: String(positions.length), l: "Public Offices" }
      : { n: "--", l: "Public Offices", empty: true, href: contribute ? proposalHref(official.id) : undefined },
    latestAsset != null
      ? { n: formatNaira(latestAsset)!, l: "Assets Declared", cls: "text-amber-400" }
      : { n: "--", l: "Assets Declared", empty: true, href: contribute ? recordHref(official.id, "asset_declaration") : undefined },
    // Legal is never an invitation to add (defamation risk) — count or a neutral "--".
    legalCount > 0
      ? { n: String(legalCount), l: "Legal Records", cls: "text-red-500" }
      : { n: "--", l: "Legal Records", empty: true },
  ];
  return (
    <div className="hidden md:grid grid-cols-4 gap-4 mt-8">
      {cells.map((s) => {
        const inner = (
          <>
            <div className={`font-sans text-[29px] text-center ${s.empty ? "text-[#43ee94]/60" : s.cls ?? "text-[#43ee94]"}`}>{s.n}</div>
            <div className="font-sans text-[11px] font-medium tracking-[0.1em] text-center text-[#bbcbbc] mt-1">{s.l}</div>
          </>
        );
        return s.empty && s.href ? (
          <Link key={s.l} href={s.href} className={`${CARD} py-5 px-4 block transition-colors hover:border-emerald-400/50`}>{inner}</Link>
        ) : (
          <div key={s.l} className={`${CARD} py-5 px-4`}>{inner}</div>
        );
      })}
    </div>
  );
}

/* ---------- page ---------- */

export function ProfileV10({
  official,
  contribute = true,
  partyLogos = {},
}: {
  official: Official;
  contribute?: boolean;
  /** acronym (uppercase) → logo URL, from GET /api/parties — party flags on affiliation rows. */
  partyLogos?: Record<string, string>;
}) {
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

  const subtitle = current
    ? roleLabel(current.role)
    : official.officialType
      ? (TYPE_LABELS[official.officialType] ?? "Public Official")
      : "Official";
  const stateLabel = current?.state ? `${current.state} State`.toUpperCase().replace(/ STATE STATE$/, " STATE") : null;
  const stateHref = current?.stateCode
    ? `/states/${current.stateCode}`
    : current?.state
      ? `/states/${current.state.toLowerCase().replace(/\s+/g, "-")}`
      : null;
  const jurisdiction = current ? positionScope(current) : null;
  const completeness = Math.round((official.completenessScore ?? 0) * 100);
  const bio = official.biography;
  const latestAsset = assets.map((a) => a.amount).find((a) => a != null) ?? null;
  const legalCount = legal.length + corruption.length;

  return (
    <div className="bg-[#030403] text-[#e5e2e1] font-sans min-h-screen">
      <div className="max-w-[960px] mx-auto px-4 md:px-6 pt-6 pb-16">
        <BackButton
          fallbackHref="/officials"
          fallbackLabel="officials"
          className="gap-2.5 whitespace-nowrap text-slate-300/70 hover:text-emerald-400 mb-6"
        />

        {/* bordered profile container (border on desktop only, per Figma) */}
        <div className="md:border md:border-[rgba(224,224,224,0.21)] md:rounded-[25px] md:p-8 lg:p-10">
          {/* Download CV — desktop, top-right per Figma. Generates the branded
              OurNigeria PDF (cv-pdf.tsx), lazy-loading react-pdf on click.
              Hidden behind the flag until the CV design is concluded. */}
          <Show when={SHOW_DOWNLOAD_CV}>
            <div className="hidden md:flex justify-end mb-2">
              <DownloadCvButton official={official} />
            </div>
          </Show>
          {/* hero */}
          <div className="flex flex-col items-center text-center md:flex-row md:items-start md:text-left gap-6 md:gap-10">
            <div className="shrink-0">
              <HeroPhoto official={official} contribute={contribute} />
            </div>
            <div className="flex-1 min-w-0 w-full md:pt-1">
              <h1 className="font-serif font-normal text-4xl md:text-5xl leading-[1.15] tracking-[-0.02em] text-[#43ee94] m-0">
                {official.name}
              </h1>
              <div className="font-sans text-lg md:text-xl text-[#bbcbbc] mt-2">
                {subtitle}
                {current?.party ? (
                  <>
                    {" • "}
                    <Link
                      href={`/parties/${current.party}`}
                      className="transition-colors hover:text-[#43ee94]"
                      title={current.partyName ?? current.party}
                    >
                      {current.party}
                    </Link>
                  </>
                ) : null}
              </div>
              <Show when={!!(stateLabel || jurisdiction)}>
                {stateHref && stateLabel ? (
                  <Link
                    href={stateHref}
                    className="flex items-center gap-1.5 justify-center md:justify-start mt-1.5 text-[#bbcbbc] transition-colors hover:text-[#43ee94]"
                  >
                    {PIN_ICON}
                    <span className="font-sans text-[10px] font-semibold tracking-[0.05em] uppercase">{stateLabel}</span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-1.5 justify-center md:justify-start mt-1.5 text-[#bbcbbc]">
                    {PIN_ICON}
                    <span className="font-sans text-[10px] font-semibold tracking-[0.05em] uppercase">
                      {stateLabel ?? jurisdiction}
                    </span>
                  </div>
                )}
              </Show>
              <ContactPills official={official} contribute={contribute} />
              <CompletenessBar pct={completeness} />
            </div>
          </div>

          {/* biography — not in the Figma frames but kept for data completeness */}
          <Show when={!!bio}>
            <p className="font-sans text-sm md:text-[15px] leading-[1.7] text-[#bbcbbc] max-w-[720px] mt-7 mx-auto md:mx-0 text-center md:text-left">{bio}</p>
          </Show>
          <Show when={!bio && !!contribute}>
            <div className="mt-7 max-w-[720px] mx-auto md:mx-0">
              <AddPrompt
                href={proposalHref(official.id, "biography")}
                title="Add a biography"
                hint="Their background, career, and what they're known for."
              />
            </div>
          </Show>

          {/* pull-stat band (desktop) */}
          <StatsBand
            official={official}
            elections={elections}
            positions={positions}
            latestAsset={latestAsset}
            legalCount={legalCount}
            contribute={contribute}
          />

          {/* section cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-5 mt-8">
            <SectionCard
              title="Political Career"
              count={positions.length}
              hint="Political positions held with dates"
              href={proposalHref(official.id)}
              contribute={contribute}
              records={[]}
              span="md:col-span-3"
            >
              <div className="flex flex-col gap-4">
                {positions.map((p) => (
                  <div key={p.id} className={`border-l-2 pl-3.5 py-1 ${p.isCurrent ? "border-[rgba(67,238,148,0.3)]" : "border-[#3c4a3f] opacity-70"}`}>
                    <div className={`font-sans text-[9px] font-bold tracking-[0.1em] uppercase ${p.isCurrent ? "text-[#43ee94]" : "text-[#bbcbbc]"}`}>
                      {dateRange(p.startDate, p.endDate, p.isCurrent)}
                    </div>
                    <div className="font-sans text-sm font-semibold text-[#e5e2e1] mt-0.5">{roleLabel(p.role)}</div>
                    <div className="font-sans text-[10px] font-semibold text-[#bbcbbc] mt-0.5">
                      {[positionScope(p), p.party].filter(Boolean).join(" · ")}{p.endReason ? ` · ${p.endReason}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Education"
              count={education.length}
              hint="Schools, degrees, and the years attended"
              href={recordHref(official.id, "education")}
              contribute={contribute}
              records={education}
              span="md:col-span-3"
            >
              {education.map((e) => (
                <div key={e.id} className={`py-2.5 ${DIVIDER}`}>
                  <div className="flex justify-between gap-2 items-baseline">
                    <span className="font-sans text-sm text-[#e5e2e1]">{[e.qualification, e.field].filter(Boolean).join(" ") || e.institution}</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500 whitespace-nowrap">{yearRange(e.startYear, e.endYear)}</span>
                  </div>
                  {(e.qualification || e.field) && (
                    <div className="font-sans text-[10px] font-semibold text-[#bbcbbc] mt-0.5">{e.institution}</div>
                  )}
                  <ProvFooter v={e} />
                </div>
              ))}
            </SectionCard>

            <SectionCard
              title="Party Affiliations"
              count={parties.length}
              hint="Current and former parties with dates"
              href={recordHref(official.id, "party_affiliation")}
              contribute={contribute}
              records={parties}
              span="md:col-span-2"
            >
              {parties.map((p) => (
                <div key={p.id} className={`flex items-start gap-3 py-2.5 ${DIVIDER}`}>
                  <PartyFlag acronym={p.party} logo={partyLogos[p.party?.toUpperCase()]} current={!p.endDate} />
                  <div className="min-w-0">
                    <div className="font-sans text-[11px] text-[#e5e2e1] leading-snug">{p.partyName ?? p.party}</div>
                    <div className="font-sans text-[9px] font-medium tracking-[0.09em] text-[#43ee94] mt-0.5">
                      {!p.endDate ? "Current" : yearOf(p.endDate)}
                    </div>
                    <ProvFooter v={p} />
                  </div>
                </div>
              ))}
            </SectionCard>

            <SectionCard
              title="Elections Contested"
              count={elections.length}
              hint="Elections contested and results by year"
              href={recordHref(official.id, "election")}
              contribute={contribute}
              records={elections}
              span="md:col-span-4"
            >
              <div className="grid grid-cols-[3rem_1fr_3rem_3.5rem] gap-x-3 font-sans text-[9px] font-bold tracking-[0.1em] uppercase text-[#bbcbbc] pb-2">
                <span>Year</span><span>Office</span><span>Party</span><span className="text-right">Result</span>
              </div>
              {elections.map((e) => {
                const won = e.result?.toLowerCase() === "won";
                return (
                  <div key={e.id} className={`py-2 ${DIVIDER}`}>
                    <div className="grid grid-cols-[3rem_1fr_3rem_3.5rem] gap-x-3 items-baseline">
                      <span className="font-sans text-[11px] text-[#bbcbbc]">{e.year}</span>
                      <span className="font-sans text-[10px] text-[#bbcbbc] capitalize">
                        {e.electionType?.replace(/_/g, " ")}{e.isPrimary ? " (primary)" : ""}
                        {e.state || e.constituency || e.lga ? `, ${e.state || e.constituency || e.lga}` : ""}
                      </span>
                      <span className="font-sans text-[10px] text-[#bbcbbc]">{e.party ?? "—"}</span>
                      <span className={`font-sans text-[11px] text-right capitalize ${won ? "text-[#00d492]" : "text-slate-400"}`}>{e.result ?? "—"}</span>
                    </div>
                    <Show when={e.votes != null || (!won && !!e.winnerName)}>
                      <div className="font-sans text-[10px] text-slate-500 mt-0.5">
                        {e.votes != null ? `${e.votes.toLocaleString()} votes` : ""}{e.votePercentage != null ? ` · ${e.votePercentage}%` : ""}{!won && e.winnerName ? ` · lost to ${e.winnerName}` : ""}
                      </div>
                    </Show>
                    <ProvFooter v={e} />
                  </div>
                );
              })}
            </SectionCard>

            <SectionCard
              title="Asset Declarations"
              count={assets.length}
              hint="Declared assets and year filed"
              href={recordHref(official.id, "asset_declaration")}
              contribute={contribute}
              records={assets}
              span="md:col-span-2"
            >
              {assets.map((a) => (
                <div key={a.id} className={`py-2.5 ${DIVIDER}`}>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-sans text-sm font-bold text-[#e5e2e1]">{formatNaira(a.amount) ?? "—"}</span>
                    <Show when={!!a.declaredTo}>
                      <span className="font-sans text-[10px] text-[#464b48]">({a.declaredTo})</span>
                    </Show>
                  </div>
                  {a.summary && <div className="font-sans text-[10px] text-[#bbcbbc] mt-0.5">{a.summary}</div>}
                  <div className="font-sans text-[9px] font-medium tracking-[0.09em] text-[#43ee94] mt-1">{a.year}</div>
                  <ProvFooter v={a} />
                </div>
              ))}
            </SectionCard>

            <SectionCard
              title="Sponsored Bills"
              count={bills.length}
              hint="Bills they sponsored or co-sponsored"
              href={recordHref(official.id, "sponsored_bill")}
              contribute={contribute}
              records={bills}
              span="md:col-span-2"
            >
              {bills.map((b) => (
                <div key={b.id} className={`py-2 ${DIVIDER}`}>
                  <div className="flex justify-between items-baseline gap-3">
                    <span className="font-sans text-[11px] text-[#e5e2e1] leading-snug">{b.title}</span>
                    <Show when={!!(b.introducedDate || b.status)}>
                      <span className="font-sans text-[9px] font-medium tracking-[0.09em] text-[#43ee94] whitespace-nowrap">
                        {yearOf(b.introducedDate) ?? b.status}
                      </span>
                    </Show>
                  </div>
                  <ProvFooter v={b} />
                </div>
              ))}
            </SectionCard>

            <SectionCard
              title="Committees"
              count={committees.length}
              hint="Committees and the role they play on each"
              href={recordHref(official.id, "committee")}
              contribute={contribute}
              records={committees}
              span="md:col-span-2"
            >
              {committees.map((c) => (
                <div key={c.id} className={`py-2 ${DIVIDER}`}>
                  <div className="flex justify-between items-baseline gap-3">
                    <span className="font-sans text-[11px] text-[#e5e2e1] leading-snug">{c.committeeName}</span>
                    <span className="font-sans text-[9px] font-medium tracking-[0.09em] text-[#43ee94] whitespace-nowrap capitalize">{c.role}</span>
                  </div>
                  <ProvFooter v={c} />
                </div>
              ))}
            </SectionCard>

            <SectionCard
              title="Publications"
              count={pubs.length}
              hint="Books, papers or articles they've authored"
              href={recordHref(official.id, "publication")}
              contribute={contribute}
              records={pubs}
              span="md:col-span-3"
            >
              {pubs.map((p) => (
                <div key={p.id} className={`py-2.5 ${DIVIDER}`}>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-sans text-[10px] text-[#464b48]">Title</span>
                    <span className="font-sans text-[11px] font-semibold text-[#e5e2e1]">{p.title}</span>
                    <Show when={!!p.type}>
                      <span className="font-sans text-[10px] text-[#464b48] capitalize">{p.type}</span>
                    </Show>
                  </div>
                  <Show when={!!(p.publisher || p.year)}>
                    <div className="font-sans text-[10px] text-[#bbcbbc] mt-0.5">{[p.publisher, p.year].filter(Boolean).join(" · ")}</div>
                  </Show>
                </div>
              ))}
            </SectionCard>

            <SectionCard
              title="Career before politics"
              count={careers.length}
              hint="Work and roles before public office"
              href={recordHref(official.id, "career")}
              contribute={contribute}
              records={careers}
              span="md:col-span-3"
            >
              {careers.map((c) => (
                <div key={c.id} className={`py-2.5 ${DIVIDER}`}>
                  <div className="flex justify-between gap-2 items-baseline">
                    <span className="font-sans text-sm text-[#e5e2e1]">{c.role ?? c.organization}</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500 whitespace-nowrap">{yearRange(c.startYear, c.endYear)}</span>
                  </div>
                  <div className="font-sans text-[10px] font-semibold text-[#bbcbbc] mt-0.5">{[c.role ? c.organization : null, c.industry].filter(Boolean).join(" · ")}</div>
                  <ProvFooter v={c} />
                </div>
              ))}
            </SectionCard>

            <SectionCard
              title="Family"
              count={family.length}
              hint="Notable relatives in public life"
              href={recordHref(official.id, "family_member")}
              contribute={contribute}
              records={family}
              span="md:col-span-2"
            >
              {family.map((f) => (
                <div key={f.id} className={`py-2.5 ${DIVIDER}`}>
                  <div className="font-sans text-[9px] font-bold tracking-[0.1em] uppercase text-[#bbcbbc]">{f.relationship}</div>
                  <div className={`font-sans text-[12px] mt-0.5 ${f.relatedOfficial?.slug ? "text-[#43ee94]" : "text-[#e5e2e1]"}`}>
                    {f.relatedOfficial?.slug ? (
                      <Link href={`/officials/${f.relatedOfficial.slug}`} className="hover:underline">{f.name ?? f.relatedOfficial.name}</Link>
                    ) : (
                      f.name ?? "—"
                    )}
                    {f.isPublicFigure ? " — public figure" : ""}
                  </div>
                </div>
              ))}
            </SectionCard>

            <SectionCard
              title="Awards & Honours"
              count={awards.length}
              hint="Honours and recognitions received"
              href={recordHref(official.id, "award")}
              contribute={contribute}
              records={awards}
              span="md:col-span-4"
            >
              {awards.map((a) => (
                <div key={a.id} className={`py-2 ${DIVIDER}`}>
                  <div className="flex justify-between items-baseline gap-3">
                    <span className="font-sans text-[11px] text-[#e5e2e1] leading-snug">{a.title}</span>
                    <Show when={a.year != null}>
                      <span className="font-sans text-[9px] font-medium tracking-[0.09em] text-[#43ee94] whitespace-nowrap">{a.year}</span>
                    </Show>
                  </div>
                  {a.awardedBy && <div className="font-sans text-[10px] text-[#bbcbbc] mt-0.5">{a.awardedBy}</div>}
                  <ProvFooter v={a} />
                </div>
              ))}
            </SectionCard>

            {/* legal & integrity — red register, kept from V9. Never a
                contribution invitation (defamation risk): renders only with data. */}
            <Show when={legalCount > 0}>
              <section className={`${CARD} md:col-span-6 p-6 border-red-500/30`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="font-serif italic font-normal text-xl text-red-500 m-0">Legal &amp; Integrity</h2>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-red-400 mt-1.5">{legalCount}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {legal.map((l) => (
                    <div key={l.id} className="rounded-lg bg-red-500/[0.08] border border-red-500/30 px-4 py-3.5">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-red-400">{l.caseType?.replace(/_/g, " ")}</span>
                        <span className="font-mono text-[9.5px] px-2.5 py-[3px] rounded-full text-red-400 border border-red-500/30 whitespace-nowrap capitalize">{l.status?.replace(/_/g, " ")}</span>
                      </div>
                      <div className="font-sans text-sm font-semibold text-[#e5e2e1] mt-1.5">{l.title}</div>
                      {(l.forum || l.outcome) && <div className="font-sans text-[11px] text-[#bbcbbc] mt-0.5">{[l.forum, l.outcome].filter(Boolean).join(" — ")}</div>}
                      <div className="font-mono text-[10px] text-slate-500 mt-1">{[l.caseNumber, [yearOf(l.filedDate), yearOf(l.resolvedDate)].filter(Boolean).join(" – ")].filter(Boolean).join(" · ")}</div>
                      <ProvFooter v={l} />
                    </div>
                  ))}
                  {corruption.map((c) => (
                    <div key={c.id} className="rounded-lg bg-red-500/[0.08] border border-red-500/30 px-4 py-3.5">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-red-400">{c.case.caseType?.replace(/_/g, " ")} · {c.roleInCase?.replace(/_/g, " ")}</span>
                        <span className="font-mono text-[9.5px] px-2.5 py-[3px] rounded-full text-red-400 border border-red-500/30 whitespace-nowrap capitalize">{c.case.status?.replace(/_/g, " ")}</span>
                      </div>
                      <Link href={`/case/${c.case.slug}`} className="inline-block font-sans text-sm font-semibold text-[#e5e2e1] mt-1.5 hover:text-red-300">{c.case.title} →</Link>
                      {c.case.forum && <div className="font-sans text-[11px] text-[#bbcbbc] mt-0.5">{c.case.forum}</div>}
                      {c.case.amountInvolved != null && <div className="font-serif text-xl text-red-500 mt-1.5">{formatNaira(c.case.amountInvolved)}</div>}
                      <ProvFooter v={c} />
                    </div>
                  ))}
                </div>
                {/* seal like every other card; legal never invites contributions
                    (defamation risk), so no help link when unverified */}
                <VerifyBadge
                  evidence={[...legal, ...corruption].flatMap((r) => r.evidence ?? [])}
                  title="Legal & Integrity"
                />
              </section>
            </Show>
          </div>

          <Show when={!!contribute}>
            <p className="mt-8 flex items-center justify-center md:justify-start gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-400/70">
              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-emerald-400/40" style={{ color: ACCENT }}>{PLUS_ICON}</span>
              See a gap? Tap any card to help verify this profile.
            </p>
          </Show>
        </div>
      </div>
    </div>
  );
}
