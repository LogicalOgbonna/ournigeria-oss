import { Badge } from "@/components/ui/badge";
import { ExternalLink, Archive } from "lucide-react";
import { TIER_STYLES } from "@/app/dashboard/enrichment/lib";
import { formatDateTime } from "@/lib/format";
import type { ProposalSource } from "@/app/dashboard/enrichment/types";

export function SourceEvidence({ source }: { source: ProposalSource }) {
  return (
    <div className="rounded-md border border-border p-3 text-sm">
      <div className="mb-1 flex items-center gap-2">
        <Badge className={TIER_STYLES[source.sourceTier]}>{source.sourceTier}</Badge>
        <span className="font-medium">{source.publisher}</span>
        <span className="font-mono text-xs uppercase text-muted-foreground">{source.format}</span>
        {source.locator && (
          <span className="font-mono text-xs text-muted-foreground">{source.locator}</span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{formatDateTime(source.retrievedAt)}</span>
      </div>
      <p className="mb-2 italic text-muted-foreground">&ldquo;{source.snippet}&rdquo;</p>
      <div className="flex gap-3 text-xs">
        <a href={source.url} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-1 text-emerald-700 hover:underline dark:text-emerald-400">
          <ExternalLink className="size-3" /> source
        </a>
        {source.archiveUrl && (
          <a href={source.archiveUrl} target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-1 text-muted-foreground hover:underline">
            <Archive className="size-3" /> archived
          </a>
        )}
      </div>
    </div>
  );
}
