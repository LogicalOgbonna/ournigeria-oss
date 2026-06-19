import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { MagazineProfile } from "@/components/official/MagazineProfile";
import type { Official } from "@/lib/api";

/**
 * INTERNAL PREVIEW ROUTE — not linked anywhere, not in the sitemap, noindex.
 *
 * Renders the candidate "Magazine Profile" (V9) layout for any official using
 * LIVE data straight from the backend (no cache), so we can eyeball whether a
 * given official has enough structured data to justify promoting V9 to the real
 * /officials/[slug] route. Visit directly: /preview/officials/<slug>.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.example.invalid";

async function getOfficial(idOrSlug: string): Promise<Official | null> {
  try {
    const res = await fetch(`${API_URL}/api/officials/${encodeURIComponent(idOrSlug)}`, {
      cache: "no-store", // always read live — this is a readiness-testing tool
    });
    if (!res.ok) return null;
    return (await res.json()) as Official;
  } catch {
    return null;
  }
}

// Keep this route out of search indexes regardless of how it's reached.
export const metadata: Metadata = {
  title: "Profile preview (internal)",
  robots: { index: false, follow: false, nocache: true },
};

export default async function OfficialPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const official = await getOfficial(slug);
  if (!official) notFound();

  return (
    <div className="min-h-screen flex flex-col bg-[oklch(0.10_0.005_160)]">
      <Navbar />
      {/* internal preview banner so it's never mistaken for the live page */}
      <div className="fixed top-0 inset-x-0 z-[60] bg-amber-500/90 text-amber-950 text-center font-mono text-[11px] tracking-[0.1em] uppercase py-1 pointer-events-none">
        Internal preview · V9 candidate · live data · not indexed
      </div>
      <main className="flex-grow pt-24">
        <MagazineProfile official={official} />
      </main>
      <Footer />
    </div>
  );
}
