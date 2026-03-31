import { RAG_CONFIG } from "./config";

interface RerankableResult {
  text: string;
  score: number;
  [key: string]: unknown;
}

interface VoyageRerankResponse {
  data: Array<{ index: number; relevance_score: number }>;
  usage: { total_tokens: number };
}

export async function rerankResults<T extends RerankableResult>(
  query: string,
  results: T[],
  topN?: number,
): Promise<T[]> {
  if (!RAG_CONFIG.rerank.enabled || results.length === 0) {
    return results;
  }

  const finalTopN = topN ?? (RAG_CONFIG.rerank.topN || results.length);

  try {
    const documents = results.map((r) => r.text);

    const response = await fetch("https://api.voyageai.com/v1/rerank", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RAG_CONFIG.rerank.apiKey}`,
      },
      body: JSON.stringify({
        query,
        documents,
        model: RAG_CONFIG.rerank.model,
        top_k: finalTopN,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.warn(
        `[rerank] Voyage API returned ${response.status}, falling back to original order`,
      );
      return results.slice(0, finalTopN);
    }

    const body = (await response.json()) as VoyageRerankResponse;

    return body.data.map((item) => ({
      ...results[item.index],
      score: item.relevance_score,
    }));
  } catch (err) {
    console.warn("[rerank] Rerank failed, falling back to original order:", err);
    return results.slice(0, finalTopN);
  }
}
