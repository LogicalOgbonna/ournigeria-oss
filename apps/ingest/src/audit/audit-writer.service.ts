import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { appendAuditEvent } from "@ournigeria/access";

/**
 * Best-effort chain-of-trust audit logging for ingest admin actions.
 * appendAuditEvent must run inside a transaction (advisory lock + chain-head
 * read); failures are logged and swallowed so an audit outage never breaks
 * an ingestion endpoint.
 */
@Injectable()
export class AuditWriterService {
  constructor(private prisma: PrismaService) {}

  async log(
    adminId: string,
    event: {
      action: string;
      targetType?: string;
      targetId?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    try {
      await this.prisma.$transaction((tx) =>
        appendAuditEvent(tx as any, {
          actorType: "staff",
          actorId: adminId,
          ...event,
        }),
      );
    } catch (err) {
      console.error(`audit: failed to append ${event.action}`, err);
    }
  }
}
