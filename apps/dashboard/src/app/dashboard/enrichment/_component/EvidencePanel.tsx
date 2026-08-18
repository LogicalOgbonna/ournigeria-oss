import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProposalSource } from "../types";

const TIER_LABEL: Record<string, string> = { canonical: "Canonical", official: "Official", web: "Web" };
const TIER_CLASS: Record<string, string> = {
  canonical: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  official: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  web: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
};

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function SourceCard({ source }: { source: ProposalSource }) {
  const tierClass = TIER_CLASS[source.sourceTier] ?? TIER_CLASS.web;
  const tierLabel = TIER_LABEL[source.sourceTier] ?? source.sourceTier;
  return (
    <div className="rounded-[10px] border border-border bg-card p-3.5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] font-semibold", tierClass)}>
            {tierLabel}
          </span>
          <span className="truncate text-[13px] font-bold text-foreground">{source.publisher}</span>
        </div>
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10.5px] uppercase text-muted-foreground">
          {source.format}
        </span>
      </div>
      <blockquote className="mb-2 border-l-2 border-border py-1 pl-3 text-[13px] leading-relaxed text-foreground/90">
        &ldquo;{source.snippet}&rdquo;
      </blockquote>
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-[11.5px]">
        {source.locator ? (
          <span className="font-mono text-muted-foreground">{source.locator}</span>
        ) : (
          <span />
        )}
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-emerald-700 hover:underline dark:text-emerald-400"
        >
          {hostOf(source.url)} <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
}

export function EvidencePanel({ sources }: { sources: ProposalSource[] }) {
  if (sources.length === 0) {
    return <p className="text-sm text-muted-foreground">No sources attached.</p>;
  }
  return (
    <div className="flex flex-col gap-2.5">
      {sources.map((s) => (
        <SourceCard key={s.id} source={s} />
      ))}
    </div>
  );
}
