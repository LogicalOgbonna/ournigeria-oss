import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Ingest Service')
    .setDescription('Document ingestion and embedding pipeline')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3002);
  console.log(`Ingest service running on http://localhost:3002`);
  console.log(`Swagger docs at http://localhost:3002/docs`);
}

bootstrap();
