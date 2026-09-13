import Image from "next/image";
import { isOptimizedImageSrc } from "@/lib/image-hosts";
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

/** A photo placed on the 404x695 poster, in poster coordinates. */
export interface TicketBox {
  readonly src: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/**
 * Per-poster artwork geometry, lifted from that ticket's Figma node.
 *
 * The designed posters are not one template with swapped photos — each has its
 * own background, crops and chip shape — so a ticket that has this renders from
 * it, and one that doesn't falls back to the generic layout below.
 */
export interface TicketArtwork {
  /** The poster's background fill. Deliberately not `PARTY_COLORS`. */
  readonly bg: string;
  /** Colour of the www.ournigeria.ng watermark; varies with the background. */
  readonly urlColor?: string;
  readonly candidate: TicketBox;
  readonly mate?: TicketBox;
  readonly chip: {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
    /** Tailwind radius classes for this chip's corners. */
    readonly radius: string;
    /** Posters that set the logo on a white card instead of bleeding it. */
    readonly plaque?: { readonly inset: { x: number; y: number; size: number } };
  };
  /** Blurred wash behind the chip, where the photo runs under it. */
  readonly scrim?: {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
    readonly color?: string;
    readonly opacity?: number;
  };
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

/** Widest the poster is ever painted, per preset — drives the image srcset. */
const SIZE_PX: Record<TicketSize, number> = {
  sm: 105,
  md: 143,
  lg: 404,
  rail: 404,
  hero: 404,
};

/**
 * Candidate poster — the "ticket". Shared: the home hero rail, the party slate,
 * and any future surface that needs a candidate rendered large.
 *
 * Presentational apart from `href`, which makes the whole poster a link.
 * Sizing comes from `size`, never from the container.
 */
export function CandidateTicket({
  candidate,
  mate,
  party,
  size = "lg",
  shortName,
  unverified = false,
  partyHref,
  href,
  art,
  priority = false,
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
  /** Makes the whole poster a link — e.g. to the ballot. */
  readonly href?: string;
  /** This poster's own Figma geometry; without it the generic layout is used. */
  readonly art?: TicketArtwork;
  /** Set on the first poster or two — the rest lazy-load. */
  readonly priority?: boolean;
  readonly className?: string;
}) {
  const brand = unverified ? "#00bc7d" : (art?.bg ?? partyColor(party?.acronym, party?.color));
  const px = SIZE_PX[size];

  return (
    <div
      className={cn(
        "group/ticket relative shrink-0 overflow-hidden rounded-[12px]",
        "h-[calc(695px*var(--ticket-scale))] w-[calc(404px*var(--ticket-scale))]",
        // Motion is opt-out via the global reduced-motion rule in globals.css.
        href && "transition-transform duration-200 hover:-translate-y-1",
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

        <Show when={!unverified && Boolean(art)}>
          <ArtworkPhotos art={art!} candidate={candidate} mate={mate} px={px} priority={priority} />
        </Show>
        <Show when={!unverified && !art}>
          <TicketPhotos candidate={candidate} mate={mate} px={px} priority={priority} />
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

        {/* Party logo chip. With `partyHref` it's the way into that party's
            full slate, and it sits above the poster-wide link overlay. */}
        <Show when={Boolean(party?.logoUrl)}>
          <PartyChip party={party} href={partyHref} art={art} px={px} />
        </Show>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/long_logo_dark.svg"
          alt="OurNigeria"
          className="absolute left-[20px] top-[636px] h-[28px] w-[101px]"
        />
        <span
          className="absolute left-[20px] top-[664px] font-sans text-[12.5px] leading-[12px]"
          style={{ color: art?.urlColor ?? "#ffffff" }}
        >
          www.ournigeria.ng
        </span>
      </div>

      {/* Poster-wide link. A stretched overlay rather than a wrapper, so the
          party chip can keep its own href — nesting one <a> inside another is
          invalid HTML and React will not render it as written. */}
      <Show when={Boolean(href)}>
        <Link
          href={href ?? "#"}
          aria-label={ticketLabel(candidate, mate, party)}
          className="absolute inset-0 z-10 rounded-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
        />
      </Show>
    </div>
  );
}

/** Accessible name for the poster-wide link, which holds no text of its own. */
function ticketLabel(
  candidate: TicketPerson,
  mate?: TicketPerson | null,
  party?: TicketParty | null,
): string {
  const names = mate ? `${candidate.name} and ${mate.name}` : candidate.name;
  return party?.acronym
    ? `${names}, ${party.acronym} — see the 2027 ballot`
    : `${names} — see the 2027 ballot`;
}

/** Party logo, positioned by the poster's own chip geometry when it has one. */
function PartyChip({
  party,
  href,
  art,
  px,
}: {
  readonly party?: TicketParty | null;
  readonly href?: string;
  readonly art?: TicketArtwork;
  readonly px: number;
}) {
  const chip = art?.chip;
  const box = cn(
    "absolute z-20 overflow-hidden",
    chip ? chip.radius : "rounded-l-[11px]",
  );
  const style = chip
    ? { left: chip.x, top: chip.y, width: chip.w, height: chip.h }
    : { left: 303, top: 604, width: 101, height: 91 };

  const alt = party?.name ?? party?.acronym ?? "";
  const src = party?.logoUrl ?? "";

  // A plaque poster insets a smaller logo on a white card; the rest bleed the
  // logo to fill the chip.
  // Party logos come from wherever the party record was sourced (Wikimedia,
  // party sites, our CDN) — an unconfigured host must render unoptimized
  // instead of crashing next/image (same rule as TicketProfile/DocsPanel).
  const optimized = isOptimizedImageSrc(src);
  const inner = chip?.plaque ? (
    <span className="absolute inset-0 bg-white">
      <Image
        src={src}
        alt={alt}
        unoptimized={!optimized}
        width={Math.round(chip.plaque.inset.size)}
        height={Math.round(chip.plaque.inset.size)}
        sizes={`${Math.max(1, Math.round(chip.plaque.inset.size * (px / 404)))}px`}
        className="absolute object-contain"
        style={{
          left: chip.plaque.inset.x,
          top: chip.plaque.inset.y,
          width: chip.plaque.inset.size,
          height: chip.plaque.inset.size,
        }}
      />
    </span>
  ) : (
    <Image
      src={src}
      alt={alt}
      unoptimized={!optimized}
      width={Math.round(style.width)}
      height={Math.round(style.height)}
      sizes={`${Math.max(1, Math.round(style.width * (px / 404)))}px`}
      className="h-full w-full object-cover"
    />
  );

  if (!href) return <span className={box} style={style}>{inner}</span>;

  return (
    <Link
      href={href}
      className={cn(box, "transition-opacity hover:opacity-80")}
      style={style}
      aria-label={`See the ${party?.acronym} slate`}
    >
      {inner}
    </Link>
  );
}

/**
 * Photos placed by this poster's own Figma geometry.
 *
 * Note these are plain conditionals, not `<Show>`: `Show` receives its children
 * as a prop, so the JSX — and every expression in it — is built before `Show`
 * decides. Anything dereferencing an optional slot has to narrow inside its own
 * component instead, which is why `Photo` and `Scrim` accept `undefined`.
 */
function ArtworkPhotos({
  art,
  candidate,
  mate,
  px,
  priority,
}: {
  readonly art: TicketArtwork;
  readonly candidate: TicketPerson;
  readonly mate?: TicketPerson | null;
  readonly px: number;
  readonly priority: boolean;
}) {
  return (
    <>
      <Photo box={art.mate} alt={mate?.name ?? ""} px={px} priority={priority} />
      <Photo box={art.candidate} alt={candidate.name} px={px} priority={priority} />
      <Scrim scrim={art.scrim} />
    </>
  );
}

/** Blurred wash so the logo reads where the photo runs under the chip. */
function Scrim({ scrim }: { readonly scrim?: TicketArtwork["scrim"] }) {
  if (!scrim) return null;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute blur-[46.7px]"
      style={{
        left: scrim.x,
        top: scrim.y,
        width: scrim.w,
        height: scrim.h,
        opacity: scrim.opacity ?? 1,
        background:
          scrim.color ??
          "linear-gradient(-3.37deg, rgb(19,19,19) 71.7%, rgba(121,121,121,0) 116.9%)",
      }}
    />
  );
}

/**
 * One placed photo. The files are local, so next/image handles format and the
 * responsive srcset; `sizes` is the poster's own width scaled to this preset,
 * because a CSS transform is invisible to the browser's own sizing.
 */
function Photo({
  box,
  alt,
  px,
  priority,
}: {
  readonly box?: TicketBox;
  readonly alt: string;
  readonly px: number;
  readonly priority: boolean;
}) {
  if (!box) return null;
  return (
    <Image
      src={box.src}
      alt={alt}
      unoptimized={!isOptimizedImageSrc(box.src)}
      width={Math.round(box.w)}
      height={Math.round(box.h)}
      priority={priority}
      sizes={`${Math.max(1, Math.round(box.w * (px / 404)))}px`}
      className="absolute max-w-none object-contain"
      style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
    />
  );
}

/**
 * The generic two-portrait layout, for tickets with no authored artwork (the
 * party slate, and anything fed straight from the API).
 */
function TicketPhotos({
  candidate,
  mate,
  px,
  priority,
}: {
  readonly candidate: TicketPerson;
  readonly mate?: TicketPerson | null;
  readonly px: number;
  readonly priority: boolean;
}) {
  return (
    <>
      <RemotePhoto
        src={mate?.imageUrl}
        alt={mate?.name ?? ""}
        box={{ left: 196, top: 266, width: 236, height: 342 }}
        px={px}
        priority={priority}
      />
      <RemotePhoto
        src={candidate.imageUrl}
        alt={candidate.name}
        box={{ left: -24, top: 100, width: 300, height: 595 }}
        px={px}
        priority={priority}
      />
    </>
  );
}

/**
 * Photos from the API live on hosts next/image isn't configured for, so they
 * stay a plain <img> (the same escape hatch SmartImage takes) — sized
 * explicitly, never `auto`. Local paths still go through the optimizer.
 */
function RemotePhoto({
  src,
  alt,
  box,
  px,
  priority,
}: {
  readonly src?: string | null;
  readonly alt: string;
  readonly box: { left: number; top: number; width: number; height: number };
  readonly px: number;
  readonly priority: boolean;
}) {
  if (!src) return null;
  const style = { left: box.left, top: box.top, width: box.width, height: box.height };

  if (src.startsWith("/")) {
    return (
      <Image
        src={src}
        alt={alt}
        width={box.width}
        height={box.height}
        priority={priority}
        sizes={`${Math.max(1, Math.round(box.width * (px / 404)))}px`}
        className="absolute max-w-none object-cover object-top"
        style={style}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className="absolute max-w-none object-cover object-top"
      style={style}
    />
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
