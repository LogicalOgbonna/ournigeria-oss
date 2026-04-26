"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Loader2, ChevronDown, Sparkles, Globe } from "lucide-react";
import { AVAILABLE_TOOLS, type ToolId, type Language } from "@/types";

const LANGUAGE_STORAGE_KEY = "ournigeria-language";

const AUTO_DESCRIPTION: Record<Language, string> = {
  en: "AI picks the best tool based on your question",
  pcm: "AI go pick the best tool based on your question",
};

const PLACEHOLDER: Record<ToolId | "default", string> = {
  corruption: "Ask about EFCC corruption cases...",
  budget: "Ask about Nigerian budgets...",
  govspend: "Ask about government payments...",
  faac: "Ask about federal allocation data...",
  impact: "Ask about the real-world impact of spending...",
  general: "Ask anything about Nigeria...",
  default: "Ask about budgets, corruption cases, or government payments...",
};

const LANGUAGE_OPTIONS: {
  id: Language;
  label: string;
  description: string;
}[] = [
  { id: "en", label: "English", description: "Standard English responses" },
  {
    id: "pcm",
    label: "Pidgin",
    description: "Nigerian Pidgin English responses",
  },
];

function toExpirationMs(n: number): number {
  return n < 1e12 ? n * 1000 : n;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Ready";
  const s = Math.ceil(ms / 1000);
  const d = Math.floor(s / (24 * 3600));
  const h = Math.floor((s % (24 * 3600)) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rs = s % 60;
  
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (rs > 0 || parts.length === 0) parts.push(`${rs}s`);
  
  return parts.join(" ");
}

interface ChatInputProps {
  onSend: (message: string, tool?: ToolId | null, language?: Language) => void;
  isLoading: boolean;
  /** Roll-off times from 429; input stays disabled while every time is still in the future. */
  rateLimitExpirations?: number[];
}

export function ChatInput({
  onSend,
  isLoading,
  rateLimitExpirations = [],
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [selectedTool, setSelectedTool] = useState<ToolId | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === "pcm") return "pcm";
    }
    return "en";
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const [rateLimitNow, setRateLimitNow] = useState(() => Date.now());

  // Re-render on an interval when count-downs are active (deferred `now` to avoid sync setState in effect).
  useEffect(() => {
    if (rateLimitExpirations.length === 0) return;
    const t0 = setTimeout(() => setRateLimitNow(Date.now()), 0);
    const id = setInterval(() => setRateLimitNow(Date.now()), 1000);
    return () => {
      clearTimeout(t0);
      clearInterval(id);
    };
  }, [rateLimitExpirations]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    window.dispatchEvent(new CustomEvent("language-change", { detail: lang }));
  };

  const expMs = rateLimitExpirations.map(toExpirationMs);
  /** All roll-off times still in the future — no message slot has opened since 429. */
  const allSlotsInFuture =
    expMs.length > 0 && expMs.every((t) => t > rateLimitNow);
  const rateLimitLocksInput = allSlotsInFuture;
  const countdownMs = allSlotsInFuture
    ? Math.max(0, Math.min(...expMs) - rateLimitNow)
    : 0;

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || rateLimitLocksInput) return;
    onSend(trimmed, selectedTool, language);
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(e.target as Node)
      ) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeLabel = selectedTool
    ? AVAILABLE_TOOLS.find((t) => t.id === selectedTool)?.label
    : "Auto";

  const defaultPlaceholder = selectedTool
    ? PLACEHOLDER[selectedTool]
    : PLACEHOLDER.default;
  const placeholderText =
    rateLimitLocksInput && countdownMs > 0
      ? `Next message in ${formatCountdown(countdownMs)}…`
      : defaultPlaceholder;

  return (
    <div className="border-t border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
      <div className="mx-auto max-w-3xl px-4 py-3">
        {/* Input area with integrated tool selector */}
        <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-all focus-within:border-emerald-300 dark:focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/10 focus-within:shadow-md">
          {/* Tool selector row */}
          <div className="flex items-center gap-2 px-4 pt-2" ref={dropdownRef}>
            <div className="relative" data-tour="tool-selector">
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
                      {AUTO_DESCRIPTION[language]}
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
                        {tool.description[language] ?? tool.description.en}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language selector */}
            <div
              className="relative"
              ref={langDropdownRef}
              data-tour="language-selector"
            >
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-700 dark:hover:text-emerald-300"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>
                  {LANGUAGE_OPTIONS.find((l) => l.id === language)?.label}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${langDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {langDropdownOpen && (
                <div className="absolute bottom-full left-0 z-20 mb-1 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 shadow-lg">
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setLanguage(opt.id);
                        setLangDropdownOpen(false);
                      }}
                      className={`flex w-full flex-col items-start rounded-lg px-3 py-2.5 text-left transition-colors ${
                        language === opt.id
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span className="text-sm font-medium">{opt.label}</span>
                      <span className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {opt.description}
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
              disabled={isLoading || rateLimitLocksInput}
              placeholder={placeholderText}
              rows={1}
              className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading || rateLimitLocksInput}
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
          OurNigeria analyses real budget documents, EFCC case files, and
          government payment records. Data is sourced from official publications
          but may contain extraction errors.
        </p>
      </div>
    </div>
  );
}
