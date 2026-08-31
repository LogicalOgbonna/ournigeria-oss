"use client";

import { useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { cdnAvatar } from "@/lib/img";
import type { Official, Position } from "@/lib/api";

const ROLE_LABELS: Record<string, string> = {
  governor: "Governor",
  deputy_governor: "Deputy Governor",
  senator: "Senator",
  representative: "Federal Representative",
  rep: "Federal Representative",
  mha: "State House Member",
  lga_chairman: "LGA Chairman",
  councilor: "Ward Councilor",
};

/** Donut completeness badge overlaid on the card photo (Figma 541:600). */
function CompletenessBadge({ value }: { value: number }) {
  const radius = 11;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white ring-2 ring-white/30">
      <svg width="28" height="28" viewBox="0 0 28 28" className="absolute inset-0" aria-hidden>
        <circle cx="14" cy="14" r={radius} fill="none" stroke="#cbffef" strokeWidth="2" />
        <circle
          cx="14"
          cy="14"
          r={radius}
          fill="none"
          stroke="#00d492"
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (value / 100) * circumference}
          strokeLinecap="round"
          transform="rotate(-90 14 14)"
        />
      </svg>
      <span className="relative text-[8px] font-bold leading-none text-[#0f2919]">{value}%</span>
    </div>
  );
}

/** Mini party flag disc — logo on a white fill (transparent PNGs stay legible),
 *  acronym fallback when missing or broken. */
function PartyFlag({ acronym, logo }: { acronym: string; logo?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#43ee94] bg-[#2a2a2a] text-[6px] font-bold text-white">
      {logo && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={acronym} className="h-full w-full bg-white object-contain p-px" onError={() => setFailed(true)} />
      ) : (
        acronym.slice(0, 3).toUpperCase()
      )}
    </span>
  );
}

/**
 * Photo-led official card (Figma "Nigerian Officials" 541:600 / profile 529:47).
 * Used by the officials directory grid and the profile's peer-officials section.
 * `position` overrides `official.positions[0]` for callers (like the by-location
 * chain) that carry the relevant position separately.
 */
export function OfficialGridCard({
  official,
  position: positionProp,
  partyLogos = {},
}: {
  official: Official;
  position?: Position | null;
  partyLogos?: Record<string, string>;
}) {
  const [imgError, setImgError] = useState(false);
  const position = positionProp ?? official.positions?.[0];
  const completeness = Math.round(official.completenessScore * 100);
  const location = position?.ward || position?.constituency || position?.lga || position?.state || "";
  const roleLabel = position?.role ? ROLE_LABELS[position.role] || position.role : "Official";
  const sinceYear = position?.startDate ? new Date(position.startDate).getFullYear() : null;
  const showImage = official.imageUrl && !imgError;

  return (
    <Link
      href={`/officials/${official.slug ?? official.id}`}
      className="block overflow-hidden rounded-[10px] border border-slate-200 bg-white transition-all hover:border-emerald-400 hover:shadow-md dark:border-white/5 dark:bg-[#060a08] dark:hover:border-emerald-600"
    >
      {/* Photo on the brand-green backdrop */}
      <div className="relative aspect-[171/146] w-full overflow-hidden bg-[#43ee94]">
        {showImage ? (
          <SmartImage
            src={cdnAvatar(official.imageUrl) ?? official.imageUrl!}
            alt={official.name}
            px={342}
            className="h-full w-full object-cover object-top"
            onError={() => setImgError(true)}
          />
        ) : (
          /* white silhouette bust, bottom-anchored and cropped like the Figma placeholder */
          <User
            className="absolute -bottom-[10%] left-1/2 h-[88%] w-auto -translate-x-1/2 text-white"
            fill="currentColor"
            strokeWidth={0}
          />
        )}
        <CompletenessBadge value={completeness} />
      </div>

      {/* Meta */}
      <div className="p-3">
        <p className="truncate text-sm font-bold text-slate-900 dark:text-[#bbcbbc]">
          {official.name}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-[#bbcbbc]">
          <span className="truncate">{roleLabel}</span>
          {location && (
            <>
              <span aria-hidden className="h-0.5 w-0.5 shrink-0 rounded-full bg-current" />
              <span className="truncate text-emerald-600 dark:text-[#00d492]">{location}</span>
            </>
          )}
        </p>
        <div className="mt-2 flex h-4 items-center justify-between gap-2">
          {position?.party ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <PartyFlag acronym={position.party} logo={partyLogos[position.party.toUpperCase()]} />
              <span className="truncate text-[10px] text-slate-600 dark:text-[#bbcbbc]">
                {position.party}
              </span>
            </span>
          ) : (
            <span />
          )}
          {sinceYear && (
            <span className="shrink-0 text-[10px] text-slate-500 dark:text-white/80">
              Since {sinceYear}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
