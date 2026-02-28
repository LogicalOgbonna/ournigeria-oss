import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(userId: string, limit = 50) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async getActiveBanners(userId: string) {
    const now = new Date();

    const banners = await this.prisma.systemBanner.findMany({
      where: {
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
    });

    // Get this user's dismissed banner IDs
    const dismissals = await this.prisma.bannerDismissal.findMany({
      where: {
        userId,
        bannerId: { in: banners.map((b) => b.id) },
      },
      select: { bannerId: true },
    });

    const dismissedIds = new Set(dismissals.map((d) => d.bannerId));

    return banners.filter((b) => !dismissedIds.has(b.id));
  }

  async dismissBanner(userId: string, bannerId: string) {
    return this.prisma.bannerDismissal.upsert({
      where: { userId_bannerId: { userId, bannerId } },
      create: { userId, bannerId },
      update: {},
    });
  }
}
