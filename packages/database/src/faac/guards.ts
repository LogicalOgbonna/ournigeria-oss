import type { FaacSeedResult } from "./seed-faac";

export interface FaacGuardResult {
  ok: boolean;
  failures: string[];
}

/** Hard validation before an auto-ingested FAAC month is committed/trusted. */
export function faacLoadGuards(r: FaacSeedResult): FaacGuardResult {
  const failures: string[] = [];
  if (r.stateCount !== 37) failures.push(`expected 37 state rows, got ${r.stateCount}`);
  if (r.lgaCount <= 700) failures.push(`LGA rows too few (${r.lgaCount}); parse likely truncated`);
  if (r.lgaCount > 774) failures.push(`LGA rows too many (${r.lgaCount})`);
  if (!(r.grandTotal > 0)) failures.push(`grandTotal must be > 0, got ${r.grandTotal}`);
  if (r.titleYear !== r.year || r.titleMonth !== r.month) {
    failures.push(
      `sheet title period ${r.titleYear}-${r.titleMonth} does not match expected ${r.year}-${r.month}`,
    );
  }
  return { ok: failures.length === 0, failures };
}
