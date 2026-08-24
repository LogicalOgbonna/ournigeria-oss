import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbLd } from "@/lib/seo";

type Month = { value: string; label: string };

export function StructuredData({
  state,
  state_slug,
  year,
  month,
  months,
}: {
  state: any;
  state_slug: string;
  year?: string;
  month?: string;
  months: Month[];
}) {
  const { governor, stats, economy, lgas } = state;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GovernmentOrganization",
    "name": `${state.name} State Government`,
    "url": `https://ournigeria.ng/states/${state_slug}`,
    ...(governor ? {
      "member": {
        "@type": "Person",
        "name": governor.name,
        "jobTitle": "Governor"
      }
    } : {}),
    ...(lgas && lgas.length > 0 ? {
      "subOrganization": lgas.map((lga: any) => ({
        "@type": "GovernmentOrganization",
        "name": `${lga.name} Local Government Area`,
        "url": `https://ournigeria.ng/states/${state_slug}/${lga.name.toLowerCase().replace(/\s+/g, '-')}`
      }))
    } : {})
  };

  const breadcrumbJsonLd = breadcrumbLd([
    { name: "Home", item: "https://ournigeria.ng" },
    { name: "States", item: "https://ournigeria.ng/states" },
    { name: `${state.name} State`, item: `https://ournigeria.ng/states/${state_slug}` },
  ]);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [] as any[]
  };

  if (governor) {
    faqJsonLd.mainEntity.push({
      "@type": "Question",
      "name": `Who is the current governor of ${state.name} State?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `The current governor of ${state.name} State is ${governor.name}${governor.party ? ` of the ${governor.party}` : ''}.`
      }
    });
  }

  if (stats?.budget && stats.budget !== "N/A") {
    faqJsonLd.mainEntity.push({
      "@type": "Question",
      "name": `What is the approved budget for ${state.name} State${year ? ` in ${year}` : ''}?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `The approved budget for ${state.name} State is ${stats.budget}.`
      }
    });
  }

  if (stats?.faac && stats.faac !== "N/A") {
    faqJsonLd.mainEntity.push({
      "@type": "Question",
      "name": `How much FAAC allocation did ${state.name} State receive${year && month ? ` in ${months.find(m => m.value === month)?.label} ${year}` : year ? ` in ${year}` : ' recently'}?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `${state.name} State received a FAAC allocation of ${stats.faac}${year && month ? ` in ${months.find(m => m.value === month)?.label} ${year}` : year ? ` in ${year}` : ''}.`
      }
    });
  }

  if (economy?.population && economy.population !== "N/A") {
    faqJsonLd.mainEntity.push({
      "@type": "Question",
      "name": `What is the estimated population of ${state.name} State?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `The estimated population of ${state.name} State is ${economy.population}.`
      }
    });
  }

  return (
    <JsonLd data={[breadcrumbJsonLd, jsonLd, faqJsonLd.mainEntity.length ? faqJsonLd : null]} />
  );
}
