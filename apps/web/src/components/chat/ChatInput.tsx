"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Loader2, ChevronDown, Sparkles } from "lucide-react";
import { AVAILABLE_TOOLS, type ToolId } from "@/types";

interface ChatInputProps {
  onSend: (message: string, tool?: ToolId | null) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [selectedTool, setSelectedTool] = useState<ToolId | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed, selectedTool);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeLabel = selectedTool
    ? AVAILABLE_TOOLS.find((t) => t.id === selectedTool)?.label
    : "Auto";

  return (
    <div className="border-t border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
      <div className="mx-auto max-w-3xl px-4 py-3">
        {/* Input area with integrated tool selector */}
        <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-all focus-within:border-emerald-300 dark:focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/10 focus-within:shadow-md">
          {/* Tool selector row */}
          <div className="flex items-center gap-2 px-4 pt-2" ref={dropdownRef}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-700 dark:hover:text-emerald-300"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{activeLabel}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute bottom-full left-0 z-20 mb-1 w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTool(null);
                      setDropdownOpen(false);
                    }}
                    className={`flex w-full flex-col items-start rounded-lg px-3 py-2.5 text-left transition-colors ${
                      selectedTool === null
                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span className="text-sm font-medium">Auto</span>
                    <span className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      AI picks the best tool based on your question
                    </span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                  {AVAILABLE_TOOLS.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => {
                        setSelectedTool(tool.id);
                        setDropdownOpen(false);
                      }}
                      className={`flex w-full flex-col items-start rounded-lg px-3 py-2.5 text-left transition-colors ${
                        selectedTool === tool.id
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span className="text-sm font-medium">{tool.label}</span>
                      <span className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {tool.description}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedTool && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Locked to {activeLabel}
              </span>
            )}
          </div>

          {/* Text input + send button */}
          <div className="flex items-end gap-2 px-4 pb-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedTool === "corruption"
                  ? "Ask about EFCC corruption cases..."
                  : selectedTool === "state-budget"
                    ? "Ask about Nigerian state budgets..."
                    : "Ask about budgets or corruption cases..."
              }
              rows={1}
              className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
            />
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="mb-1 h-9 w-9 shrink-0 rounded-xl bg-emerald-600 text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:shadow-none"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
          NaijaBudget AI analyses real state budget documents and EFCC case
          files. Data is sourced from official publications but may contain
          extraction errors.
        </p>
      </div>
    </div>
  );
}
