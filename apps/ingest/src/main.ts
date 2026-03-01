import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle("Ingest Service")
    .setDescription("Document ingestion and embedding pipeline")
    .setVersion("0.1.0")
    .addCookieAuth("on_admin_session")
    .addApiKey(
      { type: "apiKey", name: "X-Admin-Key", in: "header" },
      "X-Admin-Key",
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  await app.listen(3002);
  console.log(`Ingest service running on http://localhost:3002`);
  console.log(`Swagger docs at http://localhost:3002/docs`);
}

bootstrap();
