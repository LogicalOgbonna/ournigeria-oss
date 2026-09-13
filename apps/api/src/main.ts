import { initOtel } from "./lib/otel";
initOtel();

import "reflect-metadata";
import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import { corsOptionsFor } from "./storage/local-storage-cors";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { closePgVector } from "./mastra/rag/config";
import { closeSharedPool } from "./mastra/rag/db-pool";
import { runRagMigrations } from "./mastra/rag/migrations/run-migrations";
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Single reverse proxy in front (prod box / edge). Trust exactly one hop so
  // req.ip is the real client IP from the trusted end of X-Forwarded-For, not a
  // client-spoofable first hop. If the deployment adds proxy hops (e.g. a CDN in
  // front), bump this number to match.
  app.set("trust proxy", 1);

  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }));

  // Allow larger request bodies for base64-encoded image uploads (proposals)
  app.useBodyParser("json", { limit: "2mb" });
  app.useBodyParser("urlencoded", { limit: "2mb", extended: true });

  app.use(cookieParser());
  app.setGlobalPrefix("api", { exclude: ["health"] });
  const allowedOrigins = process.env
    .CORS_ORIGINS!.split(",")
    .map((o) => o.trim());
  // Delegate form: the local storage route (dev only) answers CORS for any
  // origin without credentials; everything else keeps the allowlist.
  app.enableCors((req: { originalUrl?: string; url?: string }, cb: (err: Error | null, opts: CorsOptions) => void) => cb(null, corsOptionsFor(req, allowedOrigins)));

  const config = new DocumentBuilder()
    .setTitle("OurNigeria API")
    .setDescription(
      "Budget analysis, corruption tracking, and government spending API",
    )
    .setVersion("0.1.0")
    .addCookieAuth("nb_uid")
    .build();

  if (process.env.NODE_ENV !== "production") {
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document);
  }

  // Graceful shutdown: close standalone DB pools
  app.enableShutdownHooks();
  process.on("SIGTERM", async () => {
    await Promise.all([closePgVector(), closeSharedPool()]);
  });

  // Run RAG migrations (idempotent, non-blocking)
  runRagMigrations().catch(() => {});

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
  if (process.env.LEGACY_UID_SESSIONS !== "false") {
    console.warn(
      "[security] LEGACY_UID_SESSIONS is enabled — raw-UUID nb_uid cookies are still accepted. Set LEGACY_UID_SESSIONS=false to close the migration window.",
    );
  }
  // Default flipped OFF at the RBAC rollout (plan 62 §7): warn only when
  // someone explicitly re-opened the legacy window.
  if (process.env.LEGACY_ADMIN_SESSIONS === "true") {
    console.warn(
      "[security] LEGACY_ADMIN_SESSIONS is enabled — stateless HMAC admin tokens are still accepted. Set LEGACY_ADMIN_SESSIONS=false to close the migration window.",
    );
  }
  if (process.env.NODE_ENV !== "production") {
    console.log(`Swagger docs at http://localhost:${port}/docs`);
  }
}

bootstrap();
