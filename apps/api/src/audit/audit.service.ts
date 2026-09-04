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
 * Links an actor back to its request so AuditService can mark the request
 * audited AFTER a successful append. Marking eagerly here would disarm the
 * backstop interceptor even when the append later fails — leaving a committed
 * privileged mutation with zero chain rows, the exact gap the backstop exists
 * to close.
 */
const actorRequests = new WeakMap<AuditActor, { __audited?: boolean }>();

/** Build an actor off an AdminGuard-authenticated request. */
export function auditActorFromRequest(req: {
  adminId?: string;
  ip?: string;
  headers?: Record<string, unknown>;
  __audited?: boolean;
}): AuditActor {
  const ua = req.headers?.["user-agent"];
  const actor: AuditActor = {
    actorType: "staff",
    actorId: req.adminId ?? null,
    ip: (req.ip ?? null)?.slice(0, 64) ?? null,
    userAgent: typeof ua === "string" ? ua.slice(0, 400) : null,
  };
  actorRequests.set(actor, req);
  return actor;
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
    const appended = tx
      ? await this.append(tx, actor, event)
      : await this.prisma.$transaction((inner) =>
          this.append(inner, actor, event),
        );
    // Only a SUCCESSFUL append suppresses the backstop for this request.
    const req = actorRequests.get(actor);
    if (req) req.__audited = true;
    return appended;
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
