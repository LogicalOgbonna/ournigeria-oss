import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbLd } from "@/lib/seo";
import { type ConstituencyDetails } from "@/lib/api";
import { roleLabel } from "../utils";

export function StructuredData({
  c,
  label,
  stateSlug,
}: {
  c: ConstituencyDetails;
  label: string;
  stateSlug: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GovernmentOrganization",
    name: `${c.name} ${label}`,
    url: `https://ournigeria.ng/constituencies/${c.code}`,
    parentOrganization: {
      "@type": "GovernmentOrganization",
      name: `${c.stateName} State`,
      url: `https://ournigeria.ng/states/${stateSlug}`,
    },
    ...(c.representatives.length
      ? {
          member: c.representatives.map((r) => ({
            "@type": "Person",
            name: r.name,
            jobTitle: roleLabel(r.role),
          })),
        }
      : {}),
  };

  const breadcrumbJsonLd = breadcrumbLd([
    { name: "Home", item: "https://ournigeria.ng" },
    { name: "States", item: "https://ournigeria.ng/states" },
    { name: `${c.stateName} State`, item: `https://ournigeria.ng/states/${stateSlug}` },
    { name: `${c.name} ${label}`, item: `https://ournigeria.ng/constituencies/${c.code}` },
  ]);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.representatives.map((r) => ({
      "@type": "Question",
      name: `Who represents ${c.name} ${label} in ${c.stateName}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `${r.name} is the ${roleLabel(r.role)} for ${c.name}${
          r.party && r.party !== "N/A" ? ` (${r.party})` : ""
        }.`,
      },
    })),
  };

  return (
    <JsonLd
      data={[breadcrumbJsonLd, jsonLd, faqJsonLd.mainEntity.length ? faqJsonLd : null]}
    />
  );
}
