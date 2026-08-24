import { hostname } from "node:os";
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "@ournigeria/database";
import { TwitterPublisher } from "../platforms/twitter/twitter.publisher.js";
import { SafetyFilter } from "../intelligence/safety-filter.js";
import { SocialsSettingsService } from "../config/socials-settings.service.js";
import {
  IdentifyCategory,
  reachTierCase,
  fillTemplate,
  buildIdentifyUrl,
  IdentifyLevel,
} from "./identify-content.js";
import { CampaignTemplateProvider } from "../campaign/campaign-template.provider.js";

export interface SelectedSeat {
  category: IdentifyCategory;
  seatColumn: "ward_code" | "lga_code" | "constituency_code";
  seatCode: string;
  seatName: string;
  stateCode: string;
  stateName: string;
  lgaCode?: string;
  lgaName?: string;
  wardName?: string;
  constituencyCode?: string;
  constituencyName?: string;
}

@Injectable()
export class IdentifyCampaignService {
  private readonly logger = new Logger(IdentifyCampaignService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: TwitterPublisher,
    private readonly safetyFilter: SafetyFilter,
    private readonly settings: SocialsSettingsService,
    private readonly templates: CampaignTemplateProvider,
  ) {}

  /**
   * Reach-weighted, without-replacement draw of ONE unidentified seat for a
   * category. Excludes seats with an official_position (done-guard) or a ledger
   * row (without-replacement). ORDER BY reach tier DESC, then random(). Returns
   * null when the pool is empty (e.g. councilor locally — 0 wards).
   */
  async selectSeat(category: IdentifyCategory): Promise<SelectedSeat | null> {
    if (category === "councilor") {
      const tier = reachTierCase("l.state_code");
      const rows = await this.prisma.$queryRawUnsafe<any[]>(`
        SELECT w.code AS seat_code, w.name AS seat_name,
               l.code AS lga_code, l.name AS lga_name,
               l.state_code AS state_code, s.name AS state_name
        FROM nigerian_wards w
        JOIN nigerian_lgas l ON w.lga_code = l.code
        JOIN nigerian_states s ON s.code = l.state_code
        LEFT JOIN official_positions p ON p.role = 'councilor' AND p.ward_code = w.code
        LEFT JOIN identify_campaign_targets t ON t.category = 'councilor' AND t.seat_code = w.code
        WHERE p.id IS NULL AND t.id IS NULL
        ORDER BY (${tier}) DESC, random()
        LIMIT 1
      `);
      const r = rows[0];
      if (!r) return null;
      return {
        category, seatColumn: "ward_code", seatCode: r.seat_code,
        seatName: r.seat_name, stateCode: r.state_code, stateName: r.state_name,
        lgaCode: r.lga_code, lgaName: r.lga_name, wardName: r.seat_name,
      };
    }

    if (category === "lga_chairman") {
      const tier = reachTierCase("l.state_code");
      const rows = await this.prisma.$queryRawUnsafe<any[]>(`
        SELECT l.code AS seat_code, l.name AS seat_name,
               l.state_code AS state_code, s.name AS state_name
        FROM nigerian_lgas l
        JOIN nigerian_states s ON s.code = l.state_code
        LEFT JOIN official_positions p ON p.role = 'lga_chairman' AND p.lga_code = l.code
        LEFT JOIN identify_campaign_targets t ON t.category = 'lga_chairman' AND t.seat_code = l.code
        WHERE p.id IS NULL AND t.id IS NULL
        ORDER BY (${tier}) DESC, random()
        LIMIT 1
      `);
      const r = rows[0];
      if (!r) return null;
      return {
        category, seatColumn: "lga_code", seatCode: r.seat_code,
        seatName: r.seat_name, stateCode: r.state_code, stateName: r.state_name,
        lgaCode: r.seat_code, lgaName: r.seat_name,
      };
    }

    // mha — state house of assembly constituencies only
    const tier = reachTierCase("c.state_code");
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT c.code AS seat_code, c.name AS seat_name,
             c.state_code AS state_code, s.name AS state_name
      FROM nigerian_constituencies c
      JOIN nigerian_states s ON s.code = c.state_code
      LEFT JOIN official_positions p ON p.role = 'mha' AND p.constituency_code = c.code
      LEFT JOIN identify_campaign_targets t ON t.category = 'mha' AND t.seat_code = c.code
      WHERE c.type = 'state' AND p.id IS NULL AND t.id IS NULL
      ORDER BY (${tier}) DESC, random()
      LIMIT 1
    `);
    const r = rows[0];
    if (!r) return null;
    return {
      category, seatColumn: "constituency_code", seatCode: r.seat_code,
      seatName: r.seat_name, stateCode: r.state_code, stateName: r.state_name,
      constituencyCode: r.seat_code, constituencyName: r.seat_name,
    };
  }

  /**
   * Cluster singleton for one (windowDate, windowSlot). The first socials node
   * to INSERT the run row owns the window; everyone else gets a 0-row conflict
   * and returns false. Blue/green safe. $executeRaw returns the affected count.
   */
  async claimWindow(windowDate: Date, windowSlot: number): Promise<boolean> {
    const affected = await this.prisma.$executeRaw`
      INSERT INTO identify_campaign_runs
        (window_date, window_slot, claimed_by_pid, claimed_by_host, started_at, posted_count)
      VALUES (${windowDate}::date, ${windowSlot}, ${process.pid}, ${hostname()}, now(), 0)
      ON CONFLICT (window_date, window_slot) DO NOTHING;
    `;
    return affected === 1;
  }

  /** Bump the posted counter on the current window's run row. */
  private async incrementPosted(windowDate: Date, windowSlot: number) {
    await this.prisma.$executeRaw`
      UPDATE identify_campaign_runs SET posted_count = posted_count + 1
      WHERE window_date = ${windowDate}::date AND window_slot = ${windowSlot};
    `;
  }

  private readonly CATEGORIES: IdentifyCategory[] = ["councilor", "lga_chairman", "mha"];
  /** UTC hours the cron fires at (07/11/15/19/23 WAT, offset baked in). */
  private readonly WINDOW_HOURS = [6, 10, 14, 18, 22];

  private sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
  private rand(minMs: number, maxMs: number) {
    return Math.floor(minMs + Math.random() * (maxMs - minMs));
  }

  /** 5 windows/day at 07/11/15/19/23 WAT (UTC 06/10/14/18/22). */
  @Cron("0 0 6,10,14,18,22 * * *")
  async runScheduledWindow() {
    const now = new Date();
    const slot = this.WINDOW_HOURS.indexOf(now.getUTCHours());
    if (slot === -1) return;
    const windowDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const leader = await this.claimWindow(windowDate, slot);
    if (!leader) { this.logger.log(`window ${slot} owned by another node — skipping`); return; }
    await this.runWindow(windowDate, slot);
  }

  /**
   * Post ONE tweet per fueled category, jittered: initial 0-5 min, then 2-5 min
   * between categories (~15 min total). If the process is killed mid-window at
   * most the remaining tweets of THIS window are lost (acceptable).
   */
  async runWindow(windowDate: Date, windowSlot: number) {
    await this.sleep(this.rand(0, 5 * 60_000));
    for (let i = 0; i < this.CATEGORIES.length; i++) {
      const cat = this.CATEGORIES[i];
      try {
        const result = await this.postOneCategory(cat, windowSlot, { dryRun: false });
        if (result) await this.incrementPosted(windowDate, windowSlot);
      } catch (e) {
        this.logger.error(`identify ${cat} failed: ${e instanceof Error ? e.message : e}`);
      }
      if (i < this.CATEGORIES.length - 1) {
        await this.sleep(this.rand(2 * 60_000, 5 * 60_000));
      }
    }
  }

  /**
   * Select a seat, build the tweet, and either auto-post (toggle ON) or park a
   * draft (toggle OFF). Returns a preview or null (empty pool). `dryRun` builds
   * everything but performs NO publish AND NO writes — for automated tests. Both
   * the auto-post and park branches write a ledger row so the seat isn't reused.
   */
  async postOneCategory(
    category: IdentifyCategory,
    windowSlot: number,
    opts: { dryRun: boolean },
  ): Promise<{ text: string; url: string; safe: boolean; seatCode: string } | null> {
    const seat = await this.selectSeat(category);
    if (!seat) return null;

    const level: IdentifyLevel =
      category === "councilor" ? "ward" : category === "lga_chairman" ? "lga" : "constituency";
    const url = buildIdentifyUrl({
      role: category, stateCode: seat.stateCode, level,
      lgaCode: seat.lgaCode, wardCode: category === "councilor" ? seat.seatCode : undefined,
      constituencyCode: seat.constituencyCode,
    });
    const tpl = await this.templates.pickIdentify(category, windowSlot);
    const text = fillTemplate(tpl, {
      ward: seat.wardName ?? "", lga: seat.lgaName ?? "",
      constituency: seat.constituencyName ?? "", state: seat.stateName, url,
    });
    const safety = this.safetyFilter.check(text, []);
    const preview = { text, url, safe: safety.safe && !safety.blocked, seatCode: seat.seatCode };

    if (opts.dryRun) return preview;
    if (!preview.safe) {
      this.logger.warn(`identify ${category} skipped: ${safety.warnings.join("; ")}`);
      return null;
    }

    if (await this.seatHasPosition(seat)) {
      this.logger.log(`identify ${category} seat ${seat.seatCode} got identified — skip`);
      return null;
    }

    const dataQuery = JSON.stringify({
      category, seatColumn: seat.seatColumn, seatCode: seat.seatCode, stateCode: seat.stateCode, url,
    });

    const autoPost = await this.settings.getIdentifyAutoPost();
    if (autoPost) {
      const published = await this.publisher.publishOriginal(text, "opinion_tweet");
      const tweetId = published[0]?.id;
      const post = await this.prisma.socialPost.create({
        data: {
          platform: "twitter", postType: "identify_seat", externalId: tweetId,
          content: text, dataDomain: "officials", dataQuery,
          status: "published", publishedAt: new Date(),
        },
      });
      await this.prisma.identifyCampaignTarget.create({
        data: {
          category, seatColumn: seat.seatColumn, seatCode: seat.seatCode,
          stateCode: seat.stateCode, socialPostId: post.id, tweetId, status: "posted",
        },
      });
      this.logger.log(`identify ${category} posted ${seat.seatCode}: ${tweetId}`);
    } else {
      const post = await this.prisma.socialPost.create({
        data: {
          platform: "twitter", postType: "identify_seat",
          content: text, dataDomain: "officials", dataQuery,
          status: "drafted", reviewStatus: "pending",
        },
      });
      await this.prisma.identifyCampaignTarget.create({
        data: {
          category, seatColumn: seat.seatColumn, seatCode: seat.seatCode,
          stateCode: seat.stateCode, socialPostId: post.id, status: "drafted",
        },
      });
      this.logger.log(`identify ${category} parked draft ${post.id} for ${seat.seatCode}`);
    }
    return preview;
  }

  /** Race-guard: does the seat now have an official_position? */
  private async seatHasPosition(seat: SelectedSeat): Promise<boolean> {
    const col = seat.seatColumn; // internal enum, not user input
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT 1 FROM official_positions WHERE role = $1 AND ${col} = $2 LIMIT 1`,
      seat.category, seat.seatCode,
    );
    return rows.length > 0;
  }
}
