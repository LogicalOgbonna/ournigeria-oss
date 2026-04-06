"use client";

import { useState } from "react";
import Link from "next/link";
import { User, ExternalLink, Calendar } from "lucide-react";
import type { Official, Position } from "@/lib/api";

interface OfficialCardProps {
  readonly official: Official | null;
  readonly position: Position | null;
  readonly role: string;
  readonly scope?: Record<string, string>;
  readonly showProposals?: boolean;
  readonly onClick?: () => void;
}

const PARTY_COLORS: Record<string, string> = {
  APC: "#059669",
  PDP: "#ef4444",
  LP: "#0891b2",
  NNPP: "#d97706",
  APGA: "#65a30d",
  YPP: "#7c3aed",
  SDP: "#e11d48",
  ADC: "#0284c7",
};

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    governor: "Governor",
    deputy_governor: "Deputy Governor",
    senator: "Senator",
    representative: "Federal Representative",
    rep: "Federal Representative",
    mha: "State House Member",
    lga_chairman: "LGA Chairman",
    councilor: "Ward Councilor",
  };
  return labels[role] || role;
}

function getLocationLabel(position: Position | null): string {
  if (!position) return "";
  const parts = [];
  if (position.constituency) parts.push(position.constituency);
  else if (position.ward) parts.push(position.ward);
  else if (position.lga) parts.push(position.lga);
  else if (position.state) parts.push(position.state);
  return parts.join(", ");
}

export function OfficialCard({ official, position, role, scope, showProposals = true, onClick }: OfficialCardProps) {
  const [imgError, setImgError] = useState(false);

  if (!official) {
    return <UnknownOfficialCard role={role} position={position} scope={scope} onClick={onClick} />;
  }
  const partyColor = position?.party ? PARTY_COLORS[position.party] || "#94a3b8" : "#94a3b8";
  const completeness = Math.round(official.completenessScore * 100);
  const showImage = official.imageUrl && !imgError;

  return (
    <Link
      href={`/officials/${official.id}`}
      onClick={onClick}
      className="block bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all cursor-pointer"
      style={{ borderLeftWidth: "4px", borderLeftColor: partyColor }}
    >
      <div className="flex">
        {/* Photo: square on desktop, circle on mobile */}
        <div className="hidden md:block shrink-0">
          {showImage ? (
            <img
              src={official.imageUrl!}
              alt={official.name}
              className="w-24 h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-24 h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <User className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          {/* Mobile-only: small circle photo inline */}
          <div className="flex items-start gap-3">
            <div className="md:hidden shrink-0">
              {showImage ? (
                <img
                  src={official.imageUrl!}
                  alt={official.name}
                  className="w-11 h-11 rounded-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Name + party */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-900 dark:text-white truncate text-[15px]">
                  {official.name}
                </span>
                {position?.party && (
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white shrink-0"
                    style={{ backgroundColor: partyColor }}
                  >
                    {position.party}
                  </span>
                )}
              </div>

              {/* Role + location */}
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {getRoleLabel(role)}
                {getLocationLabel(position) && (
                  <span className="text-slate-400 dark:text-slate-500">
                    {" · "}
                    {getLocationLabel(position)}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Desktop: extra details row */}
          <div className="hidden md:flex items-center gap-4 mt-2.5 text-xs text-slate-500 dark:text-slate-400">
            {position?.startDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Since {new Date(position.startDate).getFullYear()}</span>
              </div>
            )}
            <CompletenessRing value={completeness} />
{showProposals && official.proposalCount > 0 && (
              <span className="text-emerald-600">
                {"▲"} {official.proposalCount} proposal{official.proposalCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Mobile: compact completeness row */}
          <div className="md:hidden mt-2 flex items-center gap-3 text-xs">
            <CompletenessRing value={completeness} />
            {showProposals && official.proposalCount > 0 && (
              <span className="text-emerald-600">
                {"▲"} {official.proposalCount} proposal{official.proposalCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function UnknownOfficialCard({ role, position, scope, onClick }: { role: string; position: Position | null; scope?: Record<string, string>; onClick?: () => void }) {
  const params = new URLSearchParams({ role });
  // Pass normalized geographic scope from chain entry.
  if (scope) {
    if (scope.stateCode || scope.state) params.set("stateCode", scope.stateCode || scope.state || "");
    if (scope.lgaCode || scope.lga) params.set("lgaCode", scope.lgaCode || scope.lga || "");
    if (scope.wardCode || scope.ward) params.set("wardCode", scope.wardCode || scope.ward || "");
    if (scope.constituencyCode || scope.constituency) {
      params.set("constituencyCode", scope.constituencyCode || scope.constituency || "");
    }
    if (scope.stateName) params.set("stateName", scope.stateName);
    if (scope.lgaName) params.set("lgaName", scope.lgaName);
    if (scope.wardName) params.set("wardName", scope.wardName);
    if (scope.constituencyName) params.set("constituencyName", scope.constituencyName);
  }
  // Also pass richer position scope if available.
  if (position) {
    if (position.stateCode) params.set("stateCode", position.stateCode);
    if (position.lgaCode) params.set("lgaCode", position.lgaCode);
    if (position.wardCode) params.set("wardCode", position.wardCode);
    if (position.constituencyCode) params.set("constituencyCode", position.constituencyCode);
    if (position.state) params.set("stateName", position.state);
    if (position.lga) params.set("lgaName", position.lga);
    if (position.ward) params.set("wardName", position.ward);
    if (position.constituency) params.set("constituencyName", position.constituency);
  }

  return (
    <Link
      href={`/proposals/new?${params.toString()}`}
      onClick={onClick}
      className="block rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 overflow-hidden hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer"
    >
      <div className="flex">
        {/* Desktop: square placeholder */}
        <div className="hidden md:flex w-24 shrink-0 items-center justify-center bg-slate-100/50 dark:bg-slate-800/50">
          <User className="w-10 h-10 text-slate-300 dark:text-slate-600" />
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start gap-3">
            {/* Mobile: circle placeholder */}
            <div className="md:hidden shrink-0 w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900 dark:text-white text-[15px]">
                {getRoleLabel(role)}
              </p>
              {position && getLocationLabel(position) && (
                <p className="text-sm text-slate-500 dark:text-slate-400">{getLocationLabel(position)}</p>
              )}
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Position unidentified
              </p>
              <span className="inline-block mt-2 text-sm font-medium text-emerald-600">
                Help identify this person →
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CompletenessRing({ value }: { value: number }) {
  const radius = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex items-center gap-1">
      <svg width="18" height="18" viewBox="0 0 18 18">
        <circle
          cx="9"
          cy="9"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-slate-200 dark:text-slate-700"
        />
        <circle
          cx="9"
          cy="9"
          r={radius}
          fill="none"
          stroke="#059669"
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 9 9)"
        />
      </svg>
      <span className="text-slate-500 dark:text-slate-400">{value}%</span>
    </div>
  );
}
