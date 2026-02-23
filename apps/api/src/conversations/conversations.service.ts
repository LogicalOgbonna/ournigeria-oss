import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { userId, status: 'active' },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          orderBy: { sequenceNumber: 'desc' },
          take: 1,
          select: {
            content: true,
            role: true,
          },
        },
        _count: {
          select: {
            messages: { where: { role: 'user' } },
          },
        },
      },
    });

    return conversations.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      lastMessage: c.messages[0]?.content ?? null,
      lastMessageRole: c.messages[0]?.role ?? null,
      messageCount: c._count.messages,
    }));
  }

  async getById(id: string, userId: string) {
    return this.prisma.conversation.findFirst({
      where: { id, userId, status: 'active' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          orderBy: { sequenceNumber: 'asc' },
          select: {
            id: true,
            sequenceNumber: true,
            role: true,
            content: true,
            richContent: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async delete(id: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, userId },
    });

    if (!conversation) {
      return null;
    }

    await this.prisma.conversation.update({
      where: { id },
      data: { status: 'deleted' },
    });

    return { success: true };
  }
}
