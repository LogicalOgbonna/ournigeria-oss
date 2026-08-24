import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbLd } from "@/lib/seo";

type Month = { value: string; label: string };

export function StructuredData({
  lga,
  resolvedParams,
  year,
  month,
  months,
}: {
  lga: any;
  resolvedParams: { state_slug: string; lga_slug: string };
  year?: string;
  month?: string;
  months: Month[];
}) {
  const { stateName, name: lgaName, chairman, stats, wards } = lga;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GovernmentOrganization",
    "name": `${lga.name} Local Government Area`,
    "url": `https://ournigeria.ng/states/${resolvedParams.state_slug}/${resolvedParams.lga_slug}`,
    "parentOrganization": {
      "@type": "GovernmentOrganization",
      "name": `${stateName} State Government`,
      "url": `https://ournigeria.ng/states/${resolvedParams.state_slug}`
    },
    ...(chairman ? {
      "member": {
        "@type": "Person",
        "name": chairman.name,
        "jobTitle": "LGA Chairman"
      }
    } : {}),
    ...(wards && wards.length > 0 ? {
      "subOrganization": wards.map((ward: any) => ({
        "@type": "GovernmentOrganization",
        "name": `${ward.name} Ward`,
        "url": `https://ournigeria.ng/states/${resolvedParams.state_slug}/${resolvedParams.lga_slug}/${ward.name.toLowerCase().split('/')[0].replace(/\s+/g, '-')}`
      }))
    } : {})
  };

  const breadcrumbJsonLd = breadcrumbLd([
    { name: "Home", item: "https://ournigeria.ng" },
    { name: "States", item: "https://ournigeria.ng/states" },
    { name: `${stateName} State`, item: `https://ournigeria.ng/states/${resolvedParams.state_slug}` },
    { name: `${lgaName} LGA`, item: `https://ournigeria.ng/states/${resolvedParams.state_slug}/${resolvedParams.lga_slug}` },
  ]);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [] as any[]
  };

  if (chairman) {
    faqJsonLd.mainEntity.push({
      "@type": "Question",
      "name": `Who is the current chairman of ${lga.name} LGA?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `The current chairman of ${lga.name} Local Government Area is ${chairman.name}${chairman.party ? ` of the ${chairman.party}` : ''}.`
      }
    });
  }

  if (stats?.faac && stats.faac !== "N/A") {
    faqJsonLd.mainEntity.push({
      "@type": "Question",
      "name": `How much FAAC allocation did ${lga.name} LGA receive${year && month ? ` in ${months.find(m => m.value === month)?.label} ${year}` : year ? ` in ${year}` : ' recently'}?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `${lga.name} Local Government Area received a FAAC allocation of ${stats.faac}${year && month ? ` in ${months.find(m => m.value === month)?.label} ${year}` : year ? ` in ${year}` : ''}.`
      }
    });
  }

  if (stats?.population && stats.population !== "N/A") {
    faqJsonLd.mainEntity.push({
      "@type": "Question",
      "name": `What is the estimated population of ${lga.name} LGA?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `The estimated population of ${lga.name} Local Government Area is ${stats.population}.`
      }
    });
  }

  return (
    <JsonLd data={[breadcrumbJsonLd, jsonLd, faqJsonLd.mainEntity.length ? faqJsonLd : null]} />
  );
}
