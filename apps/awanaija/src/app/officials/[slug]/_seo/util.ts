import type { Metadata } from "next";
import { formatOfficialLocation } from "@/lib/api";
import { getOfficial, roleLabel, absoluteImage, SITE_URL } from "../utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const official = await getOfficial(slug);
  if (!official) return { title: "Official Not Found | OurNigeria" };

  const position = official.positions?.[0];
  const role = roleLabel(position?.role);
  const location = formatOfficialLocation(position);
  const party = position?.partyName || position?.party || null;
  const canonicalSlug = official.slug || slug;
  const canonical = `${SITE_URL}/officials/${canonicalSlug}`;
  const image = absoluteImage(official.imageUrl);

  const title = `${official.name} — ${role}, ${location} | OurNigeria`;
  const description =
    `${official.name} is the ${role} of ${location}${party ? ` (${party})` : ""}. ` +
    `View profile, contact details, office address and political record on OurNigeria.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${official.name} — ${role}`,
      description,
      url: canonical,
      type: "profile",
      ...(image ? { images: [{ url: image, alt: official.name }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `${official.name} — ${role}`,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}
