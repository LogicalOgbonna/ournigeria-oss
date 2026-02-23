"use client";

import { Message } from "@/types";
import { AIMessage } from "./AIMessage";
import { Markdown } from "./Markdown";
import { User, Sparkles } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  onFollowUpClick: (text: string) => void;
}

export function MessageBubble({
  message,
  onFollowUpClick,
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
            onFollowUpClick={onFollowUpClick}
          />
        ) : (
          <div className="rounded-2xl rounded-tl-sm bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            <Markdown>{message.content}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
