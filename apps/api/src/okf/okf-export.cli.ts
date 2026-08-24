#!/usr/bin/env npx tsx
/**
 * Build the OKF bundle and write it to ./okf-out (+ okf-out.tar.gz).
 *   DATABASE_URL=... npx tsx --tsconfig apps/api/tsconfig.json apps/api/src/okf/okf-export.cli.ts [outDir]
 * Services are wired by hand (see okf-bootstrap) so no Nest DI / decorator
 * metadata is required at runtime.
 */
import { bootstrapOkf } from "./okf-bootstrap";
import { writeBundle, tarBundle } from "./okf-bundle";

async function main() {
  const outDir = process.argv[2] ?? "okf-out";
  const rt = await bootstrapOkf();
  try {
    const timestamp = new Date().toISOString();
    const bundle = await rt.exporter.buildBundle(timestamp);
    writeBundle(bundle, outDir);
    tarBundle(outDir, `${outDir}.tar.gz`);
    process.stdout.write(`OKF bundle: ${bundle.size} files -> ${outDir}/ (+ ${outDir}.tar.gz)\n`);
  } finally {
    await rt.dispose();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
