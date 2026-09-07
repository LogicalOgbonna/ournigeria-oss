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
import { Forbidden } from "@/components/layout/forbidden";
import {
  TicketTable,
  type TicketColumn,
} from "@/components/campaigns/ticket-table";
import {
  ELECTION_TYPES,
  ELECTION_TYPE_LABEL,
  type CampaignStatus,
  type ElectionType,
  type ReviewStatus,
  campaignsApi,
} from "@/lib/campaigns";
import { relativeTime } from "@/lib/format";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useGeoList } from "@/lib/hooks/use-geo-list";
import { useResource } from "@/lib/hooks/use-resource";
import { usePermissions } from "@/lib/permissions";

const PAGE_SIZE = 50;
/** The six campaign_status values; `status` only moves through the API's verbs. */
const STATUSES: CampaignStatus[] = [
  "draft",
  "active",
  "suspended",
  "withdrawn",
  "dissolved",
  "concluded",
];
const REVIEW_STATUSES: ReviewStatus[] = ["unreviewed", "reviewed", "disputed"];
/** Radix Select forbids an empty item value, so "all" is the cleared sentinel. */
const ALL = "all";

const LIST_COLUMNS: TicketColumn[] = [
  {
    key: "updated",
    header: "Updated",
    className: "w-[120px] text-sm text-muted-foreground",
    render: (row) => relativeTime(row.updatedAt),
  },
];

export default function CampaignsPage() {
  // nuqs' useQueryState reads useSearchParams(), which Next requires under a
  // Suspense boundary or static prerender of this page fails (CSR bailout).
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
      <CampaignsView />
    </Suspense>
  );
}

function CampaignsView() {
  const { loading: permsLoading, can } = usePermissions();
  const canRead = can("campaigns.read");
  // Nothing is requested until the RBAC answer is in: an optimistic fetch here
  // would 403 for every reader who lacks the permission.
  const ready = !permsLoading && canRead;
  const denied = !permsLoading && !canRead;

  const [year, setYear] = useQueryState("year", parseAsInteger);
  const [type, setType] = useQueryState(
    "type",
    parseAsStringEnum<ElectionType>([...ELECTION_TYPES]),
  );
  const [state, setState] = useQueryState("state", parseAsString);
  const [party, setParty] = useQueryState("party", parseAsString);
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringEnum<CampaignStatus>(STATUSES),
  );
  const [review, setReview] = useQueryState(
    "review",
    parseAsStringEnum<ReviewStatus>(REVIEW_STATUSES),
  );
  const [search, setSearch] = useQueryState("q", parseAsString);
  const [rawPage, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  // ?page=0 and ?page=-3 are hand-edited URLs, not states the UI can produce;
  // they must not send a negative offset to the API.
  const page = Math.max(1, rawPage);

  // Free-text filters are typed locally and pushed to the URL (and the API)
  // only once typing settles — one request per phrase, not per keystroke.
  const [qText, setQText] = useState(search ?? "");
  const [partyText, setPartyText] = useState(party ?? "");
  const [yearText, setYearText] = useState(year !== null ? String(year) : "");
  const debouncedQ = useDebounce(qText, 300);
  const debouncedParty = useDebounce(partyText, 300);
  const debouncedYear = useDebounce(yearText, 300);

  // URL -> input. Back/forward (and the page clamp below) change the query
  // string without touching these boxes, so they re-sync from it. Each updater
  // compares the box's own text THROUGH the same normalisation the write
  // effects apply, so the echo of a value the user already typed leaves their
  // text alone — otherwise a trailing space (or lowercase party letter) would
  // be yanked out from under the caret mid-word.
  useEffect(() => {
    setQText((prev) => (prev.trim() === (search ?? "") ? prev : (search ?? "")));
  }, [search]);
  useEffect(() => {
    setPartyText((prev) =>
      prev.trim().toUpperCase() === (party ?? "") ? prev : (party ?? ""),
    );
  }, [party]);
  useEffect(() => {
    setYearText((prev) =>
      Number.parseInt(prev, 10) === year ? prev : year !== null ? String(year) : "",
    );
  }, [year]);

  // input -> URL. Each effect compares against the committed query value, so
  // the first run (debounced === initial) is a no-op and never resets ?page.
  useEffect(() => {
    const next = debouncedQ.trim();
    if (next === (search ?? "")) return;
    void setSearch(next || null);
    void setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  useEffect(() => {
    const next = debouncedParty.trim().toUpperCase();
    if (next === (party ?? "")) return;
    void setParty(next || null);
    void setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedParty]);

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
      campaignsApi.list({
        year: year ?? undefined,
        type: type ?? undefined,
        state,
        party,
        status: status ?? undefined,
        reviewStatus: review ?? undefined,
        q: search,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
    [year, type, state, party, status, review, search, page],
    { enabled: ready },
  );

  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // A filter that shrinks the result set can leave the URL pointing past the
  // end (deep link, or back/forward into a stale ?page). Land on the last real
  // page instead of an empty table the operator has to debug.
  useEffect(() => {
    if (!data) return;
    if (page > lastPage) void setPage(lastPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, lastPage, page]);

  // Out-of-range page numbers are normalised out of the URL immediately — this
  // is about the address bar, not about what came back from the API.
  useEffect(() => {
    if (rawPage < 1) void setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawPage]);

  if (denied) return <Forbidden permission="campaigns.read" />;

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
          <h1 className="text-2xl font-heading font-bold">Election Tickets</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? "Loading…" : `${total} ticket${total === 1 ? "" : "s"}`}
            {" · a ticket is one candidate + running mate in one race"}
          </p>
        </div>
        {!permsLoading && can("campaigns.write") && (
          <Button asChild size="sm">
            <Link href="/dashboard/campaigns/new">
              <Plus className="h-4 w-4 mr-1" />
              New ticket
            </Link>
          </Button>
        )}
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
            // Only digits, at most four: a fifth keystroke (or a pasted "20277")
            // leaves the last valid text standing rather than filtering on a
            // year that cannot exist.
            onChange={(e) =>
              setYearText(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-type" className="text-xs text-muted-foreground">
            Race
          </Label>
          <Select
            value={type ?? ALL}
            onValueChange={(v) => pick<ElectionType>(setType, v)}
          >
            <SelectTrigger id="filter-type" className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All races</SelectItem>
              {ELECTION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {ELECTION_TYPE_LABEL[t]}
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
          {/* A silently empty state list looks like "Nigeria has no states". */}
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
          <Label htmlFor="filter-party" className="text-xs text-muted-foreground">
            Party
          </Label>
          <Input
            id="filter-party"
            className="w-[110px] uppercase"
            placeholder="APC"
            value={partyText}
            onChange={(e) => setPartyText(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-status" className="text-xs text-muted-foreground">
            Status
          </Label>
          <Select
            value={status ?? ALL}
            onValueChange={(v) => pick<CampaignStatus>(setStatus, v)}
          >
            <SelectTrigger id="filter-status" className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-review" className="text-xs text-muted-foreground">
            Review
          </Label>
          <Select
            value={review ?? ALL}
            onValueChange={(v) => pick<ReviewStatus>(setReview, v)}
          >
            <SelectTrigger id="filter-review" className="w-[175px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any review state</SelectItem>
              {REVIEW_STATUSES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <Label htmlFor="filter-q" className="text-xs text-muted-foreground">
            Search
          </Label>
          <Input
            id="filter-q"
            placeholder="Candidate, running mate or slug"
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
        <TicketTable
          rows={rows}
          loading={loading}
          showThumb
          extraColumns={LIST_COLUMNS}
          emptyState={
            <span>
              No tickets match.{" "}
              <Link
                href="/dashboard/campaigns/new"
                className="text-primary underline underline-offset-4"
              >
                Create one
              </Link>{" "}
              or{" "}
              <Link
                href="/dashboard/imports"
                className="text-primary underline underline-offset-4"
              >
                import a dataset
              </Link>
              .
            </span>
          }
        />
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
