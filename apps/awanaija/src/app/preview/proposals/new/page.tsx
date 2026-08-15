import { Suspense } from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { PreviewProposalContent } from "./preview-proposal-content";

/**
 * INTERNAL PREVIEW ROUTE (Plan 55) — not linked from the live site, noindex.
 *
 * The rich structured-contribution form. The preview MagazineProfile's
 * "Add …" prompts deep-link here; the live /proposals/new page is untouched
 * until this flow is promoted.
 */

export const metadata: Metadata = {
  title: "Contribute (internal preview)",
  robots: { index: false, follow: false, nocache: true },
};

export default function PreviewProposalPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[oklch(0.10_0.005_160)]">
      <Navbar />
      <div className="fixed top-0 inset-x-0 z-[60] bg-amber-500/90 text-amber-950 text-center font-mono text-[11px] tracking-[0.1em] uppercase py-1 pointer-events-none">
        Internal preview · structured contributions · not indexed
      </div>
      <main className="flex-grow pt-24 pb-16">
        <Suspense fallback={null}>
          <PreviewProposalContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
