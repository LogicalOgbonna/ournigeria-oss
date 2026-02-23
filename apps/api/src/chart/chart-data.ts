import type { ChartDataPoint, TrendDataPoint } from '../types';

// Same colors as apps/web/src/lib/constants.ts
const SECTOR_COLORS: Record<string, string> = {
  education: '#059669',
  health: '#0891b2',
  infrastructure: '#d97706',
  agriculture: '#65a30d',
  other: '#94a3b8',
  transportation: '#e11d48',
  'works & infrastructure': '#d97706',
  environment: '#16a34a',
  'commerce & industry': '#0284c7',
  'general administration': '#7c3aed',
  'works & housing': '#ea580c',
  'water resources': '#06b6d4',
  'youth & sports': '#dc2626',
  'debt service': '#64748b',
  'social welfare': '#a855f7',
  'housing & urban dev': '#f59e0b',
  works: '#d97706',
  security: '#ef4444',
};

const CHART_COLORS = [
  '#059669', '#0891b2', '#d97706', '#65a30d', '#7c3aed',
  '#e11d48', '#0284c7', '#ea580c', '#4f46e5', '#be185d',
];

const MULTIPLIERS: Record<string, number> = {
  trillion: 1e12, t: 1e12,
  billion: 1e9, b: 1e9,
  million: 1e6, m: 1e6,
};

interface BarChartResult {
  title: string;
  data: ChartDataPoint[];
  unit?: string;
}

interface DonutChartResult {
  title: string;
  data: ChartDataPoint[];
}

interface TrendLineResult {
  title: string;
  data: TrendDataPoint[];
  lines: { key: string; color: string; label: string }[];
}

/**
 * Extract bar chart data from analysis text.
 * Looks for sector-amount pairs like "Education: ₦150B" or "Health: NGN 80 billion".
 */
export function extractBarChart(text: string): BarChartResult | undefined {
  const sectorAmountPattern =
    /(?:^|\n)\s*[-*•]?\s*\**([A-Za-z &]+?)\**\s*[:–—-]\s*(?:NGN|₦|N)\s*([\d,.]+)\s*(trillion|billion|million|T|B|M)\b/gi;

  const items: ChartDataPoint[] = [];
  const seen = new Set<string>();
  let match;

  while ((match = sectorAmountPattern.exec(text)) !== null) {
    const name = match[1].trim();
    const num = parseFloat(match[2].replace(/,/g, ''));
    const unit = match[3].toLowerCase();
    const value = num * (MULTIPLIERS[unit] ?? 1);
    const key = name.toLowerCase();

    if (seen.has(key) || value <= 0) continue;
    seen.add(key);

    items.push({
      name,
      value,
      color: SECTOR_COLORS[key] ?? CHART_COLORS[items.length % CHART_COLORS.length],
    });

    if (items.length >= 8) break;
  }

  if (items.length < 2) return undefined;

  items.sort((a, b) => b.value - a.value);

  return {
    title: 'Budget Allocation by Sector',
    data: items,
    unit: 'naira',
  };
}

/**
 * Extract donut chart data — same extraction as barChart but only when
 * text describes a breakdown/composition (single-state analysis).
 */
export function extractDonutChart(text: string): DonutChartResult | undefined {
  const lower = text.toLowerCase();
  const isBreakdown =
    lower.includes('breakdown') ||
    lower.includes('composition') ||
    lower.includes('allocation') ||
    lower.includes('distributed');

  if (!isBreakdown) return undefined;

  const bar = extractBarChart(text);
  if (!bar || bar.data.length < 2) return undefined;

  const stateMatch = text.match(
    /\b(Lagos|Kano|Rivers|Delta|Ogun|Kaduna|Benue|FCT|Akwa Ibom|Edo|Enugu|Oyo|Imo|Anambra|Abia|Bayelsa|Borno|Cross River|Ebonyi|Ekiti|Gombe|Jigawa|Katsina|Kebbi|Kogi|Kwara|Nasarawa|Niger|Ondo|Osun|Plateau|Sokoto|Taraba|Yobe|Zamfara|Adamawa|Bauchi)\b/i,
  );
  const yearMatch = text.match(/\b(20(?:19|20|21|22|23|24|25))\b/);

  const titleParts = [
    stateMatch ? stateMatch[1] : '',
    'Budget Breakdown',
    yearMatch ? `(${yearMatch[1]})` : '',
  ].filter(Boolean);

  return {
    title: titleParts.join(' '),
    data: bar.data,
  };
}

/**
 * Extract trend line data when multiple years' figures are mentioned.
 * Looks for "2024: ₦1.2T" style patterns.
 */
export function extractTrendLine(text: string): TrendLineResult | undefined {
  const yearAmountPattern =
    /\b(20(?:19|20|21|22|23|24|25))\b\s*[:–—-]\s*(?:NGN|₦|N)\s*([\d,.]+)\s*(trillion|billion|million|T|B|M)\b/gi;

  const yearMap = new Map<number, number>();
  let match;

  while ((match = yearAmountPattern.exec(text)) !== null) {
    const year = parseInt(match[1]);
    const num = parseFloat(match[2].replace(/,/g, ''));
    const unit = match[3].toLowerCase();
    const value = num * (MULTIPLIERS[unit] ?? 1);

    if (!yearMap.has(year) && value > 0) {
      yearMap.set(year, value);
    }
  }

  if (yearMap.size < 2) return undefined;

  const sortedYears = Array.from(yearMap.entries()).sort(([a], [b]) => a - b);

  const data: TrendDataPoint[] = sortedYears.map(([year, total]) => ({
    year,
    total,
  }));

  const stateMatch = text.match(
    /\b(Lagos|Kano|Rivers|Delta|Ogun|Kaduna|Benue|FCT|Akwa Ibom|Edo|Enugu|Oyo|Imo|Anambra)\b/i,
  );

  return {
    title: `${stateMatch ? stateMatch[1] + ' ' : ''}Budget Trend (${sortedYears[0][0]}–${sortedYears[sortedYears.length - 1][0]})`,
    data,
    lines: [{ key: 'total', color: '#059669', label: 'Total Budget' }],
  };
}
