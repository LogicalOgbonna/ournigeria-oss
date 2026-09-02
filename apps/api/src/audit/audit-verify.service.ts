import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import {
  GENESIS_PREV_HASH,
  verifyChainSegment,
  type ChainVerdict,
  type VerifiableEvent,
} from "@ournigeria/access";
import { AuditAlertService } from "./audit-alert.service";
import { parseIntervalMs } from "./audit-anchor.service";

const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h
const PAGE_SIZE = 1000;

export interface VerifyResult {
  ok: boolean;
  checked: number;
  checkedThrough: number;
  startedFromSeq: number;
  brokenAtSeq?: number;
  reason?: string;
  at: string;
}

interface RawEventRow {
  seq: string | number | bigint;
  id: string;
  occurred_at: Date;
  epoch: number;
  actor_type: VerifiableEvent["actorType"];
  actor_id: string | null;
  session_id: string | null;
  ip: string | null;
  user_agent: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  diff_text: string | null;
  metadata_text: string;
  prev_hash: string;
  hash: string;
}

/**
 * Scheduled chain verification (spec §10). Verifies from the last confirmed
 * anchor (anchors double as checkpoints — cost stays flat as the chain grows);
 * full-genesis verify on demand. setInterval pattern per
 * evidence-snapshot.service.ts (the API has no scheduler dep).
 */
@Injectable()
export class AuditVerifyService implements OnModuleInit, OnModuleDestroy {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private lastResult: VerifyResult | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly alerts: AuditAlertService,
  ) {}

  onModuleInit(): void {
    const ms = parseIntervalMs(
      process.env.AUDIT_VERIFY_INTERVAL_MS,
      DEFAULT_INTERVAL_MS,
      "AUDIT_VERIFY_INTERVAL_MS",
    );
    if (process.env.NODE_ENV === "test" || !ms) return;
    this.timer = setInterval(() => void this.runScheduled(), ms);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  getLastResult(): VerifyResult | null {
    return this.lastResult;
  }

  private async runScheduled(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const result = await this.verify(true);
      if (!result.ok) {
        await this.alerts.alert(
          `🚨 <b>AUDIT CHAIN VERIFICATION FAILED</b>\n` +
            `Broken at seq ${result.brokenAtSeq} (${result.reason}). ` +
            `Checked from seq ${result.startedFromSeq}. Investigate immediately.`,
          { urgent: true },
        );
      }
    } catch (err) {
      console.error("audit verify job failed:", err);
    } finally {
      this.running = false;
    }
  }

  /**
   * Recompute hashes over the chain. fromAnchor=true starts at the last 'sent'
   * anchor (after confirming the anchored head row still matches).
   */
  async verify(fromAnchor = true): Promise<VerifyResult> {
    let startSeq = 1;
    let prevHash = GENESIS_PREV_HASH;

    if (fromAnchor) {
      const anchor = await this.prisma.auditAnchor.findFirst({
        where: { status: "sent" },
        orderBy: { anchoredAt: "desc" },
      });
      if (anchor) {
        const anchored = await this.prisma.auditEvent.findUnique({
          where: { seq: anchor.headSeq },
          select: { hash: true },
        });
        if (!anchored || anchored.hash !== anchor.headHash) {
          const result: VerifyResult = {
            ok: false,
            checked: 0,
            checkedThrough: Number(anchor.headSeq),
            startedFromSeq: Number(anchor.headSeq),
            brokenAtSeq: Number(anchor.headSeq),
            reason: anchored
              ? "anchored head hash mismatch (history rewritten?)"
              : "anchored head row missing (history truncated?)",
            at: new Date().toISOString(),
          };
          this.lastResult = result;
          return result;
        }
        startSeq = Number(anchor.headSeq) + 1;
        prevHash = anchor.headHash;
      }
    }

    let checked = 0;
    let cursor = startSeq;
    let lastSeq = startSeq - 1;

    for (;;) {
      const rows = await this.prisma.$queryRawUnsafe<RawEventRow[]>(
        `SELECT seq, id, occurred_at, epoch, actor_type, actor_id, session_id, ip,
                user_agent, action, target_type, target_id,
                diff::text AS diff_text, metadata::text AS metadata_text,
                prev_hash, hash
           FROM audit_events WHERE seq >= $1 ORDER BY seq ASC LIMIT $2`,
        cursor,
        PAGE_SIZE,
      );
      if (rows.length === 0) break;

      const events: VerifiableEvent[] = rows.map((row) => ({
        seq: Number(row.seq),
        id: row.id,
        occurredAt: new Date(row.occurred_at).toISOString(),
        epoch: row.epoch,
        actorType: row.actor_type,
        actorId: row.actor_id,
        sessionId: row.session_id,
        ip: row.ip,
        userAgent: row.user_agent,
        action: row.action,
        targetType: row.target_type,
        targetId: row.target_id,
        diff: row.diff_text === null ? null : JSON.parse(row.diff_text),
        metadata: JSON.parse(row.metadata_text),
        prevHash: row.prev_hash,
        hash: row.hash,
      }));

      // Cross-page continuity: first row of this page must follow lastSeq.
      if (checked > 0 || startSeq > 1) {
        if (events[0].seq !== lastSeq + 1) {
          const result: VerifyResult = {
            ok: false,
            checked,
            checkedThrough: lastSeq,
            startedFromSeq: startSeq,
            brokenAtSeq: events[0].seq,
            reason: `seq gap after ${lastSeq}`,
            at: new Date().toISOString(),
          };
          this.lastResult = result;
          return result;
        }
      }

      const verdict: ChainVerdict = verifyChainSegment(events, prevHash);
      if (!verdict.ok) {
        const result: VerifyResult = {
          ok: false,
          checked: checked + verdict.checked,
          checkedThrough: lastSeq + verdict.checked,
          startedFromSeq: startSeq,
          brokenAtSeq: verdict.brokenAtSeq,
          reason: verdict.reason,
          at: new Date().toISOString(),
        };
        this.lastResult = result;
        return result;
      }

      checked += events.length;
      lastSeq = events[events.length - 1].seq;
      prevHash = events[events.length - 1].hash;
      cursor = lastSeq + 1;
      if (rows.length < PAGE_SIZE) break;
    }

    const result: VerifyResult = {
      ok: true,
      checked,
      checkedThrough: lastSeq,
      startedFromSeq: startSeq,
      at: new Date().toISOString(),
    };
    this.lastResult = result;
    return result;
  }
}
