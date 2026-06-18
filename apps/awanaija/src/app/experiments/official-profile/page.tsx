"use client";

/**
 * Official-profile design experiment — the live <MagazineProfile/> rendered with
 * offline mock data, framed by the site Navbar + Footer. The real route
 * (/officials/[slug]) renders the same component with API data.
 */

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { MagazineProfile } from "@/components/official/MagazineProfile";
import { MOCK_OFFICIAL } from "./mock";

export default function OfficialProfileExperiment() {
  return (
    <div className="min-h-screen flex flex-col bg-[oklch(0.10_0.005_160)]">
      <Navbar />
      <main className="flex-grow pt-24">
        <MagazineProfile official={MOCK_OFFICIAL} />
      </main>
      <Footer />
    </div>
  );
}
