"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface NarrativeEntity {
  name: string;
  type: string;
}

interface NarrativeBlockProps {
  narrative: string;
  entities: NarrativeEntity[];
}

export function NarrativeBlock({ narrative, entities }: NarrativeBlockProps) {
  return (
    <div className="rounded-lg border-l-4 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
      <h4 className="font-heading font-semibold text-sm text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
        <ArrowRight className="h-3.5 w-3.5" />
        Follow the Money
      </h4>
      <p className="font-sans text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        {narrative}
      </p>
      {entities.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {entities.map((entity, i) => (
            <Link
              key={i}
              href={`/explore?search=${encodeURIComponent(entity.name)}`}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/40 transition-colors"
            >
              {entity.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
