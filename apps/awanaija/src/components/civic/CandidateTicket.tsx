import Link from "next/link";
import { Show } from "@/components/ui/Show";
import { partyColor } from "@/lib/partyColors";
import { cn } from "@/lib/utils";

/** Someone on a ticket — the candidate, or their running mate. */
export interface TicketPerson {
  readonly name: string;
  readonly office?: string | null;
  readonly imageUrl?: string | null;
}

export interface TicketParty {
  readonly acronym: string;
  readonly name?: string | null;
  readonly logoUrl?: string | null;
  /** Enriched brand hex; falls back to PARTY_COLORS for the acronym. */
  readonly color?: string | null;
}

export type TicketSize = "sm" | "md" | "lg" | "rail" | "hero";

/**
 * The poster is authored once at its Figma size (404×695, node 132:2097); every
 * other size is that same artwork under a CSS transform driven by
 * `--ticket-scale`. Type, photo crops and the logo chip stay in exact
 * proportion at any width, and the responsive presets change size at a
 * breakpoint without a second copy of the markup.
 */
const SIZE_CLASS: Record<TicketSize, string> = {
  sm: "[--ticket-scale:0.26]", //     105px — mobile rail,     Figma 132:8124
  md: "[--ticket-scale:0.3535]", //   143px — mobile featured, Figma 132:9672
  lg: "[--ticket-scale:1]", //        404px — desktop,         Figma 132:2097
  rail: "[--ticket-scale:0.26] lg:[--ticket-scale:1]",
  hero: "[--ticket-scale:0.3535] lg:[--ticket-scale:1]",
};

/**
 * Candidate poster — the "ticket". Shared: the home hero rail, the party slate,
 * and any future surface that needs a candidate rendered large.
 *
 * Purely presentational. Sizing comes from `size`, never from the container.
 */
export function CandidateTicket({
  candidate,
  mate,
  party,
  size = "lg",
  shortName,
  unverified = false,
  partyHref,
  className,
}: {
  readonly candidate: TicketPerson;
  readonly mate?: TicketPerson | null;
  readonly party?: TicketParty | null;
  readonly size?: TicketSize;
  /** Override the headline (defaults to the candidate's surname). */
  readonly shortName?: string;
  /** No confirmed candidate yet — renders the silhouette placeholder. */
  readonly unverified?: boolean;
  /** Makes the party logo chip a link — e.g. to that party's slate. */
  readonly partyHref?: string;
  readonly className?: string;
}) {
  const brand = unverified ? "#00bc7d" : partyColor(party?.acronym, party?.color);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-[12px]",
        "h-[calc(695px*var(--ticket-scale))] w-[calc(404px*var(--ticket-scale))]",
        SIZE_CLASS[size],
        className,
      )}
      style={{ backgroundColor: brand }}
    >
      <div className="absolute left-0 top-0 h-[695px] w-[404px] origin-top-left scale-[var(--ticket-scale)]">
        {/* Raised-hands motif, tinted into the party colour. Figma 132:2101. */}
        <div className="pointer-events-none absolute left-[-124.87px] top-[-343.96px] flex h-[850.5px] w-[919.7px] items-center justify-center">
          {/* Local SVG: next/image would need dangerouslyAllowSVG for no gain. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/home/ticket-hands.svg"
            alt=""
            aria-hidden
            className="h-[592.57px] w-[737.35px] max-w-none rotate-[25.25deg]"
          />
        </div>

        <Show when={!unverified}>
          <TicketPhotos candidate={candidate} mate={mate} />
        </Show>
        <Show when={unverified}>
          <UnverifiedSilhouette />
        </Show>

        <p className="absolute left-[41px] top-[40px] w-[250px] font-sans text-white">
          <span className="text-[49px] font-bold leading-[55px]">
            {shortName ?? surnameOf(candidate.name)}
          </span>
          <Show when={Boolean(mate)}>
            <span className="text-[32px] font-medium leading-[38px]">
              {" & "}
              {surnameOf(mate?.name ?? "")}
            </span>
          </Show>
        </p>

        {/* Party logo chip, flush to the bottom-right corner. Figma 132:2105.
            With `partyHref` it's the way into that party's full slate. */}
        <Show when={Boolean(party?.logoUrl)}>
          <PartyChip party={party} href={partyHref} />
        </Show>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/long_logo_dark.svg"
          alt="OurNigeria"
          className="absolute left-[20px] top-[636px] h-[28px] w-[101px]"
        />
        <span className="absolute left-[20px] top-[664px] font-sans text-[12.5px] leading-[12px] text-black">
          www.ournigeria.ng
        </span>
      </div>
    </div>
  );
}

/** Party logo, flush to the poster's bottom-right corner. */
function PartyChip({
  party,
  href,
}: {
  readonly party?: TicketParty | null;
  readonly href?: string;
}) {
  const box = "absolute left-[303px] top-[604px] h-[91px] w-[101px] overflow-hidden rounded-l-[11px]";
  const logo = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={party?.logoUrl ?? ""}
      alt={party?.name ?? party?.acronym ?? ""}
      className="h-full w-full object-cover"
    />
  );

  if (!href) return <span className={box}>{logo}</span>;

  return (
    <Link href={href} className={cn(box, "transition-opacity hover:opacity-80")} aria-label={`See the ${party?.acronym} slate`}>
      {logo}
    </Link>
  );
}

/**
 * The two cut-out portraits. Photos are remote API images on hosts next/image
 * isn't configured for, so they stay plain <img> (same escape hatch SmartImage
 * takes for unknown hosts) — sized explicitly, never `auto`.
 */
function TicketPhotos({
  candidate,
  mate,
}: {
  readonly candidate: TicketPerson;
  readonly mate?: TicketPerson | null;
}) {
  return (
    <>
      <Show when={Boolean(mate?.imageUrl)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mate?.imageUrl ?? ""}
          alt={mate?.name ?? ""}
          className="absolute left-[196px] top-[266px] h-[342px] w-[236px] max-w-none object-cover object-top"
        />
      </Show>
      <Show when={Boolean(candidate.imageUrl)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={candidate.imageUrl ?? ""}
          alt={candidate.name}
          className="absolute left-[-24px] top-[100px] h-[595px] w-[300px] max-w-none object-cover object-top"
        />
      </Show>
    </>
  );
}

/** "Not yet verified" state — Figma 132:9732 and the desktop slate's third row. */
function UnverifiedSilhouette() {
  return (
    <svg
      viewBox="0 0 404 695"
      className="absolute inset-0 h-full w-full text-white"
      aria-hidden
    >
      <circle cx="202" cy="360" r="96" fill="currentColor" />
      <path d="M42 695c0-88 72-160 160-160s160 72 160 160z" fill="currentColor" />
    </svg>
  );
}

/**
 * Poster headline. Nigerian officials carry long honorifics
 * ("Asiwaju Bola Ahmed Adekunle Tinubu"), so the poster shows the surname —
 * callers with a better label pass `shortName`.
 */
function surnameOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length === 0 ? "" : parts[parts.length - 1];
}
