import type { DatasetImporter, ImportDiff, ProposalSpec } from "../importer.types";
import { decideSeat, type DatasetMember } from "./lib/assembly-member-reconcile";

function host(u: string): string {
  try {
    return new URL(u).host;
  } catch {
    return "source";
  }
}

const sourcesOf = (m: DatasetMember) =>
  (m.sources?.length ? m.sources : ["https://www.inecnigeria.org/"]).map((u) => ({
    url: u,
    publisher: host(u),
    snippet: `${m.name} holds ${m.constituency_code}`,
    format: "html",
    sourceTier: "official" as const,
  }));

/**
 * Per-seat replace importer for State House of Assembly members.
 *
 * For each sourced member, decideSeat() (Task 1) yields one of:
 *  - install   → emit a `create` for the assembly_member entity (find/create official +
 *                upsert active mha position + fill profile), and — if a different person
 *                currently holds the seat — a `correction` downgrading that prior holder's
 *                position status `active → contested` (never a delete).
 *  - unchanged → the recorded holder already matches; counted, no specs.
 *  - review    → low-confidence/unsourced; surfaced as `REVIEW:` in sample, no specs.
 *
 * Idempotent: the live query only loads `status='active'` mha positions, so an already
 * installed/downgraded seat won't re-propose the same downgrade.
 */
export const stateAssemblyMembersImporter: DatasetImporter = {
  name: "state-assembly-members",
  label: "State Assembly members (per-seat replace)",
  description:
    "Install the true current mha member per seat (create/link official + active position), downgrade the prior holder, fill profile.",
  autoApprove: true,

  validate(json: unknown): void {
    if (!json || typeof json !== "object" || Array.isArray(json)) {
      throw new Error("expected an object keyed by state slug");
    }
  },

  async diff(json: unknown, prisma): Promise<ImportDiff> {
    const data = json as Record<string, { members?: DatasetMember[] }>;
    const creates: ProposalSpec[] = [];
    const updates: ProposalSpec[] = [];
    const reviews: { label: string; detail: string }[] = [];
    let unchanged = 0;

    const live = await prisma.$queryRawUnsafe<
      { id: string; official_id: string; name: string; constituency_code: string; state_code: string | null }[]
    >(
      `SELECT op.id, op.official_id, o.name, op.constituency_code, op.state_code
       FROM official_positions op JOIN nigerian_officials o ON o.id = op.official_id
       WHERE op.role='mha' AND op.status='active' AND op.constituency_code IS NOT NULL`,
    );
    const liveBySeat = new Map(live.map((r) => [r.constituency_code, r]));

    for (const [stateSlug, block] of Object.entries(data)) {
      if (stateSlug === "_meta" || !block?.members) continue;
      for (const m of block.members) {
        const holder = liveBySeat.get(m.constituency_code) ?? null;
        const d = decideSeat(m, holder);
        if (d.action === "unchanged") {
          unchanged++;
          continue;
        }
        if (d.action === "review") {
          reviews.push({ label: `REVIEW: ${m.name ?? "?"} @ ${m.constituency_code}`, detail: d.reason });
          continue;
        }
        creates.push({
          targetTable: "assembly_member",
          changeKind: "create",
          proposedValue: {
            name: m.name,
            constituencyCode: m.constituency_code,
            stateCode: holder?.state_code ?? stateSlug,
            party: m.party ?? null,
            gender: m.gender ?? null,
            leadershipRole: m.leadership_role ?? null,
            startDate: "2023-06-13",
            imageUrl: m.image_url ?? null,
            profile: m.profile ?? null,
          },
          confidence: m.confidence,
          sources: sourcesOf(m),
          reasoning: d.reason,
          label: `${m.name} → ${m.constituency_code}`,
        });
        if (d.downgradePositionId) {
          updates.push({
            targetTable: "official_positions",
            targetField: "status",
            targetPk: d.downgradePositionId,
            changeKind: "correction",
            proposedValue: "contested",
            confidence: "high",
            reasoning: `${holder!.name} replaced by sourced member ${m.name} on ${m.constituency_code}.`,
            sources: sourcesOf(m),
            label: `${holder!.name} → contested`,
          });
        }
      }
    }

    return {
      creates,
      updates,
      unchangedCount: unchanged,
      sample: [
        ...creates.slice(0, 15).map((c) => ({
          kind: "create" as const,
          label: c.label,
          detail: String(c.reasoning).slice(0, 90),
        })),
        ...updates.slice(0, 10).map((u) => ({
          kind: "update" as const,
          label: u.label,
          detail: String(u.reasoning).slice(0, 90),
        })),
        ...reviews.slice(0, 15).map((r) => ({
          kind: "update" as const,
          label: r.label,
          detail: r.detail,
        })),
      ],
    };
  },
};
