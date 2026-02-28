import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@ournigeria/database";
import {
  S3Client,
  GetObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

@Injectable()
export class AdminFeedbackService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.bucket = this.config.getOrThrow<string>("S3_BUCKET");
    this.s3 = new S3Client({
      region: this.config.getOrThrow<string>("AWS_REGION"),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>("AWS_ACCESS_KEY_ID"),
        secretAccessKey: this.config.getOrThrow<string>(
          "AWS_SECRET_ACCESS_KEY",
        ),
      },
    });
  }

  async listFeedback(
    page: number,
    limit: number,
    status?: string,
    category?: string,
  ) {
    const where: Record<string, any> = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const [data, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              phoneNumber: true,
              telegramId: true,
              name: true,
            },
          },
          _count: { select: { attachments: true } },
        },
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return {
      data: data.map((f) => ({
        id: f.id,
        userId: f.userId,
        user: f.user,
        category: f.category,
        subject: f.subject,
        message: f.message,
        status: f.status,
        adminNotes: f.adminNotes,
        attachmentCount: f._count.attachments,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      })),
      total,
    };
  }

  async getStats() {
    const [total, newCount, reviewing, resolved, archived] = await Promise.all([
      this.prisma.feedback.count(),
      this.prisma.feedback.count({ where: { status: "new" } }),
      this.prisma.feedback.count({ where: { status: "reviewing" } }),
      this.prisma.feedback.count({ where: { status: "resolved" } }),
      this.prisma.feedback.count({ where: { status: "archived" } }),
    ]);

    return { total, new: newCount, reviewing, resolved, archived };
  }

  async getFeedback(id: string) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            phoneNumber: true,
            telegramId: true,
            name: true,
            email: true,
          },
        },
        attachments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!feedback) return null;

    // Generate presigned GET URLs for attachments
    const attachments = await Promise.all(
      feedback.attachments.map(async (a) => {
        const command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: a.s3Key,
        });
        const url = await getSignedUrl(this.s3, command, {
          expiresIn: 3600,
        });

        return {
          id: a.id,
          fileName: a.fileName,
          fileType: a.fileType,
          fileSizeBytes: a.fileSizeBytes,
          url,
          createdAt: a.createdAt.toISOString(),
        };
      }),
    );

    return {
      id: feedback.id,
      userId: feedback.userId,
      user: feedback.user,
      category: feedback.category,
      subject: feedback.subject,
      message: feedback.message,
      status: feedback.status,
      adminNotes: feedback.adminNotes,
      attachments,
      createdAt: feedback.createdAt.toISOString(),
      updatedAt: feedback.updatedAt.toISOString(),
    };
  }

  async updateFeedback(id: string, data: { status?: string; adminNotes?: string }) {
    const updateData: Record<string, any> = {};
    if (data.status) updateData.status = data.status;
    if (data.adminNotes !== undefined) updateData.adminNotes = data.adminNotes;

    return this.prisma.feedback.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteFeedback(id: string) {
    // Get attachments to clean up S3
    const attachments = await this.prisma.feedbackAttachment.findMany({
      where: { feedbackId: id },
      select: { s3Key: true },
    });

    // Delete S3 objects
    if (attachments.length > 0) {
      await this.s3.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: {
            Objects: attachments.map((a) => ({ Key: a.s3Key })),
          },
        }),
      );
    }

    // Cascade delete removes attachments
    await this.prisma.feedback.delete({ where: { id } });
  }
}
