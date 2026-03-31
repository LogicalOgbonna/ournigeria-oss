# syntax=docker/dockerfile:1

# -- Stage 1: Install dependencies --
FROM node:22.14.0-slim AS deps

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace root config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml nx.json ./

# Copy only the workspace package.json needed
COPY apps/socials/package.json apps/socials/package.json
COPY packages/database/package.json packages/database/package.json

# Hoisted layout + install only socials workspace
RUN echo "node-linker=hoisted" > .npmrc \
 && pnpm install --frozen-lockfile --filter @ournigeria/socials...

# -- Stage 2: Build --
FROM deps AS build

COPY apps/socials/ apps/socials/
COPY packages/database/ packages/database/

RUN pnpm --filter @ournigeria/database run build \
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

# Link workspace packages
RUN mkdir -p node_modules/@ournigeria && \
    ln -s /app/packages/database node_modules/@ournigeria/database

# Copy Infisical config
COPY apps/socials/.infisical.json .infisical.json

ARG PORT=3005
ENV PORT=${PORT}
EXPOSE ${PORT}

USER appuser

STOPSIGNAL SIGTERM

CMD ["node", "dist/main"]
