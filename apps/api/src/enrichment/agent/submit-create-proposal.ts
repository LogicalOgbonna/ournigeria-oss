import type { ClientBase } from "pg";
import { getProfile } from "./profiles";
import { classifyTier } from "./tier";
import { validateCorroboration } from "./corroboration";
import { COUNCILOR_TERM_START } from "../councilor.constants";
import type { EnrichmentProfile, SubmitCreateInput, CouncilorProposedEntity } from "./profile.types";

/**
 * File a `create` proposal for a new ward councilor (person + position), as the
 * connected role (enrichment_agent — INSERT on the two proposal tables only).
 * Identity-minimum: name + ward. start_date is derived from COUNCILOR_TERM_START;
 * party is kept only if it FK-matches political_parties. Throws (nothing written)
 * on a non-existent ward, an unconfigured state, an already-filled ward, or
 * below-bar corroboration.
 */
export async function submitCreateProposal(
  client: ClientBase,
  input: SubmitCreateInput,
  profile: EnrichmentProfile = getProfile(input.domain),
): Promise<{ id: string }> {
  // 1. Ward must exist; resolve its state.
  const ward = await client.query(
    `SELECT l.state_code FROM nigerian_wards w JOIN nigerian_lgas l ON w.lga_code = l.code WHERE w.code = $1`,
    [input.wardCode],
  );
  if (ward.rowCount === 0) throw new Error(`ward ${input.wardCode} does not exist`);
  const stateCode: string = ward.rows[0].state_code;

  // 2. Term-start gate (no guessed dates).
  const startDate = COUNCILOR_TERM_START[stateCode];
  if (!startDate) throw new Error(`no term-start configured for state ${stateCode}; cannot create a councilor there yet`);

  // 3. Ward must not already have a current councilor.
  const dup = await client.query(
    `SELECT 1 FROM official_positions WHERE ward_code = $1 AND role = 'councilor' AND (end_date IS NULL OR end_date > now()) LIMIT 1`,
    [input.wardCode],
  );
  if ((dup.rowCount ?? 0) > 0) throw new Error(`ward ${input.wardCode} already has a current councilor`);

  // 4. Corroboration (create bar).
  const tiered = input.sources.map((s) => ({ ...s, tier: classifyTier(s.url, profile) }));
  const verdict = validateCorroboration(
    { changeKind: "create", targetField: "__create__", sources: tiered },
    profile,
  );
  if (!verdict.ok) throw new Error(`corroboration failed: ${verdict.reason}`);

  // 5. Party FK — keep only if it exists; never reject on party.
  let partyAcronym: string | null = null;
  if (input.partyAcronym) {
    const p = await client.query(`SELECT 1 FROM political_parties WHERE acronym = $1`, [input.partyAcronym]);
    if ((p.rowCount ?? 0) > 0) partyAcronym = input.partyAcronym;
  }

  // 6. Derive source_type from the strongest tier present.
  const sourceType: CouncilorProposedEntity["position"]["sourceType"] =
    tiered.some((s) => s.tier === "canonical") ? "election_result"
      : tiered.some((s) => s.tier === "official") ? "official_site"
        : "news";

  const entity: CouncilorProposedEntity = {
    official: { name: input.name },
    position: {
      role: "councilor", wardCode: input.wardCode, appointmentType: "elected", status: "active",
      startDate, partyAcronym, sourceType, confidence: input.confidence ?? "medium",
    },
    meta: input.meta,
  };

  const status = input.needsHuman ? "needs_human" : "pending";

  try {
    await client.query("BEGIN");
    const ins = await client.query(
      `INSERT INTO change_proposals
         (target_table, target_pk, target_field, current_value, proposed_value,
          change_kind, status, confidence, reasoning, agent_run_id, entity_role)
       VALUES ($1, NULL, '__create__', NULL, $2, 'create', $3, $4, $5, $6, 'councilor') RETURNING id`,
      [profile.targetTable, JSON.stringify(entity), status, input.confidence ?? "medium", input.reasoning ?? null, input.agentRunId ?? null],
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
