#!/usr/bin/env bash
# Regenerate the bundled enrichment CLIs from apps/api source.
# The .cjs outputs are committed so the Docker build works from a fresh checkout;
# re-run this whenever the agent CLIs or their deps change.
set -euo pipefail
cd "$(dirname "$0")/../../.."   # repo root

for cli in find-candidates submit-proposal parse-located find-councilor-gaps submit-create-proposal; do
  npx esbuild "apps/api/src/enrichment/agent/${cli}.cli.ts" \
    --bundle --platform=node --target=node22 --format=cjs --packages=external \
    --outfile="deploy/enrichment/tools/${cli}.cjs"
done
echo "Bundled: find-candidates.cjs submit-proposal.cjs parse-located.cjs find-councilor-gaps.cjs submit-create-proposal.cjs"
