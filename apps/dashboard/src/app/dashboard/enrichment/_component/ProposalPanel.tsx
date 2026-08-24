import { Check, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChangeProposal } from "../types";
import { ClaimPanel } from "./ClaimPanel";
import { EvidencePanel } from "./EvidencePanel";
import { OfficialAvatar } from "./OfficialAvatar";
import { confidenceColor, highestTier, humanize, humanizeCode, partyColor, tableLabel } from "./utils";

const KIND_META: Record<string, { label: string; color: string }> = {
  create: { label: "NEW", color: "#059669" },
  correction: { label: "FIX", color: "#d97706" },
  fill: { label: "FILL", color: "#64748b" },
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  needs_human: "Needs human",
  needs_more_sources: "Needs more sources",
  approved: "Approved",
  rejected: "Rejected",
};

const TIER_BADGE_LABEL: Record<string, string> = { canonical: "Canonical", official: "Official", web: "Web" };

function KindBadge({ kind }: { kind: string }) {
  const m = KIND_META[kind] ?? KIND_META.fill!;
  return (
    <span
      className="rounded-md px-2.5 py-1 font-mono text-[10.5px] font-extrabold tracking-wide"
      style={{ background: `${m.color}18`, color: m.color }}
    >
      {m.label}
    </span>
  );
}

function Pill({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", className)} style={style}>
      {children}
    </span>
  );
}

/**
 * Variant C ("Evidence-first") full-width proposal panel: identity strip, gold
 * "why this was proposed" note, claim-vs-evidence split (40/60, stacks on
 * mobile), and a per-panel action bar. Panels stack directly in the page's
 * single-column queue — no left inbox, no separate detail pane.
 */
export function ProposalPanel({
  proposal, busy, onApprove, onReject, onRequestMore,
}: {
  proposal: ChangeProposal;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onRequestMore: () => void;
}) {
  const tier = highestTier(proposal.sources);
  const color = partyColor(proposal.officialParty);
  const reviewable = proposal.status === "pending" || proposal.status === "needs_human";
  const confColor = confidenceColor(proposal.confidence);
  const isNewRecord = !proposal.officialId && proposal.changeKind === "create";

  const metaLabel = [
    proposal.officialRole ? humanize(proposal.officialRole) : null,
    proposal.officialState ? humanizeCode(proposal.officialState) : null,
    proposal.officialParty || null,
  ].filter(Boolean).join(" · ") || tableLabel(proposal.targetTable);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Identity strip */}
      <div className="flex flex-wrap items-center gap-3.5 border-b border-border bg-gradient-to-b from-card to-muted/20 px-5 py-4">
        <OfficialAvatar name={proposal.officialName} image={proposal.officialImage} party={proposal.officialParty} size="lg" />
        <div className="min-w-[200px] flex-1">
          <div className="flex items-center gap-1.5 font-heading text-[16px] font-bold text-foreground">
            <span className="truncate">{proposal.officialName || "Unnamed official"}</span>
            {isNewRecord && (
              <span className="shrink-0 font-mono text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
                new record
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
            <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />
            <span className="truncate">{metaLabel}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <KindBadge kind={proposal.changeKind} />
          <Pill className={proposal.status === "needs_human" ? "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}>
            {STATUS_LABEL[proposal.status] ?? humanize(proposal.status)}
          </Pill>
          <Pill className="inline-flex items-center gap-1.5 font-mono" style={{ background: `${confColor}18`, color: confColor }}>
            <span className="size-2 rounded-full" style={{ background: confColor }} />
            {humanize(proposal.confidence)} confidence
          </Pill>
          {tier && (
            <Pill className="font-mono" style={{ background: tier === "canonical" ? "#05966918" : tier === "official" ? "#d9770618" : "#94a3b818", color: tier === "canonical" ? "#059669" : tier === "official" ? "#d97706" : "#64748b" }}>
              {TIER_BADGE_LABEL[tier] ?? humanize(tier)} evidence
            </Pill>
          )}
          <Pill className="bg-slate-100 font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {proposal.sources.length} source{proposal.sources.length === 1 ? "" : "s"}
          </Pill>
        </div>
      </div>

      {/* Why this was proposed */}
      {proposal.reasoning && (
        <div className="mx-5 mt-4 rounded-lg border border-amber-200 border-l-[3px] border-l-gold bg-amber-50/40 px-4 py-3 text-[12.5px] leading-relaxed text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
          <b className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Why this was proposed
          </b>
          {proposal.reasoning}
        </div>
      )}
      {proposal.reviewNote && (
        <p className="mx-5 mt-3 text-xs text-muted-foreground">Reviewer note: {proposal.reviewNote}</p>
      )}

      {/* Claim (40%) / evidence (60%) split — stacks on mobile (<880px) */}
      <div className="mt-4 flex flex-col min-[880px]:flex-row">
        <div className="border-b border-border p-5 min-[880px]:w-[40%] min-[880px]:shrink-0 min-[880px]:border-b-0 min-[880px]:border-r">
          <div className="mb-3 flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
            Proposed change <span className="font-normal normal-case tracking-normal text-muted-foreground/80">· {tableLabel(proposal.targetTable)}</span>
          </div>
          <ClaimPanel proposal={proposal} />
        </div>
        <div className="bg-emerald-50/30 p-5 dark:bg-emerald-950/10 min-[880px]:flex-1">
          <div className="mb-3 flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
            Evidence <span className="font-normal normal-case tracking-normal text-muted-foreground/80">· {proposal.sources.length} source{proposal.sources.length === 1 ? "" : "s"}</span>
          </div>
          <EvidencePanel sources={proposal.sources} />
        </div>
      </div>

      {/* Per-panel action bar */}
      {reviewable && (
        <div className="flex flex-wrap items-center gap-2.5 border-t border-border bg-card px-5 py-3.5">
          <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950" disabled={busy} onClick={onReject}>
            <X className="size-4" /> Reject
          </Button>
          <Button variant="outline" disabled={busy} onClick={onRequestMore}>
            <HelpCircle className="size-4" /> Request more
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={busy} onClick={onApprove}>
            <Check className="size-4" /> Approve
          </Button>
          <span className="ml-auto font-mono text-[10.5px] text-muted-foreground">{proposal.id.slice(0, 8)}</span>
        </div>
      )}
    </div>
  );
}
