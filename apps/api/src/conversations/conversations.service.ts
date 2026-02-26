import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { slugify, slugifyWithSuffix } from '../lib/slugify';
import { randomUUID } from 'crypto';

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
        visibility: true,
        slug: true,
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
      visibility: c.visibility,
      slug: c.slug,
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
        visibility: true,
        slug: true,
        sharedAt: true,
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

  /**
   * Generate a unique slug from a conversation title.
   * Uses the first 8 chars of the conversation ID as suffix on collision.
   */
  private async generateUniqueSlug(
    title: string,
    conversationId: string,
  ): Promise<string> {
    const baseSlug = slugify(title) || 'conversation';

    // Try the base slug first
    const existing = await this.prisma.conversation.findUnique({
      where: { slug: baseSlug },
      select: { id: true },
    });

    if (!existing || existing.id === conversationId) {
      return baseSlug;
    }

    // Collision — append a short UUID suffix
    const suffix = randomUUID().replace(/-/g, '').slice(0, 8);
    return slugifyWithSuffix(title || 'conversation', suffix);
  }

  /**
   * Toggle a conversation's visibility between public and private.
   * When making public: generates a slug and sets sharedAt.
   * When making private: clears slug and sharedAt.
   */
  async toggleVisibility(id: string, userId: string, makePublic: boolean) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, userId, status: 'active' },
      select: { id: true, title: true },
    });

    if (!conversation) {
      return null;
    }

    if (makePublic) {
      // Retry on unique constraint violation (slug collision)
      const MAX_RETRIES = 3;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const slug = await this.generateUniqueSlug(
            conversation.title,
            conversation.id,
          );

          return await this.prisma.conversation.update({
            where: { id },
            data: {
              visibility: 'public',
              slug,
              sharedAt: new Date(),
            },
            select: {
              id: true,
              visibility: true,
              slug: true,
              sharedAt: true,
            },
          });
        } catch (err: any) {
          if (err?.code === 'P2002' && attempt < MAX_RETRIES - 1) continue;
          throw err;
        }
      }
    }

    return this.prisma.conversation.update({
      where: { id },
      data: {
        visibility: 'private',
        slug: null,
        sharedAt: null,
      },
      select: {
        id: true,
        visibility: true,
        slug: true,
        sharedAt: true,
      },
    });
  }

  /**
   * Fetch a public conversation by slug, including all messages.
   * Returns null if not found or not public.
   */
  async getBySlug(slug: string) {
    return this.prisma.conversation.findFirst({
      where: {
        slug,
        visibility: 'public',
        status: 'active',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        sharedAt: true,
        mentionedStates: true,
        mentionedYears: true,
        createdAt: true,
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

  /**
   * Fetch lightweight metadata for a public conversation (used for OG images).
   * Includes the first rich content block from an assistant message for visual previews.
   */
  async getPublicMeta(slug: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        slug,
        visibility: 'public',
        status: 'active',
      },
      select: {
        title: true,
        mentionedStates: true,
        mentionedYears: true,
        messages: {
          where: { role: 'assistant' },
          orderBy: { sequenceNumber: 'asc' },
          select: { richContent: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!conversation) return null;

    // Find the first assistant message with rich content
    const richContent = conversation.messages.find(
      (m) => m.richContent != null,
    )?.richContent as Record<string, any> | undefined;

    return {
      title: conversation.title,
      states: conversation.mentionedStates,
      years: conversation.mentionedYears,
      messageCount: conversation._count.messages,
      richContent: richContent ?? null,
    };
  }
}
