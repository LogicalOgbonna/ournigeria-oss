import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { Neo4jService } from "../neo4j.service";
import { ChunkReader } from "./chunk-reader";
import { MetadataGraphBuilder } from "./metadata-graph-builder";
import { RelationshipExtractor } from "./relationship-extractor";
import { getSettingNumber } from "../../config/settings-store";

const DOMAINS = ["budget", "corruption", "govspend", "faac"] as const;
type Domain = (typeof DOMAINS)[number];

const DOMAIN_TABLE_MAP: Record<Domain, string> = {
  budget: "budget_chunks",
  corruption: "corruption_chunks",
  govspend: "govspend_chunks",
  faac: "faac_chunks",
};

const BATCH_SIZE = 50;

export interface BackfillStatus {
  id: string;
  domain: string;
  pass: number;
  status: string;
  chunksTotal: number;
  chunksProcessed: number;
  costUsd: number;
  lastChunkId: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
}

@Injectable()
export class BackfillService implements OnModuleInit {
  private readonly logger = new Logger(BackfillService.name);
  private readonly runningJobs = new Map<string, { paused: boolean }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly neo4j: Neo4jService,
    private readonly chunkReader: ChunkReader,
    private readonly metadataBuilder: MetadataGraphBuilder,
    private readonly relationshipExtractor: RelationshipExtractor,
  ) {}

  async onModuleInit(): Promise<void> {
    // Delay to let Neo4j connection stabilize
    await new Promise((r) => setTimeout(r, 2000));

    if (!this.neo4j.enabled) {
      this.logger.warn("Neo4j not connected — skipping orphaned job recovery");
      return;
    }

    const orphaned = await this.prisma.graphExtractionJob.findMany({
      where: { status: "running" },
    });

    if (orphaned.length === 0) return;

    // Mark all orphaned jobs as paused so startBackfill can resume them
    await this.prisma.graphExtractionJob.updateMany({
      where: { status: "running" },
      data: { status: "paused" },
    });

    const toResume = new Map<string, { pass: 1 | 2; domain: string }>();
    for (const job of orphaned) {
      const key = `${job.domain}-${job.pass}`;
      if (!toResume.has(key)) {
        toResume.set(key, { pass: job.pass as 1 | 2, domain: job.domain });
      }
      this.logger.log(
        `Detected orphaned job ${job.id} (${job.domain} pass ${job.pass}), will resume...`,
      );
    }

    for (const { pass, domain } of toResume.values()) {
      this.startBackfill(pass, domain).catch((err) => {
        this.logger.error(`Failed to auto-resume ${domain} pass ${pass}: ${err}`);
      });
    }
  }

  async startBackfill(
    pass: 1 | 2,
    domain?: string,
  ): Promise<{ jobIds: string[] }> {
    if (!this.neo4j.enabled) {
      throw new Error("Neo4j is not connected — cannot start backfill");
    }

    const domains = domain
      ? [domain as Domain]
      : [...DOMAINS];

    const jobIds: string[] = [];

    for (const d of domains) {
      if (!DOMAIN_TABLE_MAP[d]) {
        throw new Error(`Invalid domain: ${d}`);
      }

      // Check for running job
      const existing = await this.prisma.graphExtractionJob.findFirst({
        where: { domain: d, pass, status: "running" },
      });
      if (existing) {
        this.logger.warn(`Job already running for ${d} pass ${pass}`);
        jobIds.push(existing.id);
        continue;
      }

      // Get total chunk count
      const total = await this.chunkReader.countChunks(DOMAIN_TABLE_MAP[d]);

      // Check for paused job to resume
      const paused = await this.prisma.graphExtractionJob.findFirst({
        where: { domain: d, pass, status: "paused" },
      });

      let job;
      if (paused) {
        job = await this.prisma.graphExtractionJob.update({
          where: { id: paused.id },
          data: { status: "running", startedAt: new Date() },
        });
      } else {
        job = await this.prisma.graphExtractionJob.create({
          data: {
            domain: d,
            pass,
            status: "running",
            chunksTotal: total,
            chunksProcessed: 0,
            costUsd: 0,
            startedAt: new Date(),
          },
        });
      }

      jobIds.push(job.id);
      this.runningJobs.set(job.id, { paused: false });

      // Run async — don't await
      this.runJob(job.id, d, pass, job.lastChunkId).catch((err) => {
        this.logger.error(`Job ${job.id} crashed: ${err}`);
      });
    }

    return { jobIds };
  }

  async pauseBackfill(jobId?: string): Promise<void> {
    if (jobId) {
      const state = this.runningJobs.get(jobId);
      if (state) state.paused = true;
      await this.prisma.graphExtractionJob.update({
        where: { id: jobId },
        data: { status: "paused" },
      });
      return;
    }
    // Pause in-memory jobs
    for (const [, state] of this.runningJobs) {
      state.paused = true;
    }
    // Pause all running jobs in DB (covers orphaned jobs after restart)
    await this.prisma.graphExtractionJob.updateMany({
      where: { status: "running" },
      data: { status: "paused" },
    });
  }

  async getStatus(): Promise<BackfillStatus[]> {
    const jobs = await this.prisma.graphExtractionJob.findMany({
      orderBy: [{ domain: "asc" }, { pass: "asc" }, { createdAt: "desc" }],
    });
    return jobs.map((j) => ({
      id: j.id,
      domain: j.domain,
      pass: j.pass,
      status: j.status,
      chunksTotal: j.chunksTotal,
      chunksProcessed: j.chunksProcessed,
      costUsd: j.costUsd,
      lastChunkId: j.lastChunkId,
      startedAt: j.startedAt,
      completedAt: j.completedAt,
      errorLog: j.errorLog ?? [],
    }));
  }

  private async runJob(
    jobId: string,
    domain: Domain,
    pass: 1 | 2,
    lastChunkId: string | null,
  ): Promise<void> {
    const table = DOMAIN_TABLE_MAP[domain];
    let cursor = lastChunkId ?? undefined;

    // When resuming, carry forward previous progress
    const existingJob = await this.prisma.graphExtractionJob.findUnique({
      where: { id: jobId },
    });
    let totalProcessed = existingJob?.chunksProcessed ?? 0;
    let totalCost = existingJob?.costUsd ?? 0;
    const errorLog: Array<{ chunk_id: string; error: string; ts: string }> = [];

    const costLimit = getSettingNumber(
      "graph.extraction_cost_limit_usd",
      "GRAPH_EXTRACTION_COST_LIMIT",
      500,
    );
    const concurrency = getSettingNumber(
      "graph.extraction_concurrency",
      "GRAPH_EXTRACTION_CONCURRENCY",
      10,
    );

    this.logger.log(`Starting ${domain} pass ${pass} from cursor=${cursor ?? "start"}`);

    try {
      while (true) {
        const jobState = this.runningJobs.get(jobId);
        if (!jobState || jobState.paused) {
          this.logger.log(`Job ${jobId} paused`);
          break;
        }

        // Cost ceiling check (Pass 2 only)
        if (pass === 2 && totalCost >= costLimit) {
          this.logger.warn(
            `Cost ceiling hit ($${totalCost.toFixed(2)} >= $${costLimit}). Pausing job ${jobId}.`,
          );
          await this.prisma.graphExtractionJob.update({
            where: { id: jobId },
            data: {
              status: "paused",
              costUsd: totalCost,
              errorLog: [...errorLog, { chunk_id: "", error: "Cost ceiling hit", ts: new Date().toISOString() }] as any,
            },
          });
          this.runningJobs.delete(jobId);
          return;
        }

        const chunks =
          pass === 1
            ? await this.chunkReader.readChunks(table, cursor, BATCH_SIZE)
            : await this.chunkReader.readChunksWithText(table, cursor, BATCH_SIZE);

        if (chunks.length === 0) {
          // Done
          await this.prisma.graphExtractionJob.update({
            where: { id: jobId },
            data: {
              status: "completed",
              completedAt: new Date(),
              chunksProcessed: totalProcessed,
              costUsd: totalCost,
              errorLog: errorLog as any,
            },
          });
          this.runningJobs.delete(jobId);
          this.logger.log(
            `Job ${jobId} completed: ${totalProcessed} chunks, $${totalCost.toFixed(2)}`,
          );
          return;
        }

        try {
          if (pass === 1) {
            const result = await this.metadataBuilder.buildFromMetadata(
              domain,
              chunks,
            );
            if (result.errors.length > 0) {
              for (const err of result.errors) {
                errorLog.push({
                  chunk_id: "batch",
                  error: err,
                  ts: new Date().toISOString(),
                });
              }
            }
          } else {
            const { results, totalTokens } =
              await this.relationshipExtractor.extractBatch(
                chunks,
                domain,
                concurrency,
              );

            // Approximate cost: $3/1M input + $15/1M output for GPT-4o-mini
            const estimatedCost = (totalTokens / 1_000_000) * 3;
            totalCost += estimatedCost;

            for (const r of results) {
              if (!r.success && r.error) {
                errorLog.push({
                  chunk_id: r.chunkId,
                  error: r.error,
                  ts: new Date().toISOString(),
                });
              }
            }
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          this.logger.error(`Batch error for ${domain} pass ${pass}: ${msg}`);
          errorLog.push({
            chunk_id: "batch",
            error: msg,
            ts: new Date().toISOString(),
          });
          // Continue to next batch
        }

        totalProcessed += chunks.length;
        cursor = String(chunks[chunks.length - 1].id);

        // Update checkpoint
        await this.prisma.graphExtractionJob.update({
          where: { id: jobId },
          data: {
            lastChunkId: cursor,
            chunksProcessed: totalProcessed,
            costUsd: totalCost,
          },
        });

        // Rate limit for Pass 2
        if (pass === 2) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Job ${jobId} failed: ${msg}`);
      await this.prisma.graphExtractionJob.update({
        where: { id: jobId },
        data: {
          status: "error",
          errorLog: [...errorLog, { chunk_id: "", error: msg, ts: new Date().toISOString() }] as any,
        },
      });
      this.runningJobs.delete(jobId);
    }
  }
}
