"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Message } from "@/types";
import { AIMessage } from "./AIMessage";
import { Markdown } from "./Markdown";
import { User, Sparkles, RefreshCw } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  conversationId?: string | null;
  onFollowUpClick: (text: string) => void;
  onRetry?: (originalMessage: string) => void;
  /** The content of the user message immediately before this one (for retry). */
  previousUserMessage?: string;
  /** Whether a message is currently being processed (pauses auto-retry). */
  isLoading?: boolean;
}

function RetryCountdown({
  onRetry,
  isLoading,
}: {
  onRetry: () => void;
  isLoading?: boolean;
}) {
  const COUNTDOWN_SECONDS = 10;
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [isRetrying, setIsRetrying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef(false);

  // Pause countdown when isLoading, resume when not
  useEffect(() => {
    if (isLoading || firedRef.current) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLoading]);

  // Fire retry via useEffect when countdown reaches 0 (not inside state updater)
  useEffect(() => {
    if (secondsLeft === 0 && !firedRef.current && !isLoading) {
      firedRef.current = true;
      setTimeout(() => {
        setIsRetrying(true);
      }, 100);
      onRetry();
    }
  }, [secondsLeft, isLoading, onRetry]);

  const handleManualRetry = useCallback(() => {
    if (firedRef.current || isRetrying || isLoading) return;
    firedRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSecondsLeft(0);
    setIsRetrying(true);
    onRetry();
  }, [isRetrying, isLoading, onRetry]);

  // SVG progress ring
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const progress = secondsLeft / COUNTDOWN_SECONDS;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <button
      onClick={handleManualRetry}
      disabled={isRetrying || isLoading}
      className="mt-2 inline-flex items-center gap-2 rounded-lg bg-red-100 dark:bg-red-900/30 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 transition-all hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-60"
    >
      {isRetrying ? (
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
      ) : secondsLeft > 0 ? (
        <svg width="28" height="28" className="shrink-0 -ml-0.5">
          <circle
            cx="14"
            cy="14"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.2"
          />
          <circle
            cx="14"
            cy="14"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 14 14)"
            className="transition-all duration-1000 ease-linear"
          />
          <text
            x="14"
            y="14"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-current text-[9px] font-bold"
          >
            {secondsLeft}
          </text>
        </svg>
      ) : (
        <RefreshCw className="h-3.5 w-3.5" />
      )}
      {isRetrying
        ? "Retrying..."
        : isLoading
          ? "Waiting..."
          : secondsLeft > 0
            ? `Auto-retry in ${secondsLeft}s — or tap now`
            : "Try again"}
    </button>
  );
}

export function MessageBubble({
  message,
  conversationId,
  onFollowUpClick,
  onRetry,
  previousUserMessage,
  isLoading,
}: MessageBubbleProps) {
  if (message.role === "user") {
    return (
      <div className="animate-fade-in-up flex items-start justify-end gap-3 px-4 py-3">
        <div className="max-w-[95%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-3 text-sm leading-relaxed text-white shadow-sm md:max-w-[70%]">
          {message.content}
        </div>
        <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 md:flex">
          <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up flex items-start gap-3 px-4 py-3">
      <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 md:flex">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 max-w-full md:max-w-[85%]">
        {message.richContent ? (
          <AIMessage
            content={message.richContent}
            thinking={message.thinking}
            messageId={message.id}
            conversationId={conversationId ?? undefined}
            onFollowUpClick={onFollowUpClick}
          />
        ) : (
          <div
            className={`rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed ${
              message.isError
                ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                : "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            <Markdown>{message.content}</Markdown>
          </div>
        )}
        {message.isError &&
          message.retryable &&
          previousUserMessage &&
          onRetry && (
            <RetryCountdown
              onRetry={() => onRetry(previousUserMessage)}
              isLoading={isLoading}
            />
          )}
      </div>
    </div>
  );
}
