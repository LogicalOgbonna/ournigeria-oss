import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";

@Injectable()
export class AdminConversationsService {
  constructor(private prisma: PrismaService) {}

  async listConversations(page: number, limit: number, search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { user: { phoneNumber: { contains: search } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          user: {
            select: { phoneNumber: true, name: true, telegramId: true },
          },
          _count: { select: { messages: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      data: data.map((c) => ({
        id: c.id,
        title: c.title,
        userId: c.userId,
        userIdentifier:
          c.user.name || c.user.phoneNumber || c.user.telegramId || "Unknown",
        messageCount: c._count.messages,
        flagged: false,
        createdAt: c.createdAt.toISOString(),
        lastMessageAt:
          c.messages[0]?.createdAt.toISOString() ?? c.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }

  async getConversation(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: { phoneNumber: true, name: true, telegramId: true },
        },
        messages: {
          orderBy: { sequenceNumber: "asc" },
          select: {
            id: true,
            role: true,
            content: true,
            richContent: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) return null;

    return {
      id: conversation.id,
      title: conversation.title,
      userId: conversation.userId,
      userIdentifier:
        conversation.user.name ||
        conversation.user.phoneNumber ||
        conversation.user.telegramId ||
        "Unknown",
      flagged: false,
      createdAt: conversation.createdAt.toISOString(),
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        sources: extractSources(m.richContent),
      })),
    };
  }
}

function extractSources(
  richContent: any,
): { title: string; filePath: string; score: number }[] | undefined {
  if (!richContent) return undefined;
  const sources = richContent.sources;
  if (!Array.isArray(sources) || sources.length === 0) return undefined;
  return sources.map((s: any) => ({
    title: s.title || s.documentTitle || "Source",
    filePath: s.filePath || s.documentPath || "",
    score: s.score ?? s.similarity ?? 0,
  }));
}
