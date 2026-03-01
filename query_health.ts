import { embed } from "ai";
import {
  getPgVector,
  embeddingModelInstance,
  RAG_CONFIG,
  truncateEmbedding,
} from "./apps/api/src/mastra/rag/config";
import * as dotenv from "dotenv";

dotenv.config({ path: "./apps/api/.env" });

async function main() {
  const states = ["Taraba", "Yobe", "Adamawa", "Bauchi", "Borno", "Gombe"];
  const year = 2025;
  const query = "health sector expenditures secondary tertiary health care";

  const { embedding } = await embed({
    model: embeddingModelInstance,
    value: query,
  });

  const vector = getPgVector();
  const truncated = truncateEmbedding(embedding);

  for (const state of states) {
    const results = await vector.query({
      indexName: RAG_CONFIG.indexName,
      queryVector: truncated,
      topK: 10,
      filter: {
        $and: [{ state: { $eq: state } }, { year: { $eq: year } }],
      },
    });

    console.log(`\n\n--- STATE: ${state} ---`);
    if (!results || results.length === 0) {
      console.log("No results.");
      continue;
    }

    for (const r of results) {
      console.log(`Score: ${r.score} | File: ${r.metadata?.filename}`);
      console.log(r.metadata?.text);
      console.log("-".repeat(40));
    }
  }
}

main().catch(console.error);
