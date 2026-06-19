import type { ConfigService } from "@nestjs/config";
import { PrismaService } from "@ournigeria/database";
import { EvidenceService } from "../evidence/evidence.service";
import { CompletenessService } from "../completeness/completeness.service";
import { OfficialsService } from "../officials/officials.service";
import { OkfExportService } from "./okf-export.service";
import { OkfPublishService } from "./okf-publish.service";

/**
 * Minimal env-backed ConfigService for the standalone CLIs. The OKF CLIs wire
 * services by hand (rather than NestFactory) so esbuild/tsx don't need emitted
 * decorator metadata — same approach as the enrichment CLIs.
 */
class EnvConfig {
  get<T = string>(key: string): T | undefined {
    const v = process.env[key];
    return (v === undefined || v === "" ? undefined : v) as T | undefined;
  }
  getOrThrow<T = string>(key: string): T {
    const v = process.env[key];
    if (v === undefined || v === "") throw new Error(`missing required env ${key}`);
    return v as T;
  }
}

export interface OkfRuntime {
  prisma: PrismaService;
  exporter: OkfExportService;
  /** Constructed lazily — touches S3/AWS env (throws if unset), so only call when publishing. */
  makePublisher: () => OkfPublishService;
  dispose: () => Promise<void>;
}

export async function bootstrapOkf(): Promise<OkfRuntime> {
  const prisma = new PrismaService();
  await prisma.onModuleInit();
  const config = new EnvConfig() as unknown as ConfigService;
  const evidence = new EvidenceService(prisma);
  const completeness = new CompletenessService(prisma);
  const officials = new OfficialsService(prisma, evidence, completeness);
  const exporter = new OkfExportService(prisma, officials, evidence, config);
  return {
    prisma,
    exporter,
    makePublisher: () => new OkfPublishService(config),
    dispose: () => prisma.onModuleDestroy(),
  };
}
