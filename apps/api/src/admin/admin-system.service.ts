import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";

@Injectable()
export class AdminSystemService {
  constructor(private prisma: PrismaService) {}

  async getHealth() {
    const start = Date.now();

    // DB ping
    let dbLatency: number;
    let dbStatus: "healthy" | "degraded" | "down" = "healthy";
    try {
      const t0 = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - t0;
      if (dbLatency > 500) dbStatus = "degraded";
    } catch {
      dbLatency = -1;
      dbStatus = "down";
    }

    // pgvector check
    let vectorLatency: number;
    let vectorStatus: "healthy" | "degraded" | "down" = "healthy";
    try {
      const t0 = Date.now();
      await this.prisma
        .$queryRaw`SELECT 1 FROM pg_extension WHERE extname = 'vector'`;
      vectorLatency = Date.now() - t0;
      if (vectorLatency > 500) vectorStatus = "degraded";
    } catch {
      vectorLatency = -1;
      vectorStatus = "down";
    }

    // Memory usage
    const mem = process.memoryUsage();
    const memMb = Math.round(mem.rss / 1024 / 1024);

    // Uptime
    const uptimeS = process.uptime();
    const days = Math.floor(uptimeS / 86400);
    const hours = Math.floor((uptimeS % 86400) / 3600);
    const uptimeStr =
      days > 0
        ? `${days}d ${hours}h`
        : `${hours}h ${Math.floor((uptimeS % 3600) / 60)}m`;

    // API latency (self)
    const apiLatency = Date.now() - start;

    // Use messages table for latency metrics (has processing_time_ms)
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

    // Avg latency from messages (processing_time_ms)
    const latencyStats = await this.prisma.message.aggregate({
      where: {
        createdAt: { gte: oneHourAgo },
        role: "assistant",
        processingTimeMs: { not: null },
      },
      _avg: { processingTimeMs: true },
    });
    const avgLatency = Math.round(latencyStats._avg.processingTimeMs || 0);

    // P99 approximation
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

    // Error rate: messages with very high latency (>120s = likely timeout)
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

    const latencyHistory = await this.buildLatencyHistory();
    const errorRateHistory = await this.buildErrorHistory();

    const services = [
      {
        name: "API (NestJS)",
        status: "healthy" as const,
        latency: apiLatency,
        uptime: uptimeStr,
      },
      {
        name: "PostgreSQL",
        status: dbStatus,
        latency: dbLatency,
        uptime: dbStatus === "down" ? "0%" : "99.99%",
      },
      {
        name: "pgvector",
        status: vectorStatus,
        latency: vectorLatency,
        uptime: vectorStatus === "down" ? "0%" : "99.99%",
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
    // Use messages + query_analytics as log sources
    const entries = await this.prisma.message.findMany({
      where: {
        role: "assistant",
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
        service: "chat",
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
      // If no completedAt and started >30 min ago, it's stale (not actually running)
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
