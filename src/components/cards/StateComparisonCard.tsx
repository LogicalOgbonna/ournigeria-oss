"use client";

import { formatNaira } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface StateComparisonCardProps {
  state1: { name: string; budget: number; perCapita: number };
  state2: { name: string; budget: number; perCapita: number };
}

export function StateComparisonCard({ state1, state2 }: StateComparisonCardProps) {
  return (
    <Card className="animate-scale-in overflow-hidden border-slate-200/80 bg-white p-0">
      <div className="border-b border-slate-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-700">
          {state1.name} vs {state2.name}
        </h3>
      </div>
      <div className="flex items-stretch">
        {/* State 1 */}
        <div className="flex-1 border-r border-slate-100 p-5">
          <div className="mb-1 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            {state1.name}
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{formatNaira(state1.budget)}</p>
          <p className="text-xs text-slate-500">Total budget</p>
          <p className="mt-2 text-lg font-semibold text-emerald-600">
            {formatNaira(state1.perCapita)}
          </p>
          <p className="text-xs text-slate-500">Per capita</p>
        </div>

        {/* Divider icon */}
        <div className="flex items-center px-2">
          <ArrowRight className="h-4 w-4 text-slate-300" />
        </div>

        {/* State 2 */}
        <div className="flex-1 p-5">
          <div className="mb-1 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            {state2.name}
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{formatNaira(state2.budget)}</p>
          <p className="text-xs text-slate-500">Total budget</p>
          <p className="mt-2 text-lg font-semibold text-blue-600">
            {formatNaira(state2.perCapita)}
          </p>
          <p className="text-xs text-slate-500">Per capita</p>
        </div>
      </div>
    </Card>
  );
}
