#!/usr/bin/env bash
set -eo pipefail

# Builds every internal @ournigeria/* package that apps require to be
# pre-compiled to dist/ before they can be required (e.g. `pnpm api:dev`
# fails with MODULE_NOT_FOUND until these are built). Run this after a
# fresh clone, after `pnpm install`, or whenever an app fails to start
# with "Cannot find module '@ournigeria/<pkg>/dist/index.js'".
#
# @ournigeria/shared-types and @ournigeria/content are source-referenced
# (package.json "main" points at a .ts file) and need no build step, so
# they're intentionally excluded here.

ROOT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BUILD_PACKAGES="database cache tools official-records"

# ─── Ensure pnpm is available ───────────────────────────────────────────────
# The version pinned in package.json's "packageManager" field is the source
# of truth; corepack (bundled with Node 16.9+) can install/activate it
# without needing npm's global install path to be writable.
if ! command -v pnpm >/dev/null 2>&1; then
  echo -e "${YELLOW}==> pnpm not found — installing it${NC}"
  PNPM_VERSION="$(node -p "require('./package.json').packageManager" 2>/dev/null | sed 's/^pnpm@//')"
  [ -n "$PNPM_VERSION" ] || PNPM_VERSION="latest"

  if command -v corepack >/dev/null 2>&1; then
    corepack enable pnpm >/dev/null 2>&1 || true
    corepack prepare "pnpm@${PNPM_VERSION}" --activate
  elif command -v npm >/dev/null 2>&1; then
    npm install -g "pnpm@${PNPM_VERSION}"
  else
    echo -e "${RED}==> Could not find corepack or npm to install pnpm. Install Node.js first.${NC}"
    exit 1
  fi

  if ! command -v pnpm >/dev/null 2>&1; then
    echo -e "${RED}==> pnpm install appeared to succeed but 'pnpm' is still not on PATH.${NC}"
    echo -e "${RED}    Open a new shell (or re-source your profile) and re-run this script.${NC}"
    exit 1
  fi
  echo -e "${GREEN}==> pnpm $(pnpm -v) installed${NC}"
fi

echo -e "${YELLOW}==> Installing dependencies${NC}"
pnpm install

echo -e "${YELLOW}==> Building internal packages: ${BUILD_PACKAGES}${NC}"
# nx.json sets build.dependsOn=[^build], so this also builds any
# cross-package deps (e.g. tools -> cache) in the correct order.
pnpm exec nx run-many -t build -p $(echo "$BUILD_PACKAGES" | tr ' ' ',')

echo -e "${GREEN}==> All internal packages built. Apps are ready to run (pnpm api:dev, pnpm ingest:dev, ...)${NC}"

echo -e "${YELLOW}==> Generating prisma schema"
pnpm prisma:generate
