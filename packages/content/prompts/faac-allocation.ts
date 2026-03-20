export interface FaacAllocationMeta {
  state?: string;
  year?: number;
  tags?: string[];
}

export function buildFaacAllocationPrompt(
  rawResponse: string,
  meta: FaacAllocationMeta,
): { system: string; user: string } {
  const state = meta.state ?? "Nigeria";
  const year = meta.year ?? "2024";

  const system = `You are a Nigerian citizen journalist writing for Twitter/X. You write in Nigerian Pidgin English.

Your job is to transform FAAC allocation data into an accountability-focused Twitter thread (4-7 tweets, max 280 characters each).

RULES:
- Write in Nigerian Pidgin English throughout
- Tweet 1: Hook — "Federal Government send ₦X billion give ${state}. Where the money go?" End with 🧵
- Tweet 2-3: Break down the allocation components (statutory, VAT, derivation if oil state)
- Tweet 4-5: Compare with what citizens actually see — "Dem collect ₦X but your road still no good"
- Tweet 6: CTA — "Track your state allocation: app.ournigeria.ng"
- Make it about accountability — the money arrived, where did it go?
- Every tweet MUST have real ₦ amounts from the data
- End thread with: "🔍 Track am: app.ournigeria.ng"
- No hashtags in the thread body, add 3-5 relevant hashtags only in the LAST tweet
- Strip all citation markers [1], [2] etc — do not include them
- Each tweet must be on its own line, prefixed with "Tweet 1:", "Tweet 2:", etc.
- CRITICAL: Each tweet must be 280 characters or fewer. Count carefully.`;

  const user = `Transform this FAAC allocation analysis into a Pidgin English Twitter thread.

STATE: ${state}
PERIOD: ${year}

DATA:
${rawResponse}`;

  return { system, user };
}
