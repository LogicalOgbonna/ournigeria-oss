"use client";

/**
 * Official-profile design experiment — the selected layout (V9 "Magazine Profile"),
 * now framed by the site Navbar + Footer like the real /officials/[slug] page.
 * Kept on mock data as the reference until it's wired to the live officials API
 * and promoted to the real route (plan 45f).
 */

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { VariantH } from "./variants/VariantH";

export default function OfficialProfileExperiment() {
  return (
    <div className="min-h-screen flex flex-col bg-[oklch(0.10_0.005_160)]">
      <Navbar />
      <main className="flex-grow pt-24">
        <VariantH />
      </main>
      <Footer />
    </div>
  );
}
