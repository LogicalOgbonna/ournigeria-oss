import { Metadata } from "next";
import React from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { getStates, getParties, getRegions, getFaacPeriods } from "@/lib/api";
import { StatesClientContent } from "./StatesClientContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nigerian States Directory | Our Nigeria",
  description: "Browse all 36 Nigerian states to view their budgets, representatives, local governments, and FAAC allocations.",
  alternates: {
    canonical: "https://ournigeria.ng/states",
  },
  openGraph: {
    title: "Nigerian States Directory",
    description: "Browse all 36 Nigerian states to view their budgets and representatives.",
    url: "https://ournigeria.ng/states",
  }
};

export default async function StatesDirectoryPage() {
  const [statesData, partiesData, regionsData, faacPeriods] = await Promise.all([
    getStates(),
    getParties(),
    getRegions(),
    getFaacPeriods()
  ]);

  const availableYears = faacPeriods.years || [];
  const monthsByYear = faacPeriods.monthsByYear || {};

  let bestYear: number | undefined;
  let bestMonth: number | undefined;

  if (availableYears.length > 0) {
    const now = new Date();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth() + 1;

    if (availableYears.includes(nowYear)) {
      bestYear = nowYear;
    } else {
      bestYear = availableYears[0];
    }

    if (bestYear) {
      const availableMonths = monthsByYear[bestYear] || [];
      if (availableMonths.length > 0) {
        const nearestInYear = bestYear === nowYear
          ? availableMonths.filter((m: number) => m <= nowMonth)
          : availableMonths;
        bestMonth = nearestInYear.length > 0
          ? nearestInYear[nearestInYear.length - 1]
          : availableMonths[availableMonths.length - 1];
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="container max-w-5xl mx-auto px-4 pt-24 pb-20 space-y-10 flex-1">
        <section className="space-y-4">
          <h1 className="font-serif text-4xl md:text-5xl text-foreground">
            Explore All States
          </h1>
          <p className="font-sans text-muted-foreground max-w-2xl text-lg">
            Select a state to view its budget, representatives, local governments, and latest civic updates.
          </p>
        </section>

        <StatesClientContent 
          statesData={statesData} 
          partiesData={partiesData} 
          regionsData={regionsData} 
          bestYear={bestYear}
          bestMonth={bestMonth}
        />
      </main>
      <Footer />
    </div>
  );
}