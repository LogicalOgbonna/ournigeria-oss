/**
 * How INEC is structured, from the Chairman down to the officials a voter
 * actually meets on election day — the content of the `/elections` explainer
 * (Figma `1:1430`).
 *
 * Authored as data rather than markup because the nine stops are the same shape
 * repeated: a heading, a description, an optional card, an optional note about
 * how the role is appointed. The page maps over this and draws the connector
 * line between consecutive stops.
 *
 * Names and the headquarters address are the values in the Figma frame. They
 * are a snapshot of the Commission as designed and are not fetched from
 * anywhere — no INEC officer records exist in the schema. Re-check them against
 * inecnigeria.org when the Commission changes.
 *
 * NOTE: Figma repeats the "Electoral Officer — EO" block twice, at y=4027 and
 * y=4284, with identical body copy. It appears once here.
 */

export interface Commissioner {
  readonly name: string;
  readonly photo: string;
}

export interface InecStop {
  readonly id: string;
  readonly heading: string;
  readonly description: string;
  /** Grey box explaining how the office is appointed. */
  readonly note?: string;
  /** A single portrait or building card. */
  readonly card?: { readonly photo?: string; readonly caption: string };
  /** The National Commissioners grid. */
  readonly grid?: readonly Commissioner[];
  readonly link?: { readonly href: string; readonly label: string };
}

const P = "/inec";

/** The ten National Commissioners, in the grid order the frame lays them out. */
const COMMISSIONERS: readonly Commissioner[] = [
  { name: "Mr. Sam Olugbadebo Olumekun, MNI", photo: `${P}/olumekun.webp` },
  { name: "Engr. Prof. Rhoda Habor Gumus", photo: `${P}/gumus.webp` },
  { name: "Prof. Sunday Nwambam Aja", photo: `${P}/aja.webp` },
  { name: "Dr. Ken Nnamdi Ukeagu", photo: `${P}/ukeagu.webp` },
  { name: "Mr. Mohammed Haruna", photo: `${P}/haruna.webp` },
  { name: "Mrs. May Agbamuche-Mbu", photo: `${P}/agbamuche-mbu.webp` },
  { name: "Prof. Abdullahi Abdu Zuru", photo: `${P}/zuru.webp` },
  { name: "Prof. Sani Muhammad Adam, SAN", photo: `${P}/adam.webp` },
  { name: "Alhaji Abdulrazaq Tukur Yusuf", photo: `${P}/yusuf.webp` },
  { name: "Prof. Kunle Ajayi", photo: `${P}/ajayi.webp` },
];

export const INEC_STOPS: readonly InecStop[] = [
  {
    id: "chairman",
    heading: "INEC Chairman",
    description:
      "Head of the Independent National Electoral Commission and Chief Electoral Commissioner of the Federation.",
    card: { photo: `${P}/amupitan.webp`, caption: "Prof. Joash Ojo Amupitan, SAN" },
    note: "The Chairman is appointed by the President of Nigeria, subject to confirmation by the Senate. The Chairman serves as the head of INEC and Chief Electoral Commissioner.",
  },
  {
    id: "commissioners",
    heading: "National Commissioners",
    description:
      "The Chairman works with the National Commissioners, who constitute the Commission and oversee different areas of INEC’s work.",
    grid: COMMISSIONERS,
    note: "National Commissioners are also appointed by the President, subject to Senate confirmation. Together with the Chairman, they form the Commission.",
  },
  {
    id: "headquarters",
    heading: "National Headquarters",
    description:
      "Located in F.C.T Abuja this is where INEC’s national administration coordinates electoral operations across Nigeria.",
    card: { caption: "Plot 436, Zambezi Crescent, Maitama District, Abuja, Nigeria." },
  },
  {
    id: "recs",
    heading: "Resident Electoral Commissioners",
    description:
      "There are 37 RECs, covering 36 states + the Federal Capital Territory. Each REC is responsible for INEC’s operations within their assigned state/FCT.",
    note: "RECs are appointed by the President, subject to Senate confirmation. Each REC heads INEC’s office in a state or the FCT.",
    link: { href: "/states", label: "See all 37 RECs" },
  },
  {
    id: "admin-secretary",
    heading: "Administrative Secretary",
    description:
      "Works within the state INEC office and supports the REC in the administration and coordination of electoral activities.",
  },
  {
    id: "eo",
    heading: "Electoral Officer — EO",
    description:
      "The Electoral Officer heads INEC’s office at the Local Government Area level. Nigeria has 774 LGAs, meaning this is the level where INEC’s operations become much closer to individual communities.",
  },
  {
    id: "aeo",
    heading: "Assistant Electoral Officer — AEO",
    description: "Supports the Electoral Officer with activities within the LGA.",
  },
  {
    id: "rao",
    heading: "Registration Area Officers",
    description:
      "These officers operate at the Registration Area/Ward level, supporting electoral and voter-registration activities.",
  },
  {
    id: "polling-unit",
    heading: "Polling Unit Officials",
    description:
      "These are the officials voters actually interact with on election day: the Presiding Officer, the Assistant Presiding Officers, and other deployed election officials.",
  },
];
