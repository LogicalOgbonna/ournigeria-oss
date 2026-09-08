"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Link2, Loader2, Undo2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ReadOnlyNotice } from "@/components/campaigns/read-only-notice";
import { ReasonDialog } from "@/components/campaigns/reason-dialog";
import { SLUG_MAX, slugError } from "@/lib/campaign-slug";
import {
  HEX,
  MAX,
  diffOf,
  expandHex,
  formOf,
  problemsOf,
  type Confidence,
  type Form,
} from "@/lib/campaign-form";
import {
  campaignsApi,
  errorMessage,
  isPublicStatus,
  ticketHasMate,
  type CampaignDetail,
} from "@/lib/campaigns";
import { usePermissions } from "@/lib/permissions";

/** Colour column: native picker + hex box, either one drives the value. */
function ColourField({
  id,
  label,
  hint,
  value,
  error,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  const messageId = `${id}-message`;
  // <input type="color"> has no empty state — an unset column shows white and
  // only becomes a real value once the operator picks one. It also only accepts
  // the 6-digit form, so a stored #abc is expanded for the picker while the hex
  // box keeps showing exactly what the column holds.
  const swatch = HEX.test(value.trim()) ? expandHex(value.trim()) : "#ffffff";
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} colour picker`}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-border bg-background p-1 disabled:cursor-not-allowed disabled:opacity-50"
          value={swatch}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
        <Input
          id={id}
          className="font-mono"
          placeholder="#059669"
          maxLength={7}
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          onChange={(e) => onChange(e.target.value)}
        />
        {value.trim() ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onChange("")}
          >
            Clear
          </Button>
        ) : null}
      </div>
      {/* One node for hint AND error: the id in aria-describedby stays valid, so
          a screen reader announces the error the moment it replaces the hint. */}
      <p
        id={messageId}
        className={`text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}
      >
        {error ?? hint}
      </p>
    </div>
  );
}

function Counter({ value, max }: { value: string; max: number }) {
  return (
    <span className="text-xs tabular-nums text-muted-foreground">
      {value.length}/{max}
    </span>
  );
}

/** A candidate/mate that resolves to a real official record. */
function OfficialChip({
  person,
}: {
  person: { id: string; slug: string | null; name: string } | null;
}) {
  if (!person) {
    return (
      <span className="text-xs text-muted-foreground">
        Not linked to an official record
      </span>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <Link
        href={`/dashboard/officials/${person.id}`}
        className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-2"
      >
        <Link2 className="h-3.5 w-3.5" />
        {person.name}
      </Link>
      {person.slug ? (
        <Badge variant="outline" className="font-mono text-xs">
          {person.slug}
        </Badge>
      ) : null}
    </span>
  );
}

/**
 * The ticket's own columns — everything `patchSchema` accepts. Artwork lives on
 * the Artwork tab (the API refuses an image URL that is not one of ours), and
 * `status` / `review*` / `displayOrder` move only through verbs.
 */
export function TicketTab({
  campaign,
  onSaved,
}: {
  campaign: CampaignDetail;
  onSaved: () => void;
}) {
  const fieldId = useId();
  const { can } = usePermissions();
  const canWrite = can("campaigns.write");
  const canReview = can("campaigns.review");

  const base = formOf(campaign);
  const [form, setForm] = useState<Form>(base);
  const [saving, setSaving] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [slug, setSlug] = useState(campaign.slug);
  const [slugSaving, setSlugSaving] = useState(false);

  const isDraft = campaign.status === "draft";
  const isPublic = isPublicStatus(campaign.status);
  // Senate / Reps / State Assembly seats and councillor wards are won by ONE
  // person; a mate that is somehow already stored is still shown so it can be
  // corrected.
  const mateRelevant = ticketHasMate(campaign);

  const body = diffOf(form, base);
  const problems = problemsOf(form);
  const dirty = Object.keys(body).length > 0;
  const slugDirty = slug !== campaign.slug;
  const blocked = Object.keys(problems).length > 0;

  // Re-seed from the server when the ROW actually changed — our own save, or a
  // revert from the Review tab. Two guards matter:
  //   - `updatedAt` (the model's @updatedAt column) means a refetch that
  //     returned identical data never touches the form;
  //   - a dirty form is left alone, so a verb elsewhere on the page (submit,
  //     approve, …) refetching underneath the operator cannot swallow the
  //     paragraph they were halfway through. "Discard" still pulls the newest
  //     server values, because it reads the current `campaign` prop.
  const seededAt = useRef(campaign.updatedAt);
  useEffect(() => {
    if (seededAt.current === campaign.updatedAt) return;
    if (dirty || slugDirty) return;
    seededAt.current = campaign.updatedAt;
    setForm(formOf(campaign));
    setSlug(campaign.slug);
  }, [campaign, dirty, slugDirty]);

  // patch(): lowering a live ticket's confidence to low hides it, which is a
  // reviewer's call.
  const lowersConfidence =
    isPublic && form.confidence === "low" && campaign.confidence !== "low";

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function discard() {
    setForm(formOf(campaign));
    setSlug(campaign.slug);
  }

  async function save(reason?: string) {
    setSaving(true);
    try {
      await campaignsApi.patch(campaign.id, reason ? { ...body, reason } : body);
      toast.success("Ticket saved");
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  function onSaveClick() {
    if (!dirty || blocked || saving) return;
    // The API rejects an edit to a non-draft row without a reason, so ask for
    // one up front rather than round-tripping a 400.
    if (!isDraft) {
      setReasonOpen(true);
      return;
    }
    void save().catch((err) => toast.error(errorMessage(err)));
  }

  async function saveSlug() {
    const problem = slugError(slug);
    if (problem) {
      toast.error(problem);
      return;
    }
    setSlugSaving(true);
    try {
      await campaignsApi.slug(campaign.id, slug);
      toast.success("Slug updated");
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSlugSaving(false);
    }
  }

  const disabled = !canWrite || saving;
  const changeCount = Object.keys(body).length;
  const nameErrorId = `${fieldId}-name-error`;
  const mateErrorId = `${fieldId}-mate-error`;
  const sourceMessageId = `${fieldId}-source-message`;

  return (
    <div className="space-y-6">
      {!canWrite ? <ReadOnlyNotice subject="details" action="Editing" /> : null}

      <Card>
        <CardHeader>
          <CardTitle>The people</CardTitle>
          <CardDescription>
            Names as they appear on the poster. Photos are uploaded on the
            Artwork tab — the API only accepts image URLs it stored itself.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor={`${fieldId}-name`}>Candidate name</Label>
                <Counter value={form.candidateName} max={MAX.candidateName} />
              </div>
              <Input
                id={`${fieldId}-name`}
                value={form.candidateName}
                maxLength={MAX.candidateName}
                disabled={disabled}
                aria-invalid={problems.candidateName ? true : undefined}
                aria-describedby={problems.candidateName ? nameErrorId : undefined}
                onChange={(e) => set("candidateName", e.target.value)}
              />
              {problems.candidateName ? (
                <p id={nameErrorId} className="text-xs text-destructive">
                  {problems.candidateName}
                </p>
              ) : (
                <OfficialChip person={campaign.candidateOfficial} />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor={`${fieldId}-short`}>Short name</Label>
                <Counter
                  value={form.candidateShortName}
                  max={MAX.candidateShortName}
                />
              </div>
              <Input
                id={`${fieldId}-short`}
                placeholder="Obi"
                value={form.candidateShortName}
                maxLength={MAX.candidateShortName}
                disabled={disabled}
                onChange={(e) => set("candidateShortName", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                What the poster and the rail card use when space is tight.
              </p>
            </div>
          </div>

          {mateRelevant ? (
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor={`${fieldId}-mate`}>Running mate</Label>
                <Counter value={form.runningMateName} max={MAX.runningMateName} />
              </div>
              <Input
                id={`${fieldId}-mate`}
                placeholder="No running mate"
                value={form.runningMateName}
                maxLength={MAX.runningMateName}
                disabled={disabled}
                aria-invalid={problems.runningMateName ? true : undefined}
                aria-describedby={problems.runningMateName ? mateErrorId : undefined}
                onChange={(e) => set("runningMateName", e.target.value)}
              />
              {problems.runningMateName ? (
                <p id={mateErrorId} className="text-xs text-destructive">
                  {problems.runningMateName}
                </p>
              ) : (
                <OfficialChip person={campaign.runningMate} />
              )}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["Candidate photo", campaign.candidateImageUrl],
                ...(mateRelevant
                  ? ([["Running mate photo", campaign.runningMateImageUrl]] as const)
                  : []),
              ] as const
            ).map(([label, url]) => (
              <div key={label} className="space-y-1.5">
                <Label>{label}</Label>
                <Input
                  readOnly
                  value={url ?? ""}
                  placeholder="No photo yet"
                  className="font-mono text-xs text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  Read-only — upload on the Artwork tab.
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>The copy</CardTitle>
          <CardDescription>
            What the public ticket page shows under the poster.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor={`${fieldId}-vision`}>Vision line</Label>
              <Counter value={form.visionLine} max={MAX.visionLine} />
            </div>
            <Textarea
              id={`${fieldId}-vision`}
              rows={3}
              placeholder="The one-line promise the ticket runs on."
              value={form.visionLine}
              maxLength={MAX.visionLine}
              disabled={disabled}
              onChange={(e) => set("visionLine", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor={`${fieldId}-quote`}>Pull quote</Label>
              <Counter value={form.pullQuote} max={MAX.pullQuote} />
            </div>
            <Textarea
              id={`${fieldId}-quote`}
              rows={2}
              value={form.pullQuote}
              maxLength={MAX.pullQuote}
              disabled={disabled}
              onChange={(e) => set("pullQuote", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ColourField
              id={`${fieldId}-quotebg`}
              label="Pull-quote background"
              hint="Behind the quote block."
              value={form.pullQuoteBg}
              error={problems.pullQuoteBg}
              disabled={disabled}
              onChange={(v) => set("pullQuoteBg", v)}
            />
            <ColourField
              id={`${fieldId}-brand`}
              label="Brand colour"
              hint="The ticket's accent across cards and posters."
              value={form.brandColor}
              error={problems.brandColor}
              disabled={disabled}
              onChange={(v) => set("brandColor", v)}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor={`${fieldId}-bio`}>Candidate bio</Label>
              <Counter value={form.candidateBio} max={MAX.candidateBio} />
            </div>
            <Textarea
              id={`${fieldId}-bio`}
              rows={8}
              value={form.candidateBio}
              maxLength={MAX.candidateBio}
              disabled={disabled}
              onChange={(e) => set("candidateBio", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor={`${fieldId}-fineprint`}>Fineprint</Label>
              <Counter value={form.fineprint} max={MAX.fineprint} />
            </div>
            <Textarea
              id={`${fieldId}-fineprint`}
              rows={2}
              placeholder="Disclaimers shown in small type under the ticket."
              value={form.fineprint}
              maxLength={MAX.fineprint}
              disabled={disabled}
              onChange={(e) => set("fineprint", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sourcing</CardTitle>
          <CardDescription>
            How sure we are, and where it came from. Public visibility needs
            confidence above low.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${fieldId}-confidence`}>Confidence</Label>
              <Select
                value={form.confidence}
                disabled={disabled}
                onValueChange={(v) => set("confidence", v as Confidence)}
              >
                <SelectTrigger id={`${fieldId}-confidence`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low — hidden from the public</SelectItem>
                </SelectContent>
              </Select>
              {lowersConfidence ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Dropping a public ticket to low hides it —{" "}
                  {canReview
                    ? "you hold campaigns.review, so the API will allow it."
                    : "the API needs campaigns.review for this and will refuse."}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor={`${fieldId}-faction`}>Faction label</Label>
                <Counter value={form.factionLabel} max={MAX.factionLabel} />
              </div>
              <Input
                id={`${fieldId}-faction`}
                placeholder="e.g. Wike faction"
                value={form.factionLabel}
                maxLength={MAX.factionLabel}
                disabled={disabled}
                onChange={(e) => set("factionLabel", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Part of the race key — two rival slates from one party need
                different labels to both go public.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor={`${fieldId}-source`}>Source URL</Label>
              <Counter value={form.sourceUrl} max={MAX.sourceUrl} />
            </div>
            <Input
              id={`${fieldId}-source`}
              placeholder="https://…"
              value={form.sourceUrl}
              maxLength={MAX.sourceUrl}
              disabled={disabled}
              aria-invalid={problems.sourceUrl ? true : undefined}
              aria-describedby={problems.sourceUrl ? sourceMessageId : undefined}
              onChange={(e) => set("sourceUrl", e.target.value)}
            />
            {problems.sourceUrl ? (
              <p id={sourceMessageId} className="text-xs text-destructive">
                {problems.sourceUrl}
              </p>
            ) : form.sourceUrl.trim() ? (
              <a
                href={form.sourceUrl.trim()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2"
              >
                Open source <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
            <div>
              <Label htmlFor={`${fieldId}-disputed`}>Disputed</Label>
              <p className="text-xs text-muted-foreground">
                Sources disagree about this ticket — shown as a caveat on the
                public page.
              </p>
            </div>
            <Switch
              id={`${fieldId}-disputed`}
              checked={form.isDisputed}
              disabled={disabled}
              onCheckedChange={(v) => set("isDisputed", v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Slug</CardTitle>
          <CardDescription>
            {isDraft
              ? "The ticket's public URL. It is fixed once the ticket leaves draft."
              : "Fixed — the slug can only change while the ticket is a draft."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <div className="min-w-[260px] flex-1 space-y-1.5">
            <Label htmlFor={`${fieldId}-slug`}>Slug</Label>
            <Input
              id={`${fieldId}-slug`}
              className="font-mono"
              value={slug}
              maxLength={SLUG_MAX}
              disabled={!canWrite || !isDraft || slugSaving}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
          {canWrite && isDraft ? (
            <Button
              variant="outline"
              disabled={!slugDirty || slugSaving}
              onClick={() => void saveSlug()}
            >
              {slugSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Save slug
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {/* The save bar sticks to the bottom: the form is taller than a screen and
          an operator must never have to hunt for Save. */}
      {canWrite ? (
        <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-background/95 px-1 py-3 backdrop-blur">
          <span role="status" aria-live="polite" className="mr-auto text-sm text-muted-foreground">
            {blocked
              ? "Fix the highlighted fields."
              : dirty
                ? `${changeCount} unsaved change${changeCount === 1 ? "" : "s"}${
                    isDraft ? "" : " — a reason is required off draft"
                  }`
                : slugDirty
                  ? "Unsaved slug — use Save slug."
                  : "No unsaved changes."}
          </span>
          <Button
            variant="ghost"
            disabled={(!dirty && !slugDirty) || saving}
            onClick={discard}
          >
            <Undo2 className="mr-1 h-4 w-4" />
            Discard
          </Button>
          <Button disabled={!dirty || blocked || saving} onClick={onSaveClick}>
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </div>
      ) : null}

      <ReasonDialog
        open={reasonOpen}
        onOpenChange={setReasonOpen}
        title="Why this edit?"
        description={`This ticket is ${campaign.status}, so the API records a reason with the change — and the edit sends it back for review.`}
        confirmLabel="Save changes"
        onConfirm={(reason) => save(reason)}
      />
    </div>
  );
}
