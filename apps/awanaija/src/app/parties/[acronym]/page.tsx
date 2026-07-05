import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { PartyProfile } from "./PartyProfile";
import { stateLabel } from "@/lib/states";
import type { PartyDetail } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.ournigeria.ng";
const SITE_URL = "https://ournigeria.ng";

async function getParty(acronym: string): Promise<PartyDetail | null> {
  try {
    const res = await fetch(`${API_URL}/api/parties/${encodeURIComponent(acronym)}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return (await res.json()) as PartyDetail;
  } catch {
    return null;
  }
}

// Party descriptions are agent-enriched; escape "<" to prevent a "</script>" breakout.
function ldJson(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

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

export default async function PartyPage({
  params,
}: {
  params: Promise<{ acronym: string }>;
}) {
  const { acronym } = await params;
  const party = await getParty(acronym);
  if (!party) notFound();

  const url = `${SITE_URL}/parties/${party.acronym}`;
  const image =
    party.logoUrl && /^https?:\/\//i.test(party.logoUrl) ? party.logoUrl : undefined;
  const sameAs = [
    party.website
      ? /^https?:\/\//i.test(party.website)
        ? party.website
        : `https://${party.website}`
      : null,
    party.twitterHandle ? `https://x.com/${party.twitterHandle.replace(/^@/, "")}` : null,
    party.facebookUrl
      ? /^https?:\/\//i.test(party.facebookUrl)
        ? party.facebookUrl
        : `https://${party.facebookUrl.replace(/^\/+/, "")}`
      : null,
  ].filter(Boolean);

  // schema.org Organization — omit empty fields.
  const orgLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: party.name,
    alternateName: party.acronym,
    url,
  };
  if (image) orgLd.logo = image;
  if (party.description) orgLd.description = party.description;
  if (party.foundingYear) orgLd.foundingDate = String(party.foundingYear);
  if (party.email) orgLd.email = party.email;
  if (party.phoneNumber) orgLd.telephone = party.phoneNumber;
  if (party.hqAddress) orgLd.address = party.hqAddress;
  if (sameAs.length) orgLd.sameAs = sameAs;

  // FAQ — answers the "which states does X control" query class. Only emit when real.
  const faqs: { q: string; a: string }[] = [];
  if (party.footprint.statesControlled.length > 0) {
    const states = party.footprint.statesControlled.map(stateLabel).join(", ");
    faqs.push({
      q: `Which states does ${party.name} hold seats in?`,
      a: `${party.name} (${party.acronym}) currently holds elected offices in ${party.footprint.statesControlled.length} states: ${states}.`,
    });
  }
  faqs.push({
    q: `How many governors does ${party.name} have?`,
    a: `${party.name} currently holds ${party.footprint.governors} governorship${party.footprint.governors === 1 ? "" : "s"} and ${party.footprint.senators} senate seats nationwide.`,
  });
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="flex min-h-screen flex-col bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.10_0.005_160)]">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(orgLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(faqLd) }} />
      <PartyProfile party={party} />
      <Footer />
    </div>
  );
}
