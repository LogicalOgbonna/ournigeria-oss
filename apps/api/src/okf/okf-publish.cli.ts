#!/usr/bin/env npx tsx
/**
 * Build + publish the OKF bundle (S3 swap + git mirror).
 *   OKF_PUBLISH_ENABLED=1 DATABASE_URL=... S3_BUCKET=... AWS_*=... \
 *   OKF_GIT_REPO=github.com/ournigeria/ournigeria-knowledge OKF_GIT_TOKEN=... \
 *   npx tsx apps/api/src/okf/okf-publish.cli.ts
 */
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { OkfExportService } from "./okf-export.service";
import { OkfPublishService } from "./okf-publish.service";
import { writeBundle, tarBundle } from "./okf-bundle";

async function main() {
  if (process.env.OKF_PUBLISH_ENABLED !== "1") {
    process.stdout.write("OKF_PUBLISH_ENABLED!=1 — refusing to publish\n");
    return;
  }
  const outDir = "okf-out";
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn", "log"] });
  try {
    const iso = new Date().toISOString();
    const date = iso.slice(0, 10);
    const runId = iso.replace(/[:.]/g, "-");
    const bundle = await app.get(OkfExportService).buildBundle(iso);
    writeBundle(bundle, outDir);
    tarBundle(outDir, `${outDir}/bundle.tar.gz`); // ship the tarball inside the bundle too
    const publish = app.get(OkfPublishService);
    await publish.publishToS3(outDir, runId);
    await publish.publishToGit(outDir, date);
  } finally {
    await app.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
