"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssetDropZone } from "@/components/campaigns/asset-drop-zone";
import { MediaSlotCard, type SlotShape } from "@/components/campaigns/media-slot-card";
import { PosterArtEditor } from "@/components/campaigns/poster-art-editor";
import { ReadOnlyNotice } from "@/components/campaigns/read-only-notice";
import { ReasonDialog } from "@/components/campaigns/reason-dialog";
import { SessionReasonBanner } from "@/components/campaigns/session-reason-banner";
import { ConfirmDialog } from "@/components/enrichment/confirm-dialog";
import { byDisplayOrder, reorderPatches } from "@/lib/campaign-assets";
import {
  MEDIA_APPEND_TYPES,
  MEDIA_SLOT_TYPES,
  MEDIA_TYPE_HINT,
  MEDIA_TYPE_LABEL,
  campaignsApi,
  ticketHasMate,
  uploadAsset,
  type CampaignDetail,
  type Media,
  type MediaType,
} from "@/lib/campaigns";
import { useAssetUpload, type UploadRun } from "@/lib/hooks/use-asset-upload";
import { toastActionError, useSessionReason } from "@/lib/hooks/use-session-reason";
import { usePermissions } from "@/lib/permissions";

/** How the public page frames each slot — drives the preview box and its hint. */
const SHAPE: Record<MediaType, SlotShape> = {
  poster_candidate: "poster",
  poster_mate: "poster",
  card_candidate: "square",
  card_mate: "square",
  quote_photo: "free",
  bio_photo: "free",
  logo: "square",
  banner: "wide",
  photo: "free",
};

/** The two slots that only exist on a ticket that runs a pair. */
const MATE_SLOTS = new Set<MediaType>(["poster_mate", "card_mate"]);

/** The slots that feed the homepage poster section, in its display order. */
const POSTER_SLOTS: readonly MediaType[] = ["poster_candidate", "poster_mate"];

/**
 * Every image on the ticket. Seven fixed slots (a second upload REPLACES the
 * row in place, enforced by `uq_campaign_media_slot`) plus the appended
 * banners and gallery photos, which stack and are ordered by hand.
 *
 * Bytes never travel through the API body: each drop zone presigns a staging
 * PUT, sends the file straight to S3 and then commits the returned key.
 */
export function ArtworkTab({
  campaign,
  onSaved,
}: {
  campaign: CampaignDetail;
  onSaved: () => void;
}) {
  const { can } = usePermissions();
  const canWrite = can("campaigns.write");
  const isDraft = campaign.status === "draft";
  // Off draft the API refuses every commit without a reason; ask once and
  // reuse it for the rest of this tab session.
  const reason = useSessionReason(!isDraft);

  const [appendType, setAppendType] = useState<MediaType>("banner");
  const appendUpload = useAssetUpload();
  // Carries the reason granted for THIS removal until the confirmation
  // settles — re-reading the session reason later could pick up a different
  // one if the operator changed it in between.
  const [pendingRemove, setPendingRemove] = useState<{
    media: Media;
    why?: string;
  } | null>(null);
  // A ref, not the state flag: two fast clicks both read the same stale `false`
  // from state and would both sail past `await reason.askOrThrow()`.
  const movingRef = useRef(false);
  const [moving, setMoving] = useState(false);

  const bySlot = new Map<MediaType, Media>();
  for (const m of campaign.media)
    if ((MEDIA_SLOT_TYPES as readonly string[]).includes(m.type)) bySlot.set(m.type, m);
  // Banners and gallery photos are two independent runs on the public page, so
  // they are numbered and reordered independently — a banner never trades
  // places with a photo.
  const appended: Record<(typeof MEDIA_APPEND_TYPES)[number], Media[]> = {
    banner: campaign.media.filter((m) => m.type === "banner").sort(byDisplayOrder),
    photo: campaign.media.filter((m) => m.type === "photo").sort(byDisplayOrder),
  };
  const appendedCount = appended.banner.length + appended.photo.length;

  // A solo race has no mate slots — unless a mate is somehow already stored (or
  // artwork for one is), in which case they stay visible so it can be corrected.
  const mateRelevant = ticketHasMate(campaign);
  const visible = (type: MediaType) =>
    mateRelevant || !MATE_SLOTS.has(type) || bySlot.has(type);
  const posterSlots = POSTER_SLOTS.filter(visible);
  const pageSlots = MEDIA_SLOT_TYPES.filter(
    (type) => !POSTER_SLOTS.includes(type) && visible(type),
  );

  /** presign → PUT → commit for one slot (or one appended row). */
  function uploadFor(type: MediaType): UploadRun {
    return async (file, onProgress, signal) => {
      let why: string | undefined;
      try {
        why = await reason.askOrThrow("Upload");
      } catch (err) {
        // Backing out of the reason dialog is a choice, not a fault: say so
        // and report "nothing committed" so the zone resets without an error.
        toastActionError(err);
        return false;
      }
      await uploadAsset({
        file,
        kind: "image",
        signal,
        onProgress,
        presign: (body) => campaignsApi.presign(campaign.id, body),
        commit: (stagingKey) =>
          campaignsApi.commitMedia(campaign.id, {
            stagingKey,
            type,
            ...(why ? { reason: why } : {}),
          }),
      });
      toast.success(`${MEDIA_TYPE_LABEL[type]} uploaded`);
      onSaved();
    };
  }

  /** Errors (and cancellations) surface through the card's own catch. */
  async function saveMedia(
    media: Media,
    body: { caption: string | null; sourceUrl: string | null },
  ) {
    const why = await reason.askOrThrow("Save");
    await campaignsApi.patchMedia(campaign.id, media.id, {
      ...body,
      ...(why ? { reason: why } : {}),
    });
    toast.success("Image details saved");
    onSaved();
  }

  /**
   * PATCH the poster rows' geometry metadata. Sequential on purpose (both
   * PATCHes re-flag a non-draft ticket for review — a parallel pair races on
   * that update). Cancelling the reason dialog throws; the editor's own catch
   * downgrades it to a warning toast.
   */
  async function saveGeometry(
    candidateMetadata: Record<string, unknown>,
    mateMetadata: Record<string, unknown> | null,
  ) {
    const posterRow = bySlot.get("poster_candidate");
    if (!posterRow) return;
    const why = await reason.askOrThrow("Save geometry");
    await campaignsApi.patchMedia(campaign.id, posterRow.id, {
      metadata: candidateMetadata,
      ...(why ? { reason: why } : {}),
    });
    const mateRow = bySlot.get("poster_mate");
    if (mateMetadata && mateRow) {
      await campaignsApi.patchMedia(campaign.id, mateRow.id, {
        metadata: mateMetadata,
        ...(why ? { reason: why } : {}),
      });
    }
    toast.success("Poster geometry saved — live on the site within moments");
    onSaved();
  }

  /**
   * The reason is asked BEFORE the confirmation opens: two stacked Radix
   * dialogs fight over the focus trap, and "why" is a fair thing to ask before
   * "are you sure".
   */
  async function requestRemove(media: Media) {
    try {
      setPendingRemove({ media, why: await reason.askOrThrow("Remove") });
    } catch (err) {
      toastActionError(err);
    }
  }

  async function removeMedia(media: Media, why?: string) {
    try {
      await campaignsApi.deleteMedia(campaign.id, media.id, why);
      toast.success("Image removed");
      onSaved();
    } catch (err) {
      toastActionError(err);
    }
  }

  /** Move one appended row within ITS OWN list (banners and photos are separate). */
  async function move(media: Media, dir: -1 | 1, list: readonly Media[]) {
    const patches = reorderPatches(list, media.id, dir);
    if (!patches.length || movingRef.current) return;
    movingRef.current = true;
    setMoving(true);
    let attempted = false;
    try {
      const why = await reason.askOrThrow("Reorder");
      // Sequential on purpose: two PATCHes on the same ticket both re-flag it
      // for review, and a parallel pair would race on that update.
      for (const patch of patches) {
        attempted = true;
        await campaignsApi.patchMedia(campaign.id, patch.id, {
          displayOrder: patch.displayOrder,
          ...(why ? { reason: why } : {}),
        });
      }
      toast.success("Order updated");
    } catch (err) {
      toastActionError(err);
    } finally {
      movingRef.current = false;
      setMoving(false);
      // A failure halfway through the loop still moved some rows — refetch so
      // the numbers on screen are the numbers in the database.
      if (attempted) onSaved();
    }
  }

  return (
    <div className="space-y-6">
      {!canWrite ? <ReadOnlyNotice subject="artwork" action="Uploading" /> : null}
      <SessionReasonBanner
        reason={reason}
        status={campaign.status}
        canWrite={canWrite}
      />

      <Card>
        <CardHeader>
          <CardTitle>Homepage poster</CardTitle>
          <CardDescription>
            The composed ticket poster shown on the homepage rail and
            /elections. Upload the cut-outs, then position them below — the
            preview is exactly what the public site renders, so there is
            nothing to publish before you can see it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {posterSlots.map((type) => (
              <MediaSlotCard
                key={type}
                type={type}
                media={bySlot.get(type) ?? null}
                shape={SHAPE[type]}
                hint={MEDIA_TYPE_HINT[type]}
                disabled={!canWrite}
                onUpload={uploadFor(type)}
                onSave={saveMedia}
                onRemove={(m) => void requestRemove(m)}
              />
            ))}
          </div>
          <PosterArtEditor
            campaign={campaign}
            poster={bySlot.get("poster_candidate") ?? null}
            matePoster={bySlot.get("poster_mate") ?? null}
            logo={bySlot.get("logo") ?? null}
            disabled={!canWrite}
            onSave={saveGeometry}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign page images</CardTitle>
          <CardDescription>
            Everything the public ticket page itself shows — cards, the
            pull-quote and bio photos, and the party logo. Each card says where
            its image appears.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pageSlots.map((type) => (
              <MediaSlotCard
                key={type}
                type={type}
                media={bySlot.get(type) ?? null}
                shape={SHAPE[type]}
                hint={MEDIA_TYPE_HINT[type]}
                disabled={!canWrite}
                onUpload={uploadFor(type)}
                onSave={saveMedia}
                onRemove={(m) => void requestRemove(m)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appended images</CardTitle>
          <CardDescription>
            Banners and gallery photos stack instead of replacing each other —
            every upload adds a row. The order here is the order the public page
            shows them in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="append-type">Add as</Label>
              <Select
                value={appendType}
                disabled={!canWrite}
                onValueChange={(v) => setAppendType(v as MediaType)}
              >
                <SelectTrigger id="append-type" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEDIA_APPEND_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {MEDIA_TYPE_LABEL[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[260px] flex-1">
              <AssetDropZone
                kind="image"
                compact
                disabled={!canWrite || appendUpload.busy}
                progress={appendUpload.progress}
                error={appendUpload.error}
                onRetry={appendUpload.retry}
                label={`Add ${MEDIA_TYPE_LABEL[appendType].toLowerCase()}`}
                hint="Each upload adds a new row — one file at a time."
                onFile={(file) => void appendUpload.start(file, uploadFor(appendType))}
              />
            </div>
          </div>

          {appendedCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              No banners or gallery photos yet.
            </p>
          ) : (
            MEDIA_APPEND_TYPES.filter((type) => appended[type].length > 0).map(
              (type) => (
                <section key={type} className="space-y-3">
                  <h3 className="text-sm font-medium">
                    {MEDIA_TYPE_LABEL[type]}s
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {appended[type].length} in order
                    </span>
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {appended[type].map((media, index) => (
                      <MediaSlotCard
                        key={media.id}
                        type={media.type}
                        media={media}
                        shape={SHAPE[media.type]}
                        hint={MEDIA_TYPE_HINT[media.type]}
                        title={`${MEDIA_TYPE_LABEL[media.type]} ${index + 1}`}
                        disabled={!canWrite}
                        // No onUpload: an appended commit APPENDS, so a
                        // "Replace" here would add a row rather than swap one.
                        // New rows come from the zone above.
                        onSave={saveMedia}
                        onRemove={(m) => void requestRemove(m)}
                        actions={
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              aria-label={`Move ${MEDIA_TYPE_LABEL[
                                media.type
                              ].toLowerCase()} ${index + 1} earlier`}
                              disabled={!canWrite || index === 0 || moving}
                              onClick={() => void move(media, -1, appended[type])}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              aria-label={`Move ${MEDIA_TYPE_LABEL[
                                media.type
                              ].toLowerCase()} ${index + 1} later`}
                              disabled={
                                !canWrite ||
                                index === appended[type].length - 1 ||
                                moving
                              }
                              onClick={() => void move(media, 1, appended[type])}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </>
                        }
                      />
                    ))}
                  </div>
                </section>
              ),
            )
          )}
        </CardContent>
      </Card>

      {/* Replacing an image KEEPS the old object so an audit revert can point
          back at it; only a reviewer's purge deletes bytes for real. */}
      <p className="text-xs text-muted-foreground">
        Replacing an image keeps the old file in storage so a revert can restore
        it. Taking a file down for real is a reviewer action — see the campaign
        assets takedown runbook.
      </p>

      <ConfirmDialog
        open={pendingRemove !== null}
        onOpenChange={(v) => {
          if (!v) setPendingRemove(null);
        }}
        title="Remove this image?"
        description={
          pendingRemove
            ? `The ${MEDIA_TYPE_LABEL[pendingRemove.media.type].toLowerCase()} row is deleted from the ticket. The stored file itself is kept until a reviewer purges it.`
            : ""
        }
        confirmLabel="Remove"
        destructive
        onConfirm={async () => {
          const pending = pendingRemove;
          setPendingRemove(null);
          if (pending) await removeMedia(pending.media, pending.why);
        }}
      />

      <ReasonDialog
        {...reason.dialogProps}
        title="Why this artwork change?"
        description={`This ticket is ${campaign.status}, so the API records a reason with every asset change — and the change sends it back for review. The reason is reused for the rest of your work on this tab.`}
        confirmLabel="Use this reason"
      />
    </div>
  );
}
