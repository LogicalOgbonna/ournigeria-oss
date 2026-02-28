/**
 * Rule-based classifiers for budget document chunks.
 * Pure regex — no LLM cost.
 */

// ─── Functional classification codes (Nigerian budget standard) ──

const FUNCTIONAL_CODE_MAP: Record<string, string> = {
  '701': 'general_administration',
  '702': 'defence',
  '703': 'public_order',
  '704': 'economic_affairs',
  '705': 'environment',
  '706': 'housing',
  '707': 'health',
  '708': 'recreation',
  '709': 'education',
  '710': 'social_protection',
};

// ─── Sector keyword definitions ──────────────────────────────────

const SECTOR_KEYWORDS: Record<string, string[]> = {
  education: [
    'education', 'school', 'university', 'polytechnic', 'college',
    'ubec', 'tetfund', 'subeb', 'scholarship', 'learning',
    'teacher', 'pupil', 'student', 'classroom', 'curriculum',
  ],
  health: [
    'health', 'hospital', 'medical', 'pharmaceutical', 'primary health',
    'nhis', 'nphcda', 'doctor', 'nurse', 'clinic', 'disease',
    'maternal', 'immunization', 'vaccine',
  ],
  infrastructure: [
    'infrastructure', 'road', 'bridge', 'highway', 'construction',
    'building', 'renovation', 'rehabilitation', 'flyover',
  ],
  agriculture: [
    'agriculture', 'farming', 'livestock', 'fishery', 'irrigation',
    'crop', 'agric', 'rural development', 'fadama',
  ],
  water_resources: [
    'water supply', 'water resources', 'borehole', 'dam',
    'water treatment', 'sanitation', 'wash',
  ],
  transportation: [
    'transport', 'aviation', 'railway', 'rail', 'airport', 'seaport',
    'maritime', 'shipping', 'ferry',
  ],
  energy: [
    'power', 'energy', 'electricity', 'solar', 'gas', 'nerc',
    'transmission', 'generation', 'electrification',
  ],
  defence: [
    'defence', 'defense', 'military', 'army', 'navy', 'air force',
    'armed forces', 'security',
  ],
  environment: [
    'environment', 'forestry', 'climate', 'ecology', 'erosion',
    'pollution', 'waste management',
  ],
  housing: [
    'housing', 'estate', 'urban development', 'urban renewal',
    'settlement', 'fmbn',
  ],
  works: [
    'works', 'public works', 'ministry of works',
  ],
  science_technology: [
    'science', 'technology', 'ict', 'digital', 'innovation',
    'research', 'nitda',
  ],
  justice: [
    'justice', 'judiciary', 'court', 'legal', 'attorney general',
    'law reform',
  ],
  youth_sports: [
    'youth', 'sports', 'sport', 'stadium', 'national youth service',
    'nysc',
  ],
  women_affairs: [
    'women', 'gender', 'child', 'social welfare',
  ],
  trade_investment: [
    'trade', 'commerce', 'investment', 'industry', 'sme',
    'enterprise', 'export',
  ],
  social_protection: [
    'pension', 'social protection', 'social investment', 'n-power',
    'conditional cash transfer', 'social register',
  ],
};

// ─── classifySector ──────────────────────────────────────────────

export function classifySector(text: string): string {
  const lower = text.toLowerCase();

  // Priority 1: functional classification codes
  for (const [code, sector] of Object.entries(FUNCTIONAL_CODE_MAP)) {
    if (new RegExp(`\\b${code}\\b`).test(lower)) {
      return sector;
    }
  }

  // Priority 2: keyword density scoring
  let bestSector = 'general';
  let bestScore = 0;

  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestSector = sector;
    }
  }

  return bestScore >= 2 ? bestSector : 'general';
}

// ─── classifyBudgetCategory ──────────────────────────────────────

const BUDGET_CATEGORY_PATTERNS: Array<[RegExp, string]> = [
  [/\bcapital\s+(expenditure|budget|allocation|project|spending)\b/i, 'capital'],
  [/\brecurrent\s+(expenditure|budget|allocation|spending)\b/i, 'recurrent'],
  [/\bpersonnel\s+(cost|expenditure|emolument|salary|salaries|wages)\b/i, 'personnel'],
  [/\b(overhead|admin(?:istrative)?\s+cost|running\s+cost)\b/i, 'overhead'],
  [/\bcapital\b/i, 'capital'],
  [/\brecurrent\b/i, 'recurrent'],
];

export function classifyBudgetCategory(text: string): string {
  for (const [pattern, category] of BUDGET_CATEGORY_PATTERNS) {
    if (pattern.test(text)) return category;
  }
  return 'general';
}

// ─── classifyDocumentType ────────────────────────────────────────

const DOCUMENT_TYPE_PATTERNS: Array<[RegExp, string]> = [
  [/\bapproved\s+budget\b/i, 'approved_budget'],
  [/\bappropriation\s+(act|bill|law)\b/i, 'appropriation_act'],
  [/\bbudget\s+estimate/i, 'budget_estimate'],
  [/\bimplementation\s+report\b/i, 'implementation_report'],
  [/\bbudget\s+performance\b/i, 'implementation_report'],
  [/\bcitizen'?s?\s+budget\b/i, 'citizens_budget'],
  [/\bbudget\s+proposal\b/i, 'budget_proposal'],
  [/\b(fiscal\s+strategy|mtff|mtss|mtef)\b/i, 'fiscal_strategy'],
  [/\bexecutive\s+summary\b/i, 'executive_summary'],
  [/\bbudget\s+breakdown\b/i, 'budget_breakdown'],
];

export function classifyDocumentType(text: string, filename: string): string {
  // Check filename first
  const combined = `${filename} ${text}`;
  for (const [pattern, docType] of DOCUMENT_TYPE_PATTERNS) {
    if (pattern.test(combined)) return docType;
  }
  return 'general';
}

// ─── extractMDA ──────────────────────────────────────────────────

const MDA_PATTERNS: RegExp[] = [
  /\b(Ministry\s+of\s+[\w\s,&]+?)(?:\s*[-–—]|\s*\n|\s*$)/i,
  /\b(Office\s+of\s+the\s+[\w\s,&]+?)(?:\s*[-–—]|\s*\n|\s*$)/i,
  /\b(Federal\s+[\w\s]+?Commission)\b/i,
  /\b(National\s+[\w\s]+?Commission)\b/i,
  /\b(National\s+[\w\s]+?Agency)\b/i,
  /\b(Federal\s+[\w\s]+?Authority)\b/i,
  /\b(National\s+[\w\s]+?Service)\b/i,
  /\b(Bureau\s+of\s+[\w\s]+?)(?:\s*[-–—]|\s*\n|\s*$)/i,
  /\b(Department\s+of\s+[\w\s]+?)(?:\s*[-–—]|\s*\n|\s*$)/i,
];

export function extractMDA(text: string): string {
  for (const pattern of MDA_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      // Trim trailing whitespace and limit length
      const mda = match[1].trim();
      if (mda.length > 5 && mda.length < 100) {
        return mda;
      }
    }
  }
  return '';
}
