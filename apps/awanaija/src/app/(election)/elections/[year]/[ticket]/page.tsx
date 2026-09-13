import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect, redirect } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { getOfficialById } from "@/lib/api";
import { CAMPAIGNS_REVALIDATE, toOfficialRecords, type OfficialRecords, type RaceLabel } from "@/lib/campaigns";
import type { RailCandidate } from "@/lib/home-ballot";
import { roleLabel } from "@/lib/roles";
import type { TicketProfile as Profile } from "@/lib/presidential-profiles-2027";
import {
  ELECTION_CYCLES,
  parseParty,
  parseYear,
  slugsIn,
  ticketBySlug,
  ticketsFor,
} from "../../../_lib";
import { TicketProfile } from "./_component/TicketProfile";

// Keep in step with CAMPAIGNS_REVALIDATE (Next needs a literal here, not an
// import). Five minutes, like the homepage, so a seed run lands promptly.
export const revalidate = 300;

type Props = { params: Promise<{ year: string; ticket: string }> };

/**
 * The segment is the ticket slug (`tinubu-shettima`) — `campaigns.slug` in the
 * API. A party can field more than one ticket in a cycle, so the party acronym
 * cannot be the key. Acronym URLs still resolve (see `resolve`) so the older
 * `/elections/2027/APC` links and anything indexed under them keep working.
 *
 * If the API is unreachable at build time this returns nothing and the pages
 * render on demand instead of failing the build. (Page renders themselves DO
 * throw on a 5xx — see `get()` in lib/campaigns — so ISR keeps the last good
 * page rather than caching a redirect.)
 */
export async function generateStaticParams() {
  const params: { year: string; ticket: string }[] = [];
  for (const year of ELECTION_CYCLES) {
    try {
      for (const ticket of await slugsIn(year)) params.push({ year: String(year), ticket });
    } catch {
      // API down at build time: no prerender for this cycle, render on demand.
    }
  }
  return params;
}

type Hit =
  | {
      readonly kind: "ticket";
      readonly year: number;
      readonly ticket: RailCandidate;
      readonly profile: Profile | null;
      readonly candidateSlug: string | null;
      readonly race: RaceLabel;
    }
  | { readonly kind: "party"; readonly year: number; readonly acronym: string; readonly tickets: readonly RailCandidate[] }
  | { readonly kind: "none"; readonly year: number };

/** Resolve the segments once; both `generateMetadata` and the page need it. */
async function resolve(rawYear: string, rawTicket: string): Promise<Hit | null> {
  const year = parseYear(rawYear);
  if (year === null) return null;

  const slug = decodeURIComponent(rawTicket).trim().toLowerCase();
  const hit = await ticketBySlug(year, slug);
  if (hit) return { kind: "ticket", year, ...hit };

  // Legacy shape: a party acronym. One ticket → redirect to its slug; several →
  // let the reader pick; none → the cycle page.
  const acronym = await parseParty(rawTicket, year);
  if (acronym) return { kind: "party", year, acronym, tickets: await ticketsFor(year, acronym) };

  return { kind: "none", year };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year: rawYear, ticket: rawTicket } = await params;
  const hit = await resolve(rawYear, rawTicket);

  // Redirects and the party chooser never index; generateMetadata runs before
  // the page and still needs an answer that doesn't throw.
  if (!hit || hit.kind !== "ticket") {
    return { robots: { index: false, follow: true } };
  }

  const { year, ticket, profile, race } = hit;
  const acronym = ticket.party.acronym;
  const names = [ticket.candidate.name, ticket.mate?.name].filter(Boolean).join(" & ");
  const partyName = ticket.party.name ?? acronym;

  return {
    title: `${names} — ${acronym} · ${year} ${race.noun}${race.seat ? ` · ${race.seat}` : ""} | OurNigeria`,
    description:
      profile?.visionLine ||
      `${names} ${ticket.mate ? "are" : "is"} standing for ${partyName} in the ${year} ${race.seat ? `${race.seat} ` : ""}${race.noun}.`,
    alternates: { canonical: `/elections/${year}/${ticket.id}` },
    openGraph: {
      title: `${names} — ${acronym}`,
      images: ticket.candidate.imageUrl ? [ticket.candidate.imageUrl] : undefined,
    },
    // Indexable once there is a profile behind it. Without one the page is the
    // ticket pair and little else, which across 17 tickets is thin content — so
    // those stay noindex until the campaign row carries copy (vision, quote,
    // bio or a document), which flips this with no code change.
    robots: profile ? undefined : { index: false, follow: true },
  };
}

export default async function TicketPage({ params }: Props) {
  const { year: rawYear, ticket: rawTicket } = await params;
  const hit = await resolve(rawYear, rawTicket);

  // A cycle we don't cover → the section index.
  if (!hit) redirect("/elections");
  // Neither a ticket nor a party standing in this cycle → the cycle we do cover.
  if (hit.kind === "none") redirect(`/elections/${hit.year}`);

  if (hit.kind === "party") {
    if (hit.tickets.length === 0) redirect(`/elections/${hit.year}`);
    // The common case: one ticket per party. 308 so the old acronym URL hands
    // its ranking to the slug URL instead of splitting it.
    if (hit.tickets.length === 1) permanentRedirect(`/elections/${hit.year}/${hit.tickets[0].id}`);
    return <PartyTickets year={hit.year} acronym={hit.acronym} tickets={hit.tickets} />;
  }

  const { year, ticket, profile, candidateSlug, race } = hit;
  const records = await officialRecords(candidateSlug);

  return (
    <PageLayout
      bare
      navLabel={`${ticket.party.acronym} ${year} ticket`}
      className="bg-background dark:bg-[#030403]"
    >
      <main>
        <TicketProfile ticket={ticket} profile={profile} records={records} year={year} race={race} />
      </main>
    </PageLayout>
  );
}

/**
 * Political career + education join on the candidate's official record. A
 * candidate with no record (or a 404 / unreachable API) simply gets no cards.
 */
async function officialRecords(slug: string | null): Promise<OfficialRecords> {
  if (!slug) return { career: [], education: [] };
  try {
    const official = await getOfficialById(slug, { next: { revalidate: CAMPAIGNS_REVALIDATE } } as RequestInit);
    return toOfficialRecords(official as Parameters<typeof toOfficialRecords>[0], roleLabel);
  } catch {
    return { career: [], education: [] };
  }
}

/**
 * A party with more than one ticket in the cycle — rival slates from a
 * factional dispute. Say so and list them; picking one silently would take a
 * side in a live political fight.
 */
function PartyTickets({
  year,
  acronym,
  tickets,
}: {
  readonly year: number;
  readonly acronym: string;
  readonly tickets: readonly RailCandidate[];
}) {
  const partyName = tickets[0]?.party.name ?? acronym;
  return (
    <PageLayout navLabel={`${acronym} ${year} tickets`}>
      <main className="mx-auto w-full max-w-3xl px-6 pb-24 pt-28 lg:px-8">
        <p className="font-mono text-[10px] uppercase leading-[15px] tracking-[1px] text-muted-foreground">
          {year} elections · Presidential
        </p>
        <h1 className="mt-4 font-serif text-[32px] italic leading-tight text-foreground lg:text-[48px]">
          {partyName} <span className="text-emerald-600 dark:text-emerald-400">({acronym})</span> has{" "}
          {tickets.length} tickets
        </h1>
        <p className="mt-4 max-w-[620px] text-base leading-relaxed text-muted-foreground">
          More than one slate is claiming this party&apos;s flag for {year}. We list every
          ticket we can source rather than pick a side; INEC&apos;s final candidate list
          settles it.
        </p>
        <ul className="mt-10 flex flex-col gap-4">
          {tickets.map((t) => {
            const names = [t.candidate.name, t.mate?.name].filter(Boolean).join(" & ");
            return (
              <li key={t.id}>
                <Link
                  href={`/elections/${year}/${t.id}`}
                  className="block rounded-[12px] border border-border bg-card p-6 transition-colors hover:border-emerald-600 dark:border-[#3c4a3f] dark:bg-[#060a08] dark:hover:border-emerald-400"
                >
                  <span className="block font-heading text-xl font-semibold text-foreground">{names}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    See the {year} ticket
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </PageLayout>
  );
}
