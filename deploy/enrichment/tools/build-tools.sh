#!/usr/bin/env bash
# Regenerate the bundled enrichment CLIs from apps/api source.
# The .cjs outputs are committed so the Docker build works from a fresh checkout;
# re-run this whenever the agent CLIs or their deps change.
set -euo pipefail
cd "$(dirname "$0")/../../.."   # repo root

# --packages=external leaves every package import as a runtime require(), but the
# agent image only npm-installs the tools' package.json deps (pg, xlsx, pdf-parse).
# Two workspace-only imports leak through the bundled graph — slugifyName from
# @ournigeria/database and BadRequestException from @nestjs/common — and would
# crash the CLIs on boot inside the container. Alias them to tiny shims so
# esbuild inlines them and the bundles stay genuinely standalone.
SHIM_ALIASES=(
  --alias:@ournigeria/database=./deploy/enrichment/tools/shims/ournigeria-database.ts
  --alias:@nestjs/common=./deploy/enrichment/tools/shims/nestjs-common.ts
)

for cli in find-candidates submit-proposal parse-located find-councilor-gaps submit-create-proposal find-structured-gaps submit-structured-create corruption-lookup courtlistener-lookup; do
  npx esbuild "apps/api/src/enrichment/agent/${cli}.cli.ts" \
    --bundle --platform=node --target=node22 --format=cjs --packages=external \
    "${SHIM_ALIASES[@]}" \
    --outfile="deploy/enrichment/tools/${cli}.cjs"
done

# Autonomous sweeper (control plane) — lives under enrichment/sweeper/, bundled too.
npx esbuild "apps/api/src/enrichment/sweeper/sweeper.cli.ts" \
  --bundle --platform=node --target=node22 --format=cjs --packages=external \
  "${SHIM_ALIASES[@]}" \
  --outfile="deploy/enrichment/tools/sweeper.cjs"

# Guard: fail loudly if any bundle still requires a package the image won't have.
BAD=$(grep -lE 'require\("@(ournigeria|nestjs)/' deploy/enrichment/tools/*.cjs || true)
if [ -n "$BAD" ]; then
  echo "ERROR: bundles still require workspace packages the agent image cannot install:" >&2
  echo "$BAD" >&2
  exit 1
fi

echo "Bundled: find-candidates submit-proposal parse-located find-councilor-gaps submit-create-proposal find-structured-gaps submit-structured-create corruption-lookup courtlistener-lookup sweeper (.cjs)"
