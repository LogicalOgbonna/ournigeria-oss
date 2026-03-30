import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "@ournigeria/database";
import { TwitterAdapter } from "../platforms/twitter/twitter.adapter.js";

@Injectable()
export class EngagementService {
  private readonly logger = new Logger(EngagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly twitter: TwitterAdapter,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async pollEngagement() {
    this.logger.log("Starting daily engagement poll");

    const posts = await this.prisma.socialPost.findMany({
      where: {
        status: "published",
        externalId: { not: null },
        publishedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      select: { id: true, externalId: true },
    });

    let updated = 0;
    for (const post of posts) {
      try {
        const engagement = await this.twitter.getEngagement(
          post.externalId!,
        );

        await this.prisma.socialPost.update({
          where: { id: post.id },
          data: {
            engagementData: engagement as any,
          },
        });

        updated++;
      } catch (error) {
        this.logger.warn(
          `Failed to poll engagement for ${post.externalId}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    this.logger.log(
      `Engagement poll complete: ${updated}/${posts.length} posts updated`,
    );
  }
}
