import { Injectable } from "@nestjs/common";
import { Prisma, PrismaService } from "@ournigeria/database";
import {
  appendAuditEvent,
  type AppendedAuditEvent,
  type AuditActorType,
} from "@ournigeria/access";
import { AuditCryptoService } from "./audit-crypto.service";

export interface AuditActor {
  actorType: AuditActorType;
  actorId?: string | null;
  sessionId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

export interface AuditEventDetails {
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  /** Convention: { before, after } objects with model-field keys. */
  diff?: unknown;
  metadata?: Record<string, unknown>;
}

export const SYSTEM_ACTOR: AuditActor = { actorType: "system" };

/**
 * Build an actor off an AdminGuard-authenticated request and mark the request
 * explicitly audited (suppresses the backstop interceptor).
 */
export function auditActorFromRequest(req: {
  adminId?: string;
  ip?: string;
  headers?: Record<string, unknown>;
  __audited?: boolean;
}): AuditActor {
  req.__audited = true;
  const ua = req.headers?.["user-agent"];
  return {
    actorType: "staff",
    actorId: req.adminId ?? null,
    ip: (req.ip ?? null)?.slice(0, 64) ?? null,
    userAgent: typeof ua === "string" ? ua.slice(0, 400) : null,
  };
}

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: AuditCryptoService,
  ) {}

  /**
   * Append an event to the chain. Pass the surrounding domain transaction as
   * `tx` (same-transaction guarantee, spec §8) and call this LAST in that
   * transaction; pass null for events with no domain mutation (logins, reads).
   */
  async log(
    tx: Prisma.TransactionClient | null,
    actor: AuditActor,
    event: AuditEventDetails,
  ): Promise<AppendedAuditEvent> {
    if (tx) return this.append(tx, actor, event);
    return this.prisma.$transaction((inner) =>
      this.append(inner, actor, event),
    );
  }

  /** Same as log(null, ...) but never throws — for backstop/security events. */
  async logBestEffort(
    actor: AuditActor,
    event: AuditEventDetails,
  ): Promise<AppendedAuditEvent | null> {
    try {
      return await this.log(null, actor, event);
    } catch (err) {
      console.error(`audit: failed to log ${event.action}:`, err);
      return null;
    }
  }

  private async append(
    tx: Prisma.TransactionClient,
    actor: AuditActor,
    event: AuditEventDetails,
  ): Promise<AppendedAuditEvent> {
    let diff: unknown = event.diff ?? null;
    if (diff !== null && event.targetType && event.targetId) {
      diff = await this.crypto.encryptDiffFields(
        tx,
        event.targetType,
        event.targetId,
        diff,
      );
    }
    return appendAuditEvent(tx, {
      actorType: actor.actorType,
      actorId: actor.actorId ?? null,
      sessionId: actor.sessionId ?? null,
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
      action: event.action.slice(0, 60),
      targetType: event.targetType ?? null,
      targetId: event.targetId?.slice(0, 200) ?? null,
      diff,
      metadata: event.metadata ?? {},
    });
  }
}
