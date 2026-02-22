"use client";

import { AIResponseContent } from "@/types";
import { StatHighlight } from "@/components/cards/StatHighlight";
import { BudgetBarChart } from "@/components/charts/BarChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { TrendLine } from "@/components/charts/TrendLine";
import { MoneyCouldBuyCard } from "@/components/cards/MoneyCouldBuyCard";
import { StateComparisonCard } from "@/components/cards/StateComparisonCard";
import { Markdown } from "./Markdown";

interface AIMessageProps {
  content: AIResponseContent;
  onFollowUpClick: (text: string) => void;
}

export function AIMessage({ content, onFollowUpClick }: AIMessageProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Stat Highlights */}
      {content.stats && content.stats.length > 0 && (
        <StatHighlight stats={content.stats} />
      )}

      {/* Text */}
      <div className="rounded-2xl rounded-tl-sm bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
        <Markdown>{content.text}</Markdown>
      </div>

      {/* State Comparison */}
      {content.stateComparison && (
        <StateComparisonCard
          state1={content.stateComparison.state1}
          state2={content.stateComparison.state2}
        />
      )}

      {/* Charts */}
      {content.barChart && (
        <BudgetBarChart
          title={content.barChart.title}
          data={content.barChart.data}
        />
      )}

      {content.donutChart && (
        <DonutChart
          title={content.donutChart.title}
          data={content.donutChart.data}
        />
      )}

      {content.trendLine && (
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

      {/* Follow-up Suggestions */}
      {content.followUps && content.followUps.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {content.followUps.map((f, i) => (
            <button
              key={i}
              onClick={() => onFollowUpClick(f.text)}
              className="animate-fade-in rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-all hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-sm"
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
