# syntax=docker/dockerfile:1

# ── Stage 1: Install dependencies ──
FROM node:22.14.0-slim AS deps

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace root config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml nx.json tsconfig.base.json ./

# Copy only the workspace package.json needed
COPY apps/api/package.json apps/api/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/cache/package.json packages/cache/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/tools/package.json packages/tools/package.json

# Hoisted layout + install only api workspace
RUN echo "node-linker=hoisted" > .npmrc \
 && pnpm install --frozen-lockfile --filter @ournigeria/api...

# ── Stage 2: Build API ──
FROM deps AS api-build

COPY apps/api/ apps/api/
COPY packages/database/ packages/database/
COPY packages/cache/ packages/cache/
COPY packages/shared-types/ packages/shared-types/
COPY packages/tools/ packages/tools/
COPY packages/source/nga_admin_boundaries.geojson/ packages/source/nga_admin_boundaries.geojson/

RUN pnpm --filter @ournigeria/database run build \
 && pnpm --filter @ournigeria/cache run build \
 && pnpm --filter @ournigeria/tools run build \
 && pnpm --filter @ournigeria/api exec nest build

# ── Stage 3: Prune to production deps only ──
FROM deps AS prod-deps

# Re-install with production only — removes typescript, prisma CLI, nest CLI, etc.
ENV CI=true
RUN pnpm install --frozen-lockfile --filter @ournigeria/api... --prod \
 && rm -rf node_modules/.cache \
    node_modules/typescript \
    node_modules/ts-node \
    node_modules/ts-loader \
    node_modules/tsconfig-paths \
    node_modules/@nestjs/cli \
    node_modules/@nestjs/schematics \
    node_modules/@nx \
    node_modules/nx \
    node_modules/next \
    node_modules/react \
    node_modules/react-dom \
    node_modules/@next \
    node_modules/@swc \
    node_modules/@napi-rs \
    node_modules/lightningcss \
    node_modules/esbuild \
    node_modules/@esbuild \
    node_modules/tailwindcss \
    node_modules/@tailwindcss \
    node_modules/postcss \
    node_modules/autoprefixer \
    node_modules/eslint* \
    node_modules/@eslint* \
    node_modules/@typescript-eslint \
    node_modules/prettier \
    node_modules/webpack* \
    node_modules/jest* \
    node_modules/@types \
    node_modules/lucide-react \
    node_modules/recharts \
    node_modules/playwright-core \
    node_modules/@babel \
    node_modules/tesseract.js-core \
    node_modules/tesseract.js \
    node_modules/pdfjs-dist \
    node_modules/pdf-parse \
    node_modules/xlsx

# ── Stage 4: Production runner ──
FROM node:22.14.0-slim AS runner

# git + openssh-client: required by the OKF knowledge-bundle publisher (dist/okf/okf-publish.cli.js)
# to clone/push the public mirror over an SSH deploy key. tar (for the bundle tarball) ships in the base.
RUN apt-get update && apt-get install -y openssl curl bash gnupg git openssh-client \
 && curl -1sLf 'https://artifacts-cli.infisical.com/setup.deb.sh' | bash \
 && apt-get update && apt-get install -y infisical \
 && rm -rf /var/lib/apt/lists/*

# postgresql-client-16: pg_dump for the dashboard DB-backup feature.
# Must be >= the PG16 server version, so pin via the official PGDG apt repo.
# PGDG ships amd64 + arm64, so this works for current prod and the future OCI box.
RUN curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
      | gpg --dearmor -o /usr/share/keyrings/pgdg.gpg \
 && echo "deb [signed-by=/usr/share/keyrings/pgdg.gpg] http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" \
      > /etc/apt/sources.list.d/pgdg.list \
 && apt-get update && apt-get install -y postgresql-client-16 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

# Copy production-only node_modules (no devDependencies)
COPY --from=prod-deps /app/node_modules/ node_modules/

# Copy generated Prisma client (lives inside node_modules after generate)
COPY --from=api-build /app/node_modules/.prisma/ node_modules/.prisma/
COPY --from=api-build /app/node_modules/@prisma/client/ node_modules/@prisma/client/

# Copy API build output
COPY --from=api-build /app/apps/api/dist/ dist/
COPY --from=api-build /app/packages/database/prisma/ prisma/
COPY --from=api-build /app/packages/database/prisma.config.ts prisma.config.ts
COPY --from=api-build /app/packages/database/dist/ packages/database/dist/
COPY --from=api-build /app/packages/database/package.json packages/database/package.json
COPY --from=api-build /app/packages/cache/dist/ packages/cache/dist/
COPY --from=api-build /app/packages/cache/package.json packages/cache/package.json
COPY --from=api-build /app/packages/shared-types/ packages/shared-types/
COPY --from=api-build /app/packages/tools/dist/ packages/tools/dist/
COPY --from=api-build /app/packages/tools/package.json packages/tools/package.json
COPY --from=api-build /app/packages/source/nga_admin_boundaries.geojson/ packages/source/nga_admin_boundaries.geojson/

# Link workspace packages so Node can resolve @ournigeria/*
RUN mkdir -p node_modules/@ournigeria && \
    ln -s /app/packages/database node_modules/@ournigeria/database && \
    ln -s /app/packages/cache node_modules/@ournigeria/cache && \
    ln -s /app/packages/shared-types node_modules/@ournigeria/shared-types && \
    ln -s /app/packages/tools node_modules/@ournigeria/tools

# Copy Infisical config
COPY apps/api/.infisical.json .infisical.json

# Copy entrypoint
COPY apps/api/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ARG PORT=3000
ENV PORT=${PORT}
EXPOSE ${PORT}

USER appuser

STOPSIGNAL SIGTERM

ENTRYPOINT ["/app/docker-entrypoint.sh"]
