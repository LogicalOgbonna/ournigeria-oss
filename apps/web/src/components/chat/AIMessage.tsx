"use client";

import { useMemo, useState } from "react";
import { AIResponseContent } from "@/types";
import { StatHighlight } from "@/components/cards/StatHighlight";
import { BudgetBarChart } from "@/components/charts/BarChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { TrendLine } from "@/components/charts/TrendLine";
import { ChartRenderer } from "@/components/charts/ChartRenderer";
import { MoneyCouldBuyCard } from "@/components/cards/MoneyCouldBuyCard";
import { StateComparisonCard } from "@/components/cards/StateComparisonCard";
import { Markdown } from "./Markdown";
import { FileText, ChevronDown, Download } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { extractChartBlocks } from "@/lib/chart-parser";

interface AIMessageProps {
  content: AIResponseContent;
  onFollowUpClick: (text: string) => void;
}

export function AIMessage({ content, onFollowUpClick }: AIMessageProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false);

  // Parse any chart blocks embedded in the text markdown
  const { text: cleanedText, charts: inlineCharts } = useMemo(
    () => extractChartBlocks(content.text),
    [content.text],
  );

  // Combine structured charts with inline-parsed charts
  const allCharts = useMemo(
    () => [...(content.charts ?? []), ...inlineCharts],
    [content.charts, inlineCharts],
  );

  const hasNewCharts = allCharts.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Stat Highlights */}
      {content.stats && content.stats.length > 0 && (
        <StatHighlight stats={content.stats} />
      )}

      {/* Text (with chart blocks stripped out) */}
      {cleanedText.trim() && (
        <div className="rounded-2xl rounded-tl-sm bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          <Markdown>{cleanedText}</Markdown>
        </div>
      )}

      {/* State Comparison */}
      {content.stateComparison && (
        <StateComparisonCard
          state1={content.stateComparison.state1}
          state2={content.stateComparison.state2}
        />
      )}

      {/* New chart system — render all ChartBlock[] */}
      {hasNewCharts &&
        allCharts.map((chart, i) => <ChartRenderer key={i} block={chart} />)}

      {/* Legacy chart support (backwards compat) — only when no new charts */}
      {!hasNewCharts && content.barChart && (
        <BudgetBarChart
          title={content.barChart.title}
          data={content.barChart.data}
        />
      )}

      {!hasNewCharts && content.donutChart && (
        <DonutChart
          title={content.donutChart.title}
          data={content.donutChart.data}
        />
      )}

      {!hasNewCharts && content.trendLine && (
        <TrendLine
          title={content.trendLine.title}
          data={content.trendLine.data}
          lines={content.trendLine.lines}
        />
      )}

      {/* Money Equivalents */}
      {content.moneyEquivalents && (
        <MoneyCouldBuyCard
          title={content.moneyEquivalents.title}
          amount={content.moneyEquivalents.amount}
          items={content.moneyEquivalents.items}
        />
      )}

      {/* Source Citations — collapsible */}
      {content.sources && content.sources.length > 0 && (
        <div>
          <button
            onClick={() => setSourcesOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <FileText className="h-3 w-3" />
            <span>
              {content.sources.length} source
              {content.sources.length > 1 ? "s" : ""}
            </span>
            <ChevronDown
              className={`h-3 w-3 transition-transform ${sourcesOpen ? "rotate-180" : ""}`}
            />
          </button>

          {sourcesOpen && (
            <div className="mt-2 flex flex-col gap-1.5 animate-fade-in max-h-40 overflow-y-auto">
              {content.sources.map((source, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 px-2.5 py-1.5 text-xs border border-slate-100 dark:border-slate-700"
                >
                  <span className="inline-flex items-center rounded bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600 dark:text-slate-300 shrink-0">
                    {source.sourceType}
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                    {source.title}
                  </span>
                  <a
                    href={apiUrl(
                      `/api/sources/download?path=${encodeURIComponent(source.location)}`,
                    )}
                    download={source.fileName}
                    className="shrink-0 ml-auto p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    title={`Download ${source.fileName}`}
                  >
                    <Download className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Follow-up Suggestions */}
      {content.followUps && content.followUps.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {content.followUps.map((f, i) => (
            <button
              key={i}
              onClick={() => onFollowUpClick(f.text)}
              className="animate-fade-in rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 transition-all hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:shadow-sm"
              style={{ animationDelay: `${i * 100 + 400}ms`, opacity: 0 }}
            >
              {f.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
