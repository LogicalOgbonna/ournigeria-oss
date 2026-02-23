import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createOpenAI } from '@ai-sdk/openai';
import { PgVector } from '@mastra/pg';
import { embedMany } from 'ai';

@Injectable()
export class VectorService implements OnModuleDestroy {
  private readonly logger = new Logger(VectorService.name);
  private pgVector: PgVector;
  private embeddingModel: ReturnType<ReturnType<typeof createOpenAI>['embedding']>;
  private embeddingDimension: number;

  constructor(private config: ConfigService) {
    this.pgVector = new PgVector({
      id: 'ingest-vectors',
      connectionString: this.config.getOrThrow<string>('DATABASE_URL'),
    });

    const timeoutMs = 5 * 60 * 1000;
    const fetchWithTimeout: typeof globalThis.fetch = (input, init) =>
      globalThis.fetch(input, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });

    const provider = createOpenAI({
      baseURL: this.config.getOrThrow<string>('EMBEDDING_BASE_URL'),
      apiKey: this.config.getOrThrow<string>('EMBEDDING_API_KEY'),
      fetch: fetchWithTimeout,
    });

    this.embeddingModel = provider.embedding(
      this.config.getOrThrow<string>('EMBEDDING_MODEL'),
    );
    this.embeddingDimension = this.config.getOrThrow<number>('EMBEDDING_DIMENSION');
  }

  async ensureIndex(indexName: string): Promise<void> {
    try {
      await this.pgVector.createIndex({
        indexName,
        dimension: this.embeddingDimension,
        metric: 'cosine',
        vectorType: 'halfvec',
        indexConfig: { type: 'hnsw' },
      });
      this.logger.log(`Index "${indexName}" created`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('already exists')) {
        this.logger.log(`Index "${indexName}" already exists, continuing`);
      } else {
        throw err;
      }
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const { embeddings: raw } = await embedMany({
      model: this.embeddingModel,
      values: texts,
    });

    return raw.map((e) =>
      e.length > this.embeddingDimension
        ? e.slice(0, this.embeddingDimension)
        : e,
    );
  }

  async upsert(
    indexName: string,
    vectors: number[][],
    metadata: Record<string, unknown>[],
  ): Promise<void> {
    await this.pgVector.upsert({
      indexName,
      vectors,
      metadata,
    });
  }

  async onModuleDestroy() {
    await this.pgVector.disconnect();
  }
}
