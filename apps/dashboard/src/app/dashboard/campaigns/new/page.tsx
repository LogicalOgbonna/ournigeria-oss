"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
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
import { Forbidden } from "@/components/layout/forbidden";
import { OfficialPicker, type PersonValue } from "@/components/campaigns/official-picker";
import { PartySelect } from "@/components/campaigns/party-select";
import {
  DEFAULT_ELECTION_YEAR,
  RaceKeyFields,
  type RaceKeyValue,
} from "@/components/campaigns/race-key-fields";
import { deriveTicketSlug, slugError, SLUG_MAX } from "@/lib/campaign-slug";
import {
  ELECTION_TYPE_LABEL,
  SCOPE_FOR,
  campaignsApi,
  errorMessage,
  seatStateCode,
} from "@/lib/campaigns";
import { useGeoList } from "@/lib/hooks/use-geo-list";
import { usePermissions } from "@/lib/permissions";

/**
 * Create one draft ticket. Two steps in local state (not the URL — a half-filled
 * race key is not a shareable address): pick the race, then the people.
 *
 * Everything else about a ticket (copy, colours, posters, council) is edited on
 * the detail page afterwards; this form only sends what `createSchema` needs to
 * open the row.
 */
export default function NewCampaignPage() {
  const { loading: permsLoading, can } = usePermissions();
  if (permsLoading) return <Skeleton className="h-96 w-full rounded-lg" />;
  if (!can("campaigns.write")) return <Forbidden permission="campaigns.write" />;
  return <NewTicketForm />;
}

/** The scope code this race type carries, if any (raceScopeFor allows exactly one). */
function scopeCode(race: RaceKeyValue): string | null {
  const scope = SCOPE_FOR[race.electionType];
  if (scope === "state") return race.stateCode ?? null;
  if (scope === "constituency") return race.constituencyCode ?? null;
  if (scope === "lga") return race.lgaCode ?? null;
  return null;
}

function NewTicketForm() {
  const router = useRouter();
  const fieldId = useId();
  const slugId = `${fieldId}-slug`;
  const slugHintId = `${slugId}-hint`;
  const slugErrorId = `${slugId}-error`;

  const [step, setStep] = useState<1 | 2>(1);
  const [race, setRace] = useState<RaceKeyValue>({
    electionType: "presidential",
    year: DEFAULT_ELECTION_YEAR,
  });
  const [party, setParty] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<PersonValue | null>(null);
  const [mate, setMate] = useState<PersonValue | null>(null);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scope = SCOPE_FOR[race.electionType];
  // Senate / House of Reps / State Assembly seats are won by one person — the
  // API stores a mate on any race type, but offering one here would invite bad
  // data. Chairman tickets DO have a deputy, so LGA races keep the picker.
  const mateAllowed = scope !== "constituency";
  const code = scopeCode(race);
  const raceComplete = (scope === null || !!code) && !!party;

  // Names for the step-2 summary. A national race has no scope to name, so the
  // list is not requested at all. The state list is already cached by
  // RaceKeyFields; a seat's owning state is read back out of its code, and the
  // seat itself is shown verbatim (its list is keyed by a state this form does
  // not keep once step 1 is behind us).
  const states = useGeoList(scope ? "/api/geo/states" : null);
  const stateCode =
    scope === "state" ? code : seatStateCode(code, states.rows.map((s) => s.code));
  const stateName = states.rows.find((s) => s.code === stateCode)?.name ?? stateCode;

  const candidateName = candidate?.name ?? "";
  const mateName = mateAllowed ? (mate?.name ?? "") : "";
  const derivedSlug = deriveTicketSlug(candidateName, mateName);

  // The slug follows the two names until the operator edits it themselves.
  useEffect(() => {
    if (slugTouched) return;
    setSlug(derivedSlug);
  }, [derivedSlug, slugTouched]);

  const hasCandidate = Boolean(candidate?.officialId || candidate?.name);
  // Only nag about the slug once there is something to slugify — an empty form
  // should not open with a red line under an empty box.
  const slugProblem = hasCandidate ? slugError(slug) : null;
  // A slug is only PROMISED to the API when the operator chose it. Left alone,
  // it is omitted so the API derives the same value and may take a `-2` suffix;
  // a supplied one that clashes is a 409 instead.
  const slugChosen = slugTouched && slug !== derivedSlug;
  const canSubmit = raceComplete && hasCandidate && !slugProblem && !pending;

  const titleRef = useRef<HTMLDivElement>(null);
  const lastStep = useRef(step);
  useEffect(() => {
    // Only on an actual step swap: nothing moved on the first render, and
    // stealing focus from the top of the page on arrival helps no one. A
    // previous-value ref (not a mounted flag) survives StrictMode's dev-only
    // effect re-run without focusing on load.
    if (lastStep.current === step) return;
    lastStep.current = step;
    titleRef.current?.focus();
  }, [step]);

  function pickRace(next: RaceKeyValue) {
    setRace(next);
    // A mate picked for a governor ticket must not ride along into a seat race.
    if (SCOPE_FOR[next.electionType] === "constituency") setMate(null);
  }

  function pickCandidate(next: PersonValue | null) {
    setCandidate(next);
    // Clearing the candidate throws away the slug that was built from them, so
    // the field goes back to following the names.
    if (!next) setSlugTouched(false);
  }

  async function submit() {
    if (!canSubmit || !candidate) return;
    setPending(true);
    setError(null);
    // Exactly the createSchema whitelist: the race key with its ONE scope
    // column (raceScopeFor rejects a payload carrying more), the party, and the
    // person objects.
    const body: Record<string, unknown> = {
      electionType: race.electionType,
      year: race.year,
      partyAcronym: party,
      candidate: {
        officialId: candidate.officialId ?? undefined,
        name: candidate.name ?? undefined,
      },
    };
    if (slugChosen) body.slug = slug;
    if (scope === "state") body.stateCode = code;
    if (scope === "constituency") body.constituencyCode = code;
    if (scope === "lga") body.lgaCode = code;
    if (mateAllowed && mate && (mate.officialId || mate.name)) {
      body.runningMate = {
        officialId: mate.officialId ?? undefined,
        name: mate.name ?? undefined,
      };
    }
    try {
      const row = await campaignsApi.create(body);
      toast.success("Draft created");
      router.push(`/dashboard/campaigns/${row.id}`);
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/campaigns"
          aria-label="Back to election tickets"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold">New Ticket</h1>
          <p className="text-muted-foreground text-sm mt-1">
            A ticket is one candidate + running mate in one race. It starts as a
            draft — nothing is public until a reviewer approves it.
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle ref={titleRef} tabIndex={-1} className="outline-none">
            {step === 1 ? "Step 1 · The race" : "Step 2 · The people"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "Which seat, which year, and under which party."
              : "Who is on the ticket, and the slug their public page will use."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (step === 1) {
                if (raceComplete) setStep(2);
                return;
              }
              void submit();
            }}
          >
            {step === 1 ? (
              <>
                <RaceKeyFields value={race} onChange={pickRace} />
                {/* Half-width on its own row: the party select keeps the same
                    column rhythm as the race fields above it. */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <PartySelect value={party} onChange={setParty} />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={!raceComplete}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                  <span className="font-medium">
                    {ELECTION_TYPE_LABEL[race.electionType]}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span>{race.year}</span>
                  {stateName ? (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span>{stateName}</span>
                    </>
                  ) : null}
                  {scope !== null && scope !== "state" && code ? (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="font-mono text-xs">{code}</span>
                    </>
                  ) : null}
                  {party ? (
                    <Badge variant="outline" className="ml-1">
                      {party}
                    </Badge>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    disabled={pending}
                    onClick={() => {
                      // The failure belonged to the payload being edited.
                      setError(null);
                      setStep(1);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                </div>

                <OfficialPicker
                  value={candidate}
                  onChange={pickCandidate}
                  label="Candidate"
                  placeholder="Search officials, or type a name"
                  disabled={pending}
                />
                {mateAllowed ? (
                  <OfficialPicker
                    value={mate}
                    onChange={setMate}
                    label="Running mate (optional)"
                    placeholder="Search officials, or type a name"
                    disabled={pending}
                  />
                ) : null}

                <div className="space-y-1.5">
                  <Label htmlFor={slugId}>Slug</Label>
                  <Input
                    id={slugId}
                    value={slug}
                    maxLength={SLUG_MAX}
                    disabled={pending}
                    aria-invalid={slugProblem ? true : undefined}
                    aria-describedby={slugProblem ? slugErrorId : slugHintId}
                    placeholder="obi-baba-ahmed"
                    onChange={(e) => {
                      // An emptied box goes back to following the names.
                      setSlugTouched(e.target.value.length > 0);
                      setSlug(e.target.value);
                    }}
                  />
                  {slugProblem ? (
                    <p id={slugErrorId} className="text-xs text-destructive">
                      {slugProblem}
                    </p>
                  ) : (
                    <p id={slugHintId} className="text-xs text-muted-foreground">
                      The ticket&apos;s public URL.{" "}
                      {slugChosen
                        ? "Yours — the API rejects it if another ticket already has it."
                        : "Auto from the surnames — a duplicate gets a -2 suffix."}
                    </p>
                  )}
                </div>

                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}

                <div className="flex justify-end">
                  <Button type="submit" disabled={!canSubmit}>
                    {pending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : null}
                    Create draft
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
