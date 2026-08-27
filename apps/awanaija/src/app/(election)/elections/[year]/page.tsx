import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { ComingSoon } from "../../_component/ComingSoon";
import { daysToGoFor, getCoverage, parseYear } from "../../_lib";

// Hourly, so the day counter stays honest without re-rendering per request.
export const revalidate = 3600;

type Props = { params: Promise<{ year: string }> };

/**
 * The hub for one election cycle. A holding page for now: the campaign pages
 * below it (`/elections/<year>/<party>`) are still being designed, so there is
 * nothing yet for this page to index.
 *
 * Kept out of search while it says "coming soon" — a page per cycle with no
 * content of its own is exactly the thin content that earns a manual action.
 * Drop `robots` when there is something here.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const year = parseYear((await params).year);
  if (year === null) return {};
  return {
    title: `${year} Elections — Coming Soon | OurNigeria`,
    description: `Every candidate and every party contesting the ${year} Nigerian general election, built seat by seat from primary results and public records.`,
    alternates: { canonical: `/elections/${year}` },
    robots: { index: false, follow: true },
  };
}

export default async function ElectionYearPage({ params }: Props) {
  const year = parseYear((await params).year);
  if (year === null) notFound();

  const coverage = await getCoverage(revalidate);
  const daysToGo = daysToGoFor(year);

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
