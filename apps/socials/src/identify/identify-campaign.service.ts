import { hostname } from "node:os";
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { TwitterPublisher } from "../platforms/twitter/twitter.publisher.js";
import { SafetyFilter } from "../intelligence/safety-filter.js";
import { SocialsSettingsService } from "../config/socials-settings.service.js";
import { IdentifyCategory, reachTierCase } from "./identify-content.js";

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
}
