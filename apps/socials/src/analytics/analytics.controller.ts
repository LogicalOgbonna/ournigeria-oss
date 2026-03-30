import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "@ournigeria/database";

@ApiTags("Analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("stats")
  @ApiOperation({ summary: "Get overall posting statistics" })
  async stats() {
    const [totalPosts, publishedPosts, failedPosts, repliesApproved] =
      await Promise.all([
        this.prisma.socialPost.count(),
        this.prisma.socialPost.count({
          where: { status: "published" },
        }),
        this.prisma.socialPost.count({
          where: { status: "failed" },
        }),
        this.prisma.socialPost.count({
          where: {
            postType: "reply",
            reviewStatus: "approved",
          },
        }),
      ]);

    return {
      totalPosts,
      publishedPosts,
      failedPosts,
      repliesApproved,
    };
  }

  @Get("posts")
  @ApiOperation({ summary: "Get recent posts with engagement" })
  async posts(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const ps = pageSize ? parseInt(pageSize, 10) : 20;

    const [items, total] = await Promise.all([
      this.prisma.socialPost.findMany({
        where: { status: "published" },
        orderBy: { publishedAt: "desc" },
        skip: (p - 1) * ps,
        take: ps,
      }),
      this.prisma.socialPost.count({
        where: { status: "published" },
      }),
    ]);

    return {
      items,
      total,
      page: p,
      pageSize: ps,
      totalPages: Math.ceil(total / ps),
    };
  }

  @Get("chart-data")
  @ApiOperation({ summary: "Get daily post counts for charting" })
  async chartData(@Query("days") days?: string) {
    const numDays = days ? parseInt(days, 10) : 30;
    const since = new Date(
      Date.now() - numDays * 24 * 60 * 60 * 1000,
    );

    const posts = await this.prisma.socialPost.findMany({
      where: {
        status: "published",
        publishedAt: { gte: since },
      },
      select: {
        publishedAt: true,
        postType: true,
        engagementData: true,
      },
      orderBy: { publishedAt: "asc" },
    });

    // Group by day
    const byDay = new Map<
      string,
      { date: string; tweets: number; threads: number; replies: number }
    >();

    for (const post of posts) {
      if (!post.publishedAt) continue;
      const day = post.publishedAt.toISOString().slice(0, 10);
      const entry = byDay.get(day) ?? {
        date: day,
        tweets: 0,
        threads: 0,
        replies: 0,
      };

      if (post.postType === "opinion_tweet") entry.tweets++;
      else if (post.postType === "thread") entry.threads++;
      else if (post.postType === "reply") entry.replies++;

      byDay.set(day, entry);
    }

    return Array.from(byDay.values());
  }
}
