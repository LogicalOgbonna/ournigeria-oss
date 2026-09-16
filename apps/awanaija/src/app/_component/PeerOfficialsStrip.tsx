import Link from "next/link";
import { ArrowRight, Calendar, User } from "lucide-react";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import { PartyBadge } from "@/components/civic/PartyBadge";
import { Show } from "@/components/ui/Show";
import { cn } from "@/lib/utils";
import {
  CompletenessMeter,
  ContactRow,
  LeadershipChip,
  ProposedFlag,
  type LocalOfficial,
} from "./FeaturedOfficialCard";

/**
 * The rest of the viewer's representatives, three across under the state
 * snapshot — Figma 132:7105, with the "learn more about {state}" link.
 */
export function PeerOfficialsStrip({
  officials,
  title,
  moreHref,
  moreLabel,
  className,
  hiddenOnMobileIds,
}: {
  readonly officials: readonly LocalOfficial[];
  /** Overline in the card's top-right corner — labels the strip against the
   *  featured cards above it. DESIGN.md "Overline": mono, uppercase, muted. */
  readonly title?: string;
  readonly moreHref?: string;
  readonly moreLabel?: string;
  readonly className?: string;
  /** Ids promoted out of the strip on mobile — they get their own featured card
   *  higher up the page, so the peer entry is `hidden lg:flex` rather than a
   *  second list. CSS-only keeps one DOM for both breakpoints. */
  readonly hiddenOnMobileIds?: readonly string[];
}) {
  if (officials.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-border/60 bg-card/50 p-6 shadow-xl shadow-black/5 backdrop-blur-md",
        className,
      )}
    >
      <Show when={Boolean(title)}>
        <p className="mb-5 text-right font-[family-name:var(--font-mono)] text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      </Show>

      {/* Column count follows the card's own width, not the viewport: this strip
          lives in a 7/12 slot of a max-w-5xl grid, so a viewport-keyed
          `xl:grid-cols-3` produced ~180px columns that broke every name onto one
          word per line. auto-fit only adds a column when 200px still fits. */}
      <div className="grid gap-5 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        {officials.map((official) => (
          <PeerCard
            key={official.id}
            official={official}
            hiddenOnMobile={hiddenOnMobileIds?.includes(official.id)}
          />
        ))}
      </div>

      <Show when={Boolean(moreHref)}>
        <Link
          href={moreHref ?? "#"}
          className="mt-5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[1px] text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400"
        >
          {moreLabel ?? "Learn more"}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </Show>
    </div>
  );
}

function PeerCard({
  official,
  hiddenOnMobile,
}: {
  readonly official: LocalOfficial;
  readonly hiddenOnMobile?: boolean;
}) {
  const href = official.missing
    ? official.missingHref
    : `/officials/${official.slug ?? official.id}`;

  const body = (
    <>
      <div className="relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-[4px] border border-white/20 bg-emerald-950">
        <OfficialAvatar
          src={official.imageUrl}
          alt={official.name}
          px={100}
          imgClassName="h-[100px] w-[100px] object-cover object-top"
          fallback={
            <div className="grid h-[100px] w-[100px] place-items-center">
              <User className="h-8 w-8 text-white/50" />
            </div>
          }
        />
        <Show when={Boolean(official.party)}>
          <PartyBadge
            acronym={official.party ?? ""}
            logoUrl={official.partyLogoUrl}
            className="absolute bottom-[2px] left-[2px]"
          />
        </Show>
      </div>

      {/* Fixed to the thumbnail's height so a card never grows past its own
          photo, with the term pinned to the bottom edge — it is the last line
          and sits level with the bottom of the image on every card, whatever
          badges the middle happens to hold. The name may take two lines; the
          middle band then shrinks rather than pushing the term down.
          The thumbnail is 100px rather than the original 86px because the band
          stacks one item per line (contact icons and the completeness meter must
          not share a row): 2-line name + role + contact + meter + term needs
          ~99px, which 86px could only have fitted by truncating names. */}
      <div className="flex h-[100px] min-w-0 flex-1 flex-col">
        {/* Clamped to keep the card within the photo's height; `title` keeps the
            full name and the full constituency reachable on hover, since a role
            like "House of Reps (Ado/Ogbadibo/Okpokwu)" will not fit one line. */}
        <p
          title={official.missing ? undefined : official.name}
          className="line-clamp-2 break-words font-sans text-[14px] font-semibold leading-[18px] text-foreground"
        >
          {official.missing ? `Unknown ${official.shortRole ?? official.role}` : official.name}
        </p>
        <p
          title={official.role}
          className="line-clamp-1 font-sans text-[12px] font-medium leading-[15px] text-emerald-600 dark:text-emerald-400"
        >
          {official.role}
        </p>

        {/* One item per line — the contact icons never sit alongside the
            completeness bar. */}
        <span className="flex min-h-0 flex-1 flex-col items-start gap-y-0.5 overflow-hidden pt-0.5">
          <LeadershipChip role={official.leadershipRole} compact />
          <ProposedFlag when={official.proposed} compact />
          <ContactRow official={official} compact />
          <CompletenessMeter value={official.completeness} compact />
        </span>

        <Show when={Boolean(official.term)}>
          <span className="flex items-center gap-1.5 font-sans text-[11px] leading-[15px] text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            {official.term}
          </span>
        </Show>
      </div>
    </>
  );

  const shell = hiddenOnMobile ? "hidden lg:flex" : "flex";

  if (!href) return <div className={cn(shell, "items-start gap-[10px]")}>{body}</div>;

  // Stretched link rather than a wrapper — ContactRow renders real <a> elements,
  // and an anchor may not nest inside an anchor.
  return (
    <div
      className={cn(
        shell,
        "relative items-start gap-[10px] transition-opacity hover:opacity-80",
      )}
    >
      {body}
      <Link
        href={href}
        aria-label={official.missing ? `Help identify the ${official.role}` : official.name}
        className="absolute inset-0 z-0 rounded-[8px]"
      />
    </div>
  );
}
