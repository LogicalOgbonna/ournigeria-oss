import { Suspense } from "react";
import { getOfficialsByLocation } from "@/lib/api";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { RepresentativesClient } from "./RepresentativesClient";

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

  let initialChain: any[] = [];
  let initialLocation = null;

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
  }

  return (
    <div className="min-h-screen bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.15_0.005_260)] flex flex-col">
      <Navbar />
      <Suspense fallback={<div className="flex-1 max-w-2xl mx-auto px-4 pt-24 pb-20 w-full" />}>
        <RepresentativesClient 
          initialChain={initialChain} 
          initialLocation={initialLocation} 
        />
      </Suspense>
      <Footer />
    </div>
  );
}