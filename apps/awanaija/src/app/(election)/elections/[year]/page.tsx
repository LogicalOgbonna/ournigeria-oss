import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { ELECTION_CYCLES, parseYear } from "../../_lib";
import { ComingSoon } from "./_component/ComingSoon";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:3000/api";

/**
 * Polling day per cycle, keyed by year so adding a cycle to `ELECTION_CYCLES`
 * has one obvious place to add its date.
 *
 * TODO(election-date): confirm against INEC before the 2027 cycle. PROGRESS.md
 * records 2027-02-20 for the presidential/NASS poll, but a live PostHog gate
 * payload carries 2027-02-27. The countdown on this page is only as right as
 * this constant.
 */
const POLLING_DAY: Record<number, number> = {
  2027: Date.UTC(2027, 1, 20),
};

// Hourly, so the day counter stays honest without re-rendering per request.
export const revalidate = 3600;

export function generateStaticParams() {
  return ELECTION_CYCLES.map((year) => ({ year: String(year) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year: raw } = await params;
  const year = parseYear(raw);
  // An uncovered cycle never renders — the page redirects — but generateMetadata
  // runs first, so it needs an answer that doesn't throw.
  if (year === null) return { robots: { index: false, follow: true } };

  return {
    title: `${year} Elections — Coming Soon | OurNigeria`,
    description:
      "Your whole ballot — president down to ward councillor, for wherever you live. We're building it seat by seat from primary results and public records.",
    alternates: { canonical: `/elections/${year}` },
    // Still a holding page: one screen of copy behind a real URL. Drop this key
    // when the cycle page renders its actual contests.
    robots: { index: false, follow: true },
  };
}

/** Same shape and fallback the homepage's coverage tiles use. */
async function getCoverage(): Promise<string> {
  const fallback = { states: 36, lgas: 774, wards: 8809 };
  const stats = await fetch(`${API_BASE}/geo/stats`, {
    next: { revalidate },
  } as RequestInit)
    .then((res) => (res.ok ? res.json() : fallback))
    .catch(() => fallback);

  const n = (v: number) => v.toLocaleString("en-NG");
  return `${stats.states ?? 36} states + FCT · ${n(stats.lgas ?? 774)} LGAs · ${n(stats.wards ?? 8809)} wards`;
}

function daysUntil(target: number): number {
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.round((target - today) / 86_400_000));
}

export default async function ElectionCyclePage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: raw } = await params;

  // A cycle we don't cover, a non-year, an out-of-range year — one answer.
  const year = parseYear(raw);
  if (year === null) redirect("/elections");

  const coverage = await getCoverage();

  return (
    <PageLayout navLabel={`${year} Election`}>
      <ComingSoon year={year} daysToGo={daysUntil(POLLING_DAY[year])} coverage={coverage} />
    </PageLayout>
  );
}
