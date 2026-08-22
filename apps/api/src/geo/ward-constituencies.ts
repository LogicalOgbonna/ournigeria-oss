/**
 * Shaping for the "which constituencies does this ward sit in?" block on ward
 * pages. A ward sits inside exactly one senatorial district, one federal (HoR)
 * constituency and one state-assembly constituency; the first is mapped at LGA
 * level (`senatorial_district_lgas`), the other two at ward level
 * (`constituency_wards`).
 *
 * Kept out of geo.service so the dedupe/precedence rules stay unit-testable
 * without a database.
 */

export type ConstituencyPositionRow = {
  role: string;
  partyAcronym: string | null;
  official: {
    id: string;
    slug: string | null;
    name: string;
    imageUrl: string | null;
  };
};

export type ConstituencyRow = {
  code: string;
  name: string;
  type: string;
  officialPositions: ConstituencyPositionRow[];
};

export type WardConstituencyRepresentative = {
  id: string;
  slug: string | null;
  name: string;
  role: string;
  party: string;
  image: string | null;
};

export type WardConstituency = {
  code: string;
  name: string;
  type: string;
  representatives: WardConstituencyRepresentative[];
};

export type WardConstituencies = {
  senatorial: WardConstituency | null;
  federal: WardConstituency | null;
  state: WardConstituency | null;
};

function toRepresentative(
  pos: ConstituencyPositionRow,
): WardConstituencyRepresentative {
  return {
    id: pos.official.id,
    slug: pos.official.slug,
    name: pos.official.name,
    role: pos.role,
    party: pos.partyAcronym || "N/A",
    image: pos.official.imageUrl,
  };
}

/**
 * Pick the single constituency of `type` a ward belongs to.
 *
 * The constituency tables still carry duplicate rows per name (e.g. Abia has
 * both `sen_abia_abia_central` and `sen_abia_central`), so a ward can resolve
 * to more than one row of the same tier. Prefer the row that has a sitting
 * representative — that is the one the rest of the app treats as canonical —
 * and fall back to the lowest code so the choice is deterministic.
 */
function pickTier(rows: ConstituencyRow[], type: string): WardConstituency | null {
  const candidates = rows
    .filter((row) => row.type === type)
    .sort((a, b) => a.code.localeCompare(b.code));
  const best =
    candidates.find((row) => row.officialPositions.length > 0) ?? candidates[0];
  if (!best) return null;
  return {
    code: best.code,
    name: best.name,
    type: best.type,
    representatives: best.officialPositions.map(toRepresentative),
  };
}

/**
 * `rows` is every constituency reachable from the ward (ward-level mappings +
 * the LGA's senatorial district), in any order. A tier is `null` when the INEC
 * mapping for it has not been reconciled yet — ward pages render that as a
 * "being compiled" state rather than hiding the tier.
 */
export function shapeWardConstituencies(
  rows: ConstituencyRow[],
): WardConstituencies {
  return {
    senatorial: pickTier(rows, "senatorial"),
    federal: pickTier(rows, "federal"),
    state: pickTier(rows, "state"),
  };
}
