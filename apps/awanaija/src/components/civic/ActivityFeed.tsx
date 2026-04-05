"use client";

import { useEffect, useState } from "react";
import { getActivity, type ActivityEntry } from "@/lib/api";

interface ActivityFeedProps {
  limit?: number;
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

function formatEvent(entry: ActivityEntry): string {
  const meta = entry.metadata as Record<string, unknown>;
  const field =
    typeof meta?.targetField === "string" ? meta.targetField : "data";
  const name =
    typeof meta?.officialName === "string" ? meta.officialName : "an official";

  switch (entry.eventType) {
    case "proposal_submitted":
      return `${field.replace(/([A-Z])/g, " $1").toLowerCase()} proposed for ${name}`;
    case "proposal_approved":
      return `${field.replace(/([A-Z])/g, " $1").toLowerCase()} verified for ${name}`;
    case "proposal_upvoted":
      return `${field.replace(/([A-Z])/g, " $1").toLowerCase()} proposal upvoted for ${name}`;
    case "proposal_downvoted":
      return `${field.replace(/([A-Z])/g, " $1").toLowerCase()} proposal downvoted for ${name}`;
    default:
      return `${entry.eventType.replace(/_/g, " ")} for ${name}`;
  }
}

export function ActivityFeed({ limit = 5 }: ActivityFeedProps) {
  const [items, setItems] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActivity(limit)
      .then((data) => setItems(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No activity yet. Be the first to contribute!
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div key={item.id} className="flex items-baseline gap-2 text-sm">
          <span className="shrink-0 font-mono text-xs text-slate-400 w-12">
            {formatTimeAgo(item.createdAt)}
          </span>
          <span className="text-slate-600 dark:text-slate-300">
            {formatEvent(item)}
          </span>
        </div>
      ))}
    </div>
  );
}
