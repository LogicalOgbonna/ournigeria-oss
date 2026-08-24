import type { Metadata } from "next";
import type { PartyDetail } from "@/lib/api";
import { getParty, SITE_URL } from "../utils";

function footprintSentence(party: PartyDetail): string {
  const fp = party.footprint;
  return (
    `Holds ${fp.governors} governorship${fp.governors === 1 ? "" : "s"}, ` +
    `${fp.senators} senate seat${fp.senators === 1 ? "" : "s"} and ` +
    `${fp.representatives} house seat${fp.representatives === 1 ? "" : "s"} ` +
    `across ${fp.statesControlled.length} state${fp.statesControlled.length === 1 ? "" : "s"}.`
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ acronym: string }>;
}): Promise<Metadata> {
  const { acronym } = await params;
  const party = await getParty(acronym);
  if (!party) return { title: "Party Not Found | OurNigeria" };

  const canonical = `${SITE_URL}/parties/${party.acronym}`;
  const description =
    `${party.name} (${party.acronym})${party.ideology ? ` — ${party.ideology}` : ""}. ` +
    `${footprintSentence(party)} See the party's footprint, leadership and state chapters on OurNigeria.`;
  const image = party.logoUrl && /^https?:\/\//i.test(party.logoUrl) ? party.logoUrl : undefined;

  return {
    title: `${party.name} (${party.acronym}) — Political Party | OurNigeria`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${party.name} (${party.acronym})`,
      description,
      url: canonical,
      type: "website",
      ...(image ? { images: [{ url: image, alt: party.name }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `${party.name} (${party.acronym})`,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}
