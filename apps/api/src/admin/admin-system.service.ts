import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@ournigeria/database";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

@Injectable()
export class AdminSystemService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly ingestUrl: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.bucket = this.config.get<string>("S3_BUCKET", "");
    this.ingestUrl = this.config.get<string>(
      "INGEST_SERVICE_URL",
      "http://ingest:3002",
    );
    this.s3 = new S3Client({
      region: this.config.get<string>("AWS_REGION", "us-east-1"),
      credentials: {
        accessKeyId: this.config.get<string>("AWS_ACCESS_KEY_ID", ""),
        secretAccessKey: this.config.get<string>("AWS_SECRET_ACCESS_KEY", ""),
      },
    });
  }

  async getHealth() {
    const start = Date.now();

    const [db, vector, s3, ingest] = await Promise.all([
      this.checkDatabase(),
      this.checkPgVector(),
      this.checkS3(),
      this.checkIngestService(),
    ]);

    const mem = process.memoryUsage();
    const memMb = Math.round(mem.rss / 1024 / 1024);

    const uptimeS = process.uptime();
    const uptimeStr = this.formatUptime(uptimeS);

    const apiLatency = Date.now() - start;

    const oneHourAgo = new Date(Date.now() - 3600_000);
    const [recentMessages, recentQueries] = await Promise.all([
      this.prisma.message.count({
        where: { createdAt: { gte: oneHourAgo }, role: "assistant" },
      }),
      this.prisma.queryAnalytic.count({
        where: { createdAt: { gte: oneHourAgo } },
      }),
    ]);

    const requestsPerMinute = Math.round((recentMessages + recentQueries) / 60);

    const latencyStats = await this.prisma.message.aggregate({
      where: {
        createdAt: { gte: oneHourAgo },
        role: "assistant",
        processingTimeMs: { not: null },
      },
      _avg: { processingTimeMs: true },
    });
    const avgLatency = Math.round(latencyStats._avg.processingTimeMs || 0);

    const totalWithLatency = await this.prisma.message.count({
      where: {
        createdAt: { gte: oneHourAgo },
        role: "assistant",
        processingTimeMs: { not: null },
      },
    });
    const p99Row = await this.prisma.message.findFirst({
      where: {
        createdAt: { gte: oneHourAgo },
        role: "assistant",
        processingTimeMs: { not: null },
      },
      orderBy: { processingTimeMs: "desc" },
      skip: Math.max(0, Math.floor(totalWithLatency * 0.01)),
      select: { processingTimeMs: true },
    });
    const p99Latency = p99Row?.processingTimeMs || avgLatency;

    const errorCount = await this.prisma.message.count({
      where: {
        createdAt: { gte: oneHourAgo },
        role: "assistant",
        processingTimeMs: { gt: 120000 },
      },
    });
    const errorRate =
      totalWithLatency > 0
        ? Math.round((errorCount / totalWithLatency) * 100 * 100) / 100
        : 0;

    const [latencyHistory, errorRateHistory] = await Promise.all([
      this.buildLatencyHistory(),
      this.buildErrorHistory(),
    ]);

    const services = [
      {
        name: "API (NestJS)",
        status: "healthy" as const,
        latency: apiLatency,
        uptime: uptimeStr,
      },
      {
        name: "Ingest Service",
        status: ingest.status,
        latency: ingest.latency,
        uptime: ingest.uptime ?? "N/A",
      },
      {
        name: "PostgreSQL",
        status: db.status,
        latency: db.latency,
        uptime: db.status === "down" ? "down" : uptimeStr,
      },
      {
        name: "pgvector",
        status: vector.status,
        latency: vector.latency,
        uptime: vector.status === "down" ? "down" : uptimeStr,
      },
      {
        name: "S3 Storage",
        status: s3.status,
        latency: s3.latency,
        uptime: s3.status === "down" ? "down" : "N/A",
      },
      {
        name: `Memory (${memMb}MB)`,
        status: (memMb > 1500 ? "degraded" : "healthy") as
          | "healthy"
          | "degraded",
        latency: 0,
        uptime: uptimeStr,
      },
    ];

    return {
      services,
      latencyHistory,
      errorRateHistory,
      requestsPerMinute,
      avgLatency,
      errorRate,
      p99Latency,
    };
  }

  private async checkDatabase(): Promise<{
    status: "healthy" | "degraded" | "down";
    latency: number;
  }> {
    try {
      const t0 = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - t0;
      return { status: latency > 500 ? "degraded" : "healthy", latency };
    } catch {
      return { status: "down", latency: -1 };
    }
  }

  private async checkPgVector(): Promise<{
    status: "healthy" | "degraded" | "down";
    latency: number;
  }> {
    try {
      const t0 = Date.now();
      await this.prisma
        .$queryRaw`SELECT 1 FROM pg_extension WHERE extname = 'vector'`;
      const latency = Date.now() - t0;
      return { status: latency > 500 ? "degraded" : "healthy", latency };
    } catch {
      return { status: "down", latency: -1 };
    }
  }

  private async checkS3(): Promise<{
    status: "healthy" | "down";
    latency: number;
  }> {
    if (!this.bucket) return { status: "down", latency: -1 };
    try {
      const t0 = Date.now();
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return { status: "healthy", latency: Date.now() - t0 };
    } catch {
      return { status: "down", latency: -1 };
    }
  }

  private async checkIngestService(): Promise<{
    status: "healthy" | "degraded" | "down";
    latency: number;
    uptime?: string;
  }> {
    try {
      const t0 = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${this.ingestUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const latency = Date.now() - t0;
      if (!res.ok) return { status: "down", latency };
      const body = await res.json();
      const uptime =
        body.uptime != null ? this.formatUptime(body.uptime) : undefined;
      return {
        status: body.status === "ok" ? "healthy" : "degraded",
        latency,
        uptime,
      };
    } catch {
      return { status: "down", latency: -1 };
    }
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }

  private async buildLatencyHistory() {
    const rows: { hour: string; avg_ms: number }[] = await this.prisma
      .$queryRaw`
      SELECT
        to_char(date_trunc('hour', created_at), 'HH24:00') AS hour,
        COALESCE(AVG(processing_time_ms), 0)::int AS avg_ms
      FROM messages
      WHERE created_at >= NOW() - INTERVAL '24 hours'
        AND role = 'assistant'
        AND processing_time_ms IS NOT NULL
      GROUP BY date_trunc('hour', created_at)
      ORDER BY date_trunc('hour', created_at)
    `;
    return rows.map((r) => ({
      time: r.hour,
      api: r.avg_ms,
      ingest: 0,
    }));
  }

  private async buildErrorHistory() {
    const rows: { hour: string; error_count: number; total: number }[] =
      await this.prisma.$queryRaw`
      SELECT
        to_char(date_trunc('hour', created_at), 'HH24:00') AS hour,
        COUNT(*) FILTER (WHERE processing_time_ms > 120000)::int AS error_count,
        COUNT(*)::int AS total
      FROM messages
      WHERE created_at >= NOW() - INTERVAL '24 hours'
        AND role = 'assistant'
      GROUP BY date_trunc('hour', created_at)
      ORDER BY date_trunc('hour', created_at)
    `;
    return rows.map((r) => ({
      time: r.hour,
      errors: r.error_count,
      total: r.total,
    }));
  }

  async getLogs(level?: string, service?: string, limit = 100, offset = 0) {
    const processingTimeFilter: Record<string, any> = {};
    if (level === "error") {
      processingTimeFilter.processingTimeMs = { gt: 120000 };
    } else if (level === "warn") {
      processingTimeFilter.processingTimeMs = { gt: 60000, lte: 120000 };
    } else if (level === "info") {
      processingTimeFilter.OR = [
        { processingTimeMs: { lte: 60000 } },
        { processingTimeMs: null },
      ];
    }

    const serviceFilter: Record<string, any> = {};
    if (service && service !== "all") {
      serviceFilter.modelUsed = { contains: service, mode: "insensitive" };
    }

    const entries = await this.prisma.message.findMany({
      where: {
        role: "assistant",
        ...serviceFilter,
        ...processingTimeFilter,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        createdAt: true,
        processingTimeMs: true,
        modelUsed: true,
        totalTokens: true,
        content: true,
      },
    });

    return entries.map((e) => {
      const ms = e.processingTimeMs || 0;
      const isError = ms > 120000;
      const isSlow = ms > 60000;
      const snippet = (e.content || "").slice(0, 60).replace(/\n/g, " ");
      return {
        id: e.id,
        timestamp: e.createdAt.toISOString(),
        level: isError ? "error" : isSlow ? "warn" : ("info" as string),
        service: e.modelUsed || "chat",
        message: `Response in ${ms}ms (${e.modelUsed || "unknown"}, ${e.totalTokens || 0} tokens): "${snippet}..."`,
      };
    });
  }

  async getJobs() {
    const runs = await this.prisma.ingestionRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 50,
    });

    return runs.map((run) => {
      const hasFailed = run.errorMsg !== null;
      const noCompletion = !run.completedAt;
      const ageMs = Date.now() - run.startedAt.getTime();
      const isStale = noCompletion && ageMs > 30 * 60 * 1000;
      const isRunning = noCompletion && !isStale;
      const progress =
        isRunning && run.totalFiles > 0
          ? Math.round((run.processedFiles / run.totalFiles) * 100)
          : null;

      let status: string;
      if (hasFailed) status = "failed";
      else if (isRunning) status = "running";
      else if (isStale) status = "failed";
      else status = "completed";

      return {
        id: run.id,
        name: `${run.pipeline} pipeline`,
        type: run.trigger === "cron" ? "cron" : "queue",
        status,
        progress,
        lastRun: run.startedAt.toISOString(),
        nextRun: null,
        schedule: null,
        duration: run.durationMs ? Math.round(run.durationMs / 1000) : null,
        error: run.errorMsg || (isStale ? "Stale: never completed" : null),
        totalFiles: run.totalFiles,
        processedFiles: run.processedFiles,
        skippedFiles: run.skippedFiles,
        errorFiles: run.errorFiles,
        totalChunks: run.totalChunks,
      };
    });
  }
}
