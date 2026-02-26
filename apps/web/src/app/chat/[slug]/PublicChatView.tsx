"use client";

import { useState } from "react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sparkles, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Message, AIResponseContent } from "@/types";

interface PublicConversation {
  id: string;
  title: string;
  slug: string;
  sharedAt: string;
  mentionedStates: string[];
  mentionedYears: number[];
  createdAt: string;
  messages: {
    id: string;
    sequenceNumber: number;
    role: "user" | "assistant";
    content: string;
    richContent?: AIResponseContent;
    createdAt: string;
  }[];
}

interface PublicChatViewProps {
  conversation: PublicConversation;
}

export function PublicChatView({ conversation }: PublicChatViewProps) {
  const [copied, setCopied] = useState(false);

  const messages: Message[] = conversation.messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    richContent: m.richContent ?? undefined,
    timestamp: new Date(m.createdAt),
  }));

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback — silently fail
    }
  };

  const sharedDate = conversation.sharedAt
    ? new Date(conversation.sharedAt).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  // No-op handler for follow-up clicks in read-only mode
  const noop = () => {};

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-[var(--font-heading)] text-base font-bold text-slate-800 dark:text-slate-100">
              Our
              <span className="text-emerald-600 dark:text-emerald-400">
                Nigeria
              </span>
            </span>
          </a>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyLink}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {copied ? (
                <Check className="mr-1 h-3 w-3 text-emerald-500" />
              ) : (
                <Link2 className="mr-1 h-3 w-3" />
              )}
              {copied ? "Copied!" : "Copy link"}
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Title Banner */}
      <div className="border-b border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-900/50">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {conversation.title}
          </h1>
          {sharedDate && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Shared on {sharedDate}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl py-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onFollowUpClick={noop}
            />
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <footer className="border-t border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Want to explore Nigerian budgets yourself?
          </p>
          <a
            href="/"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-emerald-500 hover:to-emerald-600 hover:shadow-md"
          >
            <Sparkles className="h-4 w-4" />
            Ask your own question on OurNigeria
          </a>
        </div>
      </footer>
    </div>
  );
}
