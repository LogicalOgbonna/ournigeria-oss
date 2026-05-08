import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
export interface HealthCheck {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  uptime: number;
  checks: {
    database: { status: "ok" | "down"; latency: number };
    memory: { status: "ok" | "degraded"; rss_mb: number };
  };
}

@Injectable()
export class HealthService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async check(): Promise<HealthCheck> {
    const checks = {
      database: await this.checkDatabase(),
      memory: this.checkMemory(),
    };

    const dbDown = checks.database.status === "down";
    const memDegraded = checks.memory.status === "degraded";

    return {
      status: dbDown ? "down" : memDegraded ? "degraded" : "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      checks,
    };
  }

  private async checkDatabase(): Promise<{ status: "ok" | "down"; latency: number }> {
    try {
      const t0 = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok", latency: Date.now() - t0 };
    } catch {
      return { status: "down", latency: -1 };
    }
  }

  private checkMemory(): { status: "ok" | "degraded"; rss_mb: number } {
    const rss_mb = Math.round(process.memoryUsage().rss / 1024 / 1024);
    return { status: rss_mb > 1500 ? "degraded" : "ok", rss_mb };
  }
}
