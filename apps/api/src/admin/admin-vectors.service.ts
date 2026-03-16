import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@ournigeria/database";
import { embed } from "ai";
import {
  getPgVector,
  embeddingModelInstance,
  RAG_CONFIG,
  truncateEmbedding,
} from "../mastra/rag/config";

const INDEX_MAP: Record<
  string,
  { envVar: string; label: string; groupKey: string }
> = {
  budget: { envVar: "VECTOR_INDEX_BUDGET", label: "Budget", groupKey: "state" },
  corruption: {
    envVar: "VECTOR_INDEX_CORRUPTION",
    label: "Corruption",
    groupKey: "official",
  },
  govspend: {
    envVar: "VECTOR_INDEX_GOVSPEND",
    label: "GovSpend",
    groupKey: "organization_name",
  },
  faac: {
    envVar: "VECTOR_INDEX_FAAC",
    label: "FAAC",
    groupKey: "state",
  },
};

const ALLOWED_INDEX_KEYS = new Set(Object.keys(INDEX_MAP));

@Injectable()
export class AdminVectorsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private resolveTableName(key: string): string {
    if (!ALLOWED_INDEX_KEYS.has(key)) {
      throw new BadRequestException(`Invalid index key: ${key}`);
    }
    const table = this.configService.get<string>(INDEX_MAP[key].envVar);
    if (!table || !/^[a-z_][a-z0-9_]*$/i.test(table)) {
      throw new BadRequestException(`Invalid table name for index: ${key}`);
    }
    return table;
  }

  listIndexes() {
    return Object.entries(INDEX_MAP).map(([key, val]) => ({
      key,
      label: val.label,
      groupKey: val.groupKey,
    }));
  }

  /**
   * Run a query inside a transaction with statement_timeout so PostgreSQL
   * itself aborts long-running queries (freeing the connection).
   */
  private async timedQuery<T>(
    label: string,
    sql: string,
    fallback: T,
    params: unknown[] = [],
    timeoutMs = 30_000,
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          await tx.$executeRawUnsafe(
            `SET LOCAL statement_timeout = '${timeoutMs}'`,
          );
          return tx.$queryRawUnsafe<T>(sql, ...params);
        },
        { timeout: timeoutMs + 5_000 },
      );
    } catch (err: any) {
      console.warn(`vectors-stats query "${label}" failed:`, err.message);
      return fallback;
    }
  }

  async getStats(indexKey: string) {
    const table = this.resolveTableName(indexKey);
    const { groupKey } = INDEX_MAP[indexKey];

    // All lightweight catalog queries (no table scan) — run in parallel
    const [sizeRows, columnRows, indexRows, estimateRows] = await Promise.all([
      this.timedQuery<
        { total: bigint; table_size: bigint; index_size: bigint }[]
      >(
        "sizes",
        `SELECT
          pg_total_relation_size('"${table}"') AS total,
          pg_relation_size('"${table}"') AS table_size,
          pg_indexes_size('"${table}"') AS index_size`,
        [{ total: BigInt(0), table_size: BigInt(0), index_size: BigInt(0) }],
        [],
        10_000,
      ),
      this.timedQuery<{ udt_name: string }[]>(
        "vectorColumnInfo",
        `SELECT udt_name FROM information_schema.columns
         WHERE table_name = $1 AND column_name = 'embedding'`,
        [],
        [table],
        10_000,
      ),
      this.timedQuery<{ index_name: string; am_name: string }[]>(
        "indexMethod",
        `SELECT ic.relname AS index_name, am.amname AS am_name
         FROM pg_index i
         JOIN pg_class tc ON tc.oid = i.indrelid
         JOIN pg_class ic ON ic.oid = i.indexrelid
         JOIN pg_am am ON am.oid = ic.relam
         WHERE tc.relname = $1`,
        [],
        [table],
        10_000,
      ),
      // Fast approximate row count from pg_class (no table scan)
      this.timedQuery<{ estimate: number }[]>(
        "rowEstimate",
        `SELECT reltuples::bigint AS estimate FROM pg_class WHERE relname = $1`,
        [{ estimate: 0 }],
        [table],
        10_000,
      ),
    ]);

    // Single heavy query: distribution gives us per-group chunks + documents
    // We derive totalDocuments from the sum, avoiding a separate full scan
    const distribution = await this.timedQuery<
      { key: string; chunks: bigint; documents: bigint }[]
    >(
      "distribution",
      `SELECT
        key,
        SUM(chunks) AS chunks,
        COUNT(s3_key) AS documents
       FROM (
         SELECT
           COALESCE(metadata->>'${groupKey}', 'unknown') AS key,
           metadata->>'s3_key' AS s3_key,
           COUNT(*) AS chunks
         FROM "${table}"
         GROUP BY 1, 2
       ) sub
       GROUP BY key
       ORDER BY chunks DESC`,
      [],
      [],
      60_000,
    );

    // Derive totals from distribution to avoid extra full-table scans
    let totalChunks = 0;
    let totalDocuments = 0;
    const dist = distribution.map((r) => {
      const chunks = Number(r.chunks);
      const documents = Number(r.documents);
      totalChunks += chunks;
      totalDocuments += documents;
      return { key: r.key, chunks, documents };
    });

    // Fall back to pg_class estimate if distribution query failed
    if (totalChunks === 0) {
      totalChunks = Number(estimateRows[0]?.estimate ?? 0);
    }

    const totalBytes = Number(sizeRows[0]?.total ?? 0);
    const tableBytes = Number(sizeRows[0]?.table_size ?? 0);
    const indexBytes = Number(sizeRows[0]?.index_size ?? 0);
    const vectorType = columnRows[0]?.udt_name ?? "unknown";
    const indexMethod = indexRows[0]?.am_name ?? "unknown";
    const indexName = indexRows[0]?.index_name ?? "";

    const embeddingModel =
      this.configService.get<string>("EMBEDDING_MODEL") ?? "unknown";
    const dimensions =
      this.configService.get<number>("EMBEDDING_DIMENSION") ?? 0;

    return {
      totalChunks,
      totalDocuments,
      totalSize: formatBytes(totalBytes),
      tableSize: formatBytes(tableBytes),
      indexSize: formatBytes(indexBytes),
      embeddingModel,
      dimensions,
      vectorType,
      indexMethod,
      indexName,
      tableName: table,
      groupKey,
      distribution: dist,
    };
  }

  async getSamples(indexKey: string, limit: number) {
    const table = this.resolveTableName(indexKey);
    const safeLimit = Math.min(Math.max(1, limit), 20);

    const rows = await this.prisma.$queryRawUnsafe<
      { id: string; metadata: any; content: string }[]
    >(
      `SELECT id, metadata, content FROM "${table}" ORDER BY RANDOM() LIMIT $1`,
      safeLimit,
    );

    return rows.map((r) => ({
      id: r.id,
      metadata: r.metadata,
      content: typeof r.content === "string" ? r.content.slice(0, 300) : "",
    }));
  }

  async search(indexKey: string, query: string, topK: number) {
    const table = this.resolveTableName(indexKey);
    const safeTopK = Math.min(Math.max(1, topK), 50);

    const { embedding } = await embed({
      model: embeddingModelInstance,
      value: query,
    });

    const queryResults = await getPgVector().query({
      indexName: table,
      queryVector: truncateEmbedding(embedding),
      topK: safeTopK,
      ef: RAG_CONFIG.searchEf,
    });

    return queryResults.map((r) => ({
      id: r.id ?? "",
      score: r.score,
      content: (r.metadata?.text as string) ?? "",
      file:
        (r.metadata?.s3_key as string) ??
        (r.metadata?.filename as string) ??
        "",
      metadata: Object.fromEntries(
        Object.entries(r.metadata ?? {}).filter(
          ([k]) => k !== "text" && k !== "embedding",
        ),
      ),
    }));
  }

  async getDocuments(indexKey: string, groupValue: string) {
    const table = this.resolveTableName(indexKey);
    const { groupKey } = INDEX_MAP[indexKey];

    // Using parameterized query to avoid SQL injection on groupValue
    // NOTE: table and groupKey are safe as they come from INDEX_MAP
    const sql = `
      SELECT
        metadata->>'s3_key' AS s3_key,
        MAX(metadata->>'filename') AS filename,
        COUNT(*) AS chunks
      FROM "${table}"
      WHERE COALESCE(metadata->>'${groupKey}', 'unknown') = $1
      GROUP BY 1
      ORDER BY chunks DESC
      LIMIT 100
    `;

    // Use timedQuery to avoid holding the connection forever on slow full table scans
    const rows = await this.timedQuery<
      { s3_key: string; filename: string; chunks: bigint }[]
    >("getDocuments", sql, [], [groupValue], 25_000);

    return rows.map((r) => ({
      s3Key: r.s3_key,
      filename: r.filename || r.s3_key || "Unknown",
      chunks: Number(r.chunks),
    }));
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
