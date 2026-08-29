import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { PROFILES_2027 } from "@/lib/presidential-profiles-2027";
import { ELECTION_CYCLES, parseParty, parseYear, partiesIn, ticketsFor } from "../../../_lib";
import { TicketProfile } from "./_component/TicketProfile";

// Static content behind static params — nothing here changes between requests
// except the computed ages, which only move once a year.
export const revalidate = 3600;

export function generateStaticParams() {
  return ELECTION_CYCLES.flatMap((year) =>
    partiesIn(year).map((acronym) => ({
      year: String(year),
      party: acronym.toLowerCase(),
    })),
  );
}

/** Resolve the segments once; both `generateMetadata` and the page need it. */
function resolve(rawYear: string, rawParty: string) {
  const year = parseYear(rawYear);
  if (year === null) return null;
  const acronym = parseParty(rawParty, year);
  if (!acronym) return { year, acronym: null, ticket: undefined, profile: null };

  // More than one ticket means the source data is wrong (NRM currently has two).
  // Render the first; see `ticketsFor` in `_lib`.
  const ticket = ticketsFor(year, acronym)[0];
  return { year, acronym, ticket, profile: PROFILES_2027[acronym] ?? null };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string; party: string }>;
}): Promise<Metadata> {
  const { year: rawYear, party: rawParty } = await params;
  const hit = resolve(rawYear, rawParty);

  // Both of these redirect before rendering, but generateMetadata runs first and
  // still needs an answer that doesn't throw.
  if (!hit || hit.acronym === null || !hit.ticket) {
    return { robots: { index: false, follow: true } };
  }

  const { year, acronym, ticket, profile } = hit;
  const names = [ticket.candidate.name, ticket.mate?.name].filter(Boolean).join(" & ");
  const partyName = ticket.party.name ?? acronym;

  return {
    title: `${names} — ${acronym} · ${year} presidential ticket | OurNigeria`,
    description:
      profile?.visionLine ??
      `${names} are standing for ${partyName} in the ${year} Nigerian presidential election.`,
    alternates: { canonical: `/elections/${year}/${acronym.toLowerCase()}` },
    openGraph: {
      title: `${names} — ${acronym}`,
      images: ticket.candidate.imageUrl ? [ticket.candidate.imageUrl] : undefined,
    },
    // Indexable once there is a profile behind it. Without one the page is the
    // ticket pair and little else, which across 16 parties is thin content — so
    // those stay noindex until they're filled in. Adding an acronym to
    // PROFILES_2027 flips this with no code change.
    robots: profile ? undefined : { index: false, follow: true },
  };
}

export default async function TicketPage({
  params,
}: {
  params: Promise<{ year: string; party: string }>;
}) {
  const { year: rawYear, party: rawParty } = await params;
  const hit = resolve(rawYear, rawParty);

  // A cycle we don't cover → the section index.
  if (!hit) redirect("/elections");
  // A party that isn't standing in this cycle → the cycle we do cover.
  if (hit.acronym === null || !hit.ticket) redirect(`/elections/${hit.year}`);

  const { year, ticket, profile } = hit;

  return (
    <PageLayout
      bare
      navLabel={`${ticket.party.acronym} ${year} ticket`}
      className="bg-background dark:bg-[#030403]"
    >
      <main>
        <TicketProfile ticket={ticket} profile={profile} year={year} />
      </main>
    </PageLayout>
  );
}
