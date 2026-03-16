"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, VolumeX, Copy, Check, Share2, Download } from "lucide-react";
import { generateShareCard, shareOrDownload } from "./ShareCard";
import { Markdown } from "./Markdown";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { SourceCitation } from "@/types";

interface TLDRCardProps {
  summary: string;
  sources?: SourceCitation[];
  onCitationClick?: (index: number) => void;
}

/** Strip markdown formatting and citation markers for plain text */
function stripForPlainText(text: string): string {
  return (
    text
      // Remove citation markers [1], [2], etc.
      .replaceAll(/\[\d+\]/g, "")
      // Remove bold/italic markdown
      .replaceAll(/\*{1,3}(.*?)\*{1,3}/g, "$1")
      // Remove links
      .replaceAll(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Clean up extra whitespace
      .replaceAll(/\s+/g, " ")
      .trim()
  );
}

export function TLDRCard({ summary, sources, onCitationClick }: TLDRCardProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Feature detection (stable values — no need for useMemo)
  const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  // Only show "Share" on mobile — desktop macOS share sheet UX is poor
  const canShare = typeof navigator !== "undefined" &&
    !!navigator.share &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  // Listen button handler
  const handleListen = useCallback(() => {
    if (!speechSupported) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(stripForPlainText(summary));
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }, [summary, isSpeaking, speechSupported]);

  // Copy button handler
  const handleCopy = useCallback(async () => {
    const plainText = stripForPlainText(summary);
    try {
      await navigator.clipboard.writeText(plainText);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = plainText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopied(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [summary]);

  // Share / save image handler
  const handleShare = useCallback(async () => {
    setIsSharing(true);
    try {
      const blob = await generateShareCard(summary);
      if (!blob) return;
      await shareOrDownload(blob, summary);
    } catch (err) {
      console.error("[TLDRCard] Share failed:", err);
    } finally {
      setIsSharing(false);
    }
  }, [summary]);

  return (
    <div className="relative rounded-2xl rounded-tl-sm border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/30 overflow-hidden animate-fade-in">
      {/* Emerald gradient left border */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600" />

      {/* Summary content — rendered through Markdown for clickable citation pills */}
      <div className="px-5 py-4 pl-6">
        <TooltipProvider delayDuration={300}>
          <div className="text-[15px] leading-relaxed text-slate-800 dark:text-slate-100 font-medium [&_p]:m-0">
            <Markdown sources={sources} onCitationClick={onCitationClick}>
              {summary}
            </Markdown>
          </div>
        </TooltipProvider>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 px-5 pb-3 pl-6">
        {speechSupported && (
          <button
            onClick={handleListen}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              isSpeaking
                ? "bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            title={isSpeaking ? "Stop listening" : "Listen"}
          >
            {isSpeaking ? (
              <VolumeX className="h-3.5 w-3.5" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
            <span>{isSpeaking ? "Stop" : "Listen"}</span>
          </button>
        )}

        <button
          onClick={handleCopy}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            copied
              ? "bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Copy summary"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>

        <button
          onClick={handleShare}
          disabled={isSharing}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-all disabled:opacity-50"
          title={canShare ? "Share" : "Download image"}
        >
          {canShare ? (
            <Share2 className="h-3.5 w-3.5" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          <span>{isSharing ? "Generating..." : canShare ? "Share" : "Save image"}</span>
        </button>
      </div>
    </div>
  );
}
