import {
  Search,
  MessageSquare,
  BarChart3,
  Shield,
  type LucideIcon,
} from "lucide-react";

export const APP_URL = "https://app.awanaija.ng";

// ═══ Stats ═══
export const STATS = [
  { value: 36, suffix: "+", label: "States Covered", pidgin: "All 36 states plus FCT" },
  { value: 700, suffix: "+", label: "Budget Documents", pidgin: "PDFs, spreadsheets, and more" },
  { value: 708000, suffix: "+", label: "Data Points", pidgin: "Analyzed and ready to query" },
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
    title: "Search Any Budget",
    pidgin: "Find any money wey government allocate",
    description:
      "Search through 700+ budget documents across all 36 states and FCT. Find specific allocations, compare spending, and track where public money goes.",
  },
  {
    icon: MessageSquare,
    title: "Ask in Plain Language",
    pidgin: "Just ask like you dey talk to person",
    description:
      "No need to read thousands of pages. Just ask questions in everyday English or Pidgin, and get clear answers backed by real budget data.",
  },
  {
    icon: BarChart3,
    title: "Compare States",
    pidgin: "See which state dey spend pass for education",
    description:
      "Compare how different states allocate funds for health, education, infrastructure, and more. Spot trends and hold leaders accountable.",
  },
  {
    icon: Shield,
    title: "100% Transparent",
    pidgin: "Everything dey open, nothing dey hide",
    description:
      "All data comes from publicly available government budget documents. Every answer includes sources so you can verify for yourself.",
  },
];

// ═══ Shuffler Card items ═══
export const SHUFFLER_ITEMS = [
  { label: "Education", amount: "₦150.2B", change: "+12.4%", icon: "GraduationCap" },
  { label: "Healthcare", amount: "₦132.8B", change: "+8.7%", icon: "HeartPulse" },
  { label: "Infrastructure", amount: "₦89.4B", change: "+15.2%", icon: "Building2" },
] as const;

// ═══ Typewriter Card messages ═══
export const TYPEWRITER_MESSAGES = [
  "> Analyzing Lagos State 2024 budget...",
  "> Education: ₦150.2B allocated (+12.4% YoY)",
  "> Health sector: 13.5% of total spending",
  "> Top project: Kano-Wudil Expressway — ₦18.5B",
  "> 36 states processed. 708,309 data points indexed.",
  "> Ready for your questions.",
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
    title: "Ask Anything",
    description:
      "Type your question about Nigerian government spending in plain English or Pidgin. No jargon, no login, no barriers.",
  },
  {
    step: 2,
    mono: "02",
    title: "AI Analyzes Everything",
    description:
      "Our AI searches through 708,000+ data points across 700+ official budget documents from all 36 states and the FCT.",
  },
  {
    step: 3,
    mono: "03",
    title: "Get Sourced Answers",
    description:
      "Receive clear answers backed by real data. Every figure includes its source document so you can verify for yourself.",
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
    category: "Education",
    question: "How much did Lagos State budget for education in 2024?",
    pidgin: "How much Lagos put for school money?",
    preview:
      "Lagos State allocated ₦150.2 billion to education in the 2024 fiscal year, representing 15.3% of the total budget. This includes ₦89.4B for recurrent expenditure and ₦60.8B for capital projects...",
  },
  {
    category: "Health",
    question: "Compare health spending across South-West states",
    pidgin: "Which state for South-West dey spend pass for hospital?",
    preview:
      "Among South-West states, Lagos leads health spending at ₦132.8B, followed by Oyo at ₦45.6B and Ogun at ₦38.2B. Ekiti dedicates the highest proportion at 16.1%...",
  },
  {
    category: "Infrastructure",
    question: "What are the biggest capital projects in Kano State?",
    pidgin: "Wetin be the biggest project wey Kano dey do?",
    preview:
      "Kano State's largest capital projects for 2024 include the Kano-Wudil Expressway rehabilitation (₦18.5B), the Challawa Industrial Estate expansion (₦12.3B)...",
  },
];

export const LOTTIE_URLS = {
  hero: "https://lottie.host/4db68bbd-31f6-4cd8-84eb-189571bc1ba7/MKIVFowKKi.lottie",
  aiSearch: "https://lottie.host/f4eb0b92-3661-4670-870c-9786-6f5f0000/WxMUjKKZ9V.lottie",
  data: "https://lottie.host/b2f0c8e0-ee2c-4a1f-9e35-c8bf4e0f9c8a/example.lottie",
} as const;
