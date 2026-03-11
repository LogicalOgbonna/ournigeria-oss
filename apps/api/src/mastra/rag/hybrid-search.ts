import { getPgVector, RAG_CONFIG, truncateEmbedding } from "./config";
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

interface HybridResult {
  metadata?: Record<string, unknown>;
  score: number;
}

const RRF_K = 60;

function buildBm25WhereClause(
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

export async function hybridSearch(
  params: HybridSearchParams,
): Promise<HybridResult[]> {
  if (!RAG_CONFIG.hybridSearch.enabled) {
    return getPgVector().query({
      indexName: params.indexName,
      queryVector: truncateEmbedding(params.queryVector),
      topK: params.topK,
      filter: params.filter as any,
      ef: params.ef,
    });
  }

  const vectorFetchK = params.topK * 2;

  // Run vector search and BM25 search in parallel
  const [vectorResults, bm25Results] = await Promise.all([
    getPgVector().query({
      indexName: params.indexName,
      queryVector: truncateEmbedding(params.queryVector),
      topK: vectorFetchK,
      filter: params.filter as any,
      ef: params.ef,
    }),
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
  try {
    const { clause, values } = buildBm25WhereClause(filter, 2);

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
    console.warn("[hybrid-search] BM25 search failed, using vector only:", err);
    return [];
  }
}

function getDocId(result: HybridResult): string {
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
