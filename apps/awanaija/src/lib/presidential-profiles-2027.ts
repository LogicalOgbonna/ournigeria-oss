/**
 * Long-form profiles for the `/elections/2027/<party>` ticket pages — Figma
 * `1:987` (APC) and `1:1209` (NDC).
 *
 * Authored rather than fetched, because none of this exists as data:
 *
 * - there is no link from a `PRESIDENTIAL_2027` ticket to an official record,
 *   and no Candidate / Election / ElectionCycle / running-mate model in the
 *   schema. Of the four people on these two pages, only Tinubu has a
 *   `NigerianOfficial` row at all, and his `educationRecords`, `careerRecords`,
 *   `positions` and `elections` all come back empty.
 * - pull-quotes and manifesto / CV / achievement documents have no column, no
 *   endpoint and no storage anywhere. `Document` is budget-only.
 * - a per-candidate vision line does not exist; `PoliticalParty.slogan` is
 *   party-level.
 * - `computeCandidates()` in the API excludes `e.year > now()`, so 2027
 *   flagbearers will not surface from `/parties/:acronym` before 2027.
 *
 * When the ticket → official link lands, `career` and `education` become a join
 * on `/api/officials/:slug` and drop out of this file, which then keeps only
 * what is genuinely editorial (vision, quote, documents, artwork).
 * See TODO(elections-data) below.
 *
 * ON THE FIGMA COPY: both frames ship the *same* Political Career and Education
 * blocks — "President of Nigeria / Governor of Lagos state / APC Chairman /
 * Senator" and "B.Sc. Surveying, University of Lagos" — on Obi's page as well as
 * Tinubu's. That is a designer copy-paste, wrong for Obi and partly wrong for
 * Tinubu. The records below come from public record instead: the layout is
 * Figma's, the facts are not.
 */

const ART = "/presidential/profiles";

/** One row of the Political Career card. */
export interface CareerEntry {
  readonly span: string;
  readonly office: string;
  /** Small line under the office — chamber, or the nature of the seat. */
  readonly chamber?: string;
}

/** One row of the Education card. */
export interface EducationEntry {
  readonly award: string;
  readonly school: string;
}

/**
 * A tab in the documents panel.
 *
 * `href` is the real document. The design's viewer chrome (zoom, page count,
 * search) is presentational — see `DocsPanel` — so a tab with no `href` shows
 * its cover with the download disabled rather than pretending to page through
 * something that is not there.
 */
export interface TicketDoc {
  readonly key: "manifesto" | "cv" | "achievements";
  readonly title: string;
  readonly blurb: string;
  readonly cover?: string;
  readonly href?: string;
  /** Printed as "1 of N" beside the viewer controls. */
  readonly pages?: number;
}

/** One half of a ticket, as the two portrait cards print it. */
export interface TicketPerson {
  /** Given names — the first, unaccented line of the serif name block. */
  readonly given: string;
  /** Surname — the second line, set in the party accent. */
  readonly surname: string;
  /** ISO date. Ages are computed, never stored, so they do not go stale. */
  readonly dob: string;
  /** Role label, split the way the design splits it: base + accent parenthetical. */
  readonly role: readonly [base: string, accent: string];
  readonly photo: string;
}

export interface TicketProfile {
  readonly candidate: TicketPerson;
  readonly mate: TicketPerson;
  /** Centred paragraph under the ticket pair. */
  readonly visionLine: string;
  /** Smaller line beneath it. */
  readonly fineprint: string;
  /** Full-bleed band: the pull-quote, its background fill and its photo. */
  readonly quote: string;
  readonly quoteBg: string;
  readonly quotePhoto: string;
  /** The accented word in the "Who is <short>?" heading. */
  readonly short: string;
  readonly bio: string;
  readonly bioPhoto: string;
  readonly docs: readonly TicketDoc[];
  readonly career: readonly CareerEntry[];
  readonly education: readonly EducationEntry[];
}

/** Whole years between `dob` and now. Figma's "74 years" is this, not a constant. */
export function ageFrom(dob: string, now: Date = new Date()): number {
  const born = new Date(dob);
  let age = now.getUTCFullYear() - born.getUTCFullYear();
  const month = now.getUTCMonth() - born.getUTCMonth();
  if (month < 0 || (month === 0 && now.getUTCDate() < born.getUTCDate())) age -= 1;
  return age;
}

/** The three document tabs are identically worded on both frames. */
const DOC_BLURBS = {
  manifesto: "Explore their policy agenda, priorities and promises.",
  cv: "Explore his education, career and political journey.",
  achievements: "Examine his record in office and major accomplishments.",
} as const;

/**
 * Keyed by party acronym, matching the `/elections/<year>/<party>` segment.
 *
 * Partial on purpose: 16 of the 18 acronyms in `PRESIDENTIAL_2027` have no entry
 * yet, and their pages render the ticket pair alone rather than empty shells.
 *
 * TODO(elections-data): when tickets carry an official slug, `career` and
 * `education` become a join on `/api/officials/:slug` and leave this file.
 */
export const PROFILES_2027: Readonly<Partial<Record<string, TicketProfile>>> = {
  APC: {
    candidate: {
      given: "Bola Ahmed",
      surname: "Tinubu",
      dob: "1952-03-29",
      role: ["PRESIDENT", "(INCUMBENT)"],
      photo: `${ART}/apc-tinubu-card.webp`,
    },
    mate: {
      given: "Kashim",
      surname: "Shettima",
      dob: "1966-09-02",
      role: ["RUNNING MATE", "(INCUMBENT)"],
      photo: `${ART}/apc-shettima-card.webp`,
    },
    visionLine:
      'Running under the All Progressives Congress (APC) Party with a vision of "Renewed Hope" for national prosperity and security.',
    fineprint: "The sitting President is once again being handed the APC presidential flag.",
    quote: "“We must renew our hope in Nigeria.”",
    quoteBg: "#52c2e8",
    quotePhoto: `${ART}/apc-quote.webp`,
    short: "Tinubu",
    bio: "Bola Ahmed Tinubu is a Nigerian politician and businessman who has served as the President of Nigeria since May 2023. Born on 29 March 1952, he studied Accounting in the United States before returning to Nigeria, where he worked in the private sector. He entered politics in the 1990s, served as a Senator representing Lagos West, and later became Governor of Lagos State from 1999 to 2007. As governor, he was associated with major reforms in Lagos and played a prominent role in the development of the political structure that became the All Progressives Congress (APC). In 2023, he won the presidential election on the APC platform and became Nigeria’s 16th President.",
    bioPhoto: `${ART}/apc-bio.webp`,
    docs: [
      {
        key: "manifesto",
        title: "Manifesto",
        blurb: DOC_BLURBS.manifesto,
        cover: `${ART}/apc-manifesto-cover.webp`,
        pages: 80,
      },
      { key: "cv", title: "CV", blurb: DOC_BLURBS.cv },
      { key: "achievements", title: "Achievements", blurb: DOC_BLURBS.achievements },
    ],
    career: [
      { span: "2023 - Present", office: "President of Nigeria", chamber: "Executive" },
      { span: "1999 - 2007", office: "Governor of Lagos State", chamber: "Executive" },
      { span: "1992 - 1993", office: "Senator, Lagos West", chamber: "National Assembly" },
      { span: "1988 - 1992", office: "Treasurer, Mobil Nigeria", chamber: "Private sector" },
    ],
    education: [
      { award: "B.Sc. Accounting", school: "Chicago State University" },
      { award: "Associate degree", school: "Richard J. Daley College, Chicago" },
    ],
  },

  NDC: {
    candidate: {
      given: "Peter Gregory",
      surname: "Obi",
      dob: "1961-07-19",
      role: ["PRESIDENTIAL", "(CANDIDATE)"],
      photo: `${ART}/ndc-obi-card.webp`,
    },
    mate: {
      given: "Rabiu Musa",
      surname: "Kwankwaso",
      dob: "1956-10-21",
      role: ["RUNNING MATE", "(CANDIDATE)"],
      photo: `${ART}/ndc-kwankwaso-card.webp`,
    },
    visionLine:
      "Running under the National Democratic Congress (NDC) with a vision focused on good governance, economic transformation, accountability, and improved living standards for Nigerians.",
    fineprint:
      "The presidential flag is being handed to Peter Obi as the NDC’s candidate for the upcoming election.",
    quote: "“Nigeria will be okay”",
    quoteBg: "#da3341",
    quotePhoto: `${ART}/ndc-quote.webp`,
    short: "Obi",
    bio: "Peter Obi is a Nigerian businessman and politician who served as the Governor of Anambra State from 2006 to 2014. Born on 19 July 1961 in Onitsha, Anambra State, he built a career in business and banking before entering politics. As governor, he focused on financial management, education, healthcare and infrastructure. He later served as Vice Presidential candidate of the Peoples Democratic Party in 2019 and contested the presidency under the Labour Party in 2023. He is currently associated with the National Democratic Congress (NDC) as its presidential candidate.",
    bioPhoto: `${ART}/ndc-bio.webp`,
    docs: [
      {
        key: "manifesto",
        title: "Manifesto",
        blurb: DOC_BLURBS.manifesto,
        cover: `${ART}/ndc-manifesto-cover.webp`,
        pages: 80,
      },
      { key: "cv", title: "CV", blurb: DOC_BLURBS.cv },
      { key: "achievements", title: "Achievements", blurb: DOC_BLURBS.achievements },
    ],
    career: [
      {
        span: "2027",
        office: "Presidential candidate",
        chamber: "National Democratic Congress",
      },
      { span: "2023", office: "Presidential candidate", chamber: "Labour Party" },
      {
        span: "2019",
        office: "Vice Presidential candidate",
        chamber: "Peoples Democratic Party",
      },
      { span: "2006 - 2014", office: "Governor of Anambra State", chamber: "Executive" },
    ],
    education: [
      { award: "B.A. Philosophy", school: "University of Nigeria, Nsukka" },
      { award: "Executive Programmes", school: "Lagos Business School" },
      { award: "Executive Programmes", school: "Harvard Kennedy School" },
      { award: "Executive Programmes", school: "London School of Economics" },
    ],
  },
};
