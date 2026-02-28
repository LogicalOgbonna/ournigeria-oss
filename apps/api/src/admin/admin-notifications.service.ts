import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";

interface NotificationData {
  type: "incident" | "announcement" | "info" | "warning";
  title: string;
  message: string;
  linkText?: string;
  linkUrl?: string;
}

interface BannerData {
  type: "incident" | "announcement" | "warning";
  title: string;
  message: string;
  linkText?: string;
  linkUrl?: string;
  dismissible?: boolean;
  expiresAt?: string;
}

interface BannerUpdate {
  title?: string;
  message?: string;
  active?: boolean;
  dismissible?: boolean;
  expiresAt?: string | null;
}

@Injectable()
export class AdminNotificationsService {
  constructor(private prisma: PrismaService) {}

  async listNotifications(page: number, limit: number, userId?: string) {
    const where = userId ? { userId } : {};
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, phoneNumber: true, telegramId: true, name: true },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: data.map((n) => ({
        id: n.id,
        userId: n.userId,
        user: n.user,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        linkText: n.linkText,
        linkUrl: n.linkUrl,
        createdAt: n.createdAt.toISOString(),
      })),
      total,
    };
  }

  async createNotification(userId: string, data: NotificationData) {
    return this.prisma.notification.create({
      data: { userId, ...data },
    });
  }

  async broadcastNotification(data: NotificationData) {
    const users = await this.prisma.user.findMany({
      select: { id: true },
    });

    const created = await this.prisma.notification.createMany({
      data: users.map((u) => ({ userId: u.id, ...data })),
    });

    return { count: created.count };
  }

  async deleteNotification(id: string) {
    return this.prisma.notification.delete({ where: { id } });
  }

  async listBanners() {
    const banners = await this.prisma.systemBanner.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { dismissals: true } } },
    });

    return banners.map((b) => ({
      id: b.id,
      type: b.type,
      title: b.title,
      message: b.message,
      linkText: b.linkText,
      linkUrl: b.linkUrl,
      dismissible: b.dismissible,
      active: b.active,
      expiresAt: b.expiresAt?.toISOString() ?? null,
      createdAt: b.createdAt.toISOString(),
      dismissCount: b._count.dismissals,
    }));
  }

  async createBanner(data: BannerData) {
    return this.prisma.systemBanner.create({
      data: {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });
  }

  async updateBanner(id: string, data: BannerUpdate) {
    return this.prisma.systemBanner.update({
      where: { id },
      data: {
        ...data,
        expiresAt:
          data.expiresAt === null
            ? null
            : data.expiresAt
              ? new Date(data.expiresAt)
              : undefined,
      },
    });
  }

  async deleteBanner(id: string) {
    return this.prisma.systemBanner.delete({ where: { id } });
  }
}
