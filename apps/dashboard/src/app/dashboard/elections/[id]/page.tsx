"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ReadOnlyNotice } from "@/components/campaigns/read-only-notice";
import { ReasonDialog } from "@/components/campaigns/reason-dialog";
import { ReviewTimeline } from "@/components/campaigns/review-timeline";
import { ElectionStatusChip } from "@/components/elections/election-status-chip";
import { ElectionVerbButtons } from "@/components/elections/election-verb-buttons";
import {
  ElectionDateFields,
  type ElectionDateValue,
} from "@/components/elections/election-date-fields";
import {
  ElectionScopeFields,
  type ElectionScope,
} from "@/components/elections/election-scope-fields";
import { ExcludedStatesField } from "@/components/elections/excluded-states-field";
import {
  OFFICE_LABEL,
  ROUND_LABEL,
  dateEncodingError,
  displayDate,
  electionsApi,
  errorMessage,
  type ElectionDetail,
} from "@/lib/elections";
import { useResource } from "@/lib/hooks/use-resource";
import { usePermissions } from "@/lib/permissions";

export default function ElectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ElectionDetailView id={id} />;
}

/** "Osun" | seat name | "Nationwide" — narrowest resolved scope wins. */
function scopeText(e: ElectionDetail): string {
  return (
    e.ward?.name ??
    e.constituency?.name ??
    e.lga?.name ??
    e.state?.name ??
    "Nationwide"
  );
}

function ElectionDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { loading: permsLoading, can } = usePermissions();
  // D5 split mirrored from the API: reads accept either side so a reviewer can
  // see what they publish.
  const canRead = can("elections.write") || can("campaigns.review");
  const ready = !permsLoading && canRead;
  const denied = !permsLoading && !canRead;

  const { data, loading, error, refetch } = useResource(
    () => electionsApi.get(id),
    [id],
    { enabled: ready },
  );

  if (denied) return <Forbidden permission="elections.write" />;

  // Same convention as the campaign detail page: the skeleton is driven by "no
  // data", not by `loading`, so a refetch after a verb never tears the form
  // down. A row from a previous id is not this page's data.
  const event = data && data.id === id ? data : undefined;
  const refreshing = loading && event !== undefined;

  if (!event) {
    return (
      <div className="space-y-4">
        <BackLink />
        {error ? (
          <div className="rounded-lg border border-border p-6 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={refetch}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </>
        )}
      </div>
    );
  }

  const attached = event._count.campaigns + event._count.officialElections;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <BackLink />
        <div className="flex flex-wrap items-start justify-between gap-3">
          {/* The status chip lives in the same block as the h1 — the E2E
              statusChip() helper finds it through that structure. */}
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-bold">
              {event.label ?? event.slug}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <ElectionStatusChip {...event} />
              <span>
                {OFFICE_LABEL[event.office]}
                {event.round !== "general" ? ` · ${ROUND_LABEL[event.round]}` : ""}
                {` · ${event.year} · ${scopeText(event)}`}
              </span>
              <span aria-hidden>·</span>
              <span>{displayDate(event)}</span>
              <span aria-hidden>·</span>
              <code className="font-mono text-xs">{event.slug}</code>
              {attached > 0 ? (
                <Badge variant="outline">
                  {attached} attached row{attached === 1 ? "" : "s"}
                </Badge>
              ) : null}
              {refreshing ? (
                <span className="inline-flex items-center gap-1 text-xs">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Refreshing…
                </span>
              ) : null}
            </div>
          </div>
          <ElectionVerbButtons
            election={event}
            onDone={refetch}
            onDeleted={() => router.push("/dashboard/elections")}
          />
        </div>
      </div>

      {/* A refetch that failed with the event already on screen: the page
          stays, the banner says the view may be stale. */}
      {error ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button size="sm" variant="outline" onClick={refetch}>
            Retry
          </Button>
        </div>
      ) : null}

      <EventForm event={event} onSaved={refetch} />

      <Card>
        <CardHeader>
          <CardTitle>Audit trail</CardTitle>
          <CardDescription>
            The last 20 events on this row — edits, publishes, gate moves.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReviewTimeline events={event.audit} onReverted={refetch} />
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- edit form ----------

interface Form {
  label: string;
  date: ElectionDateValue;
  scope: ElectionScope;
  excludedStates: string[];
  confidence: "high" | "medium" | "low";
  sourceUrl: string;
}

function formOf(e: ElectionDetail): Form {
  return {
    label: e.label ?? "",
    date: {
      datePrecision: e.datePrecision,
      electionDate: e.electionDate?.slice(0, 10) ?? null,
    },
    scope: {
      stateCode: e.stateCode,
      constituencyCode: e.constituencyCode,
      lgaCode: e.lgaCode,
      wardCode: e.wardCode,
    },
    excludedStates: e.excludedStates.map((s) => s.stateCode).sort(),
    confidence: e.confidence,
    sourceUrl: e.sourceUrl ?? "",
  };
}

/** Exactly the patchSchema whitelist for the fields that actually moved. */
function diffOf(form: Form, base: Form): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (form.label !== base.label) body.label = form.label.trim() || null;
  if (form.date.datePrecision !== base.date.datePrecision) {
    body.datePrecision = form.date.datePrecision;
  }
  if (form.date.electionDate !== base.date.electionDate) {
    body.electionDate = form.date.electionDate;
  }
  for (const key of ["stateCode", "constituencyCode", "lgaCode", "wardCode"] as const) {
    if (form.scope[key] !== base.scope[key]) body[key] = form.scope[key];
  }
  // Replace-set semantics: the payload's list IS the carve-out list.
  const excluded = [...form.excludedStates].sort();
  if (excluded.join(",") !== base.excludedStates.join(",")) {
    body.excludedStates = excluded;
  }
  if (form.confidence !== base.confidence) body.confidence = form.confidence;
  if (form.sourceUrl.trim() !== base.sourceUrl) {
    body.sourceUrl = form.sourceUrl.trim() || null;
  }
  return body;
}

function EventForm({
  event,
  onSaved,
}: {
  event: ElectionDetail;
  onSaved: () => void;
}) {
  const { can } = usePermissions();
  const canWrite = can("elections.write");

  const [form, setForm] = useState<Form>(() => formOf(event));
  const [saving, setSaving] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);

  const base = formOf(event);
  const body = diffOf(form, base);
  const dirty = Object.keys(body).length > 0;

  const dateProblem = dateEncodingError(form.date.datePrecision, form.date.electionDate);
  const sourceProblem =
    form.sourceUrl.trim() && !/^https?:\/\//i.test(form.sourceUrl.trim())
      ? "Must be an http(s) URL."
      : null;
  const blocked = Boolean(dateProblem || sourceProblem);
  const nationwide = form.scope.stateCode === null;

  // Re-seed from the server when the ROW actually changed (our own save, a
  // verb, a revert) — but never underneath unsaved edits.
  const seededAt = useRef(event.updatedAt);
  useEffect(() => {
    if (seededAt.current === event.updatedAt) return;
    if (dirty) return;
    seededAt.current = event.updatedAt;
    setForm(formOf(event));
  }, [event, dirty]);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function pickScope(next: ElectionScope) {
    setForm((prev) => ({
      ...prev,
      scope: next,
      // The API rejects carve-outs on a scoped row.
      excludedStates: next.stateCode !== null ? [] : prev.excludedStates,
    }));
  }

  async function save(reason?: string) {
    setSaving(true);
    try {
      await electionsApi.patch(event.id, reason ? { ...body, reason } : body);
      toast.success("Event saved");
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  function onSaveClick() {
    if (!dirty || blocked || saving) return;
    // The API requires a reason on a published row (and flips it back to
    // re-review) — ask up front rather than round-tripping a 400.
    if (event.published) {
      setReasonOpen(true);
      return;
    }
    void save().catch((err) => toast.error(errorMessage(err)));
  }

  const disabled = !canWrite || saving;
  const changeCount = Object.keys(body).length;

  return (
    <div className="space-y-6">
      {!canWrite ? (
        <ReadOnlyNotice
          noun="event"
          subject="details"
          action="Editing"
          permission="elections.write"
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
          <CardDescription>
            Office ({OFFICE_LABEL[event.office]}), cycle year ({event.year}),
            round ({ROUND_LABEL[event.round]}) and slug are the event&apos;s
            identity and cannot change — a moved poll keeps its year and only
            moves the date.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="election-label">Label</Label>
              <Input
                id="election-label"
                value={form.label}
                maxLength={120}
                disabled={disabled}
                placeholder="Osun Governorship"
                onChange={(e) => set("label", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="election-confidence">Confidence</Label>
              <Select
                value={form.confidence}
                onValueChange={(v) => set("confidence", v as Form["confidence"])}
                disabled={disabled}
              >
                <SelectTrigger id="election-confidence" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ElectionDateFields
            value={form.date}
            onChange={(v) => set("date", v)}
            disabled={disabled}
          />

          <ElectionScopeFields
            office={event.office}
            value={form.scope}
            onChange={pickScope}
            disabled={disabled}
          />

          {nationwide ? (
            <ExcludedStatesField
              value={form.excludedStates}
              onChange={(v) => set("excludedStates", v)}
              disabled={disabled}
            />
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="election-source">Source URL</Label>
            <Input
              id="election-source"
              value={form.sourceUrl}
              disabled={disabled}
              placeholder="https://inecnigeria.org/…"
              aria-invalid={sourceProblem ? true : undefined}
              aria-describedby={sourceProblem ? "election-source-problem" : undefined}
              onChange={(e) => set("sourceUrl", e.target.value)}
            />
            {sourceProblem ? (
              <p id="election-source-problem" className="text-xs text-destructive">
                {sourceProblem}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              {dirty
                ? `${changeCount} unsaved change${changeCount === 1 ? "" : "s"}${
                    event.published ? " — a reason is required while published" : ""
                  }`
                : "No unsaved changes."}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={!dirty || saving}
                onClick={() => setForm(formOf(event))}
              >
                Discard
              </Button>
              <Button
                type="button"
                disabled={!canWrite || !dirty || blocked || saving}
                onClick={onSaveClick}
              >
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ReasonDialog
        open={reasonOpen}
        onOpenChange={setReasonOpen}
        title="Save changes to a published event"
        description="This event is on the public gate, so the API records a reason with the change — and the edit sends it back for re-review."
        confirmLabel="Save"
        onConfirm={(reason) => save(reason)}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/elections"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      All events
    </Link>
  );
}
