import { Suspense } from "react";
import type { Metadata } from "next";
import { PageLayout } from "@/components/layout/PageLayout";
import { NewProposalContent } from "./_component/NewProposalContent";

// The identify flow deep-links here with ward/LGA context in the query string,
// so Google discovers thousands of query variants of this one form. The
// canonical folds them all into the clean URL.
export const metadata: Metadata = {
  title: "Submit a Proposal | OurNigeria",
  description:
    "Identify a missing official or propose a correction to an existing profile on OurNigeria.",
  alternates: { canonical: "/proposals/new" },
};

export default function NewProposalPage() {
  return (
    <PageLayout bare navLabel="Proposal" className="bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.10_0.005_160)]">
      <Suspense fallback={<div className="flex-grow pt-24" />}>
        <NewProposalContent />
      </Suspense>
    </PageLayout>
  );
}
