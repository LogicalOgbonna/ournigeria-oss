"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-expand textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, [input]);

  return (
    <div className="border-t border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto max-w-3xl px-4 py-3">
        <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm transition-all focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-500/10 focus-within:shadow-md">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Nigerian state budgets..."
            rows={1}
            className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="mb-1 h-9 w-9 shrink-0 rounded-xl bg-emerald-600 text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">
          NaijaBudget AI analyses real state budget documents. Figures are
          sourced from official publications but may contain extraction errors.
        </p>
      </div>
    </div>
  );
}
