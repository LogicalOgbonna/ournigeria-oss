import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { invalidateUserAuthCache } from "../auth/auth.guard";
import { invalidateSessionResolutionCache } from "../auth/session.service";
import { AuditService, type AuditActor } from "../audit/audit.service";

@Injectable()
export class AdminUsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async listUsers(page: number, limit: number, search?: string) {
    const where = search
      ? {
          OR: [
            { phoneNumber: { contains: search } },
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { telegramId: { contains: search } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          phoneNumber: true,
          telegramId: true,
          name: true,
          email: true,
          banned: true,
          bannedAt: true,
          banReason: true,
          createdAt: true,
          lastSeenAt: true,
          _count: { select: { conversations: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data.map((u) => ({
        id: u.id,
        phoneNumber: u.phoneNumber,
        telegramId: u.telegramId,
        name: u.name,
        email: u.email,
        banned: u.banned,
        bannedAt: u.bannedAt?.toISOString() ?? null,
        banReason: u.banReason,
        createdAt: u.createdAt.toISOString(),
        lastSeenAt: u.lastSeenAt.toISOString(),
        _count: { conversations: u._count.conversations },
      })),
      total,
      page,
      limit,
    };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            conversations: true,
            memories: true,
            queryAnalytics: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      telegramId: user.telegramId,
      name: user.name,
      email: user.email,
      banned: user.banned,
      bannedAt: user.bannedAt?.toISOString() ?? null,
      banReason: user.banReason,
      createdAt: user.createdAt.toISOString(),
      lastSeenAt: user.lastSeenAt.toISOString(),
      preferences: user.preferences,
      _count: {
        conversations: user._count.conversations,
        memories: user._count.memories,
        queryAnalytics: user._count.queryAnalytics,
      },
    };
  }

  async getUserConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    return {
      data: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        createdAt: c.createdAt.toISOString(),
        _count: { messages: c._count.messages },
      })),
    };
  }

  async getUserMemories(userId: string) {
    const memories = await this.prisma.userMemory.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    return {
      data: memories.map((m) => ({
        id: m.id,
        content: `${m.key}: ${m.value}`,
        createdAt: m.updatedAt.toISOString(),
      })),
    };
  }

  async getUserAnalytics(userId: string) {
    const analytics = await this.prisma.queryAnalytic.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return {
      data: analytics.map((a) => ({
        id: a.id,
        query: a.queryText || "(no query text)",
        category: a.queryCategory,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }

  async updateUserPreferences(
    id: string,
    preferences: Record<string, unknown>,
    actor: AuditActor,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.user.findUnique({
        where: { id },
        select: { preferences: true },
      });
      const updated = await tx.user.update({
        where: { id },
        data: { preferences: preferences as any },
        select: { id: true, preferences: true },
      });
      await this.audit.log(tx, actor, {
        action: "user.updated",
        targetType: "user",
        targetId: id,
        diff: {
          before: { preferences: before?.preferences ?? null },
          after: { preferences: updated.preferences },
        },
      });
      return updated;
    });
  }

  async banUser(id: string, reason: string | undefined, actor: AuditActor) {
    const result = await this.prisma.$transaction(async (tx) => {
      const before = await tx.user.findUnique({
        where: { id },
        select: { banned: true, bannedAt: true, banReason: true },
      });
      const updated = await tx.user.update({
        where: { id },
        data: {
          banned: true,
          bannedAt: new Date(),
          banReason: reason || null,
        },
        select: { id: true, banned: true, bannedAt: true, banReason: true },
      });
      // Kill every active session immediately (the ban cache alone lags up to 60s)
      // and purge cached token resolutions so they can't outlive the ban.
      await tx.userSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.audit.log(tx, actor, {
        action: "user.banned",
        targetType: "user",
        targetId: id,
        diff: {
          before,
          after: {
            banned: updated.banned,
            bannedAt: updated.bannedAt,
            banReason: updated.banReason,
          },
        },
        metadata: reason ? { reason } : {},
      });
      return updated;
    });
    await invalidateSessionResolutionCache();
    await invalidateUserAuthCache(id);
    return result;
  }

  async unbanUser(id: string, actor: AuditActor) {
    const result = await this.prisma.$transaction(async (tx) => {
      const before = await tx.user.findUnique({
        where: { id },
        select: { banned: true, bannedAt: true, banReason: true },
      });
      const updated = await tx.user.update({
        where: { id },
        data: {
          banned: false,
          bannedAt: null,
          banReason: null,
        },
        select: { id: true, banned: true },
      });
      await this.audit.log(tx, actor, {
        action: "user.unbanned",
        targetType: "user",
        targetId: id,
        diff: {
          before,
          after: { banned: false, bannedAt: null, banReason: null },
        },
      });
      return updated;
    });
    await invalidateUserAuthCache(id);
    return result;
  }

  async deleteUser(id: string, actor: AuditActor) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.user.findUnique({ where: { id } });
      const deleted = await tx.user.delete({ where: { id } });
      await this.audit.log(tx, actor, {
        action: "user.deleted",
        targetType: "user",
        targetId: id,
        diff: { before, after: null },
      });
      return deleted;
    });
  }

  async getUserStats() {
    const [total, last24h, last7d] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { createdAt: { gte: new Date(Date.now() - 86400000) } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: new Date(Date.now() - 604800000) } },
      }),
    ]);

    return { total, last24h, last7d };
  }
}
