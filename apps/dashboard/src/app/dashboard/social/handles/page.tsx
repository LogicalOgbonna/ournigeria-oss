"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { socialsFetch } from "@/lib/api";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface ScoutedHandleRow {
  id: string;
  handle: string;
  name: string;
  bio: string;
  followers: number;
  stateCode: string;
  lgaCode: string | null;
  wardCode: string | null;
  confidence: number;
  evidence: string;
  status: "pending" | "active" | "rejected" | "opted_out";
  timesTagged: number;
  lastTaggedAt: string | null;
  restId: string;
}

interface GeoOption {
  code: string;
  name: string;
}

const STATUS_BADGE: Record<ScoutedHandleRow["status"], string> = {
  pending: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  rejected:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  opted_out: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const PAGE_SIZE = 50;

export default function ScoutedHandlesPage() {
  const [rows, setRows] = useState<ScoutedHandleRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [states, setStates] = useState<GeoOption[]>([]);
  const [filterState, setFilterState] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Add form
  const [newHandle, setNewHandle] = useState("");
  const [newState, setNewState] = useState<string>("");
  const [newLga, setNewLga] = useState<string>("");
  const [lgas, setLgas] = useState<GeoOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    if (filterState !== "all") params.set("stateCode", filterState);
    if (filterStatus !== "all") params.set("status", filterStatus);
    socialsFetch(`/v1/scout/handles?${params.toString()}`)
      .then((r: { rows: ScoutedHandleRow[]; total: number }) => {
        setRows(r.rows);
        setTotal(r.total);
      })
      .catch((e) => {
        // An empty list must mean "nothing scouted", never "request failed" —
        // surface the failure instead of masquerading as a clean zero state.
        setRows([]);
        setTotal(0);
        setLoadError(e instanceof Error ? e.message : "Failed to load handles");
      })
      .finally(() => setLoading(false));
  }, [filterState, filterStatus, offset]);

  useEffect(reload, [reload]);

  // Reset paging synchronously with the filter change so it causes exactly one
  // fetch (an effect-based reset briefly fetched the new filter at a stale
  // offset, then re-fetched at 0).
  function changeFilterState(v: string) {
    setFilterState(v);
    setOffset(0);
  }
  function changeFilterStatus(v: string) {
    setFilterStatus(v);
    setOffset(0);
  }

  useEffect(() => {
    socialsFetch("/v1/scout/geo/states")
      .then((r: GeoOption[]) => setStates(r))
      .catch(() => setStates([]));
  }, []);

  useEffect(() => {
    if (!newState) {
      setLgas([]);
      setNewLga("");
      return;
    }
    socialsFetch(`/v1/scout/geo/lgas?stateCode=${encodeURIComponent(newState)}`)
      .then((r: GeoOption[]) => setLgas(r))
      .catch(() => setLgas([]));
  }, [newState]);

  async function addHandle() {
    setError(null);
    if (!newHandle.trim() || !newState) {
      setError("Handle and state are required.");
      return;
    }
    setSaving(true);
    try {
      await socialsFetch("/v1/scout/handles", {
        method: "POST",
        body: JSON.stringify({
          handle: newHandle.trim(),
          stateCode: newState,
          ...(newLga ? { lgaCode: newLga } : {}),
        }),
      });
      setNewHandle("");
      setNewLga("");
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add handle");
    } finally {
      setSaving(false);
    }
  }

  async function removeHandle(row: ScoutedHandleRow) {
    // For scouted rows, delete erases our memory of the account — the scout
    // will re-add them next time they tweet location signals. "Never tag this
    // person" is opt-out, not delete; say so before they click through.
    const message = row.restId.startsWith("manual:")
      ? `Delete @${row.handle}?`
      : `Delete @${row.handle}?\n\nThe scout may re-add them the next time it sees their tweets. If you want them NEVER tagged again, use "Opt out" instead.\n\nDelete anyway?`;
    if (!window.confirm(message)) return;
    try {
      await socialsFetch(`/v1/scout/handles/${row.id}`, { method: "DELETE" });
      reload();
    } catch (e) {
      // A failed mutation must be visible — silence here leaves a stale list
      // that looks like the delete worked. (No reload: it would clear the
      // error, and the server state didn't change anyway.)
      setLoadError(e instanceof Error ? e.message : "Failed to delete handle");
    }
  }

  async function setStatus(row: ScoutedHandleRow, status: string) {
    // Opt-out is a consent state — re-enrolling someone who asked never to be
    // tagged must not be a single misclick.
    if (
      row.status === "opted_out" &&
      status === "active" &&
      !window.confirm(
        `@${row.handle} was opted out (never tag again). Re-activate them for tagging?`,
      )
    ) {
      return;
    }
    try {
      await socialsFetch(`/v1/scout/handles/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      reload();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to update status");
    }
  }

  const stateName = (code: string) =>
    states.find((s) => s.code === code)?.name ?? code;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/social"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold">Location Handles</h1>
          <p className="text-muted-foreground text-sm mt-1">
            X accounts attributable to a state/LGA — campaign tweets for their
            location tag them and ask{" "}
            <span className="text-foreground">
              &ldquo;you&apos;re from {"{place}"}, do you know who this
              is?&rdquo;
            </span>
            . Scouted accounts arrive as{" "}
            <span className="text-foreground">pending</span>; only accounts you
            activate can be tagged.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="py-4 space-y-3">
          <h2 className="font-semibold text-sm">Add an account</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              className="w-[200px]"
              placeholder="@handle"
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value)}
            />
            <Select value={newState} onValueChange={setNewState}>
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="State (required)" />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={newLga}
              onValueChange={setNewLga}
              disabled={lgas.length === 0}
            >
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="LGA (optional)" />
              </SelectTrigger>
              <SelectContent>
                {lgas.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={addHandle} disabled={saving}>
              <Plus className="h-4 w-4 mr-1" />
              {saving ? "Adding…" : "Add"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Select value={filterState} onValueChange={changeFilterState}>
          <SelectTrigger className="w-[190px]">
            <SelectValue placeholder="All states" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {states.map((s) => (
              <SelectItem key={s.code} value={s.code}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={changeFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">pending review</SelectItem>
            <SelectItem value="active">active</SelectItem>
            <SelectItem value="rejected">rejected</SelectItem>
            <SelectItem value="opted_out">opted out</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-1">
          {loading
            ? "…"
            : total > PAGE_SIZE
              ? `${offset + 1}–${Math.min(offset + PAGE_SIZE, total)} of ${total}`
              : `${total} accounts`}
        </span>
        {total > PAGE_SIZE && (
          <span className="flex items-center gap-1 ml-auto">
            <Button
              size="sm"
              variant="outline"
              disabled={offset === 0 || loading}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            >
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={offset + PAGE_SIZE >= total || loading}
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              Next
            </Button>
          </span>
        )}
      </div>

      {loadError && (
        <Card>
          <CardContent className="py-4 text-sm text-red-600">
            Failed to load handles: {loadError}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        !loadError && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No accounts yet — the scout fills this as it roams, or add one
              above.
            </CardContent>
          </Card>
        )
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={`https://x.com/${r.handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold hover:underline"
                      >
                        @{r.handle}
                      </a>
                      <span className="text-sm text-muted-foreground truncate max-w-[220px]">
                        {r.name}
                      </span>
                      <Badge variant="secondary">{stateName(r.stateCode)}</Badge>
                      {r.lgaCode && (
                        <Badge variant="outline">{r.lgaCode}</Badge>
                      )}
                      <Badge className={STATUS_BADGE[r.status]}>
                        {r.status.replace("_", " ")}
                      </Badge>
                      {r.restId.startsWith("manual:") && (
                        <Badge variant="outline">manual</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-2xl">
                      {r.evidence}
                    </p>
                    <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                      <span>
                        confidence{" "}
                        <b className="text-foreground">
                          {Math.round(r.confidence * 100)}%
                        </b>
                      </span>
                      <span>
                        followers{" "}
                        <b className="text-foreground">
                          {r.followers.toLocaleString()}
                        </b>
                      </span>
                      <span>
                        tagged{" "}
                        <b className="text-foreground">{r.timesTagged}×</b>
                        {r.lastTaggedAt &&
                          ` (last ${new Date(r.lastTaggedAt).toLocaleDateString()})`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Every consent transition is one click from every
                        status — in particular, opt-out must be reachable from
                        pending without a transient Activate. */}
                    {r.status !== "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStatus(r, "active")}
                      >
                        Activate
                      </Button>
                    )}
                    {(r.status === "pending" || r.status === "active") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStatus(r, "rejected")}
                      >
                        Reject
                      </Button>
                    )}
                    {r.status !== "opted_out" && (
                      <Button
                        size="sm"
                        variant="outline"
                        title="Never tag this account again (survives re-scouting)"
                        onClick={() => setStatus(r, "opted_out")}
                      >
                        Opt out
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => removeHandle(r)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
