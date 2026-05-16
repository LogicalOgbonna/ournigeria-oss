import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { OfficialProfile } from "./OfficialProfile";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.example.invalid";

async function getOfficial(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/officials/${id}`, {
      next: { revalidate: 120 }, // 2 min cache
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const official = await getOfficial(id);
  if (!official) return { title: "Official Not Found" };

  const position = official.positions?.[0];
  const role = position?.role || "Official";
  const location = position?.state || "Nigeria";

  return {
    title: `${official.name} - ${role}, ${location} | OurNigeria`,
    description: `Profile of ${official.name}, ${role} in ${location}. Help complete this profile with verified information.`,
    alternates: {
      canonical: `https://ournigeria.ng/officials/${id}`,
    },
    openGraph: {
      title: `${official.name} - ${role}`,
      description: `${role} in ${location}. ${Math.round(official.completenessScore * 100)}% complete.`,
      url: `https://ournigeria.ng/officials/${id}`,
      type: "profile",
    },
  };
}

export default async function OfficialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const official = await getOfficial(id);
  if (!official) notFound();

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: official.name,
    image: official.imageUrl,
    jobTitle: official.positions?.[0]?.role,
    worksFor: {
      "@type": "GovernmentOrganization",
      name: "Federal Republic of Nigeria",
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.10_0.005_160)]">
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OfficialProfile official={official} />
      <Footer />
    </div>
  );
}
