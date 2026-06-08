import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { OfficialProfile } from "./OfficialProfile";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import type { Official } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.example.invalid";
const SITE_URL = "https://ournigeria.ng";

// Legacy /officials/<uuid> URLs 308-redirect to the slug. Matches a canonical UUID.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Humanized role labels for titles/descriptions/JSON-LD.
const ROLE_LABELS: Record<string, string> = {
  governor: "Governor",
  deputy_governor: "Deputy Governor",
  senator: "Senator",
  representative: "Federal Representative",
  rep: "Federal Representative",
  mha: "State House of Assembly Member",
  lga_chairman: "LGA Chairman",
  councilor: "Councilor",
};

async function getOfficial(idOrSlug: string): Promise<Official | null> {
  try {
    const res = await fetch(`${API_URL}/api/officials/${encodeURIComponent(idOrSlug)}`, {
      next: { revalidate: 120 }, // 2 min cache
    });
    if (!res.ok) return null;
    return (await res.json()) as Official;
  } catch {
    return null;
  }
}

function roleLabel(role?: string | null): string {
  if (!role) return "Public Official";
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ");
}

function absoluteImage(imageUrl: string | null): string | undefined {
  if (!imageUrl) return undefined;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `${SITE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

// Serialize JSON-LD safely: official bios/addresses are user-submittable (via the
// proposals/identify flow), so escape "<" to prevent a "</script>" breakout (XSS).
function ldJson(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const official = await getOfficial(slug);
  if (!official) return { title: "Official Not Found | OurNigeria" };

  const position = official.positions?.[0];
  const role = roleLabel(position?.role);
  const location = position?.state || "Nigeria";
  const party = position?.partyName || position?.party || null;
  const canonicalSlug = official.slug || slug;
  const canonical = `${SITE_URL}/officials/${canonicalSlug}`;
  const image = absoluteImage(official.imageUrl);

  const title = `${official.name} — ${role}, ${location} | OurNigeria`;
  const description =
    `${official.name} is the ${role} of ${location}${party ? ` (${party})` : ""}. ` +
    `View profile, contact details, office address and political record on OurNigeria.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${official.name} — ${role}`,
      description,
      url: canonical,
      type: "profile",
      ...(image ? { images: [{ url: image, alt: official.name }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `${official.name} — ${role}`,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function OfficialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const official = await getOfficial(slug);
  if (!official) notFound();

  // Back-compat: legacy UUID URLs permanently redirect to the canonical slug URL.
  if (UUID_RE.test(slug) && official.slug && official.slug !== slug) {
    permanentRedirect(`/officials/${official.slug}`);
  }

  const position = official.positions?.[0];
  const role = roleLabel(position?.role);
  const location = position?.state || "Nigeria";
  const party = position?.partyName || position?.party || null;
  const canonicalSlug = official.slug || slug;
  const url = `${SITE_URL}/officials/${canonicalSlug}`;
  const image = absoluteImage(official.imageUrl);

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
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: b.item,
    })),
  };

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

  return (
    <div className="min-h-screen flex flex-col bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.10_0.005_160)]">
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldJson(personLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldJson(faqLd) }}
      />
      <OfficialProfile official={official} />
      <Footer />
    </div>
  );
}
