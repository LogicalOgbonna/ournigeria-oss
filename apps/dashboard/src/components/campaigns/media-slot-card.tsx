"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { ExternalLink, ImageOff, Loader2, Trash2 } from "lucide-react";
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
import { AssetDropZone } from "@/components/campaigns/asset-drop-zone";
import { CAPTION_MAX, MIN_IMAGE_SHORT_EDGE, SOURCE_URL_MAX } from "@/lib/campaign-assets";
import { isHttpUrl } from "@/lib/campaign-form";
import { MEDIA_TYPE_LABEL, type Media, type MediaType } from "@/lib/campaigns";
import { useAssetUpload, type UploadRun } from "@/lib/hooks/use-asset-upload";
import { toastActionError } from "@/lib/hooks/use-session-reason";
import { cn } from "@/lib/utils";

/** How the public page frames this slot — drives the preview box and the hint. */
export type SlotShape = "portrait" | "square" | "wide" | "free";

const SHAPE: Record<SlotShape, { box: string; hint: string }> = {
  portrait: { box: "aspect-[3/4]", hint: "Portrait, about 3:4 (1200×1600)" },
  square: { box: "aspect-square", hint: "Square (1000×1000)" },
  wide: { box: "aspect-[16/6]", hint: "Wide banner, about 16:6" },
  free: {
    box: "aspect-[4/3]",
    // Same threshold `shortEdgeWarning` warns below, so the hint and the
    // warning can never quote different numbers.
    hint: `Any shape; ${MIN_IMAGE_SHORT_EDGE} px on the short edge or more`,
  },
};

export interface MediaSlotCardProps {
  type: MediaType;
  /** The row currently in this slot, or null for an empty one. */
  media: Media | null;
  shape: SlotShape;
  /** Overrides the `MEDIA_TYPE_LABEL` heading (appended rows number themselves). */
  title?: string;
  /** Extra copy under the heading — e.g. the poster-geometry note. */
  note?: ReactNode;
  disabled?: boolean;
  /**
   * presign → PUT → commit for a file dropped here. OMIT IT to hide the drop
   * zone entirely: `commitMedia` REPLACES a slot row but APPENDS a new row for
   * banners and gallery photos, so a "Replace image" button on an appended
   * card would quietly add a second one instead. Those cards are edit-only and
   * new rows are added from the section's own zone.
   */
  onUpload?: UploadRun;
  /** PATCH the caption/source of the row already in the slot. */
  onSave: (
    media: Media,
    body: { caption: string | null; sourceUrl: string | null },
  ) => Promise<unknown>;
  onRemove: (media: Media) => void;
  /** Buttons rendered beside Remove (appended rows put their up/down here). */
  actions?: ReactNode;
}

/**
 * One artwork slot: what is stored, its caption and source, and the drop zone
 * that replaces it. Metadata (poster geometry) is deliberately not editable
 * here — the geometry editor is its own release and an imported `metadata`
 * blob must survive a caption edit untouched, which it does because `PATCH`
 * only sends the keys below.
 */
export function MediaSlotCard({
  type,
  media,
  shape,
  title,
  note,
  disabled,
  onUpload,
  onSave,
  onRemove,
  actions,
}: MediaSlotCardProps) {
  const fieldId = useId();
  const upload = useAssetUpload();
  const [caption, setCaption] = useState(media?.caption ?? "");
  const [sourceUrl, setSourceUrl] = useState(media?.sourceUrl ?? "");
  const [saving, setSaving] = useState(false);

  // Re-seed when the ROW changed underneath us (our own save, someone else's
  // edit, a revert). Values the operator is mid-typing are untouched, because
  // an unchanged server value leaves these deps alone.
  const serverCaption = media?.caption ?? "";
  const serverSource = media?.sourceUrl ?? "";
  useEffect(() => {
    setCaption(serverCaption);
    setSourceUrl(serverSource);
  }, [media?.id, serverCaption, serverSource]);

  const urlProblem =
    sourceUrl.trim() && !isHttpUrl(sourceUrl.trim())
      ? "Enter a full http(s):// URL."
      : null;
  const dirty =
    Boolean(media) && (caption !== serverCaption || sourceUrl !== serverSource);

  async function save() {
    if (!media || !dirty || urlProblem || saving) return;
    setSaving(true);
    try {
      await onSave(media, {
        caption: caption.trim() || null,
        sourceUrl: sourceUrl.trim() || null,
      });
    } catch (err) {
      toastActionError(err);
    } finally {
      setSaving(false);
    }
  }

  const frame = SHAPE[shape];
  const sourceMessageId = `${fieldId}-source-message`;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">{title ?? MEDIA_TYPE_LABEL[type]}</CardTitle>
        <CardDescription>{frame.hint}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-md border border-border bg-muted/30",
            frame.box,
          )}
        >
          {media ? (
            // alt="" — the card heading right above it is the accessible label.
            <img
              src={media.url}
              alt=""
              loading="lazy"
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
              <ImageOff className="h-5 w-5" aria-hidden />
              <span className="text-xs">Nothing here yet</span>
              <span className="px-4 text-center text-xs">{frame.hint}</span>
            </div>
          )}
        </div>

        {onUpload ? (
          <AssetDropZone
            kind="image"
            compact
            disabled={disabled || upload.busy || saving}
            progress={upload.progress}
            error={upload.error}
            onRetry={upload.retry}
            label={media ? "Replace image" : "Upload image"}
            onFile={(file) => void upload.start(file, onUpload)}
          />
        ) : null}

        {media ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor={`${fieldId}-caption`}>Caption</Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {caption.length}/{CAPTION_MAX}
                </span>
              </div>
              <Input
                id={`${fieldId}-caption`}
                value={caption}
                maxLength={CAPTION_MAX}
                disabled={disabled || saving}
                placeholder="Optional — shown under the image"
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`${fieldId}-source`}>Source URL</Label>
              <Input
                id={`${fieldId}-source`}
                value={sourceUrl}
                maxLength={SOURCE_URL_MAX}
                disabled={disabled || saving}
                placeholder="https://…"
                aria-invalid={urlProblem ? true : undefined}
                aria-describedby={sourceMessageId}
                onChange={(e) => setSourceUrl(e.target.value)}
              />
              {urlProblem ? (
                <p id={sourceMessageId} className="text-xs text-destructive">
                  {urlProblem}
                </p>
              ) : (
                <p id={sourceMessageId} className="text-xs">
                  <a
                    href={media.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
                  >
                    Open stored image <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                disabled={disabled || !dirty || Boolean(urlProblem) || saving}
                onClick={() => void save()}
              >
                {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={disabled}
                onClick={() => onRemove(media)}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Remove
              </Button>
              {actions}
            </div>
          </div>
        ) : null}

        {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
      </CardContent>
    </Card>
  );
}
