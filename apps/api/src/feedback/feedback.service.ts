import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@ournigeria/database";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const VALID_CATEGORIES = ["bug", "feature", "general", "data_issue"] as const;

@Injectable()
export class FeedbackService {
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

  async createFeedback(
    userId: string,
    data: {
      category?: string;
      subject: string;
      message: string;
    },
  ) {
    if (!data.subject?.trim()) {
      throw new BadRequestException("Subject is required");
    }
    if (!data.message?.trim()) {
      throw new BadRequestException("Message is required");
    }
    if (data.subject.length > 200) {
      throw new BadRequestException("Subject must be 200 characters or less");
    }

    const category =
      data.category && VALID_CATEGORIES.includes(data.category as any)
        ? (data.category as (typeof VALID_CATEGORIES)[number])
        : "general";

    const feedback = await this.prisma.feedback.create({
      data: {
        userId,
        category,
        subject: data.subject.trim(),
        message: data.message.trim(),
      },
    });

    return { id: feedback.id };
  }

  async uploadAttachment(
    userId: string,
    feedbackId: string,
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
  ) {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed: ${ALLOWED_TYPES.join(", ")}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException("File too large. Max 50MB");
    }

    // Verify the feedback belongs to this user
    const feedback = await this.prisma.feedback.findFirst({
      where: { id: feedbackId, userId },
    });

    if (!feedback) {
      throw new BadRequestException("Feedback not found");
    }

    // Check attachment count (max 5)
    const count = await this.prisma.feedbackAttachment.count({
      where: { feedbackId },
    });
    if (count >= 5) {
      throw new BadRequestException("Max 5 attachments per feedback");
    }

    // Build S3 key
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phoneNumber: true },
    });

    const folder = user?.phoneNumber || `usr_${randomBytes(4).toString("hex")}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const s3Key = `feedback/${folder}/${timestamp}-${safeName}`;

    // Upload to S3
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    // Create attachment record
    const attachment = await this.prisma.feedbackAttachment.create({
      data: {
        feedbackId,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSizeBytes: file.size,
        s3Key,
      },
    });

    return { id: attachment.id, fileName: file.originalname };
  }

  async listUserFeedback(userId: string) {
    const feedbacks = await this.prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { attachments: true } },
      },
    });

    return feedbacks.map((f) => ({
      id: f.id,
      category: f.category,
      subject: f.subject,
      message: f.message,
      status: f.status,
      adminNotes: f.adminNotes,
      attachmentCount: f._count.attachments,
      createdAt: f.createdAt.toISOString(),
    }));
  }
}
