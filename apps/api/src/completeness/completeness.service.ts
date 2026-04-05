import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";

// Must match TRACKED_FIELDS in officials.service.ts
const COMPLETENESS_SQL = `
  (
    CASE WHEN o.name          IS NOT NULL AND o.name          <> '' THEN 1 ELSE 0 END +
    CASE WHEN o.image_url     IS NOT NULL AND o.image_url     <> '' THEN 1 ELSE 0 END +
    CASE WHEN o.email         IS NOT NULL AND o.email         <> '' THEN 1 ELSE 0 END +
    CASE WHEN o.phone_number  IS NOT NULL AND o.phone_number  <> '' THEN 1 ELSE 0 END +
    CASE WHEN o.office_address IS NOT NULL AND o.office_address <> '' THEN 1 ELSE 0 END +
    CASE WHEN o.twitter_handle IS NOT NULL AND o.twitter_handle <> '' THEN 1 ELSE 0 END +
    CASE WHEN o.facebook_url  IS NOT NULL AND o.facebook_url  <> '' THEN 1 ELSE 0 END +
    CASE WHEN o.education     IS NOT NULL AND o.education     <> '' THEN 1 ELSE 0 END +
    CASE WHEN o.biography     IS NOT NULL AND o.biography     <> '' THEN 1 ELSE 0 END +
    CASE WHEN o.gender        IS NOT NULL AND o.gender        <> '' THEN 1 ELSE 0 END
  )::decimal / 10
`;

@Injectable()
export class CompletenessService {
  constructor(private prisma: PrismaService) {}

  async getStateRankings() {
    // Derive each position's state: directly from state_code (governors),
    // via constituency (senators/reps), or via LGA (chairmen).
    const rows: { state_code: string; state_name: string; avg_completeness: number; official_count: bigint }[] =
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
    const rows: { lga_code: string; lga_name: string; avg_completeness: number; official_count: bigint }[] =
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
