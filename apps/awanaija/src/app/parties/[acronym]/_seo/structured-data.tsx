import { JsonLd } from "@/components/seo/JsonLd";
import { stateLabel } from "@/lib/states";
import type { PartyDetail } from "@/lib/api";

export function StructuredData({
  party,
  url,
  image,
  sameAs,
}: {
  party: PartyDetail;
  url: string;
  image: string | undefined;
  sameAs: unknown[];
}) {
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

  return <JsonLd data={[orgLd, faqLd]} />;
}
