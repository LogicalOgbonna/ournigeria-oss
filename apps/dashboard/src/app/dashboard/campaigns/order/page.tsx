"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { ArrowLeft, Info, Loader2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Forbidden } from "@/components/layout/forbidden";
import { ConfirmDialog } from "@/components/enrichment/confirm-dialog";
import { DEFAULT_ELECTION_YEAR, RaceKeyFields } from "@/components/campaigns/race-key-fields";
import { OrderColumn, TicketCardBody } from "@/components/campaigns/order-list";
import {
  bucketOf,
  isOrderable,
  listParamsFor,
  moveTo,
  nudge,
  orderBodyFor,
  raceComplete,
  raceLabel,
  rankedIds,
  sameOrder,
  splitLists,
  type Bucket,
  type Lists,
} from "@/lib/campaign-order";
import {
  ELECTION_TYPE_LABEL,
  campaignsApi,
  errorMessage,
  type CampaignRow,
  type RaceKey,
} from "@/lib/campaigns";
import { useResource } from "@/lib/hooks/use-resource";
import { usePermissions } from "@/lib/permissions";

/**
 * Rail Order — the editorial order of one race's tickets on the landing page.
 *
 * `PUT /api/admin/campaigns/order` is a whole-race renumber: the service nulls
 * `display_order` across the race and writes 1…n over the `ids` it is given, so
 * this page always sends the complete ranked list and anything left out comes
 * back unranked. It accepts a maximum of 500 ids and a MINIMUM of one — there
 * is no request that empties a rail, which is why Save stays disabled with an
 * empty Ranked column.
 */

/** listQuerySchema caps `limit` at 100; no real race comes close. */
const LIMIT = 100;

const DIRTY_PROMPT = "You have unsaved rail order changes. Leave without saving?";
const COLUMN_LABEL: Record<Bucket, string> = { ranked: "Ranked", unranked: "Unranked" };

interface RaceState {
  /** The race the lists were loaded for; a response for another race is ignored. */
  token: string;
  lists: Lists<CampaignRow>;
  /** The ranked ids as the server had them — what Reset restores and dirty compares to. */
  baseline: string[];
  /** The race's true row count, which `limit` may have truncated. */
  total: number;
}

function raceToken(race: RaceKey): string {
  return JSON.stringify([race.electionType, race.year, race.stateCode, race.constituencyCode, race.lgaCode]);
}

export default function RailOrderPage() {
  const { loading: permsLoading, can } = usePermissions();
  const canWrite = can("campaigns.write");
  const ready = !permsLoading && canWrite;
  const denied = !permsLoading && !canWrite;

  const [race, setRace] = useState<RaceKey>({
    electionType: "presidential",
    year: DEFAULT_ELECTION_YEAR,
    stateCode: null,
    constituencyCode: null,
    lgaCode: null,
  });
  // Bumped whenever the picker is asked to show something other than what it
  // just emitted, which remounts it so its local state (the seat race's state
  // selector, the year box's in-progress text) resyncs from `race`.
  const [pickerKey, setPickerKey] = useState(0);
  const [pendingRace, setPendingRace] = useState<RaceKey | null>(null);
  const complete = raceComplete(race);
  const token = raceToken(race);

  const [state, setState] = useState<RaceState | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useResource(
    async () => {
      // The response is stamped with the race it was asked for: useResource
      // keeps the PREVIOUS payload while a refetch is in flight, and a stale
      // race's rows must never be rendered as this race's rail.
      const res = await campaignsApi.list(listParamsFor(race, LIMIT));
      return { token, ...res };
    },
    [token],
    { enabled: ready && complete },
  );

  useEffect(() => {
    if (!data) return;
    // Withdrawn and dissolved tickets are dropped: the API would accept a rank
    // on them, but nothing brings them back to `active`, so the rank could
    // never reach the public rail.
    const lists = splitLists(data.rows.filter(isOrderable));
    setState({ token: data.token, lists, baseline: rankedIds(lists), total: data.total });
  }, [data]);

  const current = state && state.token === token ? state : null;
  const dirty = current !== null && !sameOrder(rankedIds(current.lists), current.baseline);
  // A race with more rows than one page holds cannot be renumbered safely: the
  // PUT renumbers the WHOLE race off the ids it is given, so saving a truncated
  // list would silently unrank everything past row 100.
  const truncated = current !== null && current.total > LIMIT;

  // Reloads and tab closes are the one navigation the browser lets us block.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const dirtyRef = useRef(dirty);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  // In-app navigation: the App Router has no `beforeRouteChange` hook, so the
  // guard is a capture-phase click listener on real <a> elements — every way
  // OUT of this page in the chrome (sidebar, header, the back link below) is
  // one. LIMITATION, accepted in plan 66 T8: a programmatic router.push() and
  // the browser's own Back/Forward buttons are not covered; those lose the
  // unsaved order silently. The full fix needs Next's unstable navigation
  // interception. window.confirm stays here rather than a dialog because the
  // click has to be cancelled synchronously.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!dirtyRef.current || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      // A link that opens elsewhere (_blank, a named frame) leaves this page
      // standing, so there is nothing to warn about.
      if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      let url: URL;
      try {
        // mailto:, tel: and any malformed href — not a navigation we guard.
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      if (!window.confirm(DIRTY_PROMPT)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const update = useCallback(
    (next: Lists<CampaignRow>) => {
      setState((prev) => (prev && prev.token === token ? { ...prev, lists: next } : prev));
    },
    [token],
  );

  const onNudge = useCallback(
    (id: string, dir: -1 | 1) => {
      if (!current) return;
      update(nudge(current.lists, id, dir));
    },
    [current, update],
  );

  const onMove = useCallback(
    (id: string, bucket: Bucket, index: number) => {
      if (!current) return;
      update(moveTo(current.lists, id, bucket, index));
    },
    [current, update],
  );

  const sensors = useSensors(
    // A few pixels of slop so a click on the card's own buttons is not
    // swallowed by a drag that never moved.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /**
   * Where a drop lands: `over` is either a card (drop before/at it) or one of
   * the two column droppables, which only register while their list is empty.
   */
  function dropTarget(
    lists: Lists<CampaignRow>,
    overId: string,
  ): { bucket: Bucket; index: number } | null {
    if (overId === "ranked" || overId === "unranked") return { bucket: overId, index: lists[overId].length };
    const bucket = bucketOf(lists, overId);
    if (!bucket) return null;
    return { bucket, index: lists[bucket].findIndex((r) => r.id === overId) };
  }

  /**
   * The board as it was when the drag began. onDragOver COMMITS its cross-column
   * preview to state, so an abort has something to undo: without this, Escape
   * (the keyboard sensor's cancel) left the card in whichever column it was
   * hovering and armed "Unsaved changes" for a move the operator abandoned.
   */
  const dragSnapshot = useRef<Lists<CampaignRow> | null>(null);

  function onDragStart(e: DragStartEvent) {
    dragSnapshot.current = current?.lists ?? null;
    setActiveId(String(e.active.id));
  }

  /** Put the board back the way onDragStart found it. */
  function abortDrag() {
    setActiveId(null);
    if (dragSnapshot.current) update(dragSnapshot.current);
    dragSnapshot.current = null;
  }

  /**
   * Cross-column preview: the row is moved into the target list as soon as the
   * cursor is over it, so the column opens a gap instead of the card jumping
   * only on release. Same-column reordering is left to onDragEnd — the sortable
   * strategy already animates that.
   */
  function onDragOver(e: DragOverEvent) {
    if (!current || !e.over) return;
    const id = String(e.active.id);
    const from = bucketOf(current.lists, id);
    const to = dropTarget(current.lists, String(e.over.id));
    if (!from || !to || from === to.bucket) return;
    update(moveTo(current.lists, id, to.bucket, to.index));
  }

  function onDragEnd(e: DragEndEvent) {
    // Released over nothing is an abort too, not a drop where the preview
    // happened to stop.
    if (!current || !e.over) {
      abortDrag();
      return;
    }
    setActiveId(null);
    dragSnapshot.current = null;
    const to = dropTarget(current.lists, String(e.over.id));
    if (!to) return;
    update(moveTo(current.lists, String(e.active.id), to.bucket, to.index));
  }

  // The announcements read the live lists through a ref: the object is built
  // once (dnd-kit subscribes to it) but must never describe a stale board.
  const listsRef = useRef<Lists<CampaignRow> | null>(null);
  useEffect(() => {
    listsRef.current = current?.lists ?? null;
  }, [current]);

  const announcements = useMemo<Announcements>(() => {
    const at = (id: string) => {
      const lists = listsRef.current;
      if (!lists) return null;
      const bucket = bucketOf(lists, id);
      if (!bucket) return null;
      const index = lists[bucket].findIndex((r) => r.id === id);
      return {
        name: lists[bucket][index].candidateName,
        column: COLUMN_LABEL[bucket],
        position: index + 1,
        of: lists[bucket].length,
      };
    };
    const name = (id: string) => at(id)?.name ?? "this ticket";
    /** Where a drop would land, in words — never a UUID. */
    const target = (overId: string) => {
      if (overId === "ranked" || overId === "unranked") return `the empty ${COLUMN_LABEL[overId]} list`;
      const o = at(overId);
      return o ? `position ${o.position} of ${o.of} in ${o.column}` : "an unknown position";
    };
    return {
      onDragStart({ active }) {
        const a = at(String(active.id));
        return a
          ? `Picked up ${a.name}, position ${a.position} of ${a.of} in ${a.column}.`
          : undefined;
      },
      onDragOver({ active, over }) {
        // Describes the board AFTER onDragOver's preview move has been applied.
        if (!over) return `${name(String(active.id))} is no longer over a list.`;
        return `${name(String(active.id))} is over ${target(String(over.id))}.`;
      },
      onDragEnd({ active, over }) {
        if (!over) return `${name(String(active.id))} was dropped outside the lists; nothing moved.`;
        return `${name(String(active.id))} was dropped at ${target(String(over.id))}.`;
      },
      onDragCancel({ active }) {
        return `Moving ${name(String(active.id))} was cancelled; nothing moved.`;
      },
    };
  }, []);

  function reset() {
    if (!current) return;
    const byId = new Map([...current.lists.ranked, ...current.lists.unranked].map((r) => [r.id, r]));
    const ranked = current.baseline
      .map((id) => byId.get(id))
      .filter((r): r is CampaignRow => r !== undefined);
    const rankedSet = new Set(ranked.map((r) => r.id));
    // The unranked column goes back to the name order splitLists produced.
    const unranked = splitLists(
      [...byId.values()].filter((r) => !rankedSet.has(r.id)).map((r) => ({ ...r, displayOrder: null })),
    ).unranked;
    update({ ranked, unranked });
  }

  async function save() {
    if (!current || truncated) return;
    const ids = rankedIds(current.lists);
    setSaving(true);
    try {
      await campaignsApi.order(orderBodyFor(race, ids));
      // Re-read INSIDE the same await chain rather than firing a background
      // refetch: `saving` stays true (so Save cannot be pressed twice) until
      // the server's own numbering is on screen, and no late response can land
      // on top of edits made in the meantime.
      const res = await campaignsApi.list(listParamsFor(race, LIMIT));
      const lists = splitLists(res.rows.filter(isOrderable));
      setState({ token: raceToken(race), lists, baseline: rankedIds(lists), total: res.total });
      toast.success(`Order saved — ${ids.length} ranked ticket${ids.length === 1 ? "" : "s"}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  /**
   * The picker is controlled, so by the time onChange fires the child has
   * already moved its own local state. Rejecting the value alone would leave it
   * showing a race that is not loaded — so the pending value is parked, the
   * child is remounted back onto the current race, and the dialog decides.
   */
  function pickRace(next: RaceKey) {
    if (!dirtyRef.current) {
      setRace(next);
      return;
    }
    setPendingRace(next);
    setPickerKey((k) => k + 1);
  }

  if (denied) return <Forbidden permission="campaigns.write" />;
  if (permsLoading) return <Skeleton className="h-96 w-full rounded-lg" />;

  const busy = saving || (loading && !current);
  const ranked = current?.lists.ranked ?? [];
  const all = current ? [...current.lists.ranked, ...current.lists.unranked] : [];
  const activeRow = activeId ? all.find((r) => r.id === activeId) : undefined;
  const activeRank = activeRow ? ranked.findIndex((r) => r.id === activeRow.id) : -1;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/dashboard/campaigns"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Election tickets
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold">Rail Order</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The order one race&apos;s tickets appear in on the landing page.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <RaceKeyFields key={pickerKey} value={race} disabled={saving} onChange={pickRace} />
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          The public rail shows ranked tickets first in this order, then the unranked ones by party
          acronym and slug (<code className="text-xs">GET /api/campaigns</code> sorts on{" "}
          <code className="text-xs">display_order</code> ascending with nulls last). Only tickets
          that are live or concluded, reviewed and above low confidence reach the rail at all —
          drafts are ranked here so they are in place the moment they are approved.
        </p>
      </div>

      {!complete ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Pick a seat to load its tickets.
        </p>
      ) : error ? (
        <div className="rounded-lg border border-border p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={refetch}>
            Retry
          </Button>
        </div>
      ) : !current ? (
        <div className="flex gap-6">
          <Skeleton className="h-64 flex-1 rounded-lg" />
          <Skeleton className="h-64 flex-1 rounded-lg" />
        </div>
      ) : all.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No tickets in {raceLabel(race, ELECTION_TYPE_LABEL)} yet.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          accessibility={{ announcements }}
          // NOTE: do NOT add `measuring={{ droppable: { strategy: Always } }}`
          // here. onDragOver moves a card between columns, which resizes both
          // container rects; re-measuring on every render then feeds itself and
          // React throws "Maximum update depth exceeded" mid-drag (observed).
          // The default WhileDragging strategy re-measures when the droppable
          // set changes, which is exactly when a column empties or fills.
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={abortDrag}
        >
          <div className="flex flex-col gap-6 lg:flex-row">
            <OrderColumn
              bucket="ranked"
              title={COLUMN_LABEL.ranked}
              hint="Position 1 renders first on the rail."
              rows={current.lists.ranked}
              disabled={saving}
              emptyHint="Drag a ticket here, or use the + button."
              callbacks={{ onNudge, onMove }}
            />
            <OrderColumn
              bucket="unranked"
              title={COLUMN_LABEL.unranked}
              hint="Rendered after every ranked ticket, by party acronym then slug."
              rows={current.lists.unranked}
              disabled={saving}
              emptyHint="Every ticket in this race is ranked."
              callbacks={{ onNudge, onMove }}
            />
          </div>
          <DragOverlay>
            {activeRow ? (
              <TicketCardBody
                row={activeRow}
                rank={activeRank >= 0 ? activeRank + 1 : null}
                className="shadow-lg"
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="text-sm text-muted-foreground">
          <p>{dirty ? "Unsaved changes" : current ? "Saved" : ""}</p>
          {truncated ? (
            <p className="text-xs text-destructive">
              This race has {current?.total} tickets; only the first {LIMIT} can be ordered here.
            </p>
          ) : current && ranked.length === 0 ? (
            <p className="text-xs">
              At least one ticket must stay ranked — the API has no request that empties a rail.
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={!dirty || saving} onClick={reset}>
            <RotateCcw className="mr-1 h-4 w-4" />
            Reset
          </Button>
          <Button
            size="sm"
            disabled={!dirty || busy || truncated || ranked.length === 0}
            onClick={save}
          >
            {saving ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            Save order
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={pendingRace !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRace(null);
        }}
        title="Discard unsaved rail order?"
        description="This race has unsaved changes. Switching races throws them away — an order is saved one race at a time."
        confirmLabel="Discard and switch"
        destructive
        onConfirm={async () => {
          if (!pendingRace) return;
          setRace(pendingRace);
          setPendingRace(null);
          // Remount again so the picker seeds itself from the race it is now on
          // (a seat race derives its state selector from the seat code).
          setPickerKey((k) => k + 1);
        }}
      />
    </div>
  );
}
