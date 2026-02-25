"use client";

import { Sparkles } from "lucide-react";

export function TypingIndicator({ statusText }: { statusText?: string }) {
  return (
    <div className="animate-fade-in-up flex items-start gap-3 px-4 py-3">
      <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 md:flex">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-800 px-4 py-3">
        <div className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full bg-emerald-400"
            style={{
              animation: "bounce-dot 1.4s infinite ease-in-out both",
              animationDelay: "0s",
            }}
          />
          <span
            className="inline-block h-2 w-2 rounded-full bg-emerald-400"
            style={{
              animation: "bounce-dot 1.4s infinite ease-in-out both",
              animationDelay: "0.16s",
            }}
          />
          <span
            className="inline-block h-2 w-2 rounded-full bg-emerald-400"
            style={{
              animation: "bounce-dot 1.4s infinite ease-in-out both",
              animationDelay: "0.32s",
            }}
          />
        </div>
        {statusText && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {statusText}
          </span>
        )}
      </div>
    </div>
  );
}
