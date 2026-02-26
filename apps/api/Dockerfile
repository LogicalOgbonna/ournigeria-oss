# ── Stage 1: Install dependencies ──
FROM node:22-slim AS deps

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace root config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml nx.json ./

# Copy only the workspace package.json needed
COPY apps/api/package.json apps/api/package.json

# Hoisted layout + install only api workspace
RUN echo "node-linker=hoisted" > .npmrc \
 && pnpm install --frozen-lockfile --filter @ournigeria/api...

# ── Stage 2: Build API ──
FROM deps AS api-build

COPY apps/api/ apps/api/

RUN pnpm --filter @ournigeria/api exec prisma generate \
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
    node_modules/tesseract.js-core \
    node_modules/tesseract.js \
    node_modules/pdfjs-dist \
    node_modules/pdf-parse \
    node_modules/xlsx

# ── Stage 4: Production runner ──
FROM node:22-slim AS runner

RUN apt-get update && apt-get install -y openssl curl bash gnupg \
 && curl -1sLf 'https://artifacts-cli.infisical.com/setup.deb.sh' | bash \
 && apt-get update && apt-get install -y infisical \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy production-only node_modules (no devDependencies)
COPY --from=prod-deps /app/node_modules/ node_modules/

# Copy generated Prisma client (lives inside node_modules after generate)
COPY --from=api-build /app/node_modules/.prisma/ node_modules/.prisma/
COPY --from=api-build /app/node_modules/@prisma/client/ node_modules/@prisma/client/

# Copy API build output
COPY --from=api-build /app/apps/api/dist/ dist/
COPY --from=api-build /app/apps/api/prisma/ prisma/
COPY --from=api-build /app/apps/api/prisma.config.ts prisma.config.ts

# Copy Infisical config
COPY apps/api/.infisical.json .infisical.json

# Copy entrypoint
COPY apps/api/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ARG PORT=3000
ENV PORT=${PORT}
EXPOSE ${PORT}

ENTRYPOINT ["/app/docker-entrypoint.sh"]
