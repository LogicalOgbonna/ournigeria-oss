import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbLd } from "@/lib/seo";
import type { Official, Position } from "@/lib/api";

const SITE_URL = "https://ournigeria.ng";

export function StructuredData({
  official,
  position,
  role,
  location,
  party,
  url,
  image,
}: {
  official: Official;
  position: Position | undefined;
  role: string;
  location: string;
  party: string | null;
  url: string;
  image: string | undefined;
}) {
  // schema.org Person — omit empty fields.
  const personLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: official.name,
    url,
    jobTitle: `${role}${location !== "Nigeria" ? `, ${location}` : ""}`,
    worksFor: {
      "@type": "GovernmentOrganization",
      name: position?.state
        ? `${position.state} State Government`
        : "Government of the Federal Republic of Nigeria",
    },
  };
  if (image) personLd.image = image;
  if (official.biography) personLd.description = official.biography;
  if (official.gender) personLd.gender = official.gender;
  if (official.dateOfBirth) personLd.birthDate = official.dateOfBirth;
  if (official.email) personLd.email = official.email;
  if (official.phoneNumber) personLd.telephone = official.phoneNumber;
  if (official.officeAddress) personLd.workLocation = official.officeAddress;
  if (party) personLd.affiliation = { "@type": "Organization", name: party };
  const sameAs = [
    official.twitterHandle
      ? official.twitterHandle.startsWith("http")
        ? official.twitterHandle
        : `https://x.com/${official.twitterHandle.replace(/^@/, "")}`
      : null,
    official.facebookUrl
      ? /^https?:\/\//i.test(official.facebookUrl)
        ? official.facebookUrl
        : `https://${official.facebookUrl.replace(/^\/+/, "")}`
      : null,
  ].filter(Boolean);
  if (sameAs.length) personLd.sameAs = sameAs;

  // Breadcrumb: Home › Officials › [State] › Name
  const breadcrumbItems = [
    { name: "Home", item: SITE_URL },
    { name: "Officials", item: `${SITE_URL}/officials` },
    ...(position?.state
      ? [{ name: position.state, item: `${SITE_URL}/officials?state=${position.stateCode ?? ""}` }]
      : []),
    { name: official.name, item: url },
  ];
  const breadcrumbJsonLd = breadcrumbLd(breadcrumbItems);

  // FAQ schema — answers the exact "X phone number / who is the X of Y" queries
  // seen in Search Console. Only emit questions we can actually answer.
  const faqs: { q: string; a: string }[] = [];
  faqs.push({
    q: `Who is the ${role} of ${location}?`,
    a: `${official.name} is the ${role} of ${location}${party ? `, representing the ${party}` : ""}.`,
  });
  if (official.phoneNumber) {
    faqs.push({
      q: `What is the phone number of ${official.name}?`,
      a: `The publicly listed phone number for ${official.name}, ${role} of ${location}, is ${official.phoneNumber}.`,
    });
  }
  if (official.email || official.officeAddress) {
    const parts = [
      official.email ? `email ${official.email}` : null,
      official.officeAddress ? `the office address ${official.officeAddress}` : null,
    ].filter(Boolean);
    faqs.push({
      q: `How do I contact ${official.name}?`,
      a: `You can contact ${official.name}, ${role} of ${location}, via ${parts.join(" or ")}.`,
    });
  }
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return <JsonLd data={[personLd, breadcrumbJsonLd, faqLd]} />;
}
