/* eslint-disable no-console */
/**
 * Seed the four default OurNigeria roamer topics.
 *
 * All topics ship with `enabled = false` — operator flips them on from the
 * dashboard at `/dashboard/social/topics` after at least one bot session is
 * captured via the Chrome extension.
 *
 * Idempotent: matches by `name`. Re-running with newer values updates query /
 * description / examples in place but never flips `enabled` (so re-seeding
 * doesn't accidentally turn the loop on after an operator turned it off).
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

interface SeedTopic {
  name: string;
  query: string;
  description: string;
  domain: string;
  positiveExamples: string[];
  negativeExamples: string[];
  threshold: number;
  minFollowers: number;
  maxFollowers: number;
  lang: string;
  minTextLength: number;
  maxAgeHours: number;
}

const TOPICS: SeedTopic[] = [
  // ============================================================
  // BUDGET (4) — federal, state, sector, NASS
  // ============================================================
  {
    name: "Nigerian Federal Budget",
    query:
      '("federal budget" OR "FG budget" OR "national budget" OR "2026 budget" OR "2025 budget" OR "budget speech" OR "Appropriation Bill" OR "MTEF" OR "supplementary budget" OR "budget padding") Nigeria -is:retweet lang:en',
    description:
      "Tweets about Nigeria's federal/national budget — Appropriation Bill, MTEF, supplementary budgets, budget speech, padding scandals, headline figures. Excludes personal-finance 'budget your salary' tweets and foreign budgets.",
    domain: "budget",
    positiveExamples: [
      "FG's 2026 budget proposal is ₦47 trillion — almost double 2024. Where is the revenue going to come from?",
      "Tinubu just signed the supplementary budget. ₦2.1 trillion extra for security, but no breakdown of which agencies get what.",
      "Budget padding again? NASS just inserted ₦150 billion in projects nobody can defend in committee.",
    ],
    negativeExamples: [
      "How to budget your ₦100k salary in Lagos",
      "South Africa's budget speech delivered today — finance minister cuts VAT",
      "I'm on a tight budget so I'll buy tokunbo instead",
      "USA debt ceiling fight returns as Congress debates 2026 budget",
    ],
    threshold: 0.72,
    minFollowers: 1000,
    maxFollowers: 500_000,
    lang: "en",
    minTextLength: 30,
    maxAgeHours: 48,
  },
  {
    name: "State Budget Allocations",
    query:
      '("state budget" OR "Lagos budget" OR "Kano budget" OR "Rivers budget" OR "Kaduna budget" OR "Anambra budget" OR "Ogun budget" OR "Oyo budget" OR "Edo budget" OR "Delta budget" OR "Cross River budget" OR "governor signs budget" OR "state assembly budget") Nigeria -is:retweet lang:en',
    description:
      "Tweets about Nigerian state-level budgets — governor budget speeches, state assembly approvals, per-state allocations, capex vs recurrent splits, sector lines. Useful for citizen accountability against state spending.",
    domain: "budget",
    positiveExamples: [
      "Lagos 2026 budget: ₦3.4 trillion. Infrastructure ₦1.1T, education only ₦280B. Wahala.",
      "Sanwo-Olu signs Y2026 Appropriation. 64% capex sounds nice but Lagos already lifts ₦40B/month from FAAC and IGR.",
      "Why is Cross River budgeting ₦500 billion when its FAAC + IGR can't service ₦200 billion?",
    ],
    negativeExamples: [
      "My state government is useless, period",
      "States should generate their own revenue jare",
      "Texas state budget hits $321B",
    ],
    threshold: 0.72,
    minFollowers: 800,
    maxFollowers: 500_000,
    lang: "en",
    minTextLength: 30,
    maxAgeHours: 48,
  },
  {
    name: "Sector Budget Priorities",
    query:
      '(("education budget" OR "health budget" OR "defence budget" OR "defense budget" OR "agriculture budget" OR "WHO benchmark" OR "UNESCO benchmark" OR "15 percent health" OR "26 percent education") Nigeria) -is:retweet lang:en',
    description:
      "Tweets that compare Nigerian sector allocations (health, education, defence, agriculture) to international benchmarks (UNESCO 26%, WHO 15%) or to other line items. Strong civic angle — agent can cite exact MoH/MoE/MoD figures.",
    domain: "budget",
    positiveExamples: [
      "Nigeria's 2026 health budget is 4.2% of total — WHO benchmark is 15%. We are nowhere near it.",
      "Defence budget jumped from ₦2.5T in 2024 to ₦4.7T in 2026. Banditry didn't even reduce.",
      "FG allocated ₦1.4T to education — 7% of budget. UNESCO says minimum 26%. Yet teachers are still on strike.",
    ],
    negativeExamples: [
      "Education is the key to success",
      "We need better hospitals in Nigeria",
      "Defence spending in NATO countries hits 2% of GDP",
    ],
    threshold: 0.72,
    minFollowers: 1000,
    maxFollowers: 500_000,
    lang: "en",
    minTextLength: 30,
    maxAgeHours: 48,
  },
  {
    name: "National Assembly Spending",
    query:
      '("NASS budget" OR "National Assembly budget" OR "jumbo pay" OR "senator allowance" OR "senator severance" OR "senator salary" OR "Reps salary" OR "lawmaker allowance" OR "constituency project" OR "ZIP project") Nigeria -is:retweet lang:en',
    description:
      "Tweets about National Assembly spending — NASS budget line, senator/Reps salaries and allowances, severance packages, constituency/ZIP projects. High-engagement civic anger topic; agent should cite exact NASS appropriation and constituency-project sums.",
    domain: "budget",
    positiveExamples: [
      "NASS budget hit ₦344 billion in 2026 — more than 10 federal universities combined.",
      "A Nigerian senator earns ₦21M/month while minimum wage is ₦70k. Make it make sense.",
      "Reps approved ₦200B in constituency projects this year. Most don't even exist on the ground.",
    ],
    negativeExamples: [
      "All politicians are corrupt jare",
      "US Congress passes new spending bill",
      "I want to be a senator one day to chop money",
    ],
    threshold: 0.72,
    minFollowers: 1500,
    maxFollowers: 500_000,
    lang: "en",
    minTextLength: 30,
    maxAgeHours: 48,
  },

  // ============================================================
  // CORRUPTION (3) — investigations, recovery, named officials
  // ============================================================
  {
    name: "EFCC & ICPC Investigations",
    query:
      '(EFCC OR ICPC OR "anti-graft" OR "anti corruption agency" OR "money laundering Nigeria" OR "fraud charge" OR "arraignment" OR "convicted" OR "plea bargain") Nigeria -is:retweet lang:en',
    description:
      "Tweets about active EFCC/ICPC cases — arrests, arraignments, charges, plea bargains, convictions, ongoing investigations of Nigerian public officials. Excludes online-fraud-awareness threads and unrelated foreign cases.",
    domain: "corruption",
    positiveExamples: [
      "EFCC arrests former Kogi governor over alleged ₦80 billion fraud",
      "Court convicts ex-AGF Bello Adoke after 9 years — sentenced to 3 years for OPL 245 fraud.",
      "Why has Yahaya Bello's case stalled for 8 months? EFCC needs to explain.",
    ],
    negativeExamples: [
      "Avoid online fraud — never share your BVN over WhatsApp",
      "Beware of crypto scams targeting Nigerian youth",
      "Brazil's Lava Jato corruption probe ends",
      "EFCC arrests yahoo boys in Lekki nightclub",
    ],
    threshold: 0.75,
    minFollowers: 1000,
    maxFollowers: 500_000,
    lang: "en",
    minTextLength: 30,
    maxAgeHours: 48,
  },
  {
    name: "Looted Funds & Asset Recovery",
    query:
      '("looted funds" OR "Abacha loot" OR "stolen funds" OR "recovered assets" OR "asset forfeiture" OR "Abacha funds" OR "repatriated funds" OR "recovered loot" OR "seized properties") Nigeria -is:retweet lang:en',
    description:
      "Tweets about looted Nigerian public funds, recovered loot, asset forfeitures, and repatriation deals (Abacha, Diezani, Alison-Madueke). Strong angle — agent can cite recovery amounts vs project deployment.",
    domain: "corruption",
    positiveExamples: [
      "Switzerland just returned $23M Abacha loot. That's the 4th tranche. Where did the previous ones go?",
      "EFCC says it recovered ₦156 billion in assets last quarter. We need a public registry.",
      "Diezani's London properties auctioned. Did the proceeds reach the Federation Account?",
    ],
    negativeExamples: [
      "I lost my wallet — feels like Abacha looted me lol",
      "Recovered phone after a week of searching",
    ],
    threshold: 0.75,
    minFollowers: 1000,
    maxFollowers: 500_000,
    lang: "en",
    minTextLength: 30,
    maxAgeHours: 48,
  },
  {
    name: "Officials Under Allegation",
    query:
      '(governor OR minister OR "permanent secretary" OR "DG" OR "Director General" OR senator) (fraud OR corruption OR "missing funds" OR "diverted" OR "embezzled" OR "alleged") Nigeria -is:retweet lang:en',
    description:
      "Tweets naming specific Nigerian public officials in active fraud/corruption allegations or scandals. Agent should cite EFCC corpus + budget records to confirm/contextualize. Higher threshold to avoid generic political insults.",
    domain: "corruption",
    positiveExamples: [
      "Why is the Minister of Humanitarian Affairs not yet questioned over the missing ₦37 billion palliative funds?",
      "Former Niger Delta minister allegedly diverted ₦47B meant for amnesty payments. EFCC quiet.",
      "Senator from Kano under fire after ₦12B constituency project funds reportedly cannot be traced.",
    ],
    negativeExamples: [
      "All governors are thieves",
      "Politicians in Naija are useless",
      "My governor never gives us anything",
    ],
    threshold: 0.78,
    minFollowers: 1500,
    maxFollowers: 500_000,
    lang: "en",
    minTextLength: 40,
    maxAgeHours: 48,
  },

  // ============================================================
  // FAAC (1) — monthly allocations
  // ============================================================
  {
    name: "FAAC Monthly Allocations",
    query:
      '(FAAC OR "federation account" OR "FAAC allocation" OR "FAAC sharing" OR "FAAC meeting" OR "monthly allocation" OR "13 percent derivation" OR "VAT pool" OR "oil revenue sharing") Nigeria -is:retweet lang:en',
    description:
      "Tweets about FAAC (Federation Account Allocation Committee) monthly distributions — federal/state/LGA tier amounts, derivation, VAT pool, per-state numbers, oil revenue sharing. Niche topic so follower floor is lower.",
    domain: "faac",
    positiveExamples: [
      "FAAC shared ₦1.78 trillion in March 2026 — ₦780B to states, ₦580B to LGAs.",
      "Rivers got ₦71B from FAAC March allocation, top of the 36 states. Lagos ₦39B.",
      "Why is Yobe LGA getting ₦180M while Bonny LGA collects ₦4.2B? 13% derivation is destroying equity.",
    ],
    negativeExamples: [
      "FAAC stands for Federation Account Allocation Committee",
      "My governor announced free school uniforms today",
      "States should stop relying on federal allocations",
    ],
    threshold: 0.72,
    minFollowers: 500,
    maxFollowers: 500_000,
    lang: "en",
    minTextLength: 30,
    maxAgeHours: 48,
  },

  // ============================================================
  // GOVSPEND (4) — contracts, subsidy, failed projects, defence
  // ============================================================
  {
    name: "MDA Contract Awards & Procurement",
    query:
      '("contract award" OR "no-bid contract" OR "sole sourcing" OR "BPP" OR "Bureau of Public Procurement" OR "FERMA contract" OR "NNPC contract" OR "FCDA contract" OR "NIMC contract" OR "ministry awarded") Nigeria -is:retweet lang:en',
    description:
      "Tweets about specific MDA contract awards, procurement irregularities, BPP issues, no-bid awards, sole-sourcing in Nigeria. Excludes generic 'cut spending' political slogans. Agent should cite OurNigeria GovSpend contract records.",
    domain: "govspend",
    positiveExamples: [
      "FERMA just awarded ₦8 billion for Lagos-Ibadan repairs to a 6-month-old company. BPP said nothing.",
      "FCDA contract for Abuja street lights jumped from ₦4B to ₦11B in one year. Same scope.",
      "NIMC paid ₦4.5B to consultants in Q3 alone. Where is the audit trail?",
    ],
    negativeExamples: [
      "Government should spend less and tax less",
      "Cut government spending — that's the only solution",
      "Procurement officer needed — apply now",
    ],
    threshold: 0.72,
    minFollowers: 1000,
    maxFollowers: 500_000,
    lang: "en",
    minTextLength: 35,
    maxAgeHours: 48,
  },
  {
    name: "Subsidy Removal & Palliatives",
    query:
      '("fuel subsidy" OR "subsidy removal" OR "subsidy savings" OR "palliative" OR "palliatives" OR "NNPC remittance" OR "fuel price Nigeria" OR "PMS price" OR "subsidy fund") -is:retweet lang:en',
    description:
      "Tweets about Nigeria's fuel subsidy removal, claimed savings, NNPC remittances to FAAC, palliative distribution and tracking. High-volume topic — agent can cite FAAC monthly receipts before/after May 2023.",
    domain: "govspend",
    positiveExamples: [
      "FG claims ₦11 trillion saved from subsidy removal. Yet FAAC inflows only rose by ₦4T. Where is the rest?",
      "Palliative rice distribution: ₦35B budgeted, only 200k bags reached citizens. Maths no add.",
      "NNPC remittance to Federation Account in March 2026: ₦0. Same as last 4 months. Subsidy removed for who?",
    ],
    negativeExamples: [
      "Buying fuel is hard these days",
      "I queued at the filling station for 2 hours today",
      "Palliative care nurses deserve better pay",
    ],
    threshold: 0.74,
    minFollowers: 1000,
    maxFollowers: 500_000,
    lang: "en",
    minTextLength: 30,
    maxAgeHours: 48,
  },
  {
    name: "Failed & Abandoned Public Projects",
    query:
      '("abandoned project" OR "uncompleted project" OR "ghost project" OR "white elephant" OR "Mambilla" OR "Ajaokuta" OR "Lagos-Calabar" OR "second Niger bridge" OR "failed contract" OR "where is the road") Nigeria -is:retweet lang:en',
    description:
      "Tweets calling out abandoned/failed/ghost public projects in Nigeria — named projects (Mambilla, Ajaokuta, Lagos-Calabar coastal, Second Niger Bridge) or generic 'where is this road' callouts with photos. Agent cross-references contract values vs delivery.",
    domain: "govspend",
    positiveExamples: [
      "Mambilla power project: ₦1.2 trillion spent over 14 years, 0 megawatts produced.",
      "Lagos-Calabar coastal highway already cost ₦1.06T for 47km. At this rate the full 700km will be ₦15T.",
      "Drove past the 'completed' Lokoja-Abuja road. It's a death trap. Who collected this contract?",
    ],
    negativeExamples: [
      "Roads in my area are bad",
      "My state government should fix our roads",
      "Lagos traffic is unbearable today",
    ],
    threshold: 0.72,
    minFollowers: 1000,
    maxFollowers: 500_000,
    lang: "en",
    minTextLength: 35,
    maxAgeHours: 48,
  },
  {
    name: "Defence & Security Spending",
    query:
      '(("defence budget" OR "defense budget" OR "security vote" OR "security spending" OR "military budget" OR "DHQ budget" OR "police budget" OR "Tucano jets" OR "armoured vehicles") Nigeria) -is:retweet lang:en',
    description:
      "Tweets about Nigerian defence/security spending vs outcomes — defence budget, security votes, military procurement (Tucano jets, MRAPs), police funding, banditry/insurgency cost. Agent ties spending to FAAC security votes and MoD lines.",
    domain: "govspend",
    positiveExamples: [
      "Defence budget rose from ₦2.5T (2024) to ₦4.7T (2026). Banditry casualties also rose. We are paying for failure.",
      "Each governor pockets ₦100M-₦500M monthly as 'security vote' — no receipts, no audit. That's ₦200B+ a year across 36 states.",
      "FG bought 12 Tucano jets for $497M. How many have flown sorties this year?",
    ],
    negativeExamples: [
      "Insecurity in Naija is too much",
      "Bandits attacked my village again",
      "Our soldiers are trying their best",
      "US defense budget hits $886B",
    ],
    threshold: 0.74,
    minFollowers: 1000,
    maxFollowers: 500_000,
    lang: "en",
    minTextLength: 35,
    maxAgeHours: 48,
  },
];

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  let inserted = 0;
  let updated = 0;
  try {
    for (const t of TOPICS) {
      const existing = await prisma.socialsTopic.findUnique({
        where: { name: t.name },
      });
      if (existing) {
        await prisma.socialsTopic.update({
          where: { id: existing.id },
          data: {
            query: t.query,
            description: t.description,
            domain: t.domain,
            positiveExamples: t.positiveExamples,
            negativeExamples: t.negativeExamples,
            threshold: t.threshold,
            minFollowers: t.minFollowers,
            maxFollowers: t.maxFollowers,
            lang: t.lang,
            minTextLength: t.minTextLength,
            maxAgeHours: t.maxAgeHours,
            // Deliberately NOT touching `enabled` on existing rows.
          },
        });
        updated++;
        console.log(`  updated: ${t.name}`);
      } else {
        await prisma.socialsTopic.create({
          data: {
            ...t,
            enabled: false,
          },
        });
        inserted++;
        console.log(`  created: ${t.name}`);
      }
    }
    console.log(`\nDone. inserted=${inserted} updated=${updated}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
