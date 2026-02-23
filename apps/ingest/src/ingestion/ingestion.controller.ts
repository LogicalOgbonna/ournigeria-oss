import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'node:path';
import { IngestionService } from './ingestion.service';

@Controller('api/ingest')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('run')
  async run(
    @Body() body: { pipeline: string; concurrency?: number },
  ) {
    const result = await this.ingestionService.runPipeline(
      body.pipeline,
      'manual',
      body.concurrency,
    );
    return result;
  }

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          // Resolve at call time since the service may not be available in static context
          const uploadDir = path.resolve(__dirname, '../../../uploads');
          cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}-${file.originalname}`);
        },
      }),
    }),
  )
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { pipeline: string; metadata?: string },
  ) {
    const result = await this.ingestionService.runPipeline(
      body.pipeline,
      'upload',
    );
    return {
      uploadedFiles: files.map((f) => f.originalname),
      ...result,
    };
  }

  @Get('status')
  async status(@Query('pipeline') pipeline?: string) {
    return this.ingestionService.getStatus(pipeline);
  }
}
