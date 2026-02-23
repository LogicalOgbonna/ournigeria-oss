import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PrismaService } from '../database/prisma.service';
import { PipelineRegistry } from '../pipeline/pipeline.registry';
import { PipelineResult } from '../pipeline/pipeline.types';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private readonly uploadDir = path.resolve(__dirname, '../../../uploads');
  private readonly activePipelines = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: PipelineRegistry,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async runPipeline(
    pipelineType: string,
    trigger: string,
    concurrency?: number,
  ): Promise<{ runId: string; message: string }> {
    const pipeline = this.registry.get(pipelineType);
    if (!pipeline) {
      throw new BadRequestException(
        `Unknown pipeline: ${pipelineType}. Available: ${this.registry.listTypes().join(', ')}`,
      );
    }

    if (this.activePipelines.has(pipelineType)) {
      throw new BadRequestException(
        `Pipeline "${pipelineType}" is already running. Check /api/ingest/status for progress.`,
      );
    }

    // Create IngestionRun record
    const run = await this.prisma.ingestionRun.create({
      data: {
        pipeline: pipelineType,
        trigger,
      },
    });

    this.logger.log(
      `Starting ${pipelineType} pipeline (run: ${run.id}, trigger: ${trigger})`,
    );

    // Fire and forget — run in background
    this.activePipelines.add(pipelineType);
    pipeline
      .run(concurrency ? { concurrency } : undefined)
      .then(async (result) => {
        await this.prisma.ingestionRun.update({
          where: { id: run.id },
          data: {
            totalFiles: result.totalFiles,
            processedFiles: result.processedFiles,
            skippedFiles: result.skippedFiles,
            errorFiles: result.errorFiles,
            totalChunks: result.totalChunks,
            durationMs: result.durationMs,
            completedAt: new Date(),
          },
        });
        this.logger.log(`Pipeline ${pipelineType} (run: ${run.id}) completed`);
      })
      .catch(async (err) => {
        this.logger.error(`Pipeline ${pipelineType} (run: ${run.id}) failed`, err);
        await this.prisma.ingestionRun.update({
          where: { id: run.id },
          data: { completedAt: new Date() },
        });
      })
      .finally(() => {
        this.activePipelines.delete(pipelineType);
      });

    return {
      runId: run.id,
      message: `Pipeline "${pipelineType}" started. Check /api/ingest/status?pipeline=${pipelineType} for progress.`,
    };
  }

  isRunning(pipelineType: string): boolean {
    return this.activePipelines.has(pipelineType);
  }

  async getStatus(pipelineType?: string) {
    const where = pipelineType ? { pipeline: pipelineType } : {};

    const [records, runs] = await Promise.all([
      this.prisma.ingestionRecord.groupBy({
        by: ['pipeline', 'status'],
        _count: { id: true },
        _sum: { chunks: true },
        where,
      }),
      this.prisma.ingestionRun.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take: 5,
      }),
    ]);

    // Reshape records into per-pipeline summary
    const pipelines: Record<
      string,
      { total: number; done: number; error: number; processing: number; chunks: number }
    > = {};

    for (const row of records) {
      if (!pipelines[row.pipeline]) {
        pipelines[row.pipeline] = {
          total: 0,
          done: 0,
          error: 0,
          processing: 0,
          chunks: 0,
        };
      }
      const p = pipelines[row.pipeline];
      p.total += row._count.id;
      p.chunks += row._sum.chunks ?? 0;
      if (row.status === 'done') p.done += row._count.id;
      else if (row.status === 'error') p.error += row._count.id;
      else p.processing += row._count.id;
    }

    return {
      pipelines,
      recentRuns: runs,
      active: [...this.activePipelines],
    };
  }

  getAvailableTypes(): string[] {
    return this.registry.listTypes();
  }

  getUploadDir(): string {
    return this.uploadDir;
  }
}
