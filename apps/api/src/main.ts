import { initOtel } from "./lib/otel";
initOtel();

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { closePgVector } from "./mastra/rag/config";
import { closeSharedPool } from "./mastra/rag/db-pool";
import { runRagMigrations } from "./mastra/rag/migrations/run-migrations";
import { Neo4jService } from "./graph/neo4j.service";
import { setNeo4jServiceForTools } from "./mastra/tools/graph-search";
import { setNeo4jServiceForTraversal } from "./mastra/tools/traverse-graph";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Allow larger request bodies for base64-encoded image uploads (proposals)
  app.useBodyParser("json", { limit: "2mb" });
  app.useBodyParser("urlencoded", { limit: "2mb", extended: true });

  app.use(cookieParser());
  app.setGlobalPrefix("api", { exclude: ["health"] });
  const allowedOrigins = process.env
    .CORS_ORIGINS!.split(",")
    .map((o) => o.trim());
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle("OurNigeria API")
    .setDescription(
      "Budget analysis, corruption tracking, and government spending API",
    )
    .setVersion("0.1.0")
    .addCookieAuth("nb_uid")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  // Graceful shutdown: close standalone DB pools
  app.enableShutdownHooks();
  process.on("SIGTERM", async () => {
    await Promise.all([closePgVector(), closeSharedPool()]);
  });

  // Run RAG migrations (idempotent, non-blocking)
  runRagMigrations().catch(() => {});

  // Wire Neo4j into graph tools
  const neo4j = app.get(Neo4jService);
  setNeo4jServiceForTools(neo4j);
  setNeo4jServiceForTraversal(neo4j);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
}

bootstrap();
