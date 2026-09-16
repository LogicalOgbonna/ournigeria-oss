import Link from "next/link";
import { AlertCircle, AtSign, Calendar, Mail, Phone, Star, User } from "lucide-react";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import { PartyBadge } from "@/components/civic/PartyBadge";
import { Show } from "@/components/ui/Show";
import { cn } from "@/lib/utils";

/** An official holding office over the viewer's location. */
export interface LocalOfficial {
  readonly id: string;
  readonly name: string;
  /** Printed office line, scoped to the place — "Executive Governor Abia State". */
  readonly role: string;
  /** Unscoped seat name for the vacant-seat line, so a missing holder reads
   *  "Unknown Governor" rather than "Unknown Executive Governor Abia State".
   *  Falls back to `role`. */
  readonly shortRole?: string | null;
  readonly term?: string | null;
  readonly party?: string | null;
  readonly partyLogoUrl?: string | null;
  readonly imageUrl?: string | null;
  readonly slug?: string | null;
  /** No verified holder for this seat — links to the contribution flow. */
  readonly missing?: boolean;
  readonly missingHref?: string;
  /** Citizen-proposed record, not yet verified. */
  readonly proposed?: boolean;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly twitter?: string | null;
  /** Leadership office held in the chamber (Speaker, Chief Whip, ...) — rare, high signal. */
  readonly leadershipRole?: string | null;
  /** 0..1 — how much of our record of this person is filled in. */
  readonly completeness?: number | null;
}

/** Shared "proposed · unverified" flag — the record is a citizen submission. */
export function ProposedFlag({
  when,
  compact,
}: {
  readonly when?: boolean;
  readonly compact?: boolean;
}) {
  return (
    <Show when={Boolean(when)}>
      <span
        title="Citizen-proposed record, not yet verified"
        className={cn(
          "inline-flex items-center gap-1 rounded border border-amber-500/20 bg-amber-500/10 font-semibold text-amber-600 dark:text-amber-400",
          compact ? "px-1 py-0 text-[9px] leading-[14px]" : "mt-1 px-1.5 py-0.5 text-[10px]",
        )}
      >
        <AlertCircle className={cn("shrink-0", compact ? "h-2 w-2" : "h-3 w-3")} />
        {compact ? "Proposed" : <>Proposed &middot; unverified</>}
      </span>
    </Show>
  );
}

/** Leadership office inside the chamber — Speaker, Deputy Speaker, Chief Whip.
 *  Set on ~2.5% of positions, so it is only ever an addition, never a gap: the
 *  chip simply doesn't render for the other 97%. Gold, per DESIGN.md's
 *  secondary accent (emerald is already carrying the office line). */
export function LeadershipChip({
  role,
  compact,
}: {
  readonly role?: string | null;
  readonly compact?: boolean;
}) {
  return (
    <Show when={Boolean(role)}>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-[6px] border border-amber-500/25 bg-amber-500/10 font-[family-name:var(--font-mono)] font-medium uppercase tracking-[0.5px] text-amber-700 dark:text-amber-400",
          compact
            ? "max-w-full px-1 py-0 text-[9px] leading-[14px]"
            : "mt-1 px-1.5 py-0.5 text-[10px]",
        )}
      >
        <Star className={cn("shrink-0 fill-current", compact ? "h-2 w-2" : "h-2.5 w-2.5")} />
        <span className="truncate">{role}</span>
      </span>
    </Show>
  );
}

/** mailto/tel/X links for an official.
 *
 * These are real anchors nested inside a card that is itself a link, so the
 * card uses the stretched-link pattern (`after:absolute after:inset-0` on the
 * card's own <Link>) rather than wrapping this row — nesting <a> inside <a> is
 * invalid HTML and React will not render it. `relative z-10` lifts each icon
 * back above the card's stretched hit area.
 */
export function ContactRow({
  official,
  compact,
  className,
}: {
  readonly official: LocalOfficial;
  readonly compact?: boolean;
  readonly className?: string;
}) {
  const handle = official.twitter?.replace(/^@/, "");
  const links = [
    official.email && { key: "email", href: `mailto:${official.email}`, Icon: Mail, label: `Email ${official.name}` },
    official.phone && { key: "phone", href: `tel:${official.phone}`, Icon: Phone, label: `Call ${official.name}` },
    handle && { key: "x", href: `https://x.com/${handle}`, Icon: AtSign, label: `${official.name} on X` },
  ].filter(Boolean) as ReadonlyArray<{ key: string; href: string; Icon: typeof Mail; label: string }>;

  if (links.length === 0) return null;

  return (
    <span className={cn("relative z-10 flex items-center gap-1", !compact && "mt-1.5", className)}>
      {links.map(({ key, href, Icon, label }) => (
        <a
          key={key}
          href={href}
          title={label}
          aria-label={label}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-grid shrink-0 place-items-center rounded-[6px] border border-border/60 bg-background/60 text-muted-foreground transition-colors hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400",
            compact ? "h-[18px] w-[18px]" : "h-6 w-6",
          )}
        >
          <Icon className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
        </a>
      ))}
    </span>
  );
}

/** How much of our record of this person is filled in.
 *
 * Every official has a score, and most are low (two thirds of the register sits
 * at or below 0.14), so this is deliberately a quiet 2px meter plus a mono
 * percentage rather than a loud warning — it reads as "here is what we still
 * owe you" and gives the contribute flow a reason to exist on the card. */
export function CompletenessMeter({
  value,
  compact,
}: {
  readonly value?: number | null;
  readonly compact?: boolean;
}) {
  if (value == null) return null;
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));

  return (
    <span
      className={cn("flex items-center gap-1.5", !compact && "mt-1.5")}
      title={`Our profile of this official is ${pct}% complete`}
    >
      <span
        className={cn(
          // Compact takes a fixed width: `w-full` collapses to nothing inside the
          // peer card's wrapping flex row.
          "h-[3px] overflow-hidden rounded-full bg-muted",
          compact ? "w-[40px] shrink-0" : "w-full max-w-[64px]",
        )}
      >
        <span className="block h-full rounded-full bg-emerald-500/70" style={{ width: `${pct}%` }} />
      </span>
      <span
        className={cn(
          "font-[family-name:var(--font-mono)] leading-none text-muted-foreground",
          compact ? "text-[9px]" : "text-[10px]",
        )}
      >
        {pct}%
      </span>
    </span>
  );
}

/**
 * The headline official for the viewer's area — a full-bleed portrait with the
 * party badge over it, name / office / term beneath. Figma 132:7085 + 132:7095.
 */
export function FeaturedOfficialCard({
  official,
  className,
}: {
  readonly official: LocalOfficial;
  readonly className?: string;
}) {
  const href = official.missing
    ? official.missingHref
    : `/officials/${official.slug ?? official.id}`;

  const card = (
    <>
      <div className="relative w-[222px] max-w-full overflow-hidden rounded-[10px] bg-emerald-500">
        <OfficialAvatar
          src={official.imageUrl}
          alt={official.name}
          px={222}
          imgClassName="h-[270px] w-[222px] max-w-full object-cover object-top"
          fallback={
            <div className="grid h-[270px] w-[222px] max-w-full place-items-center">
              <User className="h-20 w-20 text-white/70" />
            </div>
          }
        />
        <Show when={Boolean(official.party)}>
          <PartyBadge
            acronym={official.party ?? ""}
            logoUrl={official.partyLogoUrl}
            size="lg"
            className="absolute bottom-[5px] left-[7px]"
          />
        </Show>
      </div>

      <div className="mt-2 w-[222px] max-w-full">
        <p className="font-sans text-[14px] font-semibold leading-[20px] text-foreground">
          {official.missing ? `Unknown ${official.shortRole ?? official.role}` : official.name}
        </p>
        <p className="font-sans text-[12px] font-medium leading-[16px] text-emerald-600 dark:text-emerald-400">
          {official.role}
        </p>
        <LeadershipChip role={official.leadershipRole} />
        <ProposedFlag when={official.proposed} />
        <ContactRow official={official} />
        <CompletenessMeter value={official.completeness} />
        {/* Term last here too, matching the peer cards. */}
        <Show when={Boolean(official.term)}>
          <span className="mt-1.5 flex items-center gap-1.5 font-sans text-[11px] leading-[16.5px] text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            {official.term}
          </span>
        </Show>
      </div>
    </>
  );

  if (!href) return <div className={cn("block", className)}>{card}</div>;

  // Stretched link, not a wrapper: ContactRow renders real <a> elements and an
  // anchor may not nest inside an anchor. The overlay is positioned so it paints
  // above the static card content; ContactRow lifts itself back out with z-10.
  return (
    <div className={cn("group relative block transition-opacity hover:opacity-90", className)}>
      {card}
      <Link
        href={href}
        aria-label={official.missing ? `Help identify the ${official.role}` : official.name}
        className="absolute inset-0 z-0 rounded-[10px]"
      />
    </div>
  );
}
