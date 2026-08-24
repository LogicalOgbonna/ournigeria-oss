import { notFound } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { PartyProfile } from "./_component/PartyProfile";
import { StructuredData } from "./_seo/structured-data";
import { getParty, SITE_URL, partyMediaLinks } from "./utils";

export { generateMetadata } from "./_seo/util";

export default async function PartyPage({
  params,
}: {
  params: Promise<{ acronym: string }>;
}) {
  const { acronym } = await params;
  const party = await getParty(acronym);
  if (!party) notFound();

  const url = `${SITE_URL}/parties/${party.acronym}`;
  const { image, sameAs } = partyMediaLinks(party);

  return (
    <PageLayout bare navLabel={party.name ?? party.acronym} className="bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.10_0.005_160)]">
      <StructuredData party={party} url={url} image={image} sameAs={sameAs} />
      <PartyProfile party={party} />
    </PageLayout>
  );
}
