#!/usr/bin/env npx tsx
/**
 * Build the OKF bundle and write it to ./okf-out (+ okf-out.tar.gz).
 *   DATABASE_URL=... npx tsx apps/api/src/okf/okf-export.cli.ts [outDir]
 * Reuses the Nest DI graph via a standalone application context so the
 * export service gets the real OfficialsService/EvidenceService/Prisma.
 */
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { OkfExportService } from "./okf-export.service";
import { writeBundle, tarBundle } from "./okf-bundle";

async function main() {
  const outDir = process.argv[2] ?? "okf-out";
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn", "log"] });
  try {
    const svc = app.get(OkfExportService);
    const timestamp = new Date().toISOString();
    const bundle = await svc.buildBundle(timestamp);
    writeBundle(bundle, outDir);
    tarBundle(outDir, `${outDir}.tar.gz`);
    process.stdout.write(`OKF bundle: ${bundle.size} files -> ${outDir}/ (+ ${outDir}.tar.gz)\n`);
  } finally {
    await app.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
