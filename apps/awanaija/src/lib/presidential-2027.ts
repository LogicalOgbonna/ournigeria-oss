import type { RailCandidate } from "@/lib/mock-home-ballot";
import type { TicketArtwork } from "@/components/civic/CandidateTicket";

/**
 * The 2027 presidential field, as drawn in Figma `163:2` ("Frame 13") — nineteen
 * 404x695 ticket posters.
 *
 * Every poster is a bespoke composition: its own background colour, its own
 * portrait crops and mirroring, its own party-chip geometry. None of that is
 * derivable, so each ticket carries the numbers lifted from its Figma node. The
 * artwork lives in `public/presidential/`; see the header of `PRESIDENTIAL_BASE`
 * for how it moves to S3.
 *
 * The photos are pre-composited: Figma stacks a clean cut-out under a halftone
 * duotone overlay to get the print texture, and the two layers were flattened
 * into one alpha WebP at export time. Mirrors and tilts are baked in too, so
 * nothing here needs a CSS transform.
 */

/**
 * Images ship from `public/` today. They are also being uploaded to the S3
 * bucket behind `CDN_BASE_URL`; when that lands, point this at the CDN origin
 * and nothing else has to change.
 */
const BASE = process.env.NEXT_PUBLIC_PRESIDENTIAL_CDN?.replace(/\/+$/, "") ?? "/presidential";

const img = (file: string) => `${BASE}/${file}`;
const logo = (acronym: string) => `${BASE}/parties/${acronym.toLowerCase()}.webp`;

/** A ticket as authored: the two halves plus the poster's artwork geometry. */
interface Ticket {
  readonly id: string;
  readonly candidate: string;
  /** Surname as the poster prints it, when it differs from the full name. */
  readonly short?: string;
  readonly mate?: string;
  readonly party: string;
  readonly partyName: string;
  readonly art: TicketArtwork;
}

/**
 * Party colours here are the poster's own background fills, which deliberately
 * do NOT follow `PARTY_COLORS` (the APC card is red, not emerald). They ride in
 * as the `color` override `partyColor()` already accepts.
 */
const TICKETS: readonly Ticket[] = [
  {
    id: "tinubu-shettima",
    candidate: "Bola Ahmed Tinubu",
    short: "Tinubu",
    mate: "Kashim Shettima",
    party: "APC",
    partyName: "All Progressives Congress",
    art: {
      bg: "#e31e25",
      urlColor: "#000000",
      candidate: { src: img("tinubu.webp"), x: -178, y: 53, w: 554.476, h: 693.263 },
      mate: { src: img("shettima.webp"), x: 202, y: 271, w: 237.046, h: 342 },
      chip: { x: 303, y: 604, w: 101, h: 91.038, radius: "rounded-l-[11px]" },
    },
  },
  {
    id: "obi-kwankwaso",
    candidate: "Peter Obi",
    mate: "Rabiu Kwankwaso",
    party: "NDC",
    partyName: "Nigeria Democratic Congress",
    art: {
      bg: "#3f3f95",
      urlColor: "#ccffef",
      candidate: { src: img("obi.webp"), x: -241, y: 82.699, w: 606.197, h: 703.3 },
      mate: { src: img("kwankwaso.webp"), x: 170, y: 158, w: 336, h: 456 },
      chip: { x: 275, y: 615, w: 121, h: 80, radius: "rounded-[19.707px]" },
    },
  },
  {
    id: "atiku-rotimi",
    candidate: "Atiku Abubakar",
    short: "Atiku",
    mate: "Rotimi",
    party: "ADC",
    partyName: "African Democratic Congress",
    art: {
      bg: "#12a650",
      candidate: { src: img("atiku.webp"), x: -193, y: 81, w: 531.333, h: 797 },
      mate: { src: img("rotimi.webp"), x: 37, y: 152, w: 540.8, h: 676 },
      chip: { x: 299, y: 599, w: 105, h: 96.25, radius: "rounded-[8.413px] rounded-tr-none" },
    },
  },
  {
    id: "makinde-bala",
    candidate: "Seyi Makinde",
    mate: "Bala Mohammed",
    party: "APM",
    partyName: "Allied Peoples Movement",
    art: {
      bg: "#027ce2",
      urlColor: "#ccffef",
      candidate: { src: img("makinde.webp"), x: -199, y: 45, w: 514, h: 713.064 },
      mate: { src: img("bala-mohammed.webp"), x: -6, y: 179, w: 516, h: 516 },
      chip: { x: 304.03, y: 586.85, w: 88.971, h: 95.869, radius: "rounded-full" },
    },
  },
  {
    id: "sowore-magashi",
    candidate: "Omoyele Sowore",
    mate: "Magashi",
    party: "AAC",
    partyName: "African Action Congress",
    art: {
      bg: "#3d2314",
      urlColor: "#ccffef",
      candidate: { src: img("sowore.webp"), x: -196, y: 149, w: 564, h: 564 },
      mate: { src: img("magashi.webp"), x: 39, y: 85, w: 476, h: 635 },
      chip: { x: 286, y: 586, w: 109, h: 109, radius: "rounded-full" },
      scrim: { x: -23, y: 604, w: 253, h: 136 },
    },
  },
  {
    id: "duke-buba",
    candidate: "Donald Duke",
    short: "Duke",
    mate: "Buba",
    party: "PRP",
    partyName: "People's Redemption Party",
    art: {
      bg: "#fa0202",
      // One photo carries both men on this poster, so there is no mate crop.
      candidate: { src: img("duke-buba.webp"), x: -279, y: 188, w: 867.936, h: 507 },
      chip: { x: 304, y: 592, w: 100, h: 100, radius: "rounded-full" },
      scrim: { x: -32, y: 594, w: 253, h: 136 },
    },
  },
  {
    id: "sandy-babangida",
    candidate: "Sandy",
    mate: "Babangida",
    party: "PDP",
    partyName: "Peoples Democratic Party",
    art: {
      bg: "#008f4f",
      urlColor: "#101010",
      candidate: { src: img("sandy.webp"), x: -180.401, y: 114.47, w: 576.25, h: 703.06 },
      chip: { x: 298, y: 589, w: 106, h: 106, radius: "" },
    },
  },
  {
    id: "ada-chikwuemeka",
    candidate: "Ada",
    mate: "Chikwuemeka",
    party: "NDP",
    partyName: "National Democratic Party",
    art: {
      bg: "#fbc62c",
      candidate: { src: img("ada.webp"), x: -80, y: 168, w: 452.2, h: 527 },
      chip: { x: 292, y: 536, w: 121.766, h: 159, radius: "rounded-tl-[12px]" },
    },
  },
  {
    id: "zugwai-egbeola",
    candidate: "Anita Zugwai-Chukwu",
    short: "Zugwai",
    mate: "Egbeola",
    party: "YPP",
    partyName: "Young Progressives Party",
    art: {
      bg: "#02754a",
      candidate: { src: img("zugwai.webp"), x: -97, y: 131, w: 444.286, h: 622 },
      chip: { x: 284, y: 585, w: 130, h: 121, radius: "rounded-[34px] rounded-bl-none" },
    },
  },
  {
    id: "adekunle-shehu",
    candidate: "Adekunle Rufai Omoaje",
    short: "Adekunle",
    mate: "Shehu",
    party: "AA",
    partyName: "Action Alliance",
    art: {
      bg: "#200f6b",
      candidate: { src: img("adekunle.webp"), x: -184, y: 166, w: 529, h: 529 },
      chip: { x: 269, y: 561, w: 134.601, h: 134, radius: "rounded-full" },
      scrim: { x: -32, y: 594, w: 253, h: 136, color: "#1b1369", opacity: 0.77 },
    },
  },
  {
    id: "adenuga-turaki",
    candidate: "Adenuga",
    mate: "Turaki",
    party: "BOOT",
    partyName: "Boot Party",
    art: {
      bg: "#069504",
      candidate: { src: img("adenuga.webp"), x: -153, y: 108, w: 598.098, h: 587 },
      mate: { src: img("turaki.webp"), x: 159.236, y: 263.291, w: 258.742, h: 275.224 },
      // This poster sets the logo on a white plaque instead of bleeding it to the edge.
      chip: {
        x: 301,
        y: 614,
        w: 154,
        h: 86.012,
        radius: "rounded-[9.961px]",
        plaque: { inset: { x: 13.439, y: 10.593, size: 64.667 } },
      },
    },
  },
  {
    id: "memeh-balogun",
    candidate: "Memeh",
    mate: "Balogun",
    party: "DLA",
    partyName: "Democratic Liberation Alliance",
    art: {
      bg: "#fcc708",
      candidate: { src: img("memeh.webp"), x: -207, y: 150, w: 554.842, h: 545 },
      chip: { x: 237, y: 569, w: 170.937, h: 126, radius: "rounded-tl-[21px] rounded-br-[21px]" },
    },
  },
  {
    id: "nwanyanwu-khalid",
    candidate: "Dan Nwanyanwu",
    short: "Nwanyanwu",
    mate: "Khalid",
    party: "ZLP",
    partyName: "Zenith Labour Party",
    art: {
      bg: "#fb0317",
      candidate: { src: img("nwanyanwu.webp"), x: -98, y: 109.036, w: 391, h: 585.964 },
      mate: { src: img("khalid.webp"), x: 78, y: 184, w: 495.581, h: 587.766 },
      chip: { x: 268, y: 597.49, w: 136.137, h: 97.514, radius: "rounded-l-[7.16px]" },
    },
  },
  {
    id: "okereke-konto",
    candidate: "Chibuzo Okereke",
    short: "Okereke",
    mate: "Konto",
    party: "LP",
    partyName: "Labour Party",
    art: {
      bg: "#00923e",
      candidate: { src: img("okereke-chibuzo.webp"), x: -312, y: 183, w: 834.697, h: 512 },
      mate: { src: img("konto.webp"), x: 60, y: 269, w: 501.829, h: 442.819 },
      chip: { x: 300, y: 591, w: 99, h: 99, radius: "" },
    },
  },
  {
    id: "okereke-gali",
    candidate: "Esther Nkem Okereke",
    short: "Okereke",
    mate: "Gali",
    party: "NRM",
    partyName: "National Rescue Movement",
    art: {
      bg: "#f9ce05",
      candidate: { src: img("okereke-esther.webp"), x: -182, y: 115, w: 679, h: 849.739 },
      chip: { x: 300, y: 585, w: 104, h: 106, radius: "rounded-full" },
    },
  },
  {
    id: "abbas-bin-chinazam",
    candidate: "Abbas-Bin",
    mate: "Chinazam",
    party: "ADP",
    partyName: "Action Democratic Party",
    art: {
      bg: "#197ad8",
      candidate: { src: img("abbas-bin.webp"), x: -135, y: 163.97, w: 539.06, h: 539.06 },
      mate: { src: img("chinazam.webp"), x: 109, y: 192, w: 427, h: 427 },
      chip: { x: 268, y: 559, w: 136, h: 136, radius: "rounded-full" },
    },
  },
  {
    id: "dikwa-abubakar",
    candidate: "Dikwa",
    mate: "Abubakar",
    party: "NNPP",
    partyName: "New Nigeria Peoples Party",
    art: {
      bg: "#0093e1",
      candidate: { src: img("dikwa.webp"), x: -78, y: 57, w: 673.064, h: 662 },
      chip: { x: 282, y: 564.37, w: 122, h: 130.642, radius: "rounded-[61px]" },
    },
  },
  {
    id: "adebayo-bugaje",
    candidate: "Adewole Adebayo",
    short: "Adebayo",
    mate: "Bugaje",
    party: "SDP",
    partyName: "Social Democratic Party",
    art: {
      bg: "#f48735",
      urlColor: "#000000",
      candidate: { src: img("adebayo.webp"), x: -173, y: 118, w: 577, h: 577 },
      mate: { src: img("bugaje.webp"), x: 146, y: 185, w: 299.107, h: 421.154 },
      chip: { x: 288, y: 595, w: 121, h: 100, radius: "rounded-t-[14.382px]" },
    },
  },
  {
    id: "kabiru-ofordile",
    candidate: "Kabiru",
    mate: "Ofordile",
    party: "NRM",
    partyName: "National Rescue Movement",
    art: {
      bg: "#f9ce05",
      candidate: { src: img("kabiru.webp"), x: -113.119, y: 116, w: 517.12, h: 707 },
      chip: { x: 300, y: 585, w: 104, h: 106, radius: "rounded-full" },
    },
  },
];

/** The presidential rail, in the order Figma lays the posters out. */
export const PRESIDENTIAL_2027: readonly RailCandidate[] = TICKETS.map((t) => ({
  id: t.id,
  candidate: { name: t.candidate, office: "President", imageUrl: t.art.candidate.src },
  mate: t.mate ? { name: t.mate, office: "Vice President", imageUrl: t.art.mate?.src ?? null } : null,
  party: {
    acronym: t.party,
    name: t.partyName,
    logoUrl: logo(t.party),
    color: t.art.bg,
  },
  shortName: t.short,
  art: t.art,
}));
