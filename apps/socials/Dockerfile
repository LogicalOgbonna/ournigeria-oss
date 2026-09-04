# syntax=docker/dockerfile:1

# -- Stage 1: Install dependencies --
FROM node:22.14.0-slim AS deps

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace root config (tsconfig.base.json needed: cache/tools tsconfigs extend it)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml nx.json tsconfig.base.json ./

# Copy only the workspace package.json needed
# socials depends on @ournigeria/{database,content,tools}; tools depends on @ournigeria/cache.
COPY apps/socials/package.json apps/socials/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/content/package.json packages/content/package.json
COPY packages/tools/package.json packages/tools/package.json
COPY packages/cache/package.json packages/cache/package.json
COPY packages/access/package.json packages/access/package.json

# Hoisted layout + install only socials workspace
RUN echo "node-linker=hoisted" > .npmrc \
 && pnpm install --frozen-lockfile --filter @ournigeria/socials...

# -- Stage 2: Build --
FROM deps AS build

COPY apps/socials/ apps/socials/
COPY packages/database/ packages/database/
COPY packages/content/ packages/content/
COPY packages/tools/ packages/tools/
COPY packages/cache/ packages/cache/
COPY packages/access/ packages/access/

RUN pnpm --filter @ournigeria/database run build \
 && pnpm --filter @ournigeria/cache run build \
 && pnpm --filter @ournigeria/access run build \
 && pnpm --filter @ournigeria/tools run build \
 && pnpm --filter @ournigeria/socials exec nest build

# -- Stage 3: Prune to production deps only --
FROM deps AS prod-deps

ENV CI=true
RUN pnpm install --frozen-lockfile --filter @ournigeria/socials... --prod \
 && rm -rf node_modules/.cache \
    node_modules/typescript \
    node_modules/ts-node \
    node_modules/ts-loader \
    node_modules/tsconfig-paths \
    node_modules/@nestjs/cli \
    node_modules/@nestjs/schematics \
    node_modules/@nx \
    node_modules/nx \
    node_modules/@types \
    node_modules/@babel

# -- Stage 4: Production runner --
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

# Copy generated Prisma client
COPY --from=build /app/node_modules/.prisma/ node_modules/.prisma/
COPY --from=build /app/node_modules/@prisma/client/ node_modules/@prisma/client/

# Copy build output
COPY --from=build /app/apps/socials/dist/ dist/
COPY --from=build /app/packages/database/dist/ packages/database/dist/
COPY --from=build /app/packages/database/package.json packages/database/package.json
COPY --from=build /app/packages/cache/dist/ packages/cache/dist/
COPY --from=build /app/packages/cache/package.json packages/cache/package.json
COPY --from=build /app/packages/access/dist/ packages/access/dist/
COPY --from=build /app/packages/access/package.json packages/access/package.json
COPY --from=build /app/packages/tools/dist/ packages/tools/dist/
COPY --from=build /app/packages/tools/package.json packages/tools/package.json
# content has no JS build (exports raw .ts); ship source so @ournigeria/content resolves.
# Its only runtime use (FAAC image render) is a try/catch'd dynamic import that degrades
# to null if it can't load — core drafting/roamer/publish do not depend on it.
COPY --from=build /app/packages/content/ packages/content/

# Link workspace packages so Node can resolve @ournigeria/*
RUN mkdir -p node_modules/@ournigeria && \
    ln -s /app/packages/database node_modules/@ournigeria/database && \
    ln -s /app/packages/cache node_modules/@ournigeria/cache && \
    ln -s /app/packages/access node_modules/@ournigeria/access && \
    ln -s /app/packages/tools node_modules/@ournigeria/tools && \
    ln -s /app/packages/content node_modules/@ournigeria/content

# Copy Infisical config
COPY apps/socials/.infisical.json .infisical.json

ARG PORT=3005
ENV PORT=${PORT}
EXPOSE ${PORT}

USER appuser

STOPSIGNAL SIGTERM

# Mirror api/ingest: wrap with Infisical so prod secrets (ROAMER_INGEST_KEY,
# DEEPSEEK_API_KEY, X OAuth tokens, SOCIALS_CORS_ORIGINS, …) are injected at runtime.
# Socials secrets live under the /socials path (see apps/socials/package.json scripts).
# Exec/JSON form so SIGTERM reaches PID 1. sh -c gives us ${INFISICAL_ENV}
# expansion; exec replaces the shell with infisical (which forwards signals to node).
CMD ["sh", "-c", "exec infisical run --env \"${INFISICAL_ENV:-prod}\" --path /socials -- node dist/main"]
