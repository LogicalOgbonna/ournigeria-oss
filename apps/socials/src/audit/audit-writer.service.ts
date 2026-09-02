import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { appendAuditEvent } from "@ournigeria/access";

export interface AuditLogInput {
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Best-effort hash-chained audit writer for socials admin mutations.
 * appendAuditEvent must run inside a transaction (advisory lock + head read +
 * insert); failures are logged and swallowed — the domain mutation has already
 * succeeded, an audit hiccup must not fail the request.
 */
@Injectable()
export class AuditWriterService {
  constructor(private readonly prisma: PrismaService) {}

  async log(adminId: string, input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.$transaction((tx) =>
        appendAuditEvent(tx as any, {
          actorType: "staff",
          actorId: adminId,
          action: input.action,
          targetType: input.targetType,
          targetId: input.targetId,
          metadata: input.metadata,
        }),
      );
    } catch (err) {
      console.error(`audit: failed to append ${input.action}`, err);
    }
  }
}
