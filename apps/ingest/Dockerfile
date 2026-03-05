# syntax=docker/dockerfile:1

# ── Stage 1: Install dependencies ──
FROM node:22.14.0-slim AS deps

RUN corepack enable && corepack prepare pnpm@latest --activate

# Build tools needed for native modules (tesseract.js)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace root config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml nx.json ./

# Copy only ingest package.json
COPY apps/ingest/package.json apps/ingest/package.json
COPY packages/database/package.json packages/database/package.json

# Hoisted layout + install only ingest workspace
RUN echo "node-linker=hoisted" > .npmrc \
 && pnpm install --frozen-lockfile --filter @ournigeria/ingest...

# ── Stage 2: Build ──
FROM deps AS build

COPY apps/ingest/ apps/ingest/
COPY packages/database/ packages/database/

RUN pnpm --filter @ournigeria/database run build \
 && pnpm --filter @ournigeria/ingest exec nest build

# ── Stage 3: Prune to production deps only ──
FROM deps AS prod-deps

ENV CI=true
RUN pnpm install --frozen-lockfile --filter @ournigeria/ingest... --prod \
 && rm -rf node_modules/.cache \
    node_modules/typescript \
    node_modules/ts-node \
    node_modules/ts-loader \
    node_modules/tsconfig-paths \
    node_modules/@nestjs/cli \
    node_modules/@nestjs/schematics \
    node_modules/@nx \
    node_modules/nx \
    node_modules/prisma \
    node_modules/next \
    node_modules/react \
    node_modules/react-dom \
    node_modules/@next \
    node_modules/@swc \
    node_modules/sharp \
    node_modules/@img \
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
    node_modules/swagger-ui-dist \
    node_modules/@prisma/studio-core \
    node_modules/@prisma/engines \
    node_modules/@prisma/dev \
    node_modules/@prisma/fetch-engine

# ── Stage 4: Production runner ──
FROM node:22.14.0-slim AS runner

RUN apt-get update && apt-get install -y openssl curl bash gnupg \
 && curl -1sLf 'https://artifacts-cli.infisical.com/setup.deb.sh' | bash \
 && apt-get update && apt-get install -y infisical \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

# Copy production-only node_modules
COPY --from=prod-deps /app/node_modules/ node_modules/

# Copy generated Prisma client (lives inside node_modules after generate)
COPY --from=build /app/node_modules/.prisma/ node_modules/.prisma/
COPY --from=build /app/node_modules/@prisma/client/ node_modules/@prisma/client/

# Copy ingest build output
COPY --from=build /app/apps/ingest/dist/ dist/
COPY --from=build /app/packages/database/prisma/ prisma/
COPY --from=build /app/packages/database/prisma.config.ts prisma.config.ts
COPY --from=build /app/packages/database/dist/ packages/database/dist/
COPY --from=build /app/packages/database/package.json packages/database/package.json

# Copy Infisical config
COPY apps/ingest/.infisical.json .infisical.json

USER appuser

EXPOSE 3002

STOPSIGNAL SIGTERM

CMD infisical run --env "${INFISICAL_ENV:-prod}" -- node dist/main.js
