import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: true });

  const corsOriginsRaw = process.env.SOCIALS_CORS_ORIGINS ?? "";
  const allowlist = new Set(
    corsOriginsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  app.enableCors({
    // Allow: no-origin requests (curl, server-to-server), the configured
    // browser frontends, and the session-capture Chrome extension. The
    // extension's origin (chrome-extension://<id>) is install-specific so we
    // can't allowlist it by value — we allow any chrome-extension origin.
    // Safe because /v1/sessions is guarded by X-Roamer-Key; CORS is not the
    // security boundary here.
    origin: (
      origin: string | undefined,
      cb: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return cb(null, true);
      if (origin.startsWith("chrome-extension://")) return cb(null, true);
      if (allowlist.size === 0 || allowlist.has(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Roamer-Key",
      "Cookie",
    ],
  });

  const config = new DocumentBuilder()
    .setTitle("OurNigeria Social Intelligence")
    .setDescription("Social media monitoring and publishing service")
    .setVersion("0.1.0")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3005;
  await app.listen(port);
  console.log(`Socials service running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
}

bootstrap();
