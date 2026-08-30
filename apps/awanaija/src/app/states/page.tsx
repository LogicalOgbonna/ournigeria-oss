import { Metadata } from "next";
import React from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { getStates, getParties, getRegions } from "@/lib/api";
import { StatesClientContent } from "./StatesClientContent";
import { SITE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nigerian States Directory | Our Nigeria",
  description: "Browse all 36 Nigerian states to view their budgets, representatives, local governments, and FAAC allocations.",
  alternates: {
    canonical: `${SITE_URL}/states`,
  },
  openGraph: {
    title: "Nigerian States Directory",
    description: "Browse all 36 Nigerian states to view their budgets and representatives.",
    url: `${SITE_URL}/states`,
  }
};

export default async function StatesDirectoryPage() {
  const [statesData, partiesData, regionsData] = await Promise.all([
    getStates(),
    getParties(),
    getRegions()
  ]);

  return (
    <PageLayout className="bg-background" mainClassName="container max-w-5xl mx-auto px-4 pt-24 pb-20 space-y-10">
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
    </PageLayout>
  );
}