import { notFound, permanentRedirect } from "next/navigation";
import { OfficialProfile } from "./_component/OfficialProfile";
import { StructuredData } from "./_seo/structured-data";
import { PageLayout } from "@/components/layout/PageLayout";

import { formatOfficialLocation } from "@/lib/api";
import { SITE_URL, getOfficial, roleLabel, absoluteImage, getPeers } from "./utils";

export { generateMetadata } from "./_seo/util";

export default async function OfficialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const official = await getOfficial(slug);
  if (!official) notFound();

  // Canonicalize the URL: legacy UUID links AND former slugs (a renamed official
  // resolved via the slug-alias table) permanently redirect to the current slug.
  if (official.slug && official.slug !== slug) {
    permanentRedirect(`/officials/${official.slug}`);
  }

  const position = official.positions?.[0];
  const role = roleLabel(position?.role);
  const location = formatOfficialLocation(position);
  const party = position?.partyName || position?.party || null;
  const canonicalSlug = official.slug || slug;
  const peers = await getPeers(position, official.id);
  const url = `${SITE_URL}/officials/${canonicalSlug}`;
  const image = absoluteImage(official.imageUrl);

  return (
    <PageLayout bare navLabel={official.name} className="bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.10_0.005_160)]">
      <StructuredData
        official={official}
        position={position}
        role={role}
        location={location}
        party={party}
        url={url}
        image={image}
      />
      <OfficialProfile official={official} peers={peers} />
    </PageLayout>
  );
}
