import type { ClientBase } from "pg";
import { getProfile } from "./profiles";
import { classifyTier } from "./tier";
import { validateCorroboration } from "./corroboration";
import type { EnrichmentProfile, SubmitProposalInput } from "./profile.types";

/**
 * Validate corroboration, then INSERT one change_proposal + its proposal_sources,
 * as the connected role (the agent connects as enrichment_agent, which has INSERT
 * on exactly those two tables and nothing else). Throws (no rows written) on a
 * profile/field violation or below-bar corroboration.
 */
export async function submitProposal(
  client: ClientBase,
  input: SubmitProposalInput,
  profile: EnrichmentProfile = getProfile(input.domain),
): Promise<{ id: string }> {
  if (!profile.targetFields.includes(input.targetField)) {
    throw new Error(
      `field ${profile.targetTable}.${input.targetField} is not enrichable for domain ${profile.domain}`,
    );
  }

  const tiered = input.sources.map((s) => ({ ...s, tier: classifyTier(s.url, profile) }));
  const verdict = validateCorroboration(
    { changeKind: input.changeKind, targetField: input.targetField, sources: tiered },
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
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [
        profile.targetTable, input.targetPk, input.targetField,
        input.currentValue === undefined ? null : JSON.stringify(input.currentValue),
        JSON.stringify(input.proposedValue),
        input.changeKind, status, input.confidence ?? "medium",
        input.reasoning ?? null, input.agentRunId ?? null,
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
