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
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import * as path from 'node:path';
import { IngestionService } from './ingestion.service';

@ApiTags('Ingestion')
@Controller('api/ingest')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('run')
  @ApiOperation({ summary: 'Run an ingestion pipeline' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['pipeline'],
      properties: {
        pipeline: { type: 'string', example: 'federal-budget' },
        concurrency: { type: 'number', example: 5 },
      },
    },
  })
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
  @ApiOperation({ summary: 'Upload files and run a pipeline' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['pipeline', 'files'],
      properties: {
        pipeline: { type: 'string', example: 'federal-budget' },
        metadata: { type: 'string' },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
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
  @ApiOperation({ summary: 'Get ingestion status' })
  @ApiQuery({ name: 'pipeline', required: false, example: 'federal-budget' })
  async status(@Query('pipeline') pipeline?: string) {
    return this.ingestionService.getStatus(pipeline);
  }
}
