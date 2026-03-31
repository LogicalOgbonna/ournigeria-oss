import { Injectable } from "@nestjs/common";

export interface TopicMatch {
  domain: "budget" | "corruption" | "faac" | "govspend" | "general";
  entities: {
    states: string[];
    officials: string[];
    sectors: string[];
    mdas: string[];
  };
  relevanceHint: string;
}

const NIGERIAN_STATES = [
  "abia", "adamawa", "akwa ibom", "anambra", "bauchi", "bayelsa",
  "benue", "borno", "cross river", "delta", "ebonyi", "edo", "ekiti",
  "enugu", "gombe", "imo", "jigawa", "kaduna", "kano", "katsina",
  "kebbi", "kogi", "kwara", "lagos", "nasarawa", "niger", "ogun",
  "ondo", "osun", "oyo", "plateau", "rivers", "sokoto", "taraba",
  "yobe", "zamfara", "fct",
];

const CORRUPTION_KEYWORDS = [
  "efcc", "icpc", "corruption", "looting", "embezzle", "divert",
  "stolen", "fraud", "convicted", "charged", "arraigned", "plea bargain",
  "money laundering",
];

const BUDGET_KEYWORDS = [
  "budget", "allocation", "appropriation", "spending", "expenditure",
  "capital project", "recurrent", "overhead", "fiscal",
];

const FAAC_KEYWORDS = [
  "faac", "federation account", "revenue allocation", "disbursement",
  "statutory allocation", "vat allocation", "13% derivation",
];

const GOVSPEND_KEYWORDS = [
  "contract", "payment", "procurement", "mda", "ministry",
  "department", "agency", "contractor", "disbursement",
];

const SECTOR_KEYWORDS: Record<string, string> = {
  education: "education", school: "education", university: "education",
  health: "health", hospital: "health", medical: "health",
  road: "infrastructure", bridge: "infrastructure", infrastructure: "infrastructure",
  agriculture: "agriculture", farming: "agriculture",
  security: "security", police: "security", army: "security",
  power: "energy", electricity: "energy", nepa: "energy",
  water: "water",
};

@Injectable()
export class TopicMatcher {
  match(text: string): TopicMatch {
    const lower = text.toLowerCase();

    // Extract entities
    const states = NIGERIAN_STATES.filter((s) =>
      new RegExp(`\\b${s.replace(/\s+/g, "\\s+")}\\b`).test(lower),
    );

    const sectors: string[] = [];
    for (const [keyword, sector] of Object.entries(SECTOR_KEYWORDS)) {
      if (lower.includes(keyword) && !sectors.includes(sector)) {
        sectors.push(sector);
      }
    }

    // Determine domain by keyword matching
    const corruptionScore = CORRUPTION_KEYWORDS.filter((k) =>
      lower.includes(k),
    ).length;
    const budgetScore = BUDGET_KEYWORDS.filter((k) =>
      lower.includes(k),
    ).length;
    const faacScore = FAAC_KEYWORDS.filter((k) =>
      lower.includes(k),
    ).length;
    const govspendScore = GOVSPEND_KEYWORDS.filter((k) =>
      lower.includes(k),
    ).length;

    const scores = {
      corruption: corruptionScore,
      budget: budgetScore,
      faac: faacScore,
      govspend: govspendScore,
    };

    const maxScore = Math.max(...Object.values(scores));
    let domain: TopicMatch["domain"] = "general";
    if (maxScore > 0) {
      domain = (Object.entries(scores).find(
        ([, v]) => v === maxScore,
      )?.[0] ?? "general") as TopicMatch["domain"];
    }

    const relevanceHint = [
      states.length > 0 ? `States: ${states.join(", ")}` : "",
      sectors.length > 0 ? `Sectors: ${sectors.join(", ")}` : "",
      `Domain: ${domain}`,
    ]
      .filter(Boolean)
      .join(". ");

    return {
      domain,
      entities: {
        states,
        officials: [],
        sectors,
        mdas: [],
      },
      relevanceHint,
    };
  }
}
