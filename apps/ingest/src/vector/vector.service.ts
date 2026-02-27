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

    const timeoutMs = 2 * 60 * 1000;
    const fetchWithTimeout: typeof globalThis.fetch = async (input, init) => {
      // Strip encoding_format from embedding requests (Voyage AI rejects 'float')
      if (init?.body && typeof init.body === 'string') {
        try {
          const parsed = JSON.parse(init.body);
          if (parsed.encoding_format) {
            delete parsed.encoding_format;
            init = { ...init, body: JSON.stringify(parsed) };
          }
        } catch {}
      }
      const resp = await globalThis.fetch(input, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });
      // Patch Voyage AI response to match OpenAI schema (add prompt_tokens)
      if (resp.ok && String(input).includes('/embeddings')) {
        const body = await resp.json();
        if (body.usage && body.usage.prompt_tokens === undefined) {
          body.usage.prompt_tokens = body.usage.total_tokens ?? 0;
        }
        return new Response(JSON.stringify(body), {
          status: resp.status,
          headers: resp.headers,
        });
      }
      return resp;
    };

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

  private async withRetry<T>(
    fn: () => Promise<T>,
    label: string,
    maxRetries = 3,
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        if (attempt === maxRetries) throw err;
        const delayMs = Math.min(1000 * 2 ** (attempt - 1), 30_000);
        this.logger.warn(
          `${label} attempt ${attempt}/${maxRetries} failed, retrying in ${delayMs}ms...`,
        );
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    throw new Error('unreachable');
  }

  async ensureIndex(indexName: string): Promise<void> {
    try {
      await this.pgVector.createIndex({
        indexName,
        dimension: this.embeddingDimension,
        metric: 'cosine',
        vectorType: 'halfvec',
        indexConfig: {
          type: 'hnsw',
          hnsw: { m: 16, efConstruction: 128 },
        },
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
    return this.withRetry(async () => {
      const { embeddings: raw } = await embedMany({
        model: this.embeddingModel,
        values: texts,
      });

      return raw.map((e) =>
        e.length > this.embeddingDimension
          ? e.slice(0, this.embeddingDimension)
          : e,
      );
    }, 'embedBatch');
  }

  async upsert(
    indexName: string,
    vectors: number[][],
    metadata: Record<string, unknown>[],
  ): Promise<void> {
    await this.withRetry(
      () => this.pgVector.upsert({ indexName, vectors, metadata }),
      'upsert',
    );
  }

  async onModuleDestroy() {
    await this.pgVector.disconnect();
  }
}
