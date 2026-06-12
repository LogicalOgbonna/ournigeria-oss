import type { ClientBase } from "pg";
import { getProfile } from "./profiles";
import { classifyTier } from "./tier";
import { validateCorroboration } from "./corroboration";
import { getCreatableEntity } from "../creatable.registry";
import type { EnrichmentProfile, ProposalSourceInput } from "./profile.types";

export interface SubmitStructuredCreateInput {
  /** Profile domain (education, elections, careers, …) — resolves the target table. */
  domain: string;
  /** The structured row payload, validated against CREATABLE_ENTITIES up front. */
  payload: Record<string, unknown>;
  confidence?: string;
  reasoning?: string;
  agentRunId?: string;
  needsHuman?: boolean;
  sources: ProposalSourceInput[];
}

/**
 * Plan 45e: file a `create` proposal for any registry-creatable structured fact
 * (education, elections, careers, party history, family, …) as the connected
 * role (enrichment_agent in production — INSERT on the two proposal tables
 * only). Mirrors submit-create-proposal.ts (councilors) but is generic:
 * validation comes from CREATABLE_ENTITIES, corroboration from the domain
 * profile's create bar. Throws (nothing written) on a malformed payload, an
 * unknown domain/table, or below-bar corroboration.
 */
export async function submitStructuredCreate(
  client: ClientBase,
  input: SubmitStructuredCreateInput,
  profile: EnrichmentProfile = getProfile(input.domain),
): Promise<{ id: string }> {
  const entity = getCreatableEntity(profile.targetTable);
  if (!entity) {
    throw new Error(`domain ${input.domain} (${profile.targetTable}) has no creatable entity`);
  }
  // Validate the shape NOW so reviewers never see junk; FK/duplicate preflight
  // re-runs inside the apply tx (live data may change between submit and apply).
  const payload = entity.validate(input.payload);

  const tiered = input.sources.map((s) => ({ ...s, tier: classifyTier(s.url, profile) }));
  const verdict = validateCorroboration(
    { changeKind: "create", targetField: "__create__", sources: tiered },
    profile,
  );
  if (!verdict.ok) throw new Error(`corroboration failed: ${verdict.reason}`);

  const status = input.needsHuman ? "needs_human" : "pending";

  try {
    await client.query("BEGIN");
    const ins = await client.query(
      `INSERT INTO change_proposals
         (target_table, target_pk, target_field, current_value, proposed_value,
          change_kind, status, confidence, reasoning, agent_run_id)
       VALUES ($1, NULL, '__create__', NULL, $2, 'create', $3, $4, $5, $6) RETURNING id`,
      [
        profile.targetTable, JSON.stringify(payload), status,
        input.confidence ?? "medium", input.reasoning ?? null, input.agentRunId ?? null,
      ],
    );
    const id: string = ins.rows[0].id;
    for (const s of tiered) {
      await client.query(
        `INSERT INTO proposal_sources
           (proposal_id, url, archive_url, publisher, snippet, format, locator, source_tier, confidence, retrieved_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [id, s.url, null, s.publisher, s.snippet, s.format, s.locator ?? null, s.tier, s.confidence ?? "medium", s.retrievedAt],
      );
    }
    await client.query("COMMIT");
    return { id };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  }
}
