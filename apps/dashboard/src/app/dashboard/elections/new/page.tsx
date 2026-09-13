"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
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
import {
  ElectionDateFields,
  type ElectionDateValue,
} from "@/components/elections/election-date-fields";
import {
  ElectionScopeFields,
  NATIONWIDE,
  type ElectionScope,
} from "@/components/elections/election-scope-fields";
import { ExcludedStatesField } from "@/components/elections/excluded-states-field";
import {
  ELECTION_OFFICES,
  ELECTION_ROUNDS,
  ELECTION_SLUG_RE,
  OFFICE_LABEL,
  ROUND_LABEL,
  dateEncodingError,
  electionsApi,
  errorMessage,
  type ElectionOffice,
  type ElectionRound,
} from "@/lib/elections";
import { usePermissions } from "@/lib/permissions";

/** Matches campaigns' DEFAULT_ELECTION_YEAR — the next general cycle. */
const DEFAULT_YEAR = 2027;

type Confidence = "high" | "medium" | "low";

/** Mirrors createSchema (admin-elections.schemas.ts): int 1999–2100. */
function yearProblem(text: string): string | null {
  if (!/^\d{4}$/.test(text)) return "A four-digit year.";
  const year = Number(text);
  if (year < 1999 || year > 2100) return "Between 1999 and 2100.";
  return null;
}

/** A supplied slug is a promise about the URL — validate it like the API will. */
function slugProblem(slug: string): string | null {
  if (!slug) return null; // omitted → the API derives one
  if (slug.length < 2 || slug.length > 160) return "2–160 characters.";
  if (!ELECTION_SLUG_RE.test(slug)) return "Lowercase kebab-case (a-z, 0-9, hyphens).";
  return null;
}

function sourceUrlProblem(url: string): string | null {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? null : "Must be an http(s) URL.";
}

/**
 * Create one draft election event. One page, no wizard — an event is a single
 * row (office + year + round + scope + date), unlike a ticket's two-step
 * race-then-people flow. Publishing is a separate reviewer verb on the detail
 * page; nothing here touches the public gate.
 */
export default function NewElectionPage() {
  const { loading: permsLoading, can } = usePermissions();
  if (permsLoading) return <Skeleton className="h-96 w-full rounded-lg" />;
  if (!can("elections.write")) return <Forbidden permission="elections.write" />;
  return <NewEventForm />;
}

function NewEventForm() {
  const router = useRouter();

  const [office, setOffice] = useState<ElectionOffice>("presidential");
  const [yearText, setYearText] = useState(String(DEFAULT_YEAR));
  const [round, setRound] = useState<ElectionRound>("general");
  const [slug, setSlug] = useState("");
  const [label, setLabel] = useState("");
  const [date, setDate] = useState<ElectionDateValue>({
    datePrecision: "year",
    electionDate: null,
  });
  const [scope, setScope] = useState<ElectionScope>(NATIONWIDE);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<Confidence>("medium");
  const [sourceUrl, setSourceUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const problems = {
    year: yearProblem(yearText),
    slug: slugProblem(slug),
    date: dateEncodingError(date.datePrecision, date.electionDate),
    sourceUrl: sourceUrlProblem(sourceUrl),
  };
  const blocked = Object.values(problems).some(Boolean);
  const nationwide = scope.stateCode === null;

  function pickOffice(next: ElectionOffice) {
    setOffice(next);
    // The narrower pickers differ per office (senate district vs LGA vs ward);
    // a code picked for the old office is meaningless under the new one.
    setScope((prev) => ({ ...NATIONWIDE, stateCode: prev.stateCode }));
  }

  function pickScope(next: ElectionScope) {
    setScope(next);
    // The API rejects carve-outs on a scoped row.
    if (next.stateCode !== null) setExcluded([]);
  }

  async function submit() {
    if (blocked || pending) return;
    setPending(true);
    setError(null);
    // Exactly the createSchema whitelist; optional fields are omitted, not
    // sent empty, so the API's defaults (round general aside — always sent —
    // slug derivation, confidence medium) stay in charge.
    const body: Record<string, unknown> = {
      office,
      year: Number(yearText),
      round,
      datePrecision: date.datePrecision,
      electionDate: date.electionDate,
      confidence,
    };
    if (slug) body.slug = slug;
    if (label.trim()) body.label = label.trim();
    if (scope.stateCode) body.stateCode = scope.stateCode;
    if (scope.constituencyCode) body.constituencyCode = scope.constituencyCode;
    if (scope.lgaCode) body.lgaCode = scope.lgaCode;
    if (scope.wardCode) body.wardCode = scope.wardCode;
    if (nationwide && excluded.length > 0) body.excludedStates = excluded;
    if (sourceUrl.trim()) body.sourceUrl = sourceUrl.trim();
    try {
      const row = await electionsApi.create(body);
      toast.success("Draft event created");
      router.push(`/dashboard/elections/${row.id}`);
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/elections"
          aria-label="Back to election events"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold">New Event</h1>
          <p className="text-muted-foreground text-sm mt-1">
            One scheduled poll. It starts as a draft — nothing reaches the
            public gate until a reviewer publishes it.
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>The event</CardTitle>
          <CardDescription>
            Office, year and round identify the event and cannot change later —
            a moved poll keeps its cycle year and only moves the date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="election-office">Office</Label>
                <Select
                  value={office}
                  onValueChange={(v) => pickOffice(v as ElectionOffice)}
                  disabled={pending}
                >
                  <SelectTrigger id="election-office" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ELECTION_OFFICES.map((o) => (
                      <SelectItem key={o} value={o}>
                        {OFFICE_LABEL[o]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="election-year">Cycle year</Label>
                <Input
                  id="election-year"
                  inputMode="numeric"
                  value={yearText}
                  disabled={pending}
                  aria-invalid={problems.year ? true : undefined}
                  aria-describedby={problems.year ? "election-year-problem" : undefined}
                  onChange={(e) =>
                    setYearText(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                />
                {problems.year ? (
                  <p id="election-year-problem" className="text-xs text-destructive">
                    {problems.year}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="election-round">Round</Label>
                <Select
                  value={round}
                  onValueChange={(v) => setRound(v as ElectionRound)}
                  disabled={pending}
                >
                  <SelectTrigger id="election-round" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ELECTION_ROUNDS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROUND_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="election-label">Label (optional)</Label>
                <Input
                  id="election-label"
                  value={label}
                  maxLength={120}
                  disabled={pending}
                  placeholder="Osun Governorship"
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
            </div>

            <ElectionDateFields value={date} onChange={setDate} disabled={pending} />

            <ElectionScopeFields
              office={office}
              value={scope}
              onChange={pickScope}
              disabled={pending}
            />

            {nationwide ? (
              <ExcludedStatesField
                value={excluded}
                onChange={setExcluded}
                disabled={pending}
              />
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="election-confidence">Confidence</Label>
                <Select
                  value={confidence}
                  onValueChange={(v) => setConfidence(v as Confidence)}
                  disabled={pending}
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

              <div className="space-y-1.5">
                <Label htmlFor="election-source">Source URL (optional)</Label>
                <Input
                  id="election-source"
                  value={sourceUrl}
                  disabled={pending}
                  placeholder="https://inecnigeria.org/…"
                  aria-invalid={problems.sourceUrl ? true : undefined}
                  aria-describedby={
                    problems.sourceUrl ? "election-source-problem" : undefined
                  }
                  onChange={(e) => setSourceUrl(e.target.value)}
                />
                {problems.sourceUrl ? (
                  <p id="election-source-problem" className="text-xs text-destructive">
                    {problems.sourceUrl}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="election-slug">Slug (optional)</Label>
              <Input
                id="election-slug"
                value={slug}
                maxLength={160}
                disabled={pending}
                placeholder="2027-presidential"
                aria-invalid={problems.slug ? true : undefined}
                aria-describedby={problems.slug ? "election-slug-problem" : "election-slug-hint"}
                onChange={(e) => setSlug(e.target.value)}
              />
              {problems.slug ? (
                <p id="election-slug-problem" className="text-xs text-destructive">
                  {problems.slug}
                </p>
              ) : (
                <p id="election-slug-hint" className="text-xs text-muted-foreground">
                  Left empty, the API derives one from the year, scope and
                  office (a duplicate gets a -2 suffix). A supplied slug that
                  clashes is rejected instead.
                </p>
              )}
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={blocked || pending}>
                {pending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                Create draft
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
