import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "@ournigeria/database";
import { TwitterPublisher } from "../platforms/twitter/twitter.publisher.js";
import { SafetyFilter } from "../intelligence/safety-filter.js";
import { ImageGeneratorService } from "../content/image-generator.js";
import { randomUUID } from "node:crypto";

/**
 * Background cron jobs for socials app.
 *
 * The old Twitter listener cycle is gone — discovery now flows through the
 * roamer (apps/socials/src/platforms/twitter/roamer/), drafting through the
 * decoupled DrafterService. CronService keeps only the FAAC infographic cron.
 */
@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);
  private readonly FAAC_DAILY_QUOTA = 5;
  private faacRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: TwitterPublisher,
    private readonly safetyFilter: SafetyFilter,
    private readonly imageGenerator: ImageGeneratorService,
  ) {}

  /** Every 3 hours during 8am-8pm WAT (UTC+1 → 7am-7pm UTC), max 5/day */
  @Cron("0 */3 7-19 * * *")
  async runFaacImageCycle() {
    if (this.faacRunning) return;
    this.faacRunning = true;
    const cycleId = randomUUID().slice(0, 8);

    try {
      await this.executeFaacCycle(cycleId);
    } catch (error) {
      this.logger.error(
        `[${cycleId}] FAAC cycle error: ${error instanceof Error ? error.message : error}`,
      );
    } finally {
      this.faacRunning = false;
    }
  }

  private async executeFaacCycle(cycleId: string) {
    this.logger.log(`[${cycleId}] Starting FAAC image cycle`);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await this.prisma.socialPost.count({
      where: {
        postType: "faac_infographic",
        publishedAt: { gte: todayStart },
      },
    });

    if (todayCount >= this.FAAC_DAILY_QUOTA) {
      this.logger.log(
        `[${cycleId}] Daily FAAC quota reached (${todayCount}/${this.FAAC_DAILY_QUOTA})`,
      );
      return;
    }

    const latestMonth = await this.getLatestFaacMonth();
    if (!latestMonth) {
      this.logger.log(`[${cycleId}] No FAAC data available`);
      return;
    }

    const nextLga = await this.pickNextUnpostedLga(
      latestMonth.month,
      latestMonth.year,
    );

    if (!nextLga) {
      this.logger.log(
        `[${cycleId}] All top LGAs already posted for ${latestMonth.month} ${latestMonth.year}`,
      );
      return;
    }

    this.logger.log(
      `[${cycleId}] Generating image for ${nextLga.lgaName}, ${nextLga.stateName}`,
    );

    const imageResult = await this.imageGenerator.generateFaacImage(
      nextLga.lgaName,
      nextLga.stateName,
      latestMonth.month,
      latestMonth.year,
    );

    const caption = this.generateFaacCaption(
      nextLga.lgaName,
      nextLga.stateName,
      latestMonth.month,
      latestMonth.year,
      nextLga.totalAllocation,
    );

    const safety = this.safetyFilter.check(caption, []);
    if (!safety.safe) {
      this.logger.warn(
        `[${cycleId}] Safety filter rejected FAAC caption: ${safety.warnings.join("; ")}`,
      );
      return;
    }

    let published;
    if (imageResult) {
      published = await this.publisher.publishWithImage(
        caption,
        imageResult.buffer,
        imageResult.altText,
      );
    } else {
      published = await this.publisher.publishOriginal(caption, "opinion_tweet");
    }

    const dataQuery = JSON.stringify({
      lgaName: nextLga.lgaName,
      stateName: nextLga.stateName,
      month: latestMonth.month,
      year: latestMonth.year,
    });

    await this.prisma.socialPost.create({
      data: {
        platform: "twitter",
        postType: "faac_infographic",
        externalId: published[0]?.id,
        content: caption,
        dataDomain: "faac",
        dataQuery,
        status: "published",
        publishedAt: new Date(),
      },
    });

    this.logger.log(
      `[${cycleId}] Published FAAC infographic for ${nextLga.lgaName}: ${published[0]?.id}`,
    );
  }

  private async getLatestFaacMonth(): Promise<{
    month: string;
    year: number;
  } | null> {
    try {
      const { executeToolCall } = await import("@ournigeria/tools");
      const result = (await executeToolCall("faac-search", {
        query: "FAAC allocation latest",
      })) as {
        results?: Array<{ metadata?: { month?: string; year?: number } }>;
      };

      const first = result?.results?.[0]?.metadata;
      if (first?.month && first?.year) {
        return { month: first.month, year: first.year };
      }
      return null;
    } catch {
      return null;
    }
  }

  private async pickNextUnpostedLga(
    month: string,
    year: number,
  ): Promise<{
    lgaName: string;
    stateName: string;
    totalAllocation: number;
  } | null> {
    const posted = await this.prisma.socialPost.findMany({
      where: {
        postType: "faac_infographic",
        dataDomain: "faac",
      },
      select: { dataQuery: true },
    });

    const postedLgas = new Set<string>();
    for (const post of posted) {
      try {
        const q = JSON.parse(post.dataQuery ?? "{}");
        if (q.month === month && q.year === year && q.lgaName) {
          postedLgas.add(`${q.lgaName}|${q.stateName}`);
        }
      } catch {
        /* skip invalid */
      }
    }

    try {
      const { executeToolCall } = await import("@ournigeria/tools");
      const result = (await executeToolCall("faac-search", {
        query: `FAAC allocation ${month} ${year} LGA`,
        month,
        year,
      })) as {
        results?: Array<{
          metadata?: {
            lga?: string;
            state?: string;
            total_allocation?: number;
          };
        }>;
      };

      if (!result?.results?.length) return null;

      const candidates = result.results
        .filter(
          (r) =>
            r.metadata?.lga && r.metadata?.state && r.metadata?.total_allocation,
        )
        .map((r) => ({
          lgaName: r.metadata!.lga!,
          stateName: r.metadata!.state!,
          totalAllocation: r.metadata!.total_allocation!,
        }))
        .sort((a, b) => b.totalAllocation - a.totalAllocation);

      for (const candidate of candidates) {
        const key = `${candidate.lgaName}|${candidate.stateName}`;
        if (!postedLgas.has(key)) {
          return candidate;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  private generateFaacCaption(
    lgaName: string,
    stateName: string,
    month: string,
    year: number,
    totalAllocation: number,
  ): string {
    const amount = this.formatNairaCaption(totalAllocation);
    const templates = [
      `${lgaName} LGA for ${stateName} State collect ${amount} from FAAC for ${month} ${year}.\n\nSee how dem share the money. Na your money o. #FAAC #${stateName.replace(/\s/g, "")} #OurNigeria`,
      `For ${month} ${year}, ${lgaName} LGA get ${amount} FAAC allocation.\n\nThis na ${stateName} State money wey suppose work for the people. Track am. #FAAC #OpenData #OurNigeria`,
      `FAAC don share money for ${month} ${year}. ${lgaName} LGA, ${stateName} State collect ${amount}.\n\nWe dey track every kobo. #BudgetTransparency #OurNigeria`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private formatNairaCaption(value: number): string {
    if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(0)}M`;
    if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`;
    return `₦${value}`;
  }
}
