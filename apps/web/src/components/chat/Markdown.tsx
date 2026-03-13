"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Scale, Banknote, BarChart3 } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { SourceCitation } from "@/types";

interface MarkdownProps {
  children: string;
  sources?: SourceCitation[];
  onCitationClick?: (index: number) => void;
}

/** Citation regex: matches [1], [2], [1, 2] but NOT [text](url) markdown links */
const CITATION_REGEX = /\[(\d+(?:,\s*\d+)*)\](?!\()/g;

/** Small icon by source type for inline pills */
function sourceTypeIcon(sourceType: string) {
  const cls = "h-2 w-2 shrink-0";
  switch (sourceType.toLowerCase()) {
    case "budget":
      return <FileText className={cls} />;
    case "corruption":
      return <Scale className={cls} />;
    case "payment":
      return <Banknote className={cls} />;
    case "faac":
      return <BarChart3 className={cls} />;
    default:
      return <FileText className={cls} />;
  }
}

/** Confidence ring color based on score */
function confidenceClass(score: number): string {
  if (score > 0.8) return "border-emerald-400 dark:border-emerald-600";
  if (score > 0.6) return "border-yellow-400 dark:border-yellow-600";
  return "border-slate-300 dark:border-slate-600";
}

/** Render a single clickable citation pill */
function CitationPill({
  num,
  source,
  onClick,
}: {
  num: number;
  source: SourceCitation;
  onClick?: () => void;
}) {
  const pill = (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-0.5
        min-w-[1.1rem] h-[1.1rem] px-1
        text-[9px] font-semibold
        text-emerald-600 dark:text-emerald-400
        bg-emerald-50 dark:bg-emerald-950/50
        border ${confidenceClass(source.score)}
        rounded-full cursor-pointer
        hover:bg-emerald-100 dark:hover:bg-emerald-900
        transition-colors -translate-y-0.5 mx-0.5
      `}
    >
      {sourceTypeIcon(source.sourceType)}
      {num}
    </button>
  );

  // Wrap in Tooltip if snippet available
  if (source.snippet) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{pill}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs text-xs leading-relaxed"
        >
          {source.snippet.slice(0, 120)}
          {source.snippet.length > 120 ? "..." : ""}
        </TooltipContent>
      </Tooltip>
    );
  }

  return pill;
}

/** Inert pill for streaming state (no sources available yet) */
function InertCitationPill({ num }: { num: number }) {
  return (
    <span
      className="
        inline-flex items-center justify-center
        min-w-[1.1rem] h-[1.1rem]
        text-[9px] font-semibold
        text-slate-400 dark:text-slate-500
        bg-slate-100 dark:bg-slate-800
        border border-slate-200 dark:border-slate-700
        rounded-full -translate-y-0.5 mx-0.5
      "
    >
      {num}
    </span>
  );
}

/**
 * Recursively process React children to replace [N] patterns with citation pills.
 * Only processes string children; React elements are cloned with processed children.
 */
function renderWithCitations(
  children: React.ReactNode,
  sources: SourceCitation[] | undefined,
  onCitationClick: ((index: number) => void) | undefined,
): React.ReactNode {
  return React.Children.map(children, (child) => {
    // Process string children
    if (typeof child === "string") {
      return processStringWithCitations(child, sources, onCitationClick);
    }

    // Recursively process element children
    if (React.isValidElement(child)) {
      const props = child.props as Record<string, unknown>;
      if (props.children) {
        return React.cloneElement(
          child as React.ReactElement<{ children?: React.ReactNode }>,
          {},
          renderWithCitations(
            props.children as React.ReactNode,
            sources,
            onCitationClick,
          ),
        );
      }
    }

    return child;
  });
}

/** Split a string on citation patterns and replace with pill components */
function processStringWithCitations(
  text: string,
  sources: SourceCitation[] | undefined,
  onCitationClick: ((index: number) => void) | undefined,
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex state
  CITATION_REGEX.lastIndex = 0;

  while ((match = CITATION_REGEX.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Parse the citation numbers (handles [1] and [1, 2])
    const numbers = match[1].split(",").map((s) => parseInt(s.trim()));

    for (const num of numbers) {
      const source = sources?.[num - 1];
      if (source && onCitationClick) {
        parts.push(
          <CitationPill
            key={`cite-${match.index}-${num}`}
            num={num}
            source={source}
            onClick={() => onCitationClick(num - 1)}
          />,
        );
      } else if (!sources) {
        // Streaming state — render inert pill
        parts.push(
          <InertCitationPill key={`cite-inert-${match.index}-${num}`} num={num} />,
        );
      } else {
        // Source doesn't exist — render as plain text
        parts.push(`[${num}]`);
      }
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/** Wrapper that applies citation processing to prose component children */
function withCitations(
  children: React.ReactNode,
  sources?: SourceCitation[],
  onCitationClick?: (index: number) => void,
): React.ReactNode {
  if (!sources && !onCitationClick) return children;
  return renderWithCitations(children, sources, onCitationClick);
}

export function Markdown({ children, sources, onCitationClick }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Prose components — process citations
        p: ({ children: c }) => (
          <p className="mb-2 last:mb-0">
            {withCitations(c, sources, onCitationClick)}
          </p>
        ),
        li: ({ children: c }) => (
          <li>{withCitations(c, sources, onCitationClick)}</li>
        ),
        h1: ({ children: c }) => (
          <h1 className="mb-2 text-base font-bold text-slate-800 dark:text-slate-100">
            {withCitations(c, sources, onCitationClick)}
          </h1>
        ),
        h2: ({ children: c }) => (
          <h2 className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            {withCitations(c, sources, onCitationClick)}
          </h2>
        ),
        h3: ({ children: c }) => (
          <h3 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {withCitations(c, sources, onCitationClick)}
          </h3>
        ),

        // Non-prose components — no citation processing
        strong: ({ children: c }) => (
          <strong className="font-semibold text-slate-800 dark:text-slate-100">
            {c}
          </strong>
        ),
        em: ({ children: c }) => <em className="italic">{c}</em>,
        ul: ({ children: c }) => (
          <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{c}</ul>
        ),
        ol: ({ children: c }) => (
          <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{c}</ol>
        ),
        hr: () => (
          <hr className="my-3 border-slate-200 dark:border-slate-700" />
        ),
        code: ({ children: c }) => (
          <code className="rounded bg-slate-200 dark:bg-slate-700 px-1 py-0.5 text-xs">
            {c}
          </code>
        ),
        table: ({ children: c }) => (
          <div className="my-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              {c}
            </table>
          </div>
        ),
        thead: ({ children: c }) => (
          <thead className="bg-slate-50 dark:bg-slate-800">{c}</thead>
        ),
        tbody: ({ children: c }) => (
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {c}
          </tbody>
        ),
        tr: ({ children: c }) => <tr>{c}</tr>,
        th: ({ children: c }) => (
          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200">
            {c}
          </th>
        ),
        td: ({ children: c }) => (
          <td className="whitespace-nowrap px-3 py-2 text-slate-600 dark:text-slate-300">
            {c}
          </td>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
