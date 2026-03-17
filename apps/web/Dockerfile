# syntax=docker/dockerfile:1

# ── Stage 1: Install dependencies ──
FROM node:22.14.0-slim AS deps

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace root config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml nx.json ./

# Copy only the workspace package.json needed
COPY apps/web/package.json apps/web/package.json
COPY packages/database/package.json packages/database/package.json

# Hoisted layout + install only web workspace
RUN echo "node-linker=hoisted" > .npmrc \
 && pnpm install --frozen-lockfile --filter @ournigeria/web...

# ── Stage 2: Build Next.js (standalone) ──
FROM deps AS build

RUN apt-get update && apt-get install -y curl bash gnupg \
 && curl -1sLf 'https://artifacts-cli.infisical.com/setup.deb.sh' | bash \
 && apt-get update && apt-get install -y infisical \
 && rm -rf /var/lib/apt/lists/*

ARG INFISICAL_TOKEN
ENV INFISICAL_TOKEN=${INFISICAL_TOKEN}

COPY apps/web/.infisical.json .infisical.json
COPY packages/database/ packages/database/
COPY apps/web/ apps/web/

RUN pnpm --filter @ournigeria/database run build

# Inject NEXT_PUBLIC_* env vars from Infisical so they are inlined into the bundle
# Using ARG to ensure we can pass the token at build time for CI environments
# Or using the local .infisical.json for local development
#
# Build guard: when Infisical is available, verify NEXT_PUBLIC_API_URL is set.
# Without it, Next.js rewrites fall back to a default and API calls may fail.
RUN if [ -z "$INFISICAL_TOKEN" ]; then \
      echo "Running without Infisical token or with old invalid token" && \
      pnpm --filter @ournigeria/web exec next build; \
    else \
      echo "Running with Infisical token" && \
      export $(infisical export --env prod --path /web --format=dotenv 2>/dev/null | xargs) 2>/dev/null || true && \
      if [ -z "${NEXT_PUBLIC_API_URL:-}" ]; then \
        echo "WARNING: NEXT_PUBLIC_API_URL is not set in Infisical prod /web. Falling back to default." ; \
      fi && \
      infisical run --env prod --path /web -- pnpm --filter @ournigeria/web exec next build; \
    fi

# ── Stage 3: Production runner ──
FROM node:22.14.0-slim AS runner

RUN apt-get update && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

# Copy standalone server
COPY --from=build /app/apps/web/.next/standalone ./
# Copy static assets
COPY --from=build /app/apps/web/.next/static apps/web/.next/static
# Copy public assets (if any)
COPY --from=build /app/apps/web/public apps/web/public

USER appuser

EXPOSE 3001

STOPSIGNAL SIGTERM

CMD ["node", "apps/web/server.js"]
