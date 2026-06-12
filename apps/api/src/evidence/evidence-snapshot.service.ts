import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@ournigeria/database";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createHash } from "crypto";

const FETCH_TIMEOUT_MS = 20_000;
/** Hard cap per snapshot object — oversized sources are marked failed, not stored. */
const MAX_BYTES = 20 * 1024 * 1024;
const ATTEMPTS = 3;
const BACKOFF_MS = [500, 1500];
const DEFAULT_SWEEP_MS = 5 * 60 * 1000;
const SWEEP_BATCH = 20;

/**
 * Plan 45d: self-hosted evidence snapshots — the "takedown-proof" copy.
 * Evidence rows are created with snapshot_status='pending' (registry apply,
 * EvidenceService.create). This service fetches the source URL, stores the RAW
 * bytes to S3 under evidence-snapshots/{evidenceId} (no transcoding — these are
 * HTML/PDF/images as cited), and stamps snapshotKey / contentHash / byteSize /
 * capturedAt. Unreachable or oversized sources go to snapshot_status='failed'
 * (visible in admin; re-runnable).
 *
 * Sweep: a low-frequency interval inside the API process (no scheduler dep).
 * Disabled in tests and when EVIDENCE_SNAPSHOT_SWEEP_MS=0.
 */
@Injectable()
export class EvidenceSnapshotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EvidenceSnapshotService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private timer: ReturnType<typeof setInterval> | null = null;
  private sweeping = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.bucket = this.config.getOrThrow<string>("S3_BUCKET");
    this.s3 = new S3Client({
      region: this.config.getOrThrow<string>("AWS_REGION"),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>("AWS_ACCESS_KEY_ID"),
        secretAccessKey: this.config.getOrThrow<string>("AWS_SECRET_ACCESS_KEY"),
      },
    });
  }

  onModuleInit(): void {
    const ms = Number(this.config.get("EVIDENCE_SNAPSHOT_SWEEP_MS") ?? DEFAULT_SWEEP_MS);
    if (process.env.NODE_ENV === "test" || !ms) return;
    this.timer = setInterval(() => {
      void this.sweepPending().catch((e) => this.logger.warn(`sweep failed: ${e.message}`));
    }, ms);
    // Never keep the process alive just for the sweep.
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** Capture a batch of pending rows. Returns counts for logging/tests. */
  async sweepPending(limit = SWEEP_BATCH): Promise<{ captured: number; failed: number }> {
    if (this.sweeping) return { captured: 0, failed: 0 };
    this.sweeping = true;
    try {
      const rows = await this.prisma.evidence.findMany({
        where: { snapshotStatus: "pending" },
        orderBy: { createdAt: "asc" },
        take: limit,
        select: { id: true },
      });
      let captured = 0;
      let failed = 0;
      for (const row of rows) {
        const status = await this.capture(row.id);
        if (status === "captured") captured++;
        else failed++;
      }
      if (rows.length > 0) {
        this.logger.log(`evidence snapshot sweep: ${captured} captured, ${failed} failed`);
      }
      return { captured, failed };
    } finally {
      this.sweeping = false;
    }
  }

  /** Fetch + store one evidence row's source. Idempotent on already-captured rows. */
  async capture(evidenceId: string): Promise<"captured" | "failed" | "skipped"> {
    const row = await this.prisma.evidence.findUnique({
      where: { id: evidenceId },
      select: { id: true, url: true, snapshotStatus: true },
    });
    if (!row) return "skipped";
    if (row.snapshotStatus === "captured") return "skipped";

    try {
      const { body, contentType } = await this.fetchWithRetries(row.url);
      const key = `evidence-snapshots/${row.id}`;
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          // Evidence is immutable by nature — never re-served with edits.
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      await this.prisma.evidence.update({
        where: { id: row.id },
        data: {
          snapshotKey: key,
          snapshotStatus: "captured",
          capturedAt: new Date(),
          contentHash: createHash("sha256").update(body).digest("hex"),
          byteSize: body.length,
          originalAccessible: true,
        },
      });
      return "captured";
    } catch (err: any) {
      this.logger.warn(`snapshot failed for ${row.id} (${row.url}): ${err.message}`);
      await this.prisma.evidence.update({
        where: { id: row.id },
        data: { snapshotStatus: "failed" },
      });
      return "failed";
    }
  }

  private async fetchWithRetries(url: string): Promise<{ body: Buffer; contentType: string }> {
    let lastErr: Error = new Error("unreachable");
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt - 1] ?? 1500));
      try {
        return await this.fetchOnce(url);
      } catch (err: any) {
        lastErr = err;
        // 4xx is deterministic — retrying won't help.
        if (/HTTP 4\d\d/.test(err.message)) break;
      }
    }
    throw lastErr;
  }

  private async fetchOnce(url: string): Promise<{ body: Buffer; contentType: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": "OurNigeriaBot/1.0 (+https://ournigeria.ng; evidence-archival)" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const declared = Number(res.headers.get("content-length") ?? 0);
      if (declared > MAX_BYTES) throw new Error(`source exceeds size cap (${declared} bytes)`);
      const body = Buffer.from(await res.arrayBuffer());
      if (body.length > MAX_BYTES) throw new Error(`source exceeds size cap (${body.length} bytes)`);
      if (body.length === 0) throw new Error("empty response body");
      return { body, contentType: res.headers.get("content-type") ?? "application/octet-stream" };
    } finally {
      clearTimeout(timer);
    }
  }
}
