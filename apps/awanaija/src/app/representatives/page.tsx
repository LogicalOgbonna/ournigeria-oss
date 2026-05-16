import { Metadata } from "next";
import { Suspense } from "react";
import { getOfficialsByLocation, type ChainEntry } from "@/lib/api";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { RepresentativesClient } from "./RepresentativesClient";

export const metadata: Metadata = {
  title: "Who Governs Me? | Find Your Representatives | Our Nigeria",
  description: "Find your local, state, and federal representatives in Nigeria. See who is responsible for your ward, LGA, and state.",
  alternates: {
    canonical: "https://ournigeria.ng/representatives",
  },
  openGraph: {
    title: "Find Your Representatives",
    description: "See who is responsible for your ward, LGA, and state.",
    url: "https://ournigeria.ng/representatives",
  }
};

export default async function RepresentativesPage({
  searchParams,
}: {
  searchParams: Promise<{
    state?: string;
    stateName?: string;
    lga?: string;
    lgaName?: string;
    ward?: string;
    wardName?: string;
  }>;
}) {
  const { state, stateName, lga, lgaName, ward, wardName } = await searchParams;

  let initialChain: ChainEntry[] = [];
  let initialLocation = null;
  let stateDetails: {
    name?: string;
    economy?: { population?: string; domesticDebt?: string; externalDebt?: string; gdp?: string };
    stats?: { budget?: string; faac?: string; igr?: string; igrFiscalYear?: number; igrPeriod?: string };
  } | null = null;
  let lgaDetails: {
    name?: string;
    stats?: { population?: string; faac?: string; igr?: string };
  } | null = null;

  if (state && ward) {
    initialLocation = {
      stateCode: state,
      stateName: stateName || "",
      lgaCode: lga,
      lgaName: lgaName,
      wardCode: ward,
      wardName: wardName,
    };

    try {
      const result = await getOfficialsByLocation({
        state,
        lga,
        ward,
      });
      initialChain = result.chain;
    } catch (err) {
      console.error("Failed to load representatives:", err);
    }

    try {
      if (stateName) {
        const stateSlug = stateName.toLowerCase().replace(/\s+/g, '-');
        const stateRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/geo/states/${stateSlug}`);
        if (stateRes.ok) {
          stateDetails = await stateRes.json();
        }
      }
    } catch (err) {
      console.error("Failed to load state details:", err);
    }

    try {
      if (stateName && lgaName) {
        const stateSlug = stateName.toLowerCase().replace(/\s+/g, '-');
        const lgaSlug = lgaName.toLowerCase().replace(/\s+/g, '-');
        const lgaRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/geo/states/${stateSlug}/lgas/${lgaSlug}`);
        if (lgaRes.ok) {
          lgaDetails = await lgaRes.json();
        }
      }
    } catch (err) {
      console.error("Failed to load LGA details:", err);
    }
  }

  return (
    <div className="min-h-screen bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.15_0.005_260)] flex flex-col">
      <Navbar />
      <Suspense fallback={<div className="flex-1 max-w-7xl mx-auto px-4 pt-24 pb-20 w-full" />}>
        <RepresentativesClient 
          initialChain={initialChain} 
          initialLocation={initialLocation} 
          stateDetails={stateDetails}
          lgaDetails={lgaDetails}
        />
      </Suspense>
      <Footer />
    </div>
  );
}