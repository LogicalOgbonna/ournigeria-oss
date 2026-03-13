"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Download, Copy, Check, FileText, Scale, Banknote, BarChart3 } from "lucide-react";
import type { SourceCitation } from "@/types";
import { apiUrl } from "@/lib/api";

interface SourceCitationModalProps {
  sources: SourceCitation[];
  activeIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Icon by source type */
function sourceTypeIcon(sourceType: string) {
  switch (sourceType.toLowerCase()) {
    case "budget":
      return <FileText className="h-3 w-3" />;
    case "corruption":
      return <Scale className="h-3 w-3" />;
    case "payment":
      return <Banknote className="h-3 w-3" />;
    case "faac":
      return <BarChart3 className="h-3 w-3" />;
    default:
      return <FileText className="h-3 w-3" />;
  }
}

export function SourceCitationModal({
  sources,
  activeIndex,
  open,
  onOpenChange,
}: SourceCitationModalProps) {
  const [currentIndex, setCurrentIndex] = useState(activeIndex);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  // Sync with external activeIndex when modal opens
  useEffect(() => {
    if (open) {
      setCurrentIndex(Math.min(activeIndex, sources.length - 1));
    }
  }, [activeIndex, open, sources.length]);

  // Scroll prevention
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  const navigate = useCallback(
    (direction: number) => {
      setCurrentIndex((i) => (i + direction + sources.length) % sources.length);
    },
    [sources.length],
  );

  // Keyboard navigation (useEffect, no library)
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onOpenChange(false);
      } else if (e.key === "ArrowRight" || e.key === "j") {
        navigate(1);
      } else if (e.key === "ArrowLeft" || e.key === "k") {
        navigate(-1);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, navigate, onOpenChange]);

  if (!open || sources.length === 0) return null;

  const source = sources[Math.min(currentIndex, sources.length - 1)];

  async function handleCopy() {
    const lines = [source.title];
    if (source.state || source.year || source.page) {
      lines.push([source.state, source.year, source.page && `Page ${source.page}`].filter(Boolean).join(" • "));
    }
    if (source.snippet) {
      lines.push(`"${source.snippet}"`);
    }
    lines.push(`Source type: ${source.sourceType.toUpperCase()}`);

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
    setTimeout(() => setCopyStatus("idle"), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600 dark:text-slate-300">
              {sourceTypeIcon(source.sourceType)}
              {source.sourceType}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Source {currentIndex + 1} of {sources.length}
            </span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            {source.title}
          </h3>
          {(source.state || source.year || source.page) && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {[source.state, source.year, source.page && `Page ${source.page}`].filter(Boolean).join(" • ")}
            </p>
          )}

          {/* Snippet */}
          <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-4">
            {source.snippet ? (
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 italic">
                &ldquo;{source.snippet}&rdquo;
              </p>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                No preview available
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-5 pb-4">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {copyStatus === "copied" ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" />
                Copied!
              </>
            ) : copyStatus === "failed" ? (
              <>
                <X className="h-3 w-3 text-red-500" />
                Failed
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy Citation
              </>
            )}
          </button>
          {source.location && (
            <a
              href={apiUrl(
                `/api/sources/download?path=${encodeURIComponent(source.location)}`,
              )}
              download={source.fileName}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Download className="h-3 w-3" />
              Download Source
            </a>
          )}
        </div>

        {/* Source navigation pills */}
        {sources.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 dark:border-slate-800 px-5 py-3">
            <button
              onClick={() => navigate(-1)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-1.5"
            >
              ←
            </button>
            {sources.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`min-w-[1.5rem] h-6 rounded-full text-[10px] font-semibold transition-colors ${
                  i === currentIndex
                    ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => navigate(1)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-1.5"
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
