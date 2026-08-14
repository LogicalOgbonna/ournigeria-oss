import { JsonLd } from "@/components/seo/JsonLd";

export function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://ournigeria.ng/#website",
        "url": "https://ournigeria.ng/",
        "name": "Our Nigeria",
        "description": "Explore how Nigeria spends public money. Search 700+ budget documents across 36 states and the FCT.",
        "publisher": {
          "@id": "https://ournigeria.ng/#organization"
        },
        "inLanguage": "en-NG"
      },
      {
        "@type": "Organization",
        "@id": "https://ournigeria.ng/#organization",
        "name": "Our Nigeria",
        "url": "https://ournigeria.ng/",
        "logo": {
          "@type": "ImageObject",
          "url": "https://ournigeria.ng/icon.png"
        },
        "description": "A civic technology platform tracking Nigerian government spending, budgets, and FAAC allocations."
      }
    ]
  };

  return <JsonLd data={jsonLd} />;
}
