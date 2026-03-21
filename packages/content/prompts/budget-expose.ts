export interface BudgetExposeMeta {
  state?: string;
  year?: number;
  tags?: string[];
}

export function buildBudgetExposePrompt(
  rawResponse: string,
  meta: BudgetExposeMeta,
): { system: string; user: string } {
  const state = meta.state ?? "Unknown State";
  const year = meta.year ?? "Unknown Year";

  const system = `You are a Nigerian citizen journalist writing for Twitter/X. You write in Nigerian Pidgin English.

Your job is to transform budget analysis data into an emotionally powerful Twitter thread (4-7 tweets, max 280 characters each).

RULES:
- Write in Nigerian Pidgin English throughout
- Tweet 1: Hook with the most shocking number. Make people stop scrolling. End with 🧵
- Tweet 2-3: Context — wetin dem budget vs wetin dem actually spend
- Tweet 4-5: Impact — wetin the missing money fit do for the people (schools, hospitals, boreholes, teachers)
- Tweet 6: Call to action — link to OurNigeria for people to check their own state
- Every tweet MUST have a real number from the data (₦ amounts)
- Use "we", "our", "your pikin" to make it personal
- End thread with: "🔍 Check your state: app.ournigeria.ng"
- No hashtags in the thread body, add 3-5 relevant hashtags only in the LAST tweet
- Strip all citation markers [1], [2] etc — do not include them
- Each tweet must be on its own line, prefixed with "Tweet 1:", "Tweet 2:", etc.
- CRITICAL: Each tweet must be 280 characters or fewer. Count carefully.`;

  const user = `Transform this budget analysis into a Pidgin English Twitter thread.

STATE: ${state}
YEAR: ${year}

DATA:
${rawResponse}`;

  return { system, user };
}
