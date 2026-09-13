"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
} from "nuqs";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Forbidden } from "@/components/layout/forbidden";
import { ElectionStatusChip } from "@/components/elections/election-status-chip";
import { GateSwitch } from "@/components/elections/gate-switch";
import {
  ELECTION_OFFICES,
  ELECTION_ROUNDS,
  ELECTION_STATUSES,
  OFFICE_LABEL,
  ROUND_LABEL,
  displayDate,
  electionsApi,
  type ElectionListRow,
  type ElectionOffice,
  type ElectionRound,
  type ElectionStatus,
} from "@/lib/elections";
import { relativeTime } from "@/lib/format";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useGeoList } from "@/lib/hooks/use-geo-list";
import { useResource } from "@/lib/hooks/use-resource";
import { usePermissions } from "@/lib/permissions";

const PAGE_SIZE = 50;
/** Radix Select forbids an empty item value, so "all" is the cleared sentinel. */
const ALL = "all";
const PUBLISHED_FILTERS = ["true", "false"] as const;
type PublishedFilter = (typeof PUBLISHED_FILTERS)[number];

/** "Osun" | seat code | "Nationwide" — narrowest non-null wins for display. */
function scopeLabel(row: ElectionListRow): string {
  return (
    row.wardCode ??
    row.constituencyCode ??
    row.lgaCode ??
    row.state?.name ??
    row.stateCode ??
    "Nationwide"
  );
}

export default function ElectionsPage() {
  // nuqs' useQueryState reads useSearchParams(), which Next requires under a
  // Suspense boundary or static prerender of this page fails (CSR bailout).
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
      <ElectionsView />
    </Suspense>
  );
}

function ElectionsView() {
  const { loading: permsLoading, can } = usePermissions();
  // D5 split: reads are open to both sides so a reviewer can see what they
  // publish — mirrors the API's ANY-of guard on GET /admin/elections.
  const canRead = can("elections.write") || can("campaigns.review");
  const ready = !permsLoading && canRead;
  const denied = !permsLoading && !canRead;

  const [year, setYear] = useQueryState("year", parseAsInteger);
  const [office, setOffice] = useQueryState(
    "office",
    parseAsStringEnum<ElectionOffice>([...ELECTION_OFFICES]),
  );
  const [round, setRound] = useQueryState(
    "round",
    parseAsStringEnum<ElectionRound>([...ELECTION_ROUNDS]),
  );
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringEnum<ElectionStatus>([...ELECTION_STATUSES]),
  );
  const [published, setPublished] = useQueryState(
    "published",
    parseAsStringEnum<PublishedFilter>([...PUBLISHED_FILTERS]),
  );
  const [state, setState] = useQueryState("state", parseAsString);
  const [search, setSearch] = useQueryState("q", parseAsString);
  const [rawPage, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  // ?page=0 and ?page=-3 are hand-edited URLs, not states the UI can produce.
  const page = Math.max(1, rawPage);

  // Free-text filters commit to the URL (and the API) only once typing
  // settles — one request per phrase, not per keystroke.
  const [qText, setQText] = useState(search ?? "");
  const [yearText, setYearText] = useState(year !== null ? String(year) : "");
  const debouncedQ = useDebounce(qText, 300);
  const debouncedYear = useDebounce(yearText, 300);

  // URL -> input (back/forward re-sync), same normalisation-compare as the
  // campaigns list so an echo never yanks text out from under the caret.
  useEffect(() => {
    setQText((prev) => (prev.trim() === (search ?? "") ? prev : (search ?? "")));
  }, [search]);
  useEffect(() => {
    setYearText((prev) =>
      Number.parseInt(prev, 10) === year ? prev : year !== null ? String(year) : "",
    );
  }, [year]);

  // input -> URL.
  useEffect(() => {
    const next = debouncedQ.trim();
    if (next === (search ?? "")) return;
    void setSearch(next || null);
    void setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  useEffect(() => {
    const next = debouncedYear.trim();
    if (next === "") {
      if (year !== null) {
        void setYear(null);
        void setPage(1);
      }
      return;
    }
    // Commit only a complete year: a pause mid-typing must not filter on "202".
    if (!/^\d{4}$/.test(next)) return;
    const parsed = Number(next);
    if (parsed === year) return;
    void setYear(parsed);
    void setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedYear]);

  const states = useGeoList(ready ? "/api/geo/states" : null);

  const { data, loading, error, refetch } = useResource(
    () =>
      electionsApi.list({
        year: year ?? undefined,
        office: office ?? undefined,
        round: round ?? undefined,
        status: status ?? undefined,
        published: published ?? undefined,
        state,
        q: search,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
    [year, office, round, status, published, state, search, page],
    { enabled: ready },
  );

  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // A filter that shrinks the result set can leave the URL pointing past the
  // end — land on the last real page instead of an empty table.
  useEffect(() => {
    if (!data) return;
    if (page > lastPage) void setPage(lastPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, lastPage, page]);

  useEffect(() => {
    if (rawPage < 1) void setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawPage]);

  if (denied) return <Forbidden permission="elections.write" />;

  const rows = data?.rows ?? [];
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  /** Any filter change invalidates the current offset. */
  function pick<T>(setter: (v: T | null) => unknown, value: string) {
    void setter(value === ALL ? null : (value as T));
    void setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">Election Events</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? "Loading…" : `${total} event${total === 1 ? "" : "s"}`}
            {" · an event is one scheduled poll — publishing it drives the public gate"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GateSwitch />
          {!permsLoading && can("elections.write") && (
            <Button asChild size="sm">
              <Link href="/dashboard/elections/new">
                <Plus className="h-4 w-4 mr-1" />
                New event
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="filter-year" className="text-xs text-muted-foreground">
            Year
          </Label>
          <Input
            id="filter-year"
            className="w-[100px]"
            inputMode="numeric"
            placeholder="All"
            value={yearText}
            onChange={(e) =>
              setYearText(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-office" className="text-xs text-muted-foreground">
            Office
          </Label>
          <Select
            value={office ?? ALL}
            onValueChange={(v) => pick<ElectionOffice>(setOffice, v)}
          >
            <SelectTrigger id="filter-office" className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All offices</SelectItem>
              {ELECTION_OFFICES.map((o) => (
                <SelectItem key={o} value={o}>
                  {OFFICE_LABEL[o]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-round" className="text-xs text-muted-foreground">
            Round
          </Label>
          <Select
            value={round ?? ALL}
            onValueChange={(v) => pick<ElectionRound>(setRound, v)}
          >
            <SelectTrigger id="filter-round" className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All rounds</SelectItem>
              {ELECTION_ROUNDS.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROUND_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-state" className="text-xs text-muted-foreground">
            State
          </Label>
          <Select
            value={state ?? ALL}
            onValueChange={(v) => pick<string>(setState, v)}
          >
            <SelectTrigger id="filter-state" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All states</SelectItem>
              {states.rows.map((s) => (
                <SelectItem key={s.code} value={s.code}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {states.error ? (
            <p className="text-xs text-destructive">
              {states.error}{" "}
              <button
                type="button"
                className="underline underline-offset-2"
                onClick={states.retry}
              >
                Retry
              </button>
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-status" className="text-xs text-muted-foreground">
            Status
          </Label>
          <Select
            value={status ?? ALL}
            onValueChange={(v) => pick<ElectionStatus>(setStatus, v)}
          >
            <SelectTrigger id="filter-status" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {ELECTION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-published" className="text-xs text-muted-foreground">
            Gate
          </Label>
          <Select
            value={published ?? ALL}
            onValueChange={(v) => pick<PublishedFilter>(setPublished, v)}
          >
            <SelectTrigger id="filter-published" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any</SelectItem>
              <SelectItem value="true">Published</SelectItem>
              <SelectItem value="false">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <Label htmlFor="filter-q" className="text-xs text-muted-foreground">
            Search
          </Label>
          <Input
            id="filter-q"
            placeholder="Slug or label"
            value={qText}
            onChange={(e) => setQText(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-border p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={refetch}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Office</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Attached</TableHead>
                <TableHead className="w-[120px]">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && rows.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    No events match.{" "}
                    <Link
                      href="/dashboard/elections/new"
                      className="text-primary underline underline-offset-4"
                    >
                      Create one
                    </Link>
                    .
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/elections/${row.id}`}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {row.label ?? row.slug}
                      </Link>
                      <div className="font-mono text-xs text-muted-foreground">
                        {row.slug}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {OFFICE_LABEL[row.office]}
                      {row.round !== "general" ? (
                        <span className="text-muted-foreground">
                          {" "}
                          · {ROUND_LABEL[row.round]}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">
                      {scopeLabel(row)}
                      {row.excludedStates.length > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {" "}
                          (−{row.excludedStates.length})
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">{displayDate(row)}</TableCell>
                    <TableCell>
                      <ElectionStatusChip {...row} />
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {row._count.campaigns + row._count.officialElections || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {relativeTime(row.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {total === 0 ? "0 of 0" : `${from}–${to} of ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1 || loading}
            onClick={() => void setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= lastPage || loading}
            onClick={() => void setPage(page + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
