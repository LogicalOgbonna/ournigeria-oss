import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbLd } from "@/lib/seo";

export function StructuredData({
  ward,
  resolvedParams,
}: {
  ward: any;
  resolvedParams: { state_slug: string; lga_slug: string; ward_slug: string };
}) {
  const { stateName, lgaName, name: wardName, councilor } = ward;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GovernmentOrganization",
    "name": `${wardName} Ward`,
    "url": `https://ournigeria.ng/states/${resolvedParams.state_slug}/${resolvedParams.lga_slug}/${resolvedParams.ward_slug}`,
    "parentOrganization": {
      "@type": "GovernmentOrganization",
      "name": `${lgaName} Local Government Area`,
      "url": `https://ournigeria.ng/states/${resolvedParams.state_slug}/${resolvedParams.lga_slug}`
    },
    ...(councilor ? {
      "member": {
        "@type": "Person",
        "name": councilor.name,
        "jobTitle": "Ward Councilor"
      }
    } : {})
  };

  const wardCrumb = /^ward\b/i.test(wardName) ? wardName : `${wardName} Ward`;
  const breadcrumbJsonLd = breadcrumbLd([
    { name: "Home", item: "https://ournigeria.ng" },
    { name: "States", item: "https://ournigeria.ng/states" },
    { name: `${stateName} State`, item: `https://ournigeria.ng/states/${resolvedParams.state_slug}` },
    { name: `${lgaName} LGA`, item: `https://ournigeria.ng/states/${resolvedParams.state_slug}/${resolvedParams.lga_slug}` },
    { name: wardCrumb, item: `https://ournigeria.ng/states/${resolvedParams.state_slug}/${resolvedParams.lga_slug}/${resolvedParams.ward_slug}` },
  ]);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [] as any[]
  };

  if (councilor) {
    faqJsonLd.mainEntity.push({
      "@type": "Question",
      "name": `Who is the current councilor for ${wardName} Ward in ${lgaName} LGA?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `The current councilor for ${wardName} Ward is ${councilor.name}${councilor.party ? ` of the ${councilor.party}` : ''}.`
      }
    });
  }

  return (
    <JsonLd data={[breadcrumbJsonLd, jsonLd, faqJsonLd.mainEntity.length ? faqJsonLd : null]} />
  );
}
