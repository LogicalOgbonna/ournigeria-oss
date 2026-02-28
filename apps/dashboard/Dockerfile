# syntax=docker/dockerfile:1

# ── Stage 1: Install dependencies ──
FROM node:22.14.0-slim AS deps

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace root config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml nx.json ./

# Copy only the workspace package.json needed
COPY apps/dashboard/package.json apps/dashboard/package.json

# Hoisted layout + install only dashboard workspace
RUN echo "node-linker=hoisted" > .npmrc \
 && pnpm install --frozen-lockfile --filter @ournigeria/dashboard...

# ── Stage 2: Build Next.js (standalone) ──
FROM deps AS build

COPY apps/dashboard/ apps/dashboard/

# Ensure public dir exists for COPY in runner stage
RUN mkdir -p apps/dashboard/public

RUN pnpm --filter @ournigeria/dashboard exec next build

# ── Stage 3: Production runner ──
FROM node:22.14.0-slim AS runner

RUN apt-get update && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3003

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

# Copy standalone server
COPY --from=build /app/apps/dashboard/.next/standalone ./
# Copy static assets
COPY --from=build /app/apps/dashboard/.next/static apps/dashboard/.next/static
# Copy public assets
COPY --from=build --chown=appuser:appgroup /app/apps/dashboard/public apps/dashboard/public

USER appuser

EXPOSE 3003

STOPSIGNAL SIGTERM

CMD ["node", "apps/dashboard/server.js"]
