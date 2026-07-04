import { hostname } from "node:os";
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "@ournigeria/database";
import { TwitterPublisher } from "../platforms/twitter/twitter.publisher.js";
import { SafetyFilter } from "../intelligence/safety-filter.js";
import { SocialsSettingsService } from "../config/socials-settings.service.js";
import {
  VerifyKind,
  VerifyLevel,
  buildProposalVerifyUrl,
  fillVerifyTemplate,
  humanizeField,
  humanizeRole,
  composeGeo,
} from "./verify-content.js";
import { CampaignTemplateProvider } from "../campaign/campaign-template.provider.js";

/** Deterministic seed from the anchor id so template choice is stable per anchor. */
function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

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
  // identify: resolved human pieces used to compose the tweet (never raw codes).
  personName?: string;
  party?: string;
  constituencyName?: string;
  wardName?: string;
  lgaName?: string;
  stateName?: string;
  sourceUrl?: string;
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
    private readonly templates: CampaignTemplateProvider,
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
             COALESCE(op.state_code, l.state_code, c.state_code, wl.state_code) AS state_code,
             c.name AS constituency_name,
             w.name AS ward_name,
             COALESCE(l.name, wl.name) AS lga_name,
             s.name AS state_name,
             COALESCE(dp.source_url, dp.proposed_value->>'sourceUrl') AS source_url
      FROM data_proposals dp
      JOIN official_positions op ON op.id = dp.position_id
      LEFT JOIN nigerian_lgas l ON l.code = op.lga_code
      LEFT JOIN nigerian_constituencies c ON c.code = op.constituency_code
      LEFT JOIN nigerian_wards w ON w.code = op.ward_code
      LEFT JOIN nigerian_lgas wl ON wl.code = w.lga_code
      LEFT JOIN nigerian_states s ON s.code = COALESCE(op.state_code, l.state_code, c.state_code, wl.state_code)
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
        personName: pv.name ?? undefined,
        party: pv.partyAcronym ?? undefined,
        constituencyName: r.constituency_name ?? undefined,
        wardName: r.ward_name ?? undefined,
        lgaName: r.lga_name ?? undefined,
        stateName: r.state_name ?? undefined,
        sourceUrl: r.source_url ?? undefined,
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

    /** UTC 06–22 = 07:00–23:00 WAT active hours. Poller runs hourly. */
    @Cron("0 0 6-22 * * *")
    async runScheduled() {
      if (this.running) { this.logger.log("verify poller already running — skip"); return; }
      this.running = true;
      try { await this.runOnce({ dryRun: false }); }
      catch (e) { this.logger.error(`verify poller failed: ${e instanceof Error ? e.message : e}`); }
      finally { this.running = false; }
    }

    /** Process up to CAP qualifying proposals with a jittered gap. dryRun builds
     *  everything but performs NO publish and NO writes (for tests). */
    async runOnce(opts: { dryRun: boolean }): Promise<Array<{
      proposalId: string; kind: VerifyKind; text: string; url: string; safe: boolean; claimed: boolean;
    }>> {
      // Combined-volume guard: cap verify tweets per UTC day so identify (~15/day)
      // + verify stays under X spam thresholds. Real runs only; counts posted+parked.
      let limit = this.CAP;
      if (!opts.dryRun) {
        const since = new Date(); since.setUTCHours(0, 0, 0, 0);
        const today = await this.prisma.socialPost.count({
          where: { postType: "proposal_verify", createdAt: { gte: since } },
        });
        const remaining = Math.max(0, this.MAX_VERIFY_PER_DAY - today);
        if (remaining === 0) { this.logger.log("verify daily cap reached — skip window"); return []; }
        limit = Math.min(this.CAP, remaining);
      }
      const candidates = await this.findQualifying(limit);
      const results: any[] = [];
      for (let i = 0; i < candidates.length; i++) {
        const r = await this.processProposal(candidates[i], opts);
        if (r) results.push(r);
        if (!opts.dryRun && i < candidates.length - 1)
          await this.sleep(this.rand(30_000, 90_000));
      }
      return results;
    }

    /** Build the tweet for a candidate (no writes; reads templates from DB). */
    async buildPreview(p: QualifyingProposal): Promise<{ text: string; url: string; safe: boolean }> {
      let url: string, text: string;
      if (p.kind === "identify") {
        url = buildProposalVerifyUrl({
          kind: "identify", role: p.role!, stateCode: p.stateCode!,
          lgaCode: p.lgaCode, wardCode: p.wardCode, constituencyCode: p.constituencyCode,
          level: p.level!,
        });
        const tpl = await this.templates.pickVerify("identify", hashSeed(p.anchorId));
        // Compose from RESOLVED human pieces — never the raw displayValue/codes.
        const geo =
          composeGeo({
            level: p.level!, constituencyName: p.constituencyName, wardName: p.wardName,
            lgaName: p.lgaName, stateName: p.stateName,
          }) || "your area";
        const sourceNote = p.sourceUrl
          ? `\n\nThe proposer shared this source: ${p.sourceUrl}`
          : "";
        text = fillVerifyTemplate(tpl, {
          claim: "", name: p.personName ?? "your official", party: p.party ?? "",
          role: humanizeRole(p.role!), geo, sourceNote, fieldLabel: "", value: "", url,
        });
        // Empty-party guard: the identify form requires a party, but if one is
        // ever missing collapse the "({party})" remnant so we never render " ()".
        if (!p.party) text = text.replace(/\s*\(\)/g, "");
      } else {
        url = buildProposalVerifyUrl({ kind: "change", slug: p.slug! });
        const tpl = await this.templates.pickVerify("change", hashSeed(p.anchorId));
        text = fillVerifyTemplate(tpl, {
          claim: "", name: p.officialName ?? "this official", party: "", role: "", geo: "",
          fieldLabel: humanizeField(p.targetField!), value: p.proposedScalar ?? "", url,
        });
      }
      const safety = this.safetyFilter.check(text, []);
      return { text, url, safe: safety.safe && !safety.blocked };
    }

    async processProposal(
      p: QualifyingProposal,
      opts: { dryRun: boolean },
    ): Promise<{ proposalId: string; kind: VerifyKind; text: string; url: string; safe: boolean; claimed: boolean } | null> {
      const preview = await this.buildPreview(p);
      if (opts.dryRun) return { proposalId: p.proposalId, kind: p.kind, ...preview, claimed: false };

      const claimed = await this.claimVerify(p);
      if (!claimed) return null; // another node owns it (or already served)

      // Stale-link guard: the proposal may have been approved/resolved between
      // findQualifying and now. Re-check; if resolved, don't post a stale link.
      if (!(await this.isStillPending(p))) {
        await this.prisma.proposalVerifyPost.updateMany({
          where: { anchorType: p.anchorType, anchorId: p.anchorId },
          data: { status: "skipped" },
        });
        this.logger.log(`verify ${p.anchorType}:${p.anchorId} resolved before posting — skipped`);
        return null;
      }

      if (!preview.safe) {
        this.logger.warn(`verify ${p.anchorType}:${p.anchorId} unsafe — leaving ledger 'claiming'`);
        return null;
      }

      const dataQuery = JSON.stringify({
        kind: p.kind, anchorType: p.anchorType, anchorId: p.anchorId,
        proposalId: p.proposalId, url: preview.url,
      });

      const autoPost = await this.settings.getVerifyAutoPost();
      if (autoPost) {
        let tweetId: string | undefined;
        try {
          const publishedTweets = await this.publisher.publishOriginal(preview.text, "opinion_tweet");
          tweetId = publishedTweets[0]?.id;
        } catch (e) {
          // Publish failed (X auth/rate/duplicate). Do NOT leave the ledger stuck
          // at 'claiming' (ON CONFLICT would block any retry). Mark 'failed' so the
          // anchor is visibly not-served and surfaces for ops.
          await this.prisma.proposalVerifyPost.updateMany({
            where: { anchorType: p.anchorType, anchorId: p.anchorId },
            data: { status: "failed" },
          });
          this.logger.error(
            `verify publish FAILED ${p.anchorType}:${p.anchorId}: ${e instanceof Error ? e.message : e}`,
          );
          return null;
        }
        const post = await this.prisma.socialPost.create({
          data: {
            platform: "twitter", postType: "proposal_verify", externalId: tweetId,
            content: preview.text, dataDomain: "officials", dataQuery,
            status: "published", publishedAt: new Date(),
          },
        });
        await this.prisma.proposalVerifyPost.updateMany({
          where: { anchorType: p.anchorType, anchorId: p.anchorId },
          data: { status: "posted", socialPostId: post.id, tweetId },
        });
        this.logger.log(`verify posted ${p.anchorType}:${p.anchorId}: ${tweetId}`);
      } else {
        const post = await this.prisma.socialPost.create({
          data: {
            platform: "twitter", postType: "proposal_verify",
            content: preview.text, dataDomain: "officials", dataQuery,
            status: "drafted", reviewStatus: "pending",
          },
        });
        await this.prisma.proposalVerifyPost.updateMany({
          where: { anchorType: p.anchorType, anchorId: p.anchorId },
          data: { status: "drafted", socialPostId: post.id },
        });
        this.logger.log(`verify parked draft ${post.id} for ${p.anchorType}:${p.anchorId}`);
      }
      return { proposalId: p.proposalId, kind: p.kind, ...preview, claimed: true };
    }

    /** Is the proposal still worth verifying: still unresolved, and (identify) its
     *  seat still unreviewed (not yet approved)? */
    private async isStillPending(p: QualifyingProposal): Promise<boolean> {
      const prop = await this.prisma.dataProposal.findUnique({
        where: { id: p.proposalId },
        select: { status: true, position: { select: { reviewStatus: true } } },
      });
      if (!prop) return false;
      if (!["submitted", "under_review", "needs_evidence"].includes(prop.status)) return false;
      if (p.kind === "identify" && prop.position?.reviewStatus !== "unreviewed") return false;
      return true;
    }
}
