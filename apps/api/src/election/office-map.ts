export type Office =
  | "president" | "governor" | "senate" | "hor"
  | "state_assembly" | "lga_chairman" | "councillor";

export const OFFICES: readonly Office[] = [
  "president", "governor", "senate", "hor", "state_assembly", "lga_chairman", "councillor",
];

export const OFFICE_ELECTION_TYPE: Record<Office, string> = {
  president: "presidential",
  governor: "gubernatorial",
  senate: "senatorial",
  hor: "house_of_reps",
  state_assembly: "state_assembly",
  lga_chairman: "lga_chairman",
  councillor: "councilor",
};

/** Generic labels used when a seat can't be resolved (resolved:false). Resolved seats use the specific constituency/state name. */
export const OFFICE_LABEL: Record<Office, string> = {
  president: "President",
  governor: "Governor",
  senate: "Senator",
  hor: "House of Representatives",
  state_assembly: "State House of Assembly",
  lga_chairman: "LGA Chairman",
  councillor: "Ward Councillor",
};

/** Reverse of OFFICE_ELECTION_TYPE. `other` has no office and is absent. */
export const ELECTION_TYPE_OFFICE: Record<string, Office> = Object.fromEntries(
  OFFICES.map((office) => [OFFICE_ELECTION_TYPE[office], office]),
) as Record<string, Office>;

/** Rail order on the homepage and in the ballot endpoint. */
export const OFFICE_ORDER: readonly Office[] = OFFICES;
