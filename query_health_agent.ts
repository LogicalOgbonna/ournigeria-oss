import { budgetSearchTool } from "./apps/api/src/mastra/tools/budget-search";
import * as dotenv from "dotenv";

dotenv.config({ path: "./apps/api/.env" });

async function main() {
  const query = "Which North-East states spend the most on health in 2025?";

  // North East states: Adamawa, Bauchi, Borno, Gombe, Taraba, Yobe
  const states = ["Taraba", "Yobe", "Adamawa", "Bauchi", "Borno", "Gombe"];

  for (const state of states) {
    console.log(`\n\n=== Fetching for ${state} ===`);
    const result = await budgetSearchTool.execute(
      {
        context: {},
        suspend: async () => {},
      },
      {
        query: "total health budget allocation expenditure",
        state: state,
        year: 2025,
        topK: 15,
      },
    );

    console.log(`Found ${result.totalResults} results.`);
    for (const r of result.results.slice(0, 5)) {
      console.log(`Score: ${r.score} | File: ${r.filename}`);
      console.log(r.text.substring(0, 200).replace(/\n/g, " ") + "...");
    }
  }
}

main().catch(console.error);
