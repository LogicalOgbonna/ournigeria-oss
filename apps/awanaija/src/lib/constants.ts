import {
  Search,
  MessageSquare,
  BarChart3,
  Shield,
  type LucideIcon,
} from "lucide-react";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://spending.arinze.online";
export const LOGIN_URL =
  process.env.NEXT_PUBLIC_LOGIN_URL || "https://ournigeria.arinze.online/login";

// ═══ Stats ═══
export const STATS = [
  {
    value: 36,
    suffix: "+",
    label: "States & Federal",
    pidgin: "All 36 states plus FCT",
  },
  {
    value: 6,
    suffix: "+",
    label: "Data Sources",
    pidgin: "Budgets, GovSpend, EFCC, ICPC, Bills & MDAs",
  },
  {
    value: 5000,
    suffix: "+",
    label: "Government Records",
    pidgin: "Analyzed documents and cases",
  },
  {
    value: 2,
    suffix: "M+",
    label: "Data Points Indexed",
    pidgin: "Ready for your questions",
  },
] as const;

// ═══ Features ═══
export interface Feature {
  icon: LucideIcon;
  title: string;
  pidgin: string;
  description: string;
}

export const FEATURES: Feature[] = [
  {
    icon: Search,
    title: "Uncover The Truth",
    pidgin: "Find any record wey government hide",
    description:
      "Search through budget documents, federal contractor payments, and corruption records. Find specific allocations, track how public money is spent, and stay informed on public institutions.",
  },
  {
    icon: MessageSquare,
    title: "Ask in Plain Language",
    pidgin: "Just ask like you dey talk to person",
    description:
      "No need to read thousands of complex pages. Just ask questions in everyday English or Pidgin about budgets or corruption cases, and get clear answers backed by real data.",
  },
  {
    icon: BarChart3,
    title: "Track Accountability",
    pidgin: "See who dey do well and who dey mess up",
    description:
      "Compare how different states allocate funds, track real-time payments through GovSpend, and monitor ongoing corruption investigations. Spot trends and hold leaders accountable.",
  },
  {
    icon: Shield,
    title: "100% Transparent",
    pidgin: "Everything dey open, nothing dey hide",
    description:
      "All data comes from publicly available government budget documents, financial portals, and official anti-corruption agencies. Every answer includes verifiable sources.",
  },
];

// ═══ Shuffler Card items (Our Datasets) ═══
export const SHUFFLER_ITEMS = [
  {
    label: "Budgets",
    amount: "700+ Docs",
    change: "36 States",
    icon: "Building2",
  },
  {
    label: "Corruption",
    amount: "Active",
    change: "EFCC & ICPC",
    icon: "ShieldAlert",
  },
  {
    label: "GovSpend",
    amount: "Daily",
    change: "Contractors",
    icon: "BarChart3",
  },
  {
    label: "Institutions",
    amount: "Coming",
    change: "MDAs",
    icon: "Building2",
  },
  {
    label: "Senate Bills",
    amount: "Coming",
    change: "Legislation",
    icon: "MessageSquare",
  },
  { label: "Projects", amount: "Live", change: "Tracking", icon: "HeartPulse" },
] as const;

// ═══ Typewriter Card messages ═══
export const TYPEWRITER_MESSAGES = [
  "> Analyzing federal budget allocations...",
  "> Tracking new GovSpend contractor payments...",
  "> Corruption case found: EFCC v. Former Officials...",
  "> Senate bills data pipeline initialized...",
  "> 36 states + FCT processed. Millions of records indexed.",
  "> Ready to build a better Nigeria with you.",
] as const;

// ═══ Explorer Card geo-zones ═══
export const GEO_ZONES = [
  { name: "NC", full: "North-Central", states: 7 },
  { name: "NE", full: "North-East", states: 6 },
  { name: "NW", full: "North-West", states: 7 },
  { name: "SE", full: "South-East", states: 5 },
  { name: "SS", full: "South-South", states: 6 },
  { name: "SW", full: "South-West", states: 6 },
] as const;

// ═══ Protocol (sticky stacking) steps ═══
export const PROTOCOL_STEPS = [
  {
    step: 1,
    mono: "01",
    title: "Budgets & Spending",
    description:
      "Explore federal and state budgets, track daily contractor payments through GovSpend, and see exactly where public funds are allocated. No jargon, just clear numbers.",
  },
  {
    step: 2,
    mono: "02",
    title: "Corruption Cases",
    description:
      "Stay informed about ongoing investigations, court filings, and convictions by anti-corruption agencies like the EFCC and ICPC. Hold leaders accountable.",
  },
  {
    step: 3,
    mono: "03",
    title: "Institutions & Bills",
    description:
      "Track the performance of public institutions, monitor the activities of Senators and HOR members, and read updates on new bills and legislation.",
  },
] as const;

// ═══ Showcase questions ═══
export interface ShowcaseQuestion {
  category: string;
  question: string;
  pidgin: string;
  preview: string;
}

export const SHOWCASE_QUESTIONS: ShowcaseQuestion[] = [
  {
    category: "Senate Bills",
    question: "Which bills have been passed related to education this year?",
    pidgin: "Which new law them make for school matter?",
    preview:
      "Several bills concerning education have been introduced, including the Student Loan Expansion Act and the Tertiary Education Trust Fund Amendment Bill, aiming to improve...",
  },
  {
    category: "Corruption",
    question:
      "What are the latest corruption cases involving former public officials?",
    pidgin: "Which ex-government people EFCC dey investigate?",
    preview:
      "Recent corruption cases involve allegations of misappropriation of public funds, money laundering, and contract fraud. The EFCC has successfully secured convictions in...",
  },
  {
    category: "GovSpend",
    question: "Show me the recent payments made by the Ministry of Works",
    pidgin: "Who the Ministry of Works pay money to recently?",
    preview:
      "According to recent GovSpend data, the Ministry of Works disbursed payments to several contractors for ongoing road rehabilitation projects across the South-West and...",
  },
];

export const LOTTIE_URLS = {
  hero: "https://lottie.host/4db68bbd-31f6-4cd8-84eb-189571bc1ba7/MKIVFowKKi.lottie",
  aiSearch:
    "https://lottie.host/f4eb0b92-3661-4670-870c-9786-6f5f0000/WxMUjKKZ9V.lottie",
  data: "https://lottie.host/b2f0c8e0-ee2c-4a1f-9e35-c8bf4e0f9c8a/example.lottie",
  budget:
    "https://lottie.host/b2f0c8e0-ee2c-4a1f-9e35-c8bf4e0f9c8a/budget.lottie", // Needs real URL or use local
  corruption:
    "https://lottie.host/b2f0c8e0-ee2c-4a1f-9e35-c8bf4e0f9c8a/corruption.lottie", // Needs real URL or use local
  institutions:
    "https://lottie.host/b2f0c8e0-ee2c-4a1f-9e35-c8bf4e0f9c8a/institutions.lottie", // Needs real URL or use local
  bills:
    "https://lottie.host/b2f0c8e0-ee2c-4a1f-9e35-c8bf4e0f9c8a/bills.lottie", // Needs real URL or use local
} as const;

// ═══ Coverage ═══
// Structural counts fixed by Nigeria's own delimitation — these do NOT drift with
// data entry, which is why they're safe to bake into statically-generated pages and
// Open Graph cards. Live counts (officials tracked, photos on file) belong in a
// server fetch, not here: see COVERAGE_SNAPSHOT_DATE for figures that DO go stale.
export const COVERAGE = {
  wards: "8,807",
  lgas: "774",
  seats: "2,317",
  constituencies: "1,468",
  states: "37",
} as const;
