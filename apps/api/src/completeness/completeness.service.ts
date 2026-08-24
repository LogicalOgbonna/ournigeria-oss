import { Injectable } from "@nestjs/common";
import {
  PrismaService,
  COMPLETENESS_FLAT_FIELDS,
  COMPLETENESS_SQL,
  computeOfficialCompleteness,
} from "@ournigeria/database";

/**
 * The ONE place official completeness is computed (Plan 45c, Fix #4).
 * Definition lives in @ournigeria/database. recompute() persists the score to
 * nigerian_officials.completeness_score for single-official reads.
 *
 * The ranking queries do NOT average that stored column. recompute() only fires
 * on the proposal-approval and enrichment-apply paths, so every bulk-imported
 * official still has completeness_score = NULL — and COALESCE(AVG(NULL), 0)
 * reported 20 of 37 fully-populated states as a hard 0. They instead evaluate
 * COMPLETENESS_SQL, the SQL twin of computeOfficialCompleteness() generated
 * from the same constants, so a leaderboard can never be silently stale.
 */
@Injectable()
export class CompletenessService {
  constructor(private prisma: PrismaService) {}

  /** Recompute + persist one official's score. Safe to call post-commit. */
  async recompute(officialId: string): Promise<number | null> {
    const official = await this.prisma.nigerianOfficial.findUnique({
      where: { id: officialId },
      select: {
        name: true,
        imageUrl: true,
        email: true,
        phoneNumber: true,
        officeAddress: true,
        twitterHandle: true,
        facebookUrl: true,
        gender: true,
        biography: true,
        education: true,
        officialType: true,
        _count: {
          select: {
            educationRecords: true,
            careers: true,
            positions: true,
            partyAffiliations: true,
            elections: true,
          },
        },
      },
    });
    if (!official) return null;

    const filled = (v: string | null) => v != null && v !== "";
    const score = computeOfficialCompleteness({
      officialType: official.officialType,
      flat: Object.fromEntries(
        COMPLETENESS_FLAT_FIELDS.map((f) => [f, filled((official as any)[f])]),
      ) as any,
      biography: filled(official.biography),
      education: filled(official.education) || official._count.educationRecords > 0,
      career: official._count.careers > 0,
      positions: official._count.positions > 0,
      partyHistory: official._count.partyAffiliations > 0,
      elections: official._count.elections > 0,
    });

    await this.prisma.nigerianOfficial.update({
      where: { id: officialId },
      data: { completenessScore: score },
    });
    return score;
  }

  async getStateRankings() {
    // Derive each position's state: directly from state_code (governors),
    // via constituency (senators/reps), or via LGA (chairmen).
    // Rankings average the STORED completeness_score (kept fresh by recompute()).
    const rows: { state_code: string; state_name: string; avg_completeness: string; official_count: bigint }[] =
      await this.prisma.$queryRawUnsafe(`
        SELECT
          s.code   AS state_code,
          s.name   AS state_name,
          COALESCE(AVG(${COMPLETENESS_SQL}), 0) AS avg_completeness,
          COUNT(DISTINCT o.id) AS official_count
        FROM nigerian_states s
        LEFT JOIN (
          SELECT p.official_id,
            COALESCE(
              p.state_code,
              c.state_code,
              l.state_code
            ) AS resolved_state_code
          FROM official_positions p
          LEFT JOIN nigerian_constituencies c ON c.code = p.constituency_code
          LEFT JOIN nigerian_lgas l ON l.code = p.lga_code
          WHERE p.status = 'active'
        ) pos ON pos.resolved_state_code = s.code
        LEFT JOIN nigerian_officials o
          ON o.id = pos.official_id
        GROUP BY s.code, s.name
        ORDER BY avg_completeness DESC, s.name ASC
      `);

    return rows.map((r) => ({
      stateCode: r.state_code,
      stateName: r.state_name,
      completeness: Number(r.avg_completeness),
      officialCount: Number(r.official_count),
    }));
  }

  async getLgaRankings(stateCode: string) {
    const rows: { lga_code: string; lga_name: string; avg_completeness: string; official_count: bigint }[] =
      await this.prisma.$queryRawUnsafe(`
        SELECT
          l.code   AS lga_code,
          l.name   AS lga_name,
          COALESCE(AVG(${COMPLETENESS_SQL}), 0) AS avg_completeness,
          COUNT(DISTINCT o.id) AS official_count
        FROM nigerian_lgas l
        LEFT JOIN official_positions p
          ON p.lga_code = l.code AND p.status = 'active'
        LEFT JOIN nigerian_officials o
          ON o.id = p.official_id
        WHERE l.state_code = $1
        GROUP BY l.code, l.name
        ORDER BY avg_completeness DESC, l.name ASC
      `, stateCode);

    return rows.map((r) => ({
      lgaCode: r.lga_code,
      lgaName: r.lga_name,
      completeness: Number(r.avg_completeness),
      officialCount: Number(r.official_count),
    }));
  }
}
