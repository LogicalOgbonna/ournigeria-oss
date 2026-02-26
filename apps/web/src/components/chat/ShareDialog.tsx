"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Globe, Lock, Link2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiUrl } from "@/lib/api";

interface ShareDialogProps {
  conversationId: string;
  visibility: "private" | "public";
  slug: string | null;
  onVisibilityChange: (visibility: "private" | "public", slug: string | null) => void;
  onClose: () => void;
}

export function ShareDialog({
  conversationId,
  visibility,
  slug,
  onVisibilityChange,
  onClose,
}: ShareDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPublic = visibility === "public";

  const shareUrl = slug
    ? `${window.location.origin}/chat/${slug}`
    : null;

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleToggle = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(apiUrl(`/api/conversations/${conversationId}/share`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ public: !isPublic }),
        });

        if (!res.ok) {
          setError("Failed to update sharing settings. Please try again.");
          return;
        }

        const data = await res.json();
        onVisibilityChange(data.visibility, data.slug);
      } catch {
        setError("Network error. Please try again.");
      }
    });
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Share Conversation
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Toggle */}
        <button
          onClick={handleToggle}
          disabled={isPending}
          className="w-full flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50"
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              isPublic
                ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
            }`}
          >
            {isPublic ? (
              <Globe className="h-5 w-5" />
            ) : (
              <Lock className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {isPublic ? "Public" : "Private"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isPublic
                ? "Anyone with the link can view this conversation"
                : "Only you can see this conversation"}
            </p>
          </div>
          <div
            className={`h-6 w-11 rounded-full transition-colors ${
              isPublic ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
            } relative`}
          >
            <div
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                isPublic ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </div>
        </button>

        {/* Error */}
        {error && (
          <p className="mt-2 text-xs text-red-500 dark:text-red-400">{error}</p>
        )}

        {/* Share URL */}
        {isPublic && shareUrl && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent text-xs text-slate-600 dark:text-slate-300 outline-none truncate"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="shrink-0 text-xs"
            >
              {copied ? (
                <Check className="mr-1 h-3 w-3 text-emerald-500" />
              ) : (
                <Link2 className="mr-1 h-3 w-3" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
