"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { getActivity, type ActivityEntry } from "@/lib/api";
import { CheckCircle2, PlusCircle, ArrowUpCircle, ArrowDownCircle, Activity, Loader2 } from "lucide-react";
import Link from "next/link";

interface ActivityFeedProps {
  limit?: number;
  loadingFallback?: ReactNode;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getEventDetails(entry: ActivityEntry) {
  const meta = entry.metadata as Record<string, unknown>;
  const fieldRaw = typeof meta?.targetField === "string" ? meta.targetField : "data";
  const field = fieldRaw.replace(/([A-Z])/g, " $1").toLowerCase();
  const name = typeof meta?.officialName === "string" ? meta.officialName : "an official";
  // Fallback to targetId if targetType is official, since metadata might not have officialId
  const officialId = typeof meta?.officialId === "string" 
    ? meta.officialId 
    : (entry.targetType === "official" ? entry.targetId : null);

  switch (entry.eventType) {
    case "proposal_submitted":
      return {
        icon: <PlusCircle className="w-5 h-5 text-blue-500" />,
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800",
        action: "proposed a new",
        actionLabel: "Proposal",
        labelColor: "text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/40",
        field,
        name,
        officialId,
      };
    case "proposal_approved":
      return {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        border: "border-emerald-200 dark:border-emerald-800",
        action: "verified the",
        actionLabel: "Verified",
        labelColor: "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40",
        field,
        name,
        officialId,
      };
    case "proposal_upvoted":
      return {
        icon: <ArrowUpCircle className="w-5 h-5 text-amber-500" />,
        bg: "bg-amber-50 dark:bg-amber-900/20",
        border: "border-amber-200 dark:border-amber-800",
        action: "upvoted a proposal for",
        actionLabel: "Upvote",
        labelColor: "text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/40",
        field,
        name,
        officialId,
      };
    case "proposal_downvoted":
      return {
        icon: <ArrowDownCircle className="w-5 h-5 text-red-500" />,
        bg: "bg-red-50 dark:bg-red-900/20",
        border: "border-red-200 dark:border-red-800",
        action: "downvoted a proposal for",
        actionLabel: "Downvote",
        labelColor: "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/40",
        field,
        name,
        officialId,
      };
    default:
      return {
        icon: <Activity className="w-5 h-5 text-slate-500" />,
        bg: "bg-slate-50 dark:bg-slate-800/50",
        border: "border-slate-200 dark:border-slate-700",
        action: entry.eventType.replace(/_/g, " "),
        actionLabel: "Activity",
        labelColor: "text-slate-700 bg-slate-100 dark:text-slate-400 dark:bg-slate-800",
        field: "",
        name,
        officialId,
      };
  }
}

export function ActivityFeed({
  limit = 50,
  loadingFallback,
}: ActivityFeedProps) {
  const [items, setItems] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getActivity(limit)
      .then((data) => {
        if (!cancelled) setItems(data.data || []);
      })
      .catch((error) => {
        console.error("Failed to load activity:", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [limit]);

  if (loading) {
    return loadingFallback ?? (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <Loader2 className="w-8 h-8 text-slate-400 mx-auto animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
        <Activity className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">No activity yet</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Be the first to contribute to Nigeria&apos;s civic data.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 max-h-[70vh] overflow-y-auto scrollbar-theme pr-4">
      <div className="relative border-l-2 border-slate-100 dark:border-slate-800/60 ml-5 space-y-8 pb-8">
        {items.map((item) => {
          const details = getEventDetails(item);
          return (
            <div key={item.id} className="relative pl-8 group">
              {/* Timeline dot */}
              <div className={`absolute -left-[21px] top-0.5 w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center ${details.bg}`}>
                {details.icon}
              </div>

              {/* Content Card */}
              {details.officialId ? (
                <Link 
                  href={`/officials/${details.officialId}`}
                  className={`block p-4 rounded-xl border ${details.border} bg-white dark:bg-slate-900/50 shadow-sm transition-shadow hover:shadow-md cursor-pointer`}
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${details.labelColor}`}>
                        {details.actionLabel}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    <span className="font-medium text-slate-900 dark:text-white">A citizen</span>{" "}
                    <span className="text-slate-600 dark:text-slate-400">{details.action}</span>{" "}
                    {details.field && <span className="font-medium text-slate-900 dark:text-white">{details.field}</span>}{" "}
                    <span className="text-slate-600 dark:text-slate-400">for</span>{" "}
                    <span className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
                      {details.name}
                    </span>
                  </p>
                  
                  {/* Optional actionable footer area */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex gap-3">
                    <span className="text-xs font-medium text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-1">
                      View Profile
                    </span>
                  </div>
                </Link>
              ) : (
                <div className={`p-4 rounded-xl border ${details.border} bg-white dark:bg-slate-900/50 shadow-sm transition-shadow hover:shadow-md`}>
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${details.labelColor}`}>
                        {details.actionLabel}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    <span className="font-medium text-slate-900 dark:text-white">A citizen</span>{" "}
                    <span className="text-slate-600 dark:text-slate-400">{details.action}</span>{" "}
                    {details.field && <span className="font-medium text-slate-900 dark:text-white">{details.field}</span>}{" "}
                    <span className="text-slate-600 dark:text-slate-400">for</span>{" "}
                    <span className="font-semibold text-slate-900 dark:text-white">{details.name}</span>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
