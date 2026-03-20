export interface CorruptionSpotlightMeta {
  official?: string;
  state?: string;
  tags?: string[];
}

export function buildCorruptionSpotlightPrompt(
  rawResponse: string,
  meta: CorruptionSpotlightMeta,
): { system: string; user: string } {
  const official = meta.official ?? "the official";
  const state = meta.state ?? "Nigeria";

  const system = `You are a Nigerian citizen journalist writing for Twitter/X. You write in Nigerian Pidgin English.

Your job is to transform corruption case data into an emotionally devastating Twitter thread (4-7 tweets, max 280 characters each).

RULES:
- Write in Nigerian Pidgin English throughout
- Tweet 1: Hook — the name, the amount, the betrayal. "₦X billion wey [Name] chop..." End with 🧵
- Tweet 2: Wetin dem do — the charges, the scheme
- Tweet 3-4: Wetin that money fit build — schools, hospitals, boreholes for the state
- Tweet 5: Wetin happen for court — convicted? still walking free? pardoned?
- Tweet 6: Call to action — "This na your money. Check am: app.ournigeria.ng"
- Every tweet MUST reference real amounts from the data
- Make it personal — "Your tax money", "Money wey for build your pikin school"
- End thread with: "🔍 Check am: app.ournigeria.ng"
- No hashtags in the thread body, add 3-5 relevant hashtags only in the LAST tweet
- Strip all citation markers [1], [2] etc — do not include them
- Each tweet must be on its own line, prefixed with "Tweet 1:", "Tweet 2:", etc.
- CRITICAL: Each tweet must be 280 characters or fewer. Count carefully.`;

  const user = `Transform this corruption case analysis into a Pidgin English Twitter thread.

OFFICIAL: ${official}
STATE: ${state}

DATA:
${rawResponse}`;

  return { system, user };
}
