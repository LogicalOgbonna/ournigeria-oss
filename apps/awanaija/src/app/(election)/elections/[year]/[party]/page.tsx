import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { ComingSoon } from "../../../_component/ComingSoon";
import { daysToGoFor, getCoverage, parseParty, parseYear } from "../../../_lib";

// Hourly, so the day counter stays honest without re-rendering per request.
export const revalidate = 3600;

type Props = { params: Promise<{ year: string; party: string }> };

/**
 * A party's campaign page for one cycle — where every poster on the homepage
 * hero points. Holding page: the design is still in progress.
 *
 * Kept out of search until it has content. This route is one page per party per
 * cycle, so indexing it while every one of them says the same thing would put
 * dozens of near-identical pages in the index. Drop `robots` when the real page
 * lands.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year: rawYear, party: rawParty } = await params;
  const year = parseYear(rawYear);
  const party = parseParty(rawParty);
  if (year === null || party === null) return {};
  return {
    title: `${party} — ${year} Campaign | OurNigeria`,
    description: `The ${party} campaign for the ${year} Nigerian general election: who they are running, where, and what the public record says about them.`,
    alternates: { canonical: `/elections/${year}/${party}` },
    robots: { index: false, follow: true },
  };
}

export default async function PartyCampaignPage({ params }: Props) {
  const { year: rawYear, party: rawParty } = await params;
  const year = parseYear(rawYear);
  const party = parseParty(rawParty);
  if (year === null || party === null) notFound();

  const coverage = await getCoverage(revalidate);
  const daysToGo = daysToGoFor(year);

  return (
    <PageLayout navLabel={`${party} ${year}`}>
      <ComingSoon
        eyebrow={`${party} · ${year} campaign${daysToGo === null ? "" : ` · ${daysToGo} days to go`}`}
        lede={`The ${party} campaign for ${year} — who they are running for every seat, and what the public record already says about them. We dey build am seat by seat.`}
        status={[`${party} · ${year}`, "campaign page in design", coverage]}
      />
    </PageLayout>
  );
}
