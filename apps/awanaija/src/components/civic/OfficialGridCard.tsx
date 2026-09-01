"use client";

import { useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { roleLabel } from "@/lib/roles";
import type { Official, Position } from "@/lib/api";

/** Donut completeness badge overlaid on the card photo (Figma 541:600). */
function CompletenessBadge({ value }: { value: number }) {
  const radius = 11;
  const circumference = 2 * Math.PI * radius;
  return (
    <div
      role="img"
      aria-label={`Profile ${value}% complete`}
      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white ring-2 ring-white/30"
    >
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
      <span aria-hidden className="relative text-[8px] font-bold leading-none text-[#0f2919]">
        {value}%
      </span>
    </div>
  );
}

/** Mini party flag disc — logo on a white fill (transparent PNGs stay legible),
 *  party-initial fallback when missing or broken. Decorative: the acronym text
 *  renders right beside it, so the disc is aria-hidden. */
function PartyFlag({ acronym, logo }: { acronym: string; logo?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      aria-hidden
      className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-500 bg-white text-[8px] font-bold text-slate-600 dark:border-brand-green dark:bg-[#2a2a2a] dark:text-white"
    >
      {logo && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt=""
          width={16}
          height={16}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full bg-white object-contain p-px"
          onError={() => setFailed(true)}
        />
      ) : (
        acronym.slice(0, 1).toUpperCase()
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
  role: roleProp,
  partyLogos = {},
}: {
  official: Official;
  position?: Position | null;
  /** Role-code override — the by-location chain's slot role is authoritative
   *  for peer cards even when the chain entry carries no position. */
  role?: string | null;
  partyLogos?: Record<string, string>;
}) {
  const [imgError, setImgError] = useState(false);
  const position = positionProp ?? official.positions?.[0];
  // Score can be null/undefined or mis-scaled at runtime despite the typing —
  // clamp to 0-100 and hide the badge rather than render "NaN%".
  const completeness = Number.isFinite(official.completenessScore)
    ? Math.min(100, Math.max(0, Math.round(official.completenessScore * 100)))
    : null;
  const location = position?.ward || position?.constituency || position?.lga || position?.state || "";
  const role = roleLabel(roleProp ?? position?.role);
  const party = typeof position?.party === "string" ? position.party : null;
  // Year taken lexically from the date-only string: new Date("YYYY-MM-DD") is UTC
  // midnight, so .getFullYear() shifts to the prior year west of UTC (and can
  // mismatch between server and client render).
  const sinceYear = /^\d{4}/.test(position?.startDate ?? "") ? position!.startDate!.slice(0, 4) : null;
  const showImage = official.imageUrl && !imgError;

  return (
    <Link
      href={`/officials/${official.slug ?? official.id}`}
      data-testid="official-card"
      className="block overflow-hidden rounded-[10px] border border-slate-200 bg-white transition-all hover:border-emerald-400 hover:shadow-md dark:border-white/5 dark:bg-surface-night dark:hover:border-emerald-600"
    >
      {/* Photo on the brand-green backdrop. Uses the stored -600 variant directly:
          cdnAvatar's -128 thumbnail is for small avatars and would upscale blurry
          at this card width. */}
      <div className="relative aspect-[171/146] w-full overflow-hidden bg-brand-green">
        {showImage ? (
          <SmartImage
            src={official.imageUrl!}
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
        {completeness !== null && <CompletenessBadge value={completeness} />}
      </div>

      {/* Meta */}
      <div className="p-3">
        <p className="truncate text-sm font-bold text-slate-900 dark:text-ink-mist">
          {official.name}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-ink-mist">
          <span className="truncate">{role}</span>
          {location && (
            <>
              <span aria-hidden className="h-0.5 w-0.5 shrink-0 rounded-full bg-current" />
              <span className="truncate text-emerald-700 dark:text-brand-mint">{location}</span>
            </>
          )}
        </p>
        <div className="mt-2 flex h-4 items-center justify-between gap-2">
          {party ? (
            <span data-testid="party-row" className="flex min-w-0 items-center gap-1.5">
              <PartyFlag acronym={party} logo={partyLogos[party.toUpperCase()]} />
              <span className="truncate text-[11px] text-slate-600 dark:text-ink-mist">
                {party}
              </span>
            </span>
          ) : (
            <span />
          )}
          {sinceYear && (
            <span className="shrink-0 text-[11px] text-slate-500 dark:text-white/80">
              Since {sinceYear}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
