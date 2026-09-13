"use client";

import { toast } from "sonner";
import { AssetDropZone } from "@/components/campaigns/asset-drop-zone";
import { campaignsApi, uploadAsset, type CouncilMember } from "@/lib/campaigns";
import { useAssetUpload } from "@/lib/hooks/use-asset-upload";
import { toastActionError, type SessionReason } from "@/lib/hooks/use-session-reason";

/**
 * The portrait uploader for ONE council member.
 *
 * It owns its own `useAssetUpload`, which is the whole point of it being a
 * component: a single upload state shared by the table would show one row's
 * progress bar and one row's error under whichever row happened to be open.
 * Mount it with `key={member.id}` so switching rows starts clean.
 */
export function CouncilPhotoZone({
  member,
  campaignId,
  canWrite,
  reason,
  onSaved,
}: {
  member: CouncilMember;
  campaignId: string;
  canWrite: boolean;
  reason: SessionReason;
  /** Called after the commit lands, so the tab can refetch and close the zone. */
  onSaved: () => void;
}) {
  const upload = useAssetUpload();
  const linked = Boolean(member.officialId);

  /** presign → PUT straight to S3 → commit the staging key onto the member row. */
  async function run(
    file: File,
    onProgress: (fraction: number) => void,
    signal: AbortSignal,
  ) {
    let why: string | undefined;
    try {
      why = await reason.askOrThrow("Upload");
    } catch (err) {
      // Backing out of the reason prompt is a choice, not a fault: say so and
      // report "nothing committed" so the zone resets without an error.
      toastActionError(err);
      return false;
    }
    await uploadAsset({
      file,
      kind: "image",
      signal,
      onProgress,
      presign: (body) => campaignsApi.presign(campaignId, body),
      commit: (stagingKey) =>
        campaignsApi.councilPhoto(campaignId, member.id, {
          stagingKey,
          ...(why ? { reason: why } : {}),
        }),
    });
    toast.success(`Photo saved for ${member.name}`);
    onSaved();
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Portrait for <span className="font-medium">{member.name}</span>.{" "}
        {linked
          ? "This official has no photo on their own record, so the ticket falls back to one stored here."
          : "It is uploaded straight to storage and re-served by us — a link to someone else's host is refused."}
      </p>
      <AssetDropZone
        kind="image"
        compact
        disabled={!canWrite || upload.busy}
        progress={upload.progress}
        error={upload.error}
        onRetry={upload.retry}
        label={`Choose photo for ${member.name}`}
        onFile={(file) => void upload.start(file, run)}
      />
    </div>
  );
}
