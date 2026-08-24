import type { Metadata } from "next";
import { PageLayout } from "@/components/layout/PageLayout";
import { ComingSoon } from "./_component/ComingSoon";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:3000/api";

/**
 * TODO(election-date): confirm against INEC before the 2027 cycle. PROGRESS.md
 * records 2027-02-20 for the presidential/NASS poll, but a live PostHog gate
 * payload carries 2027-02-27. The countdown on this page is only as right as
 * this constant.
 */
const ELECTION_DAY = Date.UTC(2027, 1, 20);

// Hourly, so the day counter stays honest without re-rendering per request.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "2027 Elections — Coming Soon | OurNigeria",
  description:
    "Your whole 2027 ballot — president down to ward councillor, for wherever you live. We're building it seat by seat from primary results and public records.",
  alternates: { canonical: "/election" },
};

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

export default async function ElectionIndex() {
  const coverage = await getCoverage();

  return (
    <PageLayout navLabel="Election">
      <ComingSoon daysToGo={daysUntil(ELECTION_DAY)} coverage={coverage} />
    </PageLayout>
  );
}
