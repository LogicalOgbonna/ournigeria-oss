import type { SlatePerson } from "@/components/civic/SlateCard";
import type { TicketParty, TicketPerson } from "@/components/civic/CandidateTicket";
import type { SlateRow } from "@/app/_component/PartySlatePanel";

/**
 * Placeholder ballot for the homepage hero.
 *
 * The hero components are pure and prop-driven — this fixture is the only thing
 * standing in for real data. Wiring it up means replacing these exports with a
 * fetch (`getElectionBallot` + `pivotByParty` in `@/lib/election-ballot`) and
 * passing the result into <HomeHero />; no component signature has to change.
 */

/** One candidate (plus running mate) on the rail. */
export interface RailCandidate {
  readonly id: string;
  readonly candidate: TicketPerson;
  readonly mate?: TicketPerson | null;
  readonly party: TicketParty;
}

/** One contest — a rail's worth of candidates, and its dropdown entry. */
export interface HomeRace {
  readonly office: string;
  readonly label: string;
  readonly seatLabel: string;
  readonly candidates: readonly RailCandidate[];
}

/** A single party's full slate for the viewer's location. */
export interface HomePartySlate {
  readonly party: TicketParty;
  readonly featured: RailCandidate;
  /** Pre-grouped by tier — the panel draws a rule between rows. */
  readonly rows: readonly SlateRow[];
}

const PHOTO_A = "/sample-candidate.webp";
const PHOTO_B = "/sample-candidate-2.webp";
const LOGO = "/sample-party.webp";

const party = (acronym: string, name: string): TicketParty => ({
  acronym,
  name,
  logoUrl: LOGO,
});

const APC = party("APC", "All Progressives Congress");
const PDP = party("PDP", "Peoples Democratic Party");
const LP = party("LP", "Labour Party");
const NNPP = party("NNPP", "New Nigeria Peoples Party");
const ADC = party("ADC", "African Democratic Congress");
const SDP = party("SDP", "Social Democratic Party");
const APGA = party("APGA", "All Progressives Grand Alliance");
const AAC = party("AAC", "African Action Congress");

const ticket = (
  id: string,
  name: string,
  mateName: string,
  p: TicketParty,
): RailCandidate => ({
  id,
  candidate: { name, office: "President", imageUrl: PHOTO_A },
  mate: { name: mateName, office: "Vice President", imageUrl: PHOTO_B },
  party: p,
});

const PRESIDENTIAL: readonly RailCandidate[] = [
  ticket("p1", "Asiwaju Bola Ahmed Adekunle Tinubu", "Kashim Shettima", APC),
  ticket("p2", "Peter Gregory Obi", "Yusuf Datti Baba-Ahmed", LP),
  ticket("p3", "Atiku Abubakar", "Ifeanyi Okowa", PDP),
  ticket("p4", "Rabiu Musa Kwankwaso", "Isaac Idahosa", NNPP),
  ticket("p5", "Seyi Makinde", "Bala Mohammed", ADC),
  ticket("p6", "Omoyele Sowore", "Haruna Magashi", AAC),
  ticket("p7", "Donald Duke", "Buba Galadima", SDP),
  ticket("p8", "Chidinma Sandy", "Ibrahim Babangida", APGA),
];

const governorship = (id: string, name: string, p: TicketParty): RailCandidate => ({
  id,
  candidate: { name, office: "Governor", imageUrl: PHOTO_B },
  party: p,
});

export const MOCK_RACES: readonly HomeRace[] = [
  {
    office: "president",
    label: "Presidential",
    seatLabel: "President of the Federal Republic",
    candidates: PRESIDENTIAL,
  },
  {
    office: "governor",
    label: "Gubernatorial",
    seatLabel: "Governor of Abia State",
    candidates: [
      governorship("g1", "Eric Opah", APC),
      governorship("g2", "Alex Otti", LP),
      governorship("g3", "Okey Ahiwe", PDP),
      governorship("g4", "Chikwe Udensi", APGA),
    ],
  },
  {
    office: "senate",
    label: "Senatorial",
    seatLabel: "Senator, Abia South",
    candidates: [
      governorship("s1", "Erondu Uchenna Erondu Jr.", APC),
      governorship("s2", "Uzo Azubuike", PDP),
      governorship("s3", "Enyinnaya Abaribe", APGA),
    ],
  },
  {
    office: "hor",
    label: "House of Representatives",
    seatLabel: "House of Reps, Aba South/Aba North",
    candidates: [
      governorship("h1", "Obika Joshua Chinedu", LP),
      governorship("h2", "Chris Garki", APC),
    ],
  },
];

const person = (
  id: string,
  name: string,
  office: string,
  tier: string,
  opts: { readonly photo?: string; readonly unverified?: boolean } = {},
): SlatePerson => ({
  id,
  name,
  office,
  tier,
  imageUrl: opts.unverified ? null : (opts.photo ?? PHOTO_B),
  unverified: opts.unverified,
});

export const MOCK_PARTY_SLATE: HomePartySlate = {
  party: APC,
  featured: PRESIDENTIAL[0],
  rows: [
    {
      id: "state-exec",
      columns: 2,
      people: [
        person("r1", "Eric Opah", "Governor", "State", { photo: PHOTO_A }),
        person("r2", "Chinedu Nwachukwu", "Deputy Governor", "State"),
      ],
    },
    {
      id: "legislature",
      columns: 3,
      people: [
        person("r3", "Erondu Uchenna Erondu Jr.", "Senate - Abia South", "Federal"),
        person("r4", "Uzo Azubuike", "Senate - Abia North", "Federal", { photo: PHOTO_A }),
        person("r5", "Aaron Emmanuel Azubuike", "House of Assembly, Aba North", "State"),
      ],
    },
    {
      id: "local",
      columns: 3,
      people: [
        person("r6", "", "Aba North LGA Chairman", "Local", { unverified: true }),
        person("r7", "", "Councillor, Umuola Ward", "Local", { unverified: true }),
      ],
    },
  ],
};

/** The parties offering a slate here — feeds the party pill's dropdown. */
export const MOCK_PARTIES: readonly TicketParty[] = [APC, LP, PDP, NNPP, ADC, APGA];

/**
 * One slate per party. The fixture reuses the same people and only swaps the
 * party, which is enough for the pill to visibly work; the real version comes
 * from `pivotByParty()` and will differ per party.
 */
export const MOCK_PARTY_SLATES: readonly HomePartySlate[] = MOCK_PARTIES.map((p) => ({
  ...MOCK_PARTY_SLATE,
  party: p,
  featured: { ...MOCK_PARTY_SLATE.featured, party: p },
}));

/** Placeholder viewer location — the real value comes from `usePersistedLocation()`. */
export const MOCK_LOCATION = "ABIA · Aba South · Umuola Ward";

export const MOCK_YEARS: readonly number[] = [2027, 2023, 2019];
