#!/usr/bin/env npx tsx
/**
 * Build + publish the OKF bundle (S3 swap + git mirror).
 *   OKF_PUBLISH_ENABLED=1 DATABASE_URL=... S3_BUCKET=... AWS_*=... \
 *   OKF_GIT_REPO=github.com/ournigeria/ournigeria-knowledge OKF_GIT_TOKEN=... \
 *   npx tsx --tsconfig apps/api/tsconfig.json apps/api/src/okf/okf-publish.cli.ts
 */
import { bootstrapOkf } from "./okf-bootstrap";
import { writeBundle, tarBundle } from "./okf-bundle";

async function main() {
  if (process.env.OKF_PUBLISH_ENABLED !== "1") {
    process.stdout.write("OKF_PUBLISH_ENABLED!=1 — refusing to publish\n");
    return;
  }
  const outDir = "okf-out";
  const tarPath = "okf-out.tar.gz"; // sibling — ships to S3 only; gzip's timestamp would defeat git no-op-diff
  const rt = await bootstrapOkf();
  try {
    const iso = new Date().toISOString();
    const date = iso.slice(0, 10);
    const runId = iso.replace(/[:.]/g, "-");
    const bundle = await rt.exporter.buildBundle(iso);
    writeBundle(bundle, outDir);
    tarBundle(outDir, tarPath);
    const publish = rt.makePublisher();
    await publish.publishToS3(outDir, tarPath, runId);
    await publish.publishToGit(outDir, date);
  } finally {
    await rt.dispose();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
