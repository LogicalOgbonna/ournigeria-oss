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
    const dbUrl = this.config.get<string>('DATABASE_URL');

    this.pgVector = new PgVector({
      id: 'ingest-vectors',
      connectionString: dbUrl,
    });

    const embeddingBaseUrl =
      this.config.get<string>('EMBEDDING_BASE_URL') || 'https://api.openai.com/v1';
    const embeddingModelName =
      this.config.get<string>('EMBEDDING_MODEL') || 'text-embedding-3-large';
    const embeddingApiKey =
      this.config.get<string>('EMBEDDING_API_KEY') ||
      this.config.get<string>('LLM_API_KEY') ||
      'ollama';

    const timeoutMs = 5 * 60 * 1000;
    const fetchWithTimeout: typeof globalThis.fetch = (input, init) =>
      globalThis.fetch(input, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });

    const provider = createOpenAI({
      baseURL: embeddingBaseUrl,
      apiKey: embeddingApiKey,
      fetch: fetchWithTimeout,
    });

    this.embeddingModel = provider.embedding(embeddingModelName);
    this.embeddingDimension = 3072; // text-embedding-3-large default
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
