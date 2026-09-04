import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaService } from "@ournigeria/database";
import { AuditAlertService } from "./audit-alert.service";

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly tick

/**
 * A malformed interval env must fall back LOUDLY to the default, never
 * silently disable a trust-critical job (NaN made `!ms` truthy before).
 * "0" remains an explicit, intentional disable.
 */
export function parseIntervalMs(
  raw: string | undefined,
  fallback: number,
  name: string,
): number {
  if (raw === undefined || raw === "") return fallback;
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    console.warn(`${name}="${raw}" is not a valid interval — using default ${fallback}ms`);
    return fallback;
  }
  return parsed;
}
const DEFAULT_ANCHOR_INTERVAL_MS = 24 * 60 * 60 * 1000; // daily anchor
const DEFAULT_DEADMAN_MS = 36 * 60 * 60 * 1000; // 36h without a sent anchor => alert

/**
 * External chain anchoring (spec §10): publishes {epoch, headSeq, headHash}
 * outside the DB daily — S3 object + Telegram ops message — so a whole-chain
 * rewrite can't happen silently. Hourly tick anchors when the last anchor is
 * stale (doubles as boot catch-up) and fires the dead-man alert when no
 * anchor was SENT within AUDIT_ANCHOR_DEADMAN_MS.
 * Spec deviation (recorded in plan): destination is the API's existing AWS S3
 * bucket, not R2 — object-lock/write-only-key hardening is phase 2.
 */
@Injectable()
export class AuditAnchorService implements OnModuleInit, OnModuleDestroy {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly anchorIntervalMs: number;
  private readonly deadmanMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly alerts: AuditAlertService,
    config: ConfigService,
  ) {
    this.bucket = config.get<string>("S3_BUCKET") ?? "";
    this.s3 = new S3Client({
      region: config.get<string>("AWS_REGION") ?? "us-east-1",
    });
    this.anchorIntervalMs = parseIntervalMs(
      process.env.AUDIT_ANCHOR_INTERVAL_MS,
      DEFAULT_ANCHOR_INTERVAL_MS,
      "AUDIT_ANCHOR_INTERVAL_MS",
    );
    this.deadmanMs = parseIntervalMs(
      process.env.AUDIT_ANCHOR_DEADMAN_MS,
      DEFAULT_DEADMAN_MS,
      "AUDIT_ANCHOR_DEADMAN_MS",
    );
  }

  onModuleInit(): void {
    if (process.env.NODE_ENV === "test" || !this.anchorIntervalMs) return;
    this.timer = setInterval(() => void this.tick(), CHECK_INTERVAL_MS);
    this.timer.unref?.();
    // Boot catch-up: anchor immediately if stale (also covers first boot).
    setTimeout(() => void this.tick(), 15_000).unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const lastSent = await this.prisma.auditAnchor.findFirst({
        where: { status: "sent" },
        orderBy: { anchoredAt: "desc" },
      });
      const now = Date.now();
      const elapsed = lastSent
        ? now - lastSent.anchoredAt.getTime()
        : Number.POSITIVE_INFINITY;
      // Never-anchored dead-man: with no SENT anchor at all (S3 misconfigured
      // from day one), `elapsed` is Infinity but the lastSent guard below
      // would skip — so check the chain's age directly.
      if (!lastSent) {
        const oldest = await this.prisma.auditEvent.findFirst({
          orderBy: { seq: "asc" },
          select: { occurredAt: true },
        });
        if (oldest && now - oldest.occurredAt.getTime() >= this.deadmanMs) {
          await this.alerts.alert(
            `⚠️ <b>Audit anchor dead-man</b>: the chain is ` +
              `${Math.round((now - oldest.occurredAt.getTime()) / 3_600_000)}h old ` +
              `and has NEVER been successfully anchored. Check S3 config.`,
            { urgent: true },
          );
        }
      }
      // Dead-man BEFORE the anchor attempt: deadman (36h) > interval (24h),
      // so it only trips when anchoring itself has been failing repeatedly —
      // exactly the silent-failure window it exists to catch.
      if (lastSent && elapsed >= this.deadmanMs) {
        await this.alerts.alert(
          `⚠️ <b>Audit anchor dead-man</b>: no anchor sent in over ` +
            `${Math.round(this.deadmanMs / 3_600_000)}h. Check the anchor job.`,
          { urgent: true },
        );
      }
      if (elapsed >= this.anchorIntervalMs) {
        await this.anchorNow();
      }
    } catch (err) {
      console.error("audit anchor tick failed:", err);
    } finally {
      this.running = false;
    }
  }

  /** Publish the current head. Returns null when the chain is still empty. */
  async anchorNow(): Promise<{ headSeq: number; headHash: string } | null> {
    const head = await this.prisma.auditEvent.findFirst({
      orderBy: { seq: "desc" },
      select: { seq: true, hash: true, epoch: true },
    });
    if (!head) return null;
    // Count up to the head we're publishing — events appended between the two
    // reads must not make the anchor internally inconsistent.
    const eventCount = await this.prisma.auditEvent.count({
      where: { seq: { lte: head.seq } },
    });

    const anchor = await this.prisma.auditAnchor.create({
      data: {
        epoch: head.epoch,
        headSeq: head.seq,
        headHash: head.hash,
        eventCount: BigInt(eventCount),
        destination: "s3",
      },
    });

    const payload = {
      epoch: head.epoch,
      headSeq: Number(head.seq),
      headHash: head.hash,
      eventCount,
      anchoredAt: anchor.anchoredAt.toISOString(),
    };
    const key = `audit-anchors/${anchor.anchoredAt.toISOString().slice(0, 10)}-${Number(head.seq)}.json`;

    let uploaded = false;
    if (this.bucket) {
      try {
        await this.s3.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: JSON.stringify(payload),
            ContentType: "application/json",
          }),
        );
        uploaded = true;
      } catch (err) {
        console.error("audit anchor S3 upload failed:", err);
      }
    }

    // urgent: the anchor IS the external trust signal — never digest-buffer it,
    // and record whether it actually went out.
    const telegramSent = await this.alerts.alert(
      `⚓ <b>Audit chain anchor</b>\n` +
        `epoch ${payload.epoch} · seq ${payload.headSeq} · ${eventCount} events\n` +
        `head <code>${payload.headHash}</code>`,
      { urgent: true },
    );

    await this.prisma.auditAnchor.update({
      where: { id: anchor.id },
      data: {
        status: uploaded ? "sent" : "partial",
        receipt: { s3Key: uploaded ? key : null, telegram: telegramSent },
      },
    });
    return { headSeq: payload.headSeq, headHash: payload.headHash };
  }
}
