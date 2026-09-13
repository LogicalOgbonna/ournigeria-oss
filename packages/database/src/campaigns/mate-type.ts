/**
 * Running-mate election types per ticketed race (chk_elections_type,
 * 20260828013000_elections_type_running_mates). Null = the race has no mate.
 */
export const MATE_ELECTION_TYPE: Record<string, string | null> = {
  presidential: 'vice_presidential',
  gubernatorial: 'deputy_gubernatorial',
  lga_chairman: 'lga_vice_chairman',
  senatorial: null,
  house_of_reps: null,
  state_assembly: null,
  councilor: null,
  other: null,
};
