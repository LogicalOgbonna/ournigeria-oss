"use client";

import { useState } from "react";
import { ChevronDown, Search, Brain } from "lucide-react";
import type { ThinkingStep } from "@/types";

const TOOL_LABELS: Record<string, string> = {
  budgetSearchTool: "Searched budget documents",
  "budget-search": "Searched budget documents",
  corruptionSearchTool: "Searched corruption cases",
  "corruption-search": "Searched corruption cases",
  govspendSearchTool: "Searched government payments",
  "govspend-search": "Searched government payments",
  faacSearchTool: "Searched FAAC allocations",
  "faac-search": "Searched FAAC allocations",
  webSearchTool: "Searched the web",
  "web-search": "Searched the web",
  impactCalculatorTool: "Calculated real-world impact",
  "impact-calculator": "Calculated real-world impact",
};

function getToolLabel(tool: string): string {
  return TOOL_LABELS[tool] ?? `Used ${tool}`;
}

interface ThinkingDropdownProps {
  steps: ThinkingStep[];
}

export function ThinkingDropdown({ steps }: ThinkingDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (steps.length === 0) return null;

  // Build a summary label from the tool calls
  const toolCalls = steps.filter((s) => s.type === "tool_call");
  const summary =
    toolCalls.length > 0
      ? `Analyzed ${toolCalls.length} source${toolCalls.length > 1 ? "s" : ""}`
      : "Processed your question";

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 px-3 py-2 text-left text-xs text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <Brain className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
        <span className="flex-1 truncate font-medium">{summary}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="mt-1.5 animate-fade-in space-y-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-2.5">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              {step.type === "tool_call" ? (
                <>
                  <Search className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                  <span className="text-slate-600 dark:text-slate-300">
                    {getToolLabel(step.tool ?? step.content)}
                  </span>
                </>
              ) : (
                <>
                  <Brain className="mt-0.5 h-3 w-3 shrink-0 text-slate-400 dark:text-slate-500" />
                  <span className="text-slate-500 dark:text-slate-400 line-clamp-2">
                    {step.content}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
