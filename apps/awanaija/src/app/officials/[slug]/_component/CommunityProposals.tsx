import type { Proposal } from "@/lib/api";
import { ProposalCard } from "./ProposalCard";

export function CommunityProposals({ proposals }: { proposals: Proposal[] }) {
  return (
    <section id="proposals">
      <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-white mb-4">
        Community Proposals ({proposals.length})
      </h2>
      <div className="space-y-3">
        {proposals.map((proposal) => (
          <ProposalCard key={proposal.id} proposal={proposal} />
        ))}
      </div>
    </section>
  );
}
