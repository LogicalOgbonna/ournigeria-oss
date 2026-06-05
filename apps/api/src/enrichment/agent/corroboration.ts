import type { ChangeKind, EnrichmentProfile, SourceTier } from "./profile.types";

export interface CorroborationInput {
  changeKind: ChangeKind;
  targetField: string;
  sources: Array<{ url: string; publisher: string; tier: SourceTier }>;
}

export interface CorroborationResult {
  ok: boolean;
  reason: string;
}

function distinctPublishers(sources: CorroborationInput["sources"]): number {
  return new Set(sources.map((s) => s.publisher.toLowerCase().replace(/^www\./, ""))).size;
}

/**
 * Spec §4 bars:
 *  - canonical present: 1 satisfies a fill; a correction needs 2 canonical OR canonical + >=1 independent.
 *  - else official/web: >=2 independent for a fill, >=3 for a correction.
 *  - sensitive fields always use the stricter (correction-level) bar.
 *  Independence = distinct publisher hostnames.
 */
export function validateCorroboration(
  input: CorroborationInput,
  profile: EnrichmentProfile,
): CorroborationResult {
  const sensitive = profile.sensitiveFields.includes(input.targetField);
  const effective: ChangeKind = input.changeKind === "correction" || sensitive ? "correction" : "fill";
  const independent = distinctPublishers(input.sources);
  const canonical = input.sources.filter((s) => s.tier === "canonical").length;

  if (canonical >= 1) {
    if (effective === "fill") return { ok: true, reason: "canonical source satisfies fill" };
    if (canonical >= 2) return { ok: true, reason: "two canonical sources satisfy correction" };
    if (independent >= 2) return { ok: true, reason: "canonical + independent source satisfies correction" };
    return { ok: false, reason: "correction with one canonical source needs a second independent source" };
  }

  const need = effective === "fill" ? 2 : 3;
  if (independent >= need) return { ok: true, reason: `${independent} independent sources meet bar of ${need}` };
  return {
    ok: false,
    reason: `${effective}${sensitive ? " (sensitive field)" : ""} needs >=${need} independent sources, have ${independent}`,
  };
}
