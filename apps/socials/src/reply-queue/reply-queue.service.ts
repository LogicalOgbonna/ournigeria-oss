import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { TwitterPublisher } from "../platforms/twitter/twitter.publisher.js";

@Injectable()
export class ReplyQueueService {
  private readonly logger = new Logger(ReplyQueueService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: TwitterPublisher,
  ) {}

  async createDraft(data: {
    inReplyToId: string;
    inReplyToText: string;
    inReplyToUser: string;
    content: string;
    confidence: number;
    dataDomain?: string;
    dataQuery?: string;
    triggerTopic?: string;
  }) {
    return this.prisma.socialPost.create({
      data: {
        platform: "twitter",
        postType: "reply",
        content: data.content,
        inReplyToId: data.inReplyToId,
        inReplyToText: data.inReplyToText,
        inReplyToUser: data.inReplyToUser,
        confidence: data.confidence,
        reviewStatus: data.confidence > 0.8 ? "recommended" : "pending",
        dataDomain: data.dataDomain,
        dataQuery: data.dataQuery,
        triggerTopic: data.triggerTopic,
        status: "drafted",
      },
    });
  }

  async getPending(filters?: {
    reviewStatus?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      postType: "reply",
    };

    if (filters?.reviewStatus) {
      where.reviewStatus = filters.reviewStatus;
    } else {
      where.reviewStatus = { in: ["pending", "recommended"] };
    }

    const [items, total] = await Promise.all([
      this.prisma.socialPost.findMany({
        where,
        orderBy: [
          { confidence: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: pageSize,
      }),
      this.prisma.socialPost.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async approve(id: string, adminId: string) {
    const post = await this.prisma.socialPost.findUnique({
      where: { id },
    });

    if (!post) throw new NotFoundException("Post not found");
    if (post.postType !== "reply" || !post.inReplyToId) {
      throw new Error("Can only approve reply posts");
    }

    // Post the reply via Twitter
    const result = await this.publisher.publishReply(
      post.inReplyToId,
      post.content,
    );

    return this.prisma.socialPost.update({
      where: { id },
      data: {
        status: "published",
        externalId: result.id,
        publishedAt: new Date(),
        reviewStatus: "approved",
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });
  }

  async reject(id: string, adminId: string) {
    return this.prisma.socialPost.update({
      where: { id },
      data: {
        status: "rejected",
        reviewStatus: "rejected",
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });
  }

  async editAndSave(id: string, newContent: string) {
    return this.prisma.socialPost.update({
      where: { id },
      data: {
        content: newContent,
        reviewStatus: "edited",
      },
    });
  }

  async getStats() {
    const [pending, approved, rejected, publishedToday] =
      await Promise.all([
        this.prisma.socialPost.count({
          where: {
            postType: "reply",
            reviewStatus: { in: ["pending", "recommended"] },
          },
        }),
        this.prisma.socialPost.count({
          where: { postType: "reply", reviewStatus: "approved" },
        }),
        this.prisma.socialPost.count({
          where: { postType: "reply", reviewStatus: "rejected" },
        }),
        this.prisma.socialPost.count({
          where: {
            status: "published",
            publishedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
      ]);

    return { pending, approved, rejected, publishedToday };
  }
}
