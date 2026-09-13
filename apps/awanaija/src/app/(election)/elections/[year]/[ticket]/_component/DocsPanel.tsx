"use client";

import { Download, Expand, Minus, Plus, Search } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { isOptimizedImageSrc } from "@/lib/image-hosts";
import { cn } from "@/lib/utils";
import type { TicketDoc } from "@/lib/presidential-profiles-2027";

/**
 * The documents panel — Figma `1:1108`. Three tabs down the left (Manifesto /
 * CV / Achievements), the selected document's cover on the right under a
 * toolbar.
 *
 * The toolbar is DELIBERATELY presentational. Figma draws zoom −/+, expand,
 * "1 of 80", search and save, which implies a full PDF viewer; shipping one
 * means pdf.js on a marketing page for documents that are not hosted yet. So
 * the chrome is drawn as designed and inert, and the one control that can do
 * real work — save — is a genuine download link when the doc has an `href`.
 * Swap this for a real viewer once the PDFs exist and the weight is justified.
 *
 * Covers are local files under `public/`, so plain `next/image` optimizes them.
 * `SmartImage` is not used here: it takes a single square `px`, being built for
 * avatars, and these are 510x665 and 926x706.
 *
 * The only reason this is a client component is the selected tab.
 */
export function DocsPanel({ docs }: { readonly docs: readonly TicketDoc[] }) {
  const [active, setActive] = useState(0);
  const doc = docs[active];
  if (!doc) return null;

  return (
    <div className="rounded-[12px] border border-border bg-card/60 p-6 backdrop-blur-sm dark:border-[#3c4a3f] dark:bg-[#060a08]/60 lg:p-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        {/* Tabs. Real buttons in a tablist rather than divs, so keyboard and
            screen-reader users get the same affordance the accent bar shows. */}
        <div
          role="tablist"
          aria-label="Candidate documents"
          className="flex shrink-0 flex-col gap-8 lg:w-[340px]"
        >
          {docs.map((d, i) => (
            <button
              key={d.key}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={cn(
                "border-l-[5.58px] pl-4 text-left transition-colors",
                i === active
                  ? "border-emerald-600 dark:border-emerald-400"
                  : "border-transparent hover:border-border dark:hover:border-[#3c4a3f]",
              )}
            >
              <span className="block font-heading text-xl font-semibold text-foreground lg:text-[27.9px] lg:leading-[39px]">
                {d.title}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground lg:text-[19.5px] lg:leading-[28px]">
                {d.blurb}
              </span>
            </button>
          ))}
        </div>

        {/* Document */}
        <div className="min-w-0 flex-1 rounded-[8px] border border-border bg-background/40 p-4 dark:border-[#3c4a3f] lg:p-6">
          {doc.cover ? (
            <Image
              src={doc.cover}
              unoptimized={!isOptimizedImageSrc(doc.cover)}
              alt={`${doc.title} cover`}
              width={510}
              height={665}
              sizes="(min-width: 1024px) 510px, 100vw"
              className="mx-auto h-auto w-full max-w-[510px] rounded-[4px]"
            />
          ) : (
            <div className="flex aspect-[510/665] items-center justify-center rounded-[4px] border border-dashed border-border p-6 text-center text-sm text-muted-foreground dark:border-[#3c4a3f]">
              No {doc.title.toLowerCase()} published yet.
            </div>
          )}

          {/* Toolbar. The left half is inert chrome, so it is hidden from the
              accessibility tree rather than announced as operable controls. */}
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4 dark:border-[#3c4a3f]">
            <div className="flex items-center gap-4 text-muted-foreground" aria-hidden>
              <Minus className="size-5" />
              <Plus className="size-5" />
              <Expand className="size-5" />
              {doc.pages ? <span className="ml-2 font-mono text-xs">1 of {doc.pages}</span> : null}
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Search className="size-5" aria-hidden />
              {doc.href ? (
                <a
                  href={doc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                >
                  <Download className="size-5" aria-hidden />
                  <span className="sr-only">Download the {doc.title}</span>
                </a>
              ) : (
                <span className="opacity-40" title={`${doc.title} is not published yet`}>
                  <Download className="size-5" aria-hidden />
                  <span className="sr-only">{doc.title} not available</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
