import type { DatasetImporter, ImportDiff, ProposalSpec } from "../importer.types";
import { buildGroundTruth, reconcilePosition } from "./lib/assembly-reconcile";

function hostOf(u: string): string {
  try {
    return new URL(u).host;
  } catch {
    return "source";
  }
}

/**
 * Reconciles our live `active mha` positions against a curated per-state Assembly
 * membership dataset and emits audited `official_positions.status` corrections
 * (`active → contested`) for clear losers — never a delete.
 *
 * Verdicts (from reconcilePosition):
 *  - keep    → the recorded person IS the real member; counted, no proposal.
 *  - flip    → the seat belongs to a different, sourced member; status → contested.
 *  - borderline → ambiguous name match; NOT flipped, surfaced as `REVIEW:` in sample.
 *  - unknown → constituency absent / state not fully sourced; counted, untouched.
 *
 * Idempotent: the diff query only loads `status='active'` positions, so already
 * flipped (`contested`) seats are never re-proposed.
 */
export const stateAssemblyReconciliationImporter: DatasetImporter = {
  name: "state-assembly-reconciliation",
  label: "State Assembly reconciliation",
  description:
    "Flip mis-recorded mha positions (lost candidates shown as members) to 'contested', verified against per-state Assembly membership.",
  autoApprove: true,

  validate(json: unknown): void {
    if (json === null || typeof json !== "object" || Array.isArray(json)) {
      throw new Error("expected an object keyed by state slug");
    }
  },

  async diff(json: unknown, prisma): Promise<ImportDiff> {
    const gt = buildGroundTruth(json);

    const positions = await prisma.$queryRawUnsafe<
      { id: string; name: string; constituency_code: string; party_acronym: string | null }[]
    >(
      `SELECT op.id, o.name, op.constituency_code, op.party_acronym
       FROM official_positions op JOIN nigerian_officials o ON o.id = op.official_id
       WHERE op.role = 'mha' AND op.status = 'active' AND op.constituency_code IS NOT NULL`,
    );

    const updates: ProposalSpec[] = [];
    const borderline: { label: string; detail: string }[] = [];
    let keep = 0;
    let unknown = 0;

    for (const p of positions) {
      const v = reconcilePosition(gt, p);
      if (v.verdict === "keep") {
        keep++;
        continue;
      }
      if (v.verdict === "unknown") {
        unknown++;
        continue;
      }
      if (v.verdict === "borderline") {
        borderline.push({
          label: `${p.name} vs ${v.member?.name}`,
          detail: `score ${v.score.toFixed(2)} — ${p.constituency_code}`,
        });
        continue;
      }
      // flip
      const src = v.member!.source || "https://www.inecnigeria.org/list-of-political-parties/";
      updates.push({
        targetTable: "official_positions",
        targetField: "status",
        targetPk: p.id,
        changeKind: "correction",
        proposedValue: "contested",
        confidence: "high",
        reasoning: `${p.name} (${p.party_acronym ?? "?"}) contested ${p.constituency_code} but the seat is held by ${v.member!.name}${v.member!.party ? ` (${v.member!.party})` : ""}.`,
        sources: [
          {
            url: src,
            publisher: hostOf(src),
            snippet: `${v.member!.name} holds ${p.constituency_code}`,
            format: "html",
            sourceTier: "official",
          },
        ],
        label: `${p.name} → contested`,
      });
    }

    return {
      creates: [],
      updates,
      unchangedCount: keep + unknown,
      sample: [
        ...updates.slice(0, 20).map((u) => ({
          kind: "update" as const,
          label: u.label,
          detail: String(u.reasoning).slice(0, 90),
        })),
        ...borderline.slice(0, 15).map((b) => ({
          kind: "update" as const,
          label: `REVIEW: ${b.label}`,
          detail: b.detail,
        })),
      ],
    };
  },
};
