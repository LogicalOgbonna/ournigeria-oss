import { hostname } from "node:os";
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { TwitterPublisher } from "../platforms/twitter/twitter.publisher.js";
import { SafetyFilter } from "../intelligence/safety-filter.js";
import { SocialsSettingsService } from "../config/socials-settings.service.js";
import { VerifyKind, VerifyLevel } from "./verify-content.js";

export interface QualifyingProposal {
  proposalId: string;
  kind: VerifyKind;
  anchorType: "seat" | "proposal";
  anchorId: string;
  role?: string;
  stateCode?: string;
  lgaCode?: string;
  wardCode?: string;
  constituencyCode?: string;
  level?: VerifyLevel;
  displayValue?: string;
  officialName?: string;
  slug?: string;
  targetField?: string;
  proposedScalar?: string;
}

@Injectable()
export class ProposalVerifyService {
  private readonly logger = new Logger(ProposalVerifyService.name);
  private running = false;
  private readonly CAP = 3; // per poller run
  private readonly MAX_VERIFY_PER_DAY = 8; // combined-volume guard (used in Task 5)

  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: TwitterPublisher,
    private readonly safetyFilter: SafetyFilter,
    private readonly settings: SocialsSettingsService,
  ) {}

  private sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
  private rand(minMs: number, maxMs: number) {
    return Math.floor(minMs + Math.random() * (maxMs - minMs));
  }

  /**
   * Up to `limit` qualifying proposals not yet in the verify ledger.
   *  IDENTIFY: targetField='name' AND proposedValue.type='identify' AND position_id NOT NULL.
   *  CHANGE:   targetField IN ('name','partyAcronym') AND proposedValue.type != 'identify' AND official.slug NOT NULL.
   * Left-anti-join proposal_verify_posts on the anchor. JSON `type` re-checked in JS.
   */
  async findQualifying(limit = this.CAP): Promise<QualifyingProposal[]> {
    const identifyRows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT dp.id AS proposal_id, dp.position_id, dp.proposed_value,
             op.role AS role,
             op.ward_code,
             COALESCE(op.lga_code, w.lga_code) AS lga_code,
             op.constituency_code,
             COALESCE(op.state_code, l.state_code, c.state_code, wl.state_code) AS state_code
      FROM data_proposals dp
      JOIN official_positions op ON op.id = dp.position_id
      LEFT JOIN nigerian_lgas l ON l.code = op.lga_code
      LEFT JOIN nigerian_constituencies c ON c.code = op.constituency_code
      LEFT JOIN nigerian_wards w ON w.code = op.ward_code
      LEFT JOIN nigerian_lgas wl ON wl.code = w.lga_code
      WHERE dp.target_field = 'name'
        AND dp.status IN ('submitted','under_review','needs_evidence')
        AND dp.position_id IS NOT NULL
        AND dp.proposed_value->>'type' = 'identify'
        AND NOT EXISTS (
          SELECT 1 FROM proposal_verify_posts v
          WHERE v.anchor_type = 'seat' AND v.anchor_id = dp.position_id::text
        )
      ORDER BY dp.created_at ASC
      LIMIT ${Math.max(1, limit)}
    `);

    const changeRows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT dp.id AS proposal_id, dp.target_field, dp.proposed_value,
             o.name AS official_name, o.slug AS slug
      FROM data_proposals dp
      JOIN nigerian_officials o ON o.id = dp.official_id
      WHERE dp.target_field IN ('name','partyAcronym')
        AND dp.status IN ('submitted','under_review','needs_evidence')
        AND (dp.proposed_value->>'type') IS DISTINCT FROM 'identify'
        AND o.slug IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM proposal_verify_posts v
          WHERE v.anchor_type = 'proposal' AND v.anchor_id = dp.id::text
        )
      ORDER BY dp.created_at ASC
      LIMIT ${Math.max(1, limit)}
    `);

    const out: QualifyingProposal[] = [];
    for (const r of identifyRows) {
      const pv = r.proposed_value ?? {};
      if (pv.type !== "identify") continue;
      const level: VerifyLevel = r.constituency_code ? "constituency" : r.ward_code ? "ward" : "lga";
      out.push({
        proposalId: r.proposal_id, kind: "identify",
        anchorType: "seat", anchorId: String(r.position_id),
        role: r.role, stateCode: r.state_code ?? undefined,
        lgaCode: r.lga_code ?? undefined,
        wardCode: r.ward_code ?? undefined,
        constituencyCode: r.constituency_code ?? undefined,
        level, displayValue: pv.displayValue ?? "your official",
      });
    }
    for (const r of changeRows) {
      const pv = r.proposed_value ?? {};
      if (pv.type === "identify") continue;
      out.push({
        proposalId: r.proposal_id, kind: "change",
        anchorType: "proposal", anchorId: String(r.proposal_id),
        officialName: r.official_name, slug: r.slug,
        targetField: r.target_field,
        proposedScalar: pv.value != null ? String(pv.value) : "",
      });
    }
    return out.slice(0, limit);
  }

  /**
   * Cluster-safe claim + dedup in one insert. First node to INSERT the anchor
   * row ('claiming') owns it; everyone else gets a 0-row ON CONFLICT → false.
   */
  async claimVerify(p: QualifyingProposal): Promise<boolean> {
    const affected = await this.prisma.$executeRaw`
      INSERT INTO proposal_verify_posts
        (anchor_type, anchor_id, proposal_id, kind, status)
      VALUES (${p.anchorType}, ${p.anchorId}, ${p.proposalId}::uuid, ${p.kind}, 'claiming')
      ON CONFLICT (anchor_type, anchor_id) DO NOTHING;
    `;
    if (affected === 1)
      this.logger.log(`verify claimed ${p.anchorType}:${p.anchorId} (${p.kind}) on ${hostname()}`);
    return affected === 1;
  }
}
