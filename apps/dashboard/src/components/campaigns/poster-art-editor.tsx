"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PosterPreview, type DragTarget } from "@/components/campaigns/poster-preview";
import type { CampaignDetail, Media } from "@/lib/campaigns";
import {
  GENERIC_CANDIDATE_BOX,
  GENERIC_CHIP,
  GENERIC_MATE_BOX,
  candidateMetadataOf,
  draftFromMetadata,
  draftProblem,
  hasAuthoredLayout,
  mateMetadataOf,
  type PosterArtDraft,
  type PosterBox,
} from "@/lib/poster-art";
import { toastActionError } from "@/lib/hooks/use-session-reason";
import { cn } from "@/lib/utils";

/**
 * Author the poster geometry and watch the exact public render update live —
 * no publish-to-see loop. Saving PATCHes `metadata` on the poster rows
 * (candidate: box+chip+urlColor(+preserved scrim); mate: box only), which the
 * API validates with posterArtSchema. Legacy string radii from seeded tickets
 * are converted to numbers on load, so old rows round-trip cleanly.
 */
export function PosterArtEditor({
  campaign,
  poster,
  matePoster,
  logo,
  disabled,
  onSave,
}: {
  readonly campaign: CampaignDetail;
  readonly poster: Media | null;
  readonly matePoster: Media | null;
  readonly logo: Media | null;
  readonly disabled: boolean;
  /** PATCHes the two rows (artwork-tab owns the session reason). */
  readonly onSave: (
    candidateMetadata: Record<string, unknown>,
    mateMetadata: Record<string, unknown> | null,
  ) => Promise<void>;
}) {
  const hasMate = Boolean(matePoster) || Boolean(campaign.runningMateName);

  const stored = useMemo(
    () => draftFromMetadata(poster?.metadata, matePoster?.metadata, hasMate),
    [poster?.metadata, matePoster?.metadata, hasMate],
  );
  const [draft, setDraft] = useState<PosterArtDraft>(stored);
  const [saving, setSaving] = useState(false);
  // Re-seed when the rows change under us (our save, a revert, a replace).
  useEffect(() => setDraft(stored), [stored]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(stored);
  const problem = draftProblem(draft);
  const authored = hasAuthoredLayout(poster?.metadata);

  function patch(fn: (d: PosterArtDraft) => PosterArtDraft) {
    setDraft((d) => fn(structuredClone(d)));
  }
  const round = (n: number) => Math.round(n * 10) / 10;

  function onMove(target: DragTarget, dx: number, dy: number) {
    if (disabled || saving) return;
    patch((d) => {
      const box = target === "candidate" ? d.candidate : target === "mate" ? d.mate : d.chip;
      if (box) {
        box.x = round(box.x + dx);
        box.y = round(box.y + dy);
      }
      return d;
    });
  }

  async function save() {
    if (!poster || !dirty || problem || saving) return;
    setSaving(true);
    try {
      await onSave(candidateMetadataOf(draft), matePoster ? mateMetadataOf(draft) : null);
    } catch (err) {
      toastActionError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(260px,340px)_1fr]">
      <div className="space-y-3">
        <PosterPreview
          width={320}
          brandColor={campaign.brandColor}
          candidateName={campaign.candidateName}
          candidateShortName={campaign.candidateShortName}
          mateName={campaign.runningMateName}
          candidateSrc={poster?.url ?? null}
          mateSrc={matePoster?.url ?? null}
          logoSrc={logo?.url ?? null}
          draft={draft}
          onMove={disabled || saving ? undefined : onMove}
          className="border border-border"
        />
        <p className="text-xs text-muted-foreground">
          Live preview of the public homepage poster (404×695 canvas). Drag the
          cut-outs and the logo chip to move them; sizes are set in the fields.
          The background is the ticket&apos;s brand colour from the Ticket tab.
        </p>
        {!authored ? (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs">
            No saved geometry yet — the public site currently renders this
            ticket with the generic fallback layout. Save here to switch it to
            the layout above.
          </p>
        ) : null}
      </div>

      <div className="space-y-5">
        {!poster ? (
          <p className="text-sm text-muted-foreground">
            Upload the candidate cut-out first — geometry is stored on that
            image&apos;s row.
          </p>
        ) : null}

        <BoxFields
          legend="Candidate cut-out"
          box={draft.candidate}
          disabled={disabled || saving || !poster}
          onChange={(b) => patch((d) => ({ ...d, candidate: b }))}
        />
        {hasMate ? (
          <BoxFields
            legend="Running-mate cut-out"
            box={draft.mate ?? GENERIC_MATE_BOX}
            disabled={disabled || saving || !matePoster}
            note={!matePoster ? "Upload the running-mate cut-out to position it." : undefined}
            onChange={(b) => patch((d) => ({ ...d, mate: b }))}
          />
        ) : null}
        <BoxFields
          legend="Party logo chip"
          box={draft.chip}
          disabled={disabled || saving || !poster}
          onChange={(b) => patch((d) => ({ ...d, chip: { ...d.chip, ...b } }))}
        />

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Chip corners (px)</legend>
          <div className="grid grid-cols-4 gap-2">
            {(["tl", "tr", "br", "bl"] as const).map((corner) => (
              <NumberField
                key={corner}
                label={corner.toUpperCase()}
                value={draft.chip.radius[corner]}
                disabled={disabled || saving || !poster}
                onChange={(v) =>
                  patch((d) => {
                    d.chip.radius[corner] = v;
                    return d;
                  })
                }
              />
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="poster-url-colour">URL line colour</Label>
            <div className="flex items-center gap-2">
              <Input
                id="poster-url-colour"
                className="w-32"
                value={draft.urlColor}
                placeholder="#ffffff"
                disabled={disabled || saving || !poster}
                onChange={(e) => patch((d) => ({ ...d, urlColor: e.target.value }))}
              />
              <span
                aria-hidden
                className="h-5 w-5 rounded border border-border"
                style={{ backgroundColor: draft.urlColor.trim() || "#ffffff" }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <Checkbox
              id="poster-plaque"
              checked={Boolean(draft.chip.plaque)}
              disabled={disabled || saving || !poster}
              onCheckedChange={(checked) =>
                patch((d) => {
                  d.chip.plaque = checked
                    ? { inset: { x: 10, y: 10, size: Math.min(d.chip.w, d.chip.h) - 20 } }
                    : undefined;
                  return d;
                })
              }
            />
            <Label htmlFor="poster-plaque">White plaque behind the logo</Label>
          </div>
        </div>

        {draft.chip.plaque ? (
          <div className="grid grid-cols-3 gap-2">
            <NumberField
              label="Inset X"
              value={draft.chip.plaque.inset.x}
              disabled={disabled || saving}
              onChange={(v) =>
                patch((d) => {
                  if (d.chip.plaque) d.chip.plaque.inset.x = v;
                  return d;
                })
              }
            />
            <NumberField
              label="Inset Y"
              value={draft.chip.plaque.inset.y}
              disabled={disabled || saving}
              onChange={(v) =>
                patch((d) => {
                  if (d.chip.plaque) d.chip.plaque.inset.y = v;
                  return d;
                })
              }
            />
            <NumberField
              label="Logo size"
              value={draft.chip.plaque.inset.size}
              disabled={disabled || saving}
              onChange={(v) =>
                patch((d) => {
                  if (d.chip.plaque) d.chip.plaque.inset.size = v;
                  return d;
                })
              }
            />
          </div>
        ) : null}

        {draft.scrim ? (
          <p className="text-xs text-muted-foreground">
            This poster carries a scrim (blurred wash behind the chip); it is
            kept as stored and shown in the preview.
          </p>
        ) : null}

        {problem ? <p className="text-xs text-destructive">{problem}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={disabled || saving || !poster || !dirty || Boolean(problem)}
            onClick={() => void save()}
          >
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            Save geometry
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled || saving || !dirty}
            onClick={() => setDraft(stored)}
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            Reset to saved
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled || saving || !poster}
            onClick={() =>
              patch((d) => ({
                ...d,
                candidate: { ...GENERIC_CANDIDATE_BOX },
                mate: d.mate ? { ...GENERIC_MATE_BOX } : null,
                chip: { ...GENERIC_CHIP, radius: { ...GENERIC_CHIP.radius } },
              }))
            }
          >
            <Wand2 className="mr-1 h-4 w-4" />
            Start from generic layout
          </Button>
          {dirty ? (
            <span className="self-center text-xs text-muted-foreground">Unsaved changes</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BoxFields({
  legend,
  box,
  disabled,
  note,
  onChange,
}: {
  readonly legend: string;
  readonly box: PosterBox;
  readonly disabled: boolean;
  readonly note?: string;
  readonly onChange: (box: PosterBox) => void;
}) {
  return (
    <fieldset className={cn("space-y-2", disabled && "opacity-70")}>
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="grid grid-cols-4 gap-2">
        <NumberField label="X" value={box.x} disabled={disabled} onChange={(x) => onChange({ ...box, x })} />
        <NumberField label="Y" value={box.y} disabled={disabled} onChange={(y) => onChange({ ...box, y })} />
        <NumberField label="W" value={box.w} disabled={disabled} onChange={(w) => onChange({ ...box, w })} />
        <NumberField label="H" value={box.h} disabled={disabled} onChange={(h) => onChange({ ...box, h })} />
      </div>
      {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
    </fieldset>
  );
}

function NumberField({
  label,
  value,
  disabled,
  onChange,
}: {
  readonly label: string;
  readonly value: number;
  readonly disabled: boolean;
  readonly onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        step="1"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
      />
    </div>
  );
}
