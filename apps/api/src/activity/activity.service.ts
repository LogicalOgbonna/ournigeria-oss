import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async getRecent(limit = 10, page = 1) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      this.prisma.activityLog.count(),
    ]);

    return {
      data: items.map((item) => ({
        id: item.id,
        eventType: item.eventType,
        targetType: item.targetType,
        targetId: item.targetId,
        metadata: item.metadata,
        createdAt: item.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }
}
