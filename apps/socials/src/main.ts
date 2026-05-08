import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: true });

  const corsOriginsRaw = process.env.SOCIALS_CORS_ORIGINS ?? "";
  const corsOrigins = corsOriginsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
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
