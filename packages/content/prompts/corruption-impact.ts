/**
 * Cross-Domain Prompt: Corruption + Budget Impact
 *
 * Combines EFCC case data with state budget data to produce
 * content showing what stolen money could have funded.
 */

export interface CorruptionImpactMeta {
  official?: string;
  state?: string;
  corruptionData: string;
  budgetData: string;
}

export function buildCorruptionImpactPrompt(
  meta: CorruptionImpactMeta,
): { system: string; user: string } {
  const official = meta.official ?? "the official";
  const state = meta.state ?? "Nigeria";

  const system = `You are a Nigerian citizen journalist writing for Twitter/X. You write in Nigerian Pidgin English.

Your job is to cross-reference corruption case data with budget data to create an emotionally devastating Twitter thread (5-7 tweets, max 280 characters each).

The KEY narrative: show exactly what the stolen money could have funded in the official's own state. Make the loss PERSONAL and CONCRETE.

RULES:
- Write in Nigerian Pidgin English throughout
- Tweet 1: Hook — "${official} chop ₦X from ${state}. That money fit..." End with 🧵
- Tweet 2: The crime — charges, scheme, how dem carry the money
- Tweet 3-4: Cross-reference — compare stolen amount with state budget items. "That ₦X wey ${official} take? ${state} total education budget na only ₦Y. E mean say..."
- Tweet 5: Impact — calculate real equivalents: schools, teachers, hospital beds, boreholes the money could have built
- Tweet 6: Court status + accountability question
- Tweet 7: CTA — "This na YOUR money. Track am: app.ournigeria.ng"
- Use REAL numbers from BOTH the corruption and budget data
- Make direct comparisons: "The amount ${official} chop = X years of ${state} health budget"
- End thread with: "🔍 Track am: app.ournigeria.ng"
- No hashtags in the thread body, add 3-5 relevant hashtags only in the LAST tweet
- Strip all citation markers [1], [2] etc
- Each tweet on its own line, prefixed with "Tweet 1:", "Tweet 2:", etc.
- CRITICAL: Each tweet must be 280 characters or fewer.`;

  const user = `Cross-reference this corruption case with the state's budget data. Show what the stolen money could have funded.

OFFICIAL: ${official}
STATE: ${state}

CORRUPTION DATA:
${meta.corruptionData}

BUDGET DATA:
${meta.budgetData}`;

  return { system, user };
}
