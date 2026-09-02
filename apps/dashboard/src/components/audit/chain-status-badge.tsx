"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminFetch } from "@/lib/api";
import { relativeTime } from "@/lib/format";

interface AuditStatus {
  headSeq: number | null;
  headHash: string | null;
  epoch: number | null;
  eventCount: number;
  lastAnchor: {
    anchoredAt: string;
    headSeq: number;
    headHash: string;
    destination: string;
    status: string;
  } | null;
  lastVerify: {
    ok: boolean;
    checked: number;
    checkedThrough: number;
    brokenAtSeq?: number;
    reason?: string;
    at: string;
  } | null;
}

/** One-shot GET /audit/status → intact / FAILED / empty-chain badge. */
export function ChainStatusBadge() {
  const [status, setStatus] = useState<AuditStatus | null>(null);
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");

  useEffect(() => {
    let cancelled = false;
    adminFetch("/audit/status")
      .then((res) => {
        if (cancelled) return;
        setStatus(res as AuditStatus);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return <Skeleton className="h-6 w-72 rounded-full" />;
  }

  if (state === "error" || !status) {
    return (
      <p className="text-sm text-destructive">Failed to load chain status</p>
    );
  }

  if (status.lastVerify && !status.lastVerify.ok) {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <ShieldAlert className="h-3.5 w-3.5" />
        Chain verification FAILED at seq{" "}
        {status.lastVerify.brokenAtSeq ?? "unknown"}
      </Badge>
    );
  }

  if (status.headSeq === null || status.headSeq === undefined) {
    return (
      <Badge variant="outline" className="gap-1.5 text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        No audit events yet
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="default" className="gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" />
        Chain intact · seq {status.headSeq} · epoch {status.epoch}
        {status.lastAnchor
          ? ` · anchored ${relativeTime(status.lastAnchor.anchoredAt)}`
          : ""}
      </Badge>
      {!status.lastAnchor && (
        <span className="text-xs text-muted-foreground">Never anchored</span>
      )}
    </div>
  );
}
