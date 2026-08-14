"use client";

import { useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { Show } from "@/components/ui/Show";
import { SmartImage } from "@/components/ui/SmartImage";
import type { Official } from "@/lib/api";
import { formatOfficialLocation } from "@/lib/api";

function formatDateRange(startDate: string, endDate: string | null): string {
  const fmt = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };
  if (endDate) return `${fmt(startDate)} – ${fmt(endDate)}`;
  return `Since ${fmt(startDate)}`;
}

export function OfficialHero({
  official,
  position,
  completeness,
}: {
  official: Official;
  position: any;
  completeness: number;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex gap-6 items-start mb-7 max-[560px]:flex-col max-[560px]:items-center max-[560px]:text-center">
      {/* Photo */}
      <div className="w-[120px] h-[120px] min-w-[120px] rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
        <Show when={!!official.imageUrl && !imgError}>
          <SmartImage
            src={official.imageUrl!}
            alt={official.name}
            px={120}
            priority
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </Show>
        <Show when={!(!!official.imageUrl && !imgError)}>
          <User className="w-12 h-12 text-slate-400 opacity-35" />
        </Show>
      </div>

      <div className="flex-1 flex flex-col justify-between h-[120px] max-[560px]:h-auto max-[560px]:gap-3">
        <div>
          {/* Overline */}
          <div className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-emerald-400 mb-1">
            {position?.role || "Official"}
            {position?.party && (
              <>
                {" · "}
                <Link
                  href={`/parties/${position.party}`}
                  className="hover:text-emerald-300 hover:underline"
                >
                  {position.party}
                </Link>
              </>
            )}
          </div>

          {/* Name */}
          <h1 className="font-serif text-[30px] text-slate-900 dark:text-white leading-[1.1] max-[560px]:text-[24px]">
            {official.name}
          </h1>

          {/* Location — ward/LGA/state for councilors, constituency for
              legislators, state for governors */}
          {position && (
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">
              {formatOfficialLocation(position)}
            </p>
          )}

          {/* Term info */}
          {position?.termName && (
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 mt-0.5">
              {position.termName}
            </p>
          )}
          {position?.startDate && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {formatDateRange(position.startDate, position.endDate)}
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-[3px] bg-black/5 dark:bg-white/10 rounded-sm overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-sm transition-[width] duration-600"
              style={{ width: `${completeness}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-emerald-400 whitespace-nowrap">
            {completeness}% complete
          </span>
        </div>
      </div>
    </div>
  );
}
