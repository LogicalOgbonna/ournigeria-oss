import { RAG_CONFIG, truncateEmbedding } from "./config";
import { getSharedPool } from "./db-pool";

interface MastraFilter {
  $and?: Array<Record<string, { $eq: string | number | boolean }>>;
}

interface HybridSearchParams {
  indexName: string;
  query: string;
  queryVector: number[];
  topK: number;
  filter?: MastraFilter;
  ef?: number;
}

export interface HybridResult {
  metadata?: Record<string, unknown>;
  score: number;
}

const RRF_K = 60;

function buildFilterWhereClause(
  filter: MastraFilter | undefined,
  paramOffset: number,
): { clause: string; values: (string | number | boolean)[] } {
  if (!filter?.$and || filter.$and.length === 0) {
    return { clause: "", values: [] };
  }

  const conditions: string[] = [];
  const values: (string | number | boolean)[] = [];

  for (const condition of filter.$and) {
    for (const [key, op] of Object.entries(condition)) {
      if ("$eq" in op) {
        paramOffset++;
        const val = op.$eq;
        if (typeof val === "number") {
          conditions.push(
            `(metadata->>'${key}')::numeric = $${paramOffset}`,
          );
        } else if (typeof val === "boolean") {
          conditions.push(
            `(metadata->>'${key}')::boolean = $${paramOffset}`,
          );
        } else {
          conditions.push(`metadata->>'${key}' = $${paramOffset}`);
        }
        values.push(val);
      }
    }
  }

  return {
    clause: conditions.length > 0 ? " AND " + conditions.join(" AND ") : "",
    values,
  };
}

/**
 * Direct pgvector similarity search — replaces the Mastra PgVector.query() call.
 * Queries the pgvector table directly using SQL with cosine distance operator.
 */
async function vectorSearch(
  indexName: string,
  queryVector: number[],
  topK: number,
  filter?: MastraFilter,
  ef?: number,
): Promise<HybridResult[]> {
  if (!indexName) {
    console.warn("[hybrid-search] Vector search skipped: no index name provided");
    return [];
  }

  try {
    const pool = getSharedPool();

    // Set ef_search for HNSW index if provided
    if (ef) {
      await pool.query(`SET LOCAL hnsw.ef_search = ${Math.min(ef, 1000)}`);
    }

    const truncatedVector = truncateEmbedding(queryVector);
    const vectorStr = `[${truncatedVector.join(",")}]`;

    const { clause, values } = buildFilterWhereClause(filter, 1);

    const sql = `
      SELECT id, metadata, 1 - (embedding <=> $1::vector) AS score
      FROM "${indexName}"
      WHERE 1=1
        ${clause}
      ORDER BY embedding <=> $1::vector
      LIMIT ${topK}
    `;

    const result = await pool.query(sql, [vectorStr, ...values]);

    return result.rows.map(
      (row: { metadata: Record<string, unknown>; score: number }) => ({
        metadata: row.metadata,
        score: row.score,
      }),
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[hybrid-search] Vector search failed for index '${indexName}': ${errorMsg}`);
    return [];
  }
}

export async function hybridSearch(
  params: HybridSearchParams,
): Promise<HybridResult[]> {
  if (!RAG_CONFIG.hybridSearch.enabled) {
    return vectorSearch(
      params.indexName,
      truncateEmbedding(params.queryVector),
      params.topK,
      params.filter,
      params.ef,
    );
  }

  const vectorFetchK = params.topK * 2;

  // Run vector search and BM25 search in parallel
  const [vectorResults, bm25Results] = await Promise.all([
    vectorSearch(
      params.indexName,
      truncateEmbedding(params.queryVector),
      vectorFetchK,
      params.filter,
      params.ef,
    ),
    runBm25Search(
      params.indexName,
      params.query,
      params.topK * 2,
      params.filter,
    ),
  ]);

  return rrfMerge(vectorResults, bm25Results, params.topK);
}

async function runBm25Search(
  indexName: string,
  query: string,
  topK: number,
  filter?: MastraFilter,
): Promise<HybridResult[]> {
  if (!indexName) {
    console.warn("[hybrid-search] BM25 skipped: no index name provided");
    return [];
  }
  try {
    const { clause, values } = buildFilterWhereClause(filter, 2);

    const sql = `
      SELECT id, metadata, ts_rank_cd(tsv, plainto_tsquery('english', $1)) AS bm25_score
      FROM "${indexName}"
      WHERE tsv @@ plainto_tsquery('english', $1)
        ${clause}
      ORDER BY bm25_score DESC
      LIMIT $2
    `;

    const result = await getSharedPool().query(sql, [query, topK, ...values]);

    return result.rows.map(
      (row: { metadata: Record<string, unknown>; bm25_score: number }) => ({
        metadata: row.metadata,
        score: row.bm25_score,
      }),
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[hybrid-search] BM25 search failed for index '${indexName}', query '${query.slice(0, 50)}': ${errorMsg}`);
    return [];
  }
}

function getDocId(result: HybridResult): string {
  const filename = (result.metadata?.filename as string) ?? "";
  const chunkIndex = result.metadata?.chunk_index;
  if (filename && chunkIndex !== undefined) {
    return `${filename}#${chunkIndex}`;
  }
  // Fallback for chunks without filename/chunk_index metadata
  const text = (result.metadata?.text as string) ?? "";
  return text.slice(0, 200);
}

export function rrfMerge(
  vectorResults: HybridResult[],
  bm25Results: HybridResult[],
  topK: number,
): HybridResult[] {
  const scoreMap = new Map<
    string,
    { result: HybridResult; rrfScore: number }
  >();

  // Score from vector results
  for (let rank = 0; rank < vectorResults.length; rank++) {
    const r = vectorResults[rank];
    const id = getDocId(r);
    const rrfScore = 1 / (RRF_K + rank + 1);
    scoreMap.set(id, { result: r, rrfScore });
  }

  // Score from BM25 results
  for (let rank = 0; rank < bm25Results.length; rank++) {
    const r = bm25Results[rank];
    const id = getDocId(r);
    const rrfScore = 1 / (RRF_K + rank + 1);
    const existing = scoreMap.get(id);
    if (existing) {
      existing.rrfScore += rrfScore;
    } else {
      scoreMap.set(id, { result: r, rrfScore });
    }
  }

  return Array.from(scoreMap.values())
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, topK)
    .map((entry) => ({
      ...entry.result,
      score: entry.rrfScore,
    }));
}
