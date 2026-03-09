import { initOtel } from "./lib/otel";
initOtel();

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { closePgVector } from "./mastra/rag/config";
import { closeHybridSearchPool } from "./mastra/rag/hybrid-search";
import { closeBudgetSearchPool } from "./mastra/tools/budget-search";
import { runRagMigrations } from "./mastra/rag/migrations/run-migrations";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
    await Promise.all([closePgVector(), closeBudgetSearchPool(), closeHybridSearchPool()]);
  });

  // Run RAG migrations (idempotent, non-blocking)
  runRagMigrations().catch(() => {});

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
}

bootstrap();
