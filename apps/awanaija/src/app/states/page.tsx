import React from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { getStates, getParties, getRegions } from "@/lib/api";
import { StatesClientContent } from "./StatesClientContent";

export const dynamic = "force-dynamic";

export default async function StatesDirectoryPage() {
  const [statesData, partiesData, regionsData] = await Promise.all([
    getStates(),
    getParties(),
    getRegions()
  ]);

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
        />
      </main>
      <Footer />
    </div>
  );
}