import { Suspense } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { NewProposalContent } from "./_component/NewProposalContent";

export default function NewProposalPage() {
  return (
    <PageLayout bare navLabel="Proposal" className="bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.10_0.005_160)]">
      <Suspense fallback={<div className="flex-grow pt-24" />}>
        <NewProposalContent />
      </Suspense>
    </PageLayout>
  );
}
