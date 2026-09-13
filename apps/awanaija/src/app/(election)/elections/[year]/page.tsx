import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { ComingSoon } from "../../_component/ComingSoon";
import { daysToGoFor, ELECTION_CYCLES, getCoverage, parseYear } from "../../_lib";

// Hourly, so the day counter stays honest without re-rendering per request.
export const revalidate = 3600;

type Props = { params: Promise<{ year: string }> };

export function generateStaticParams() {
  return ELECTION_CYCLES.map((year) => ({ year: String(year) }));
}

/**
 * The hub for one election cycle. Still a holding page: the ticket pages below
 * it carry the content, and this level has nothing of its own yet.
 *
 * Kept out of search while it says "coming soon" — a page per cycle with no
 * content of its own is exactly the thin content that earns a manual action.
 * Drop `robots` when there is something here.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const year = parseYear((await params).year);
  // An uncovered cycle never renders — the page redirects — but generateMetadata
  // runs first and still needs an answer that doesn't throw.
  if (year === null) return { robots: { index: false, follow: true } };

  return {
    title: `${year} Elections — Coming Soon | OurNigeria`,
    description: `Every candidate and every party contesting the ${year} Nigerian general election, built seat by seat from primary results and public records.`,
    alternates: { canonical: `/elections/${year}` },
    robots: { index: false, follow: true },
  };
}

export default async function ElectionYearPage({ params }: Props) {
  // A cycle we don't cover, a non-year, an out-of-range year — one answer.
  // Previously this 404'd for `/elections/99999` but rendered a holding page for
  // `/elections/2043`; both are now the same question with the same answer.
  const year = parseYear((await params).year);
  if (year === null) redirect("/elections");

  const coverage = await getCoverage(revalidate);
  const daysToGo = await daysToGoFor(year);

  return (
    <PageLayout navLabel={`${year} Elections`}>
      <ComingSoon
        eyebrow={`${year} general election${daysToGo === null ? "" : ` · ${daysToGo} days to go`}`}
        lede={`Every party contesting ${year}, and every candidate they are running — president down to ward councillor. We dey build am seat by seat.`}
        status={["1 of 7 seats filled", "presidential race confirmed", coverage]}
      />
    </PageLayout>
  );
}
