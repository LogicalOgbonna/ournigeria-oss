import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbLd } from "@/lib/seo";

const breadcrumbJsonLd = breadcrumbLd([
  { name: "Home", item: "https://ournigeria.ng" },
  { name: "Officials", item: "https://ournigeria.ng/officials" },
]);

export function StructuredData() {
  return <JsonLd data={breadcrumbJsonLd} />;
}
