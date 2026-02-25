import type { Language } from "@/types";

export const STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const;

export const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025] as const;

export const SECTOR_COLORS: Record<string, string> = {
  education: "#059669",
  health: "#0891b2",
  infrastructure: "#d97706",
  agriculture: "#65a30d",
  other: "#94a3b8",
  transportation: "#e11d48",
  "works & infrastructure": "#d97706",
  environment: "#16a34a",
  "commerce & industry": "#0284c7",
  "general administration": "#7c3aed",
  "works & housing": "#ea580c",
  "water resources": "#06b6d4",
  "youth & sports": "#dc2626",
  "debt service": "#64748b",
  "social welfare": "#a855f7",
  "housing & urban dev": "#f59e0b",
  "environment & oil remediation": "#15803d",
  works: "#d97706",
  "tourism & culture": "#ec4899",
  "science & technology": "#6366f1",
  security: "#ef4444",
  "area council affairs": "#8b5cf6",
  "social development": "#a855f7",
  "energy & power": "#f97316",
  housing: "#f59e0b",
  "environment & water": "#14b8a6",
  "arts & culture": "#ec4899",
  "religious affairs": "#8b5cf6",
  "rural infrastructure": "#d97706",
};

export const CHART_COLORS = [
  "#059669",
  "#0891b2",
  "#d97706",
  "#65a30d",
  "#7c3aed",
  "#e11d48",
  "#0284c7",
  "#ea580c",
  "#4f46e5",
  "#be185d",
];

export const UNIT_COSTS = {
  house: 25_000_000,
  school: 20_000_000,
  borehole: 5_000_000,
  homePowered: 100_000,
  hospital: 500_000_000,
  road_km: 200_000_000,
  scholarship: 500_000,
  textbook: 2_000,
};

export interface SuggestedQuestion {
  icon: string;
  text: string;
  category: string;
}

export const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  // Education
  {
    icon: "GraduationCap",
    text: "Which states spend the most on education?",
    category: "Education",
  },
  {
    icon: "GraduationCap",
    text: "How much does Lagos allocate to education?",
    category: "Education",
  },
  {
    icon: "GraduationCap",
    text: "Compare education spending across South-West states",
    category: "Education",
  },
  {
    icon: "GraduationCap",
    text: "Which state has the highest education budget per capita?",
    category: "Education",
  },
  {
    icon: "GraduationCap",
    text: "How has Kaduna's education spending changed over the years?",
    category: "Education",
  },
  {
    icon: "GraduationCap",
    text: "What percentage of Kano's budget goes to education?",
    category: "Education",
  },
  {
    icon: "GraduationCap",
    text: "Show me education allocations for North-Central states",
    category: "Education",
  },
  {
    icon: "GraduationCap",
    text: "Which states spend less than 10% on education?",
    category: "Education",
  },
  // Health
  {
    icon: "Stethoscope",
    text: "Which state spends the least on healthcare?",
    category: "Health",
  },
  {
    icon: "Stethoscope",
    text: "Compare health budgets of Lagos and Rivers",
    category: "Health",
  },
  {
    icon: "Stethoscope",
    text: "How much does Edo State spend on health?",
    category: "Health",
  },
  {
    icon: "Stethoscope",
    text: "Show me healthcare spending trends in Ogun State",
    category: "Health",
  },
  {
    icon: "Stethoscope",
    text: "Which North-East states spend the most on health?",
    category: "Health",
  },
  {
    icon: "Stethoscope",
    text: "What is Enugu's health budget for 2024?",
    category: "Health",
  },
  {
    icon: "Stethoscope",
    text: "Compare health spending between Imo and Abia",
    category: "Health",
  },
  {
    icon: "Stethoscope",
    text: "How much does FCT allocate to healthcare?",
    category: "Health",
  },
  // Trends
  {
    icon: "TrendingUp",
    text: "How has Lagos budget changed from 2019 to 2025?",
    category: "Trends",
  },
  {
    icon: "TrendingUp",
    text: "Show me Rivers State budget trend over the last 5 years",
    category: "Trends",
  },
  {
    icon: "TrendingUp",
    text: "How has the federal budget grown since 2020?",
    category: "Trends",
  },
  {
    icon: "TrendingUp",
    text: "Which states have had the biggest budget increases?",
    category: "Trends",
  },
  {
    icon: "TrendingUp",
    text: "Compare Kano budget from 2020 to 2024",
    category: "Trends",
  },
  {
    icon: "TrendingUp",
    text: "Has Delta State's IGR improved over the years?",
    category: "Trends",
  },
  {
    icon: "TrendingUp",
    text: "Show me Oyo State's recurrent vs capital expenditure trend",
    category: "Trends",
  },
  {
    icon: "TrendingUp",
    text: "How has Akwa Ibom's budget allocation changed?",
    category: "Trends",
  },
  // Compare
  {
    icon: "BarChart3",
    text: "Compare Kano and Lagos budgets",
    category: "Compare",
  },
  {
    icon: "BarChart3",
    text: "Compare all South-South state budgets",
    category: "Compare",
  },
  {
    icon: "BarChart3",
    text: "How does Ogun compare to Osun in spending?",
    category: "Compare",
  },
  {
    icon: "BarChart3",
    text: "Compare infrastructure spending across the top 5 states",
    category: "Compare",
  },
  {
    icon: "BarChart3",
    text: "Which is bigger — Bayelsa or Cross River budget?",
    category: "Compare",
  },
  {
    icon: "BarChart3",
    text: "Compare internally generated revenue across all states",
    category: "Compare",
  },
  {
    icon: "BarChart3",
    text: "How do North-West states compare in total spending?",
    category: "Compare",
  },
  {
    icon: "BarChart3",
    text: "Compare Plateau and Benue state budgets",
    category: "Compare",
  },
  // Context / Impact
  {
    icon: "Home",
    text: "What could Rivers State's N800B budget buy?",
    category: "Context",
  },
  {
    icon: "Home",
    text: "Put the federal education budget in perspective",
    category: "Context",
  },
  {
    icon: "Home",
    text: "What could Kano's health budget fund?",
    category: "Context",
  },
  {
    icon: "Home",
    text: "How many schools could Lagos build with its education budget?",
    category: "Context",
  },
  {
    icon: "Home",
    text: "What real-world impact could Ogun's budget have?",
    category: "Context",
  },
  {
    icon: "Home",
    text: "How many hospitals could Delta State's health allocation build?",
    category: "Context",
  },
  {
    icon: "Home",
    text: "What could N500 billion do for Nigerian infrastructure?",
    category: "Context",
  },
  {
    icon: "Home",
    text: "How many boreholes could Borno's water budget provide?",
    category: "Context",
  },
  // Rankings
  {
    icon: "Building2",
    text: "Show me the top 5 biggest state budgets in 2024",
    category: "Rankings",
  },
  {
    icon: "Building2",
    text: "Which states have the smallest budgets?",
    category: "Rankings",
  },
  {
    icon: "Building2",
    text: "Rank South-East states by total budget size",
    category: "Rankings",
  },
  {
    icon: "Building2",
    text: "Which state has the highest internally generated revenue?",
    category: "Rankings",
  },
  {
    icon: "Building2",
    text: "Top 10 states by capital expenditure",
    category: "Rankings",
  },
  {
    icon: "Building2",
    text: "Which states depend most on federal allocation?",
    category: "Rankings",
  },
  {
    icon: "Building2",
    text: "Rank states by infrastructure spending in 2024",
    category: "Rankings",
  },
  {
    icon: "Building2",
    text: "Which states have the highest debt service costs?",
    category: "Rankings",
  },
  // Corruption
  {
    icon: "Building2",
    text: "Tell me about James Ibori's corruption case",
    category: "Corruption",
  },
  {
    icon: "Building2",
    text: "What happened to Diezani Alison-Madueke?",
    category: "Corruption",
  },
  {
    icon: "Building2",
    text: "How much did Joshua Dariye embezzle?",
    category: "Corruption",
  },
  {
    icon: "Building2",
    text: "Tell me about Yahaya Bello's EFCC case",
    category: "Corruption",
  },
  {
    icon: "Building2",
    text: "What are the biggest EFCC corruption cases?",
    category: "Corruption",
  },
  {
    icon: "Building2",
    text: "How much was Orji Uzor Kalu convicted for?",
    category: "Corruption",
  },
  {
    icon: "Building2",
    text: "Tell me about the Dasuki arms deal scandal",
    category: "Corruption",
  },
  {
    icon: "Building2",
    text: "What is the status of Fani-Kayode's case?",
    category: "Corruption",
  },
  // General / Specific state
  {
    icon: "BarChart3",
    text: "What is the FCT 2025 budget?",
    category: "Budget",
  },
  {
    icon: "BarChart3",
    text: "Break down Ekiti State's 2024 budget",
    category: "Budget",
  },
  {
    icon: "BarChart3",
    text: "Show me Zamfara's capital expenditure",
    category: "Budget",
  },
  {
    icon: "BarChart3",
    text: "What is Anambra's total revenue for 2023?",
    category: "Budget",
  },
  {
    icon: "BarChart3",
    text: "Show me Kwara State's budget breakdown",
    category: "Budget",
  },
  {
    icon: "BarChart3",
    text: "How much does Sokoto State spend on agriculture?",
    category: "Budget",
  },
  {
    icon: "BarChart3",
    text: "What is Bauchi's internally generated revenue?",
    category: "Budget",
  },
  {
    icon: "BarChart3",
    text: "Break down the 2024 federal budget",
    category: "Budget",
  },
];

export const SUGGESTED_QUESTIONS_PCM: SuggestedQuestion[] = [
  // Education
  {
    icon: "GraduationCap",
    text: "Which states dey spend di most on education?",
    category: "Education",
  },
  {
    icon: "GraduationCap",
    text: "How much Lagos dey put for education?",
    category: "Education",
  },
  {
    icon: "GraduationCap",
    text: "Compare education spending for South-West states",
    category: "Education",
  },
  {
    icon: "GraduationCap",
    text: "Which state get di highest education budget per person?",
    category: "Education",
  },
  {
    icon: "GraduationCap",
    text: "How Kaduna education spending don change over di years?",
    category: "Education",
  },
  {
    icon: "GraduationCap",
    text: "How much percent of Kano budget dey go education?",
    category: "Education",
  },
  {
    icon: "GraduationCap",
    text: "Show me education money for North-Central states",
    category: "Education",
  },
  {
    icon: "GraduationCap",
    text: "Which states dey spend less than 10% on education?",
    category: "Education",
  },
  // Health
  {
    icon: "Stethoscope",
    text: "Which state dey spend di least on healthcare?",
    category: "Health",
  },
  {
    icon: "Stethoscope",
    text: "Compare health budgets of Lagos and Rivers",
    category: "Health",
  },
  {
    icon: "Stethoscope",
    text: "How much Edo State dey spend on health?",
    category: "Health",
  },
  {
    icon: "Stethoscope",
    text: "Show me healthcare spending trends for Ogun State",
    category: "Health",
  },
  {
    icon: "Stethoscope",
    text: "Which North-East states dey spend di most on health?",
    category: "Health",
  },
  {
    icon: "Stethoscope",
    text: "Wetin be Enugu health budget for 2024?",
    category: "Health",
  },
  {
    icon: "Stethoscope",
    text: "Compare health spending between Imo and Abia",
    category: "Health",
  },
  {
    icon: "Stethoscope",
    text: "How much FCT dey put for healthcare?",
    category: "Health",
  },
  // Trends
  {
    icon: "TrendingUp",
    text: "How Lagos budget don change from 2019 to 2025?",
    category: "Trends",
  },
  {
    icon: "TrendingUp",
    text: "Show me Rivers State budget trend for di last 5 years",
    category: "Trends",
  },
  {
    icon: "TrendingUp",
    text: "How federal budget don grow since 2020?",
    category: "Trends",
  },
  {
    icon: "TrendingUp",
    text: "Which states get di biggest budget increase?",
    category: "Trends",
  },
  {
    icon: "TrendingUp",
    text: "Compare Kano budget from 2020 to 2024",
    category: "Trends",
  },
  {
    icon: "TrendingUp",
    text: "Delta State IGR don improve over di years?",
    category: "Trends",
  },
  {
    icon: "TrendingUp",
    text: "Show me Oyo State recurrent vs capital expenditure trend",
    category: "Trends",
  },
  {
    icon: "TrendingUp",
    text: "How Akwa Ibom budget allocation don change?",
    category: "Trends",
  },
  // Compare
  {
    icon: "BarChart3",
    text: "Compare Kano and Lagos budgets",
    category: "Compare",
  },
  {
    icon: "BarChart3",
    text: "Compare all South-South state budgets",
    category: "Compare",
  },
  {
    icon: "BarChart3",
    text: "How Ogun compare to Osun for spending?",
    category: "Compare",
  },
  {
    icon: "BarChart3",
    text: "Compare infrastructure spending for di top 5 states",
    category: "Compare",
  },
  {
    icon: "BarChart3",
    text: "Which one big pass — Bayelsa or Cross River budget?",
    category: "Compare",
  },
  {
    icon: "BarChart3",
    text: "Compare internally generated revenue for all states",
    category: "Compare",
  },
  {
    icon: "BarChart3",
    text: "How North-West states compare for total spending?",
    category: "Compare",
  },
  {
    icon: "BarChart3",
    text: "Compare Plateau and Benue state budgets",
    category: "Compare",
  },
  // Context / Impact
  {
    icon: "Home",
    text: "Wetin Rivers State N800B budget fit buy?",
    category: "Context",
  },
  {
    icon: "Home",
    text: "Put di federal education budget for perspective",
    category: "Context",
  },
  {
    icon: "Home",
    text: "Wetin Kano health budget fit fund?",
    category: "Context",
  },
  {
    icon: "Home",
    text: "How many schools Lagos fit build with im education budget?",
    category: "Context",
  },
  {
    icon: "Home",
    text: "Wetin real-world impact Ogun budget fit get?",
    category: "Context",
  },
  {
    icon: "Home",
    text: "How many hospitals Delta State health money fit build?",
    category: "Context",
  },
  {
    icon: "Home",
    text: "Wetin N500 billion fit do for Nigerian infrastructure?",
    category: "Context",
  },
  {
    icon: "Home",
    text: "How many boreholes Borno water budget fit provide?",
    category: "Context",
  },
  // Rankings
  {
    icon: "Building2",
    text: "Show me di top 5 biggest state budgets for 2024",
    category: "Rankings",
  },
  {
    icon: "Building2",
    text: "Which states get di smallest budgets?",
    category: "Rankings",
  },
  {
    icon: "Building2",
    text: "Rank South-East states by total budget size",
    category: "Rankings",
  },
  {
    icon: "Building2",
    text: "Which state get di highest internally generated revenue?",
    category: "Rankings",
  },
  {
    icon: "Building2",
    text: "Top 10 states by capital expenditure",
    category: "Rankings",
  },
  {
    icon: "Building2",
    text: "Which states dey depend most on federal allocation?",
    category: "Rankings",
  },
  {
    icon: "Building2",
    text: "Rank states by infrastructure spending for 2024",
    category: "Rankings",
  },
  {
    icon: "Building2",
    text: "Which states get di highest debt service costs?",
    category: "Rankings",
  },
  // Corruption
  {
    icon: "Building2",
    text: "Tell me about James Ibori corruption case",
    category: "Corruption",
  },
  {
    icon: "Building2",
    text: "Wetin happen to Diezani Alison-Madueke?",
    category: "Corruption",
  },
  {
    icon: "Building2",
    text: "How much Joshua Dariye embezzle?",
    category: "Corruption",
  },
  {
    icon: "Building2",
    text: "Tell me about Yahaya Bello EFCC case",
    category: "Corruption",
  },
  {
    icon: "Building2",
    text: "Wetin be di biggest EFCC corruption cases?",
    category: "Corruption",
  },
  {
    icon: "Building2",
    text: "How much dem convict Orji Uzor Kalu for?",
    category: "Corruption",
  },
  {
    icon: "Building2",
    text: "Tell me about di Dasuki arms deal scandal",
    category: "Corruption",
  },
  {
    icon: "Building2",
    text: "Wetin be di status of Fani-Kayode case?",
    category: "Corruption",
  },
  // General / Specific state
  { icon: "BarChart3", text: "Wetin be FCT 2025 budget?", category: "Budget" },
  {
    icon: "BarChart3",
    text: "Break down Ekiti State 2024 budget",
    category: "Budget",
  },
  {
    icon: "BarChart3",
    text: "Show me Zamfara capital expenditure",
    category: "Budget",
  },
  {
    icon: "BarChart3",
    text: "Wetin be Anambra total revenue for 2023?",
    category: "Budget",
  },
  {
    icon: "BarChart3",
    text: "Show me Kwara State budget breakdown",
    category: "Budget",
  },
  {
    icon: "BarChart3",
    text: "How much Sokoto State dey spend on agriculture?",
    category: "Budget",
  },
  {
    icon: "BarChart3",
    text: "Wetin be Bauchi internally generated revenue?",
    category: "Budget",
  },
  {
    icon: "BarChart3",
    text: "Break down di 2024 federal budget",
    category: "Budget",
  },
];

/** Pick `count` random questions from the pool, ensuring category diversity */
export function pickRandomQuestions(
  language: Language = "en",
  count = 6,
): SuggestedQuestion[] {
  const pool =
    language === "pcm" ? SUGGESTED_QUESTIONS_PCM : SUGGESTED_QUESTIONS;

  // Group by category
  const byCategory = new Map<string, SuggestedQuestion[]>();
  for (const q of pool) {
    const list = byCategory.get(q.category) || [];
    list.push(q);
    byCategory.set(q.category, list);
  }

  const categories = [...byCategory.keys()];
  const picked: SuggestedQuestion[] = [];

  // First pass: one random question per category (up to count)
  const shuffledCategories = categories.sort(() => Math.random() - 0.5);
  for (const cat of shuffledCategories) {
    if (picked.length >= count) break;
    const items = byCategory.get(cat)!;
    const idx = Math.floor(Math.random() * items.length);
    picked.push(items[idx]);
    items.splice(idx, 1); // remove so we don't pick it again
  }

  // Second pass: fill remaining slots from any category
  if (picked.length < count) {
    const remaining = [...pool].filter((q) => !picked.includes(q));
    const shuffled = remaining.sort(() => Math.random() - 0.5);
    for (const q of shuffled) {
      if (picked.length >= count) break;
      picked.push(q);
    }
  }

  return picked;
}
