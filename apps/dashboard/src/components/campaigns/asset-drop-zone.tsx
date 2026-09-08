"use client";

import { useId, useRef, useState } from "react";
import { AlertTriangle, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  IMAGE_ACCEPT,
  PDF_ACCEPT,
  fileProblem,
  shortEdgeWarning,
} from "@/lib/campaign-assets";
import { cn } from "@/lib/utils";

/**
 * Pixel size of an image file, or null when the browser cannot tell us.
 * `createImageBitmap` is the cheap read (no DOM node, no object URL to revoke)
 * but is absent in older Safari and in any non-browser runtime the component
 * might be rendered in, and it throws on a file the decoder rejects — either
 * way the upload proceeds, we simply skip the resolution warning.
 */
async function imageSize(file: File): Promise<{ width: number; height: number } | null> {
  const create = (globalThis as { createImageBitmap?: typeof createImageBitmap })
    .createImageBitmap;
  if (typeof create !== "function") return null;
  try {
    const bitmap = await create(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close?.();
    return size;
  } catch {
    return null;
  }
}

export interface AssetDropZoneProps {
  kind: "image" | "pdf";
  /** `accept` for the file input; defaults to the kind's server-accepted types. */
  accept?: string;
  /** Called with a file that already passed the type and size checks. */
  onFile: (file: File) => void;
  /** 0…1 while bytes are moving, null otherwise — drives the progress bar. */
  progress: number | null;
  /** The parent's last upload failure; shown with a Retry when `onRetry` is set. */
  error?: string | null;
  onRetry?: () => void;
  disabled?: boolean;
  /** One line under the button: what belongs here. */
  hint?: string;
  /** Button text — say which slot, so a screen reader hears more than "Choose". */
  label?: string;
  /** Denser layout for zones that sit inside a card next to a preview. */
  compact?: boolean;
}

/**
 * Drag-and-drop (or click) target for one asset. It does the same type and
 * size checks the API does before a byte leaves the machine, warns about a
 * low-resolution image without blocking it, and shows the parent's upload
 * progress and last error.
 */
export function AssetDropZone({
  kind,
  accept,
  onFile,
  progress,
  error,
  onRetry,
  disabled,
  hint,
  label,
  compact,
}: AssetDropZoneProps) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const warningId = `${inputId}-warning`;
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  // Only the newest pick may set a warning: dimension reads settle out of order.
  const pick = useRef(0);
  // dragenter/dragleave fire for every child element; count them or the border
  // flickers as the pointer crosses the label.
  const depth = useRef(0);

  function take(file: File | undefined | null) {
    if (!file || disabled) return;
    const token = ++pick.current;
    const problem = fileProblem(file, kind);
    setWarning(null);
    if (problem) {
      setRejected(problem);
      return;
    }
    setRejected(null);
    if (kind === "image") {
      void imageSize(file).then((size) => {
        if (!size || pick.current !== token) return;
        setWarning(shortEdgeWarning(size.width, size.height));
      });
    }
    onFile(file);
  }

  const shown = rejected ?? error ?? null;
  const busy = progress !== null;
  const percent = Math.round((progress ?? 0) * 100);
  // Only ids that are actually rendered: an aria-describedby pointing at a
  // missing node is silently dropped by some screen readers and read as empty
  // by others.
  const describedBy =
    [hintId, shown ? errorId : null, warning ? warningId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        depth.current += 1;
        if (!disabled) setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setDragging(false);
        // One file per zone: every zone here fills exactly one slot, so a
        // multi-file drop takes the first and the hint says so.
        take(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        "rounded-lg border border-dashed border-border bg-muted/20 text-center transition-colors",
        compact ? "p-3" : "p-5",
        dragging && !disabled && "border-primary bg-primary/5",
        disabled && "opacity-60",
      )}
    >
      <input
        ref={input}
        id={inputId}
        type="file"
        className="hidden"
        accept={accept ?? (kind === "image" ? IMAGE_ACCEPT : PDF_ACCEPT)}
        disabled={disabled}
        onChange={(e) => {
          take(e.target.files?.[0]);
          // Reset so picking the SAME file again still fires a change event
          // (the obvious move after a failed upload).
          e.target.value = "";
        }}
      />
      <div className="flex flex-col items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || busy}
          aria-describedby={describedBy}
          onClick={() => input.current?.click()}
        >
          <Upload className="mr-1 h-4 w-4" />
          {label ?? (kind === "image" ? "Choose image" : "Choose PDF")}
        </Button>
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint ? `${hint} ` : ""}
          <span className="whitespace-nowrap">or drop a file here</span>
        </p>
      </div>

      {busy ? (
        <div className="mt-3 space-y-1">
          {/* Progress renders a real progressbar with aria-valuenow, so the
              percentage below is decoration — announcing it again on every
              frame would flood a screen reader. */}
          <Progress value={percent} aria-label="Upload progress" />
          <p className="text-xs text-muted-foreground">Uploading… {percent}%</p>
        </div>
      ) : null}

      {shown ? (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <p id={errorId} role="alert" className="text-xs text-destructive">
            {shown}
          </p>
          {/* Retry replays the parent's attempt; a file we refused outright has
              nothing to replay, so the button only shows for a real failure. */}
          {onRetry && !rejected ? (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}

      {warning ? (
        <p
          id={warningId}
          className="mt-3 flex items-start justify-center gap-1.5 text-left text-xs text-amber-600 dark:text-amber-400"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {warning}
        </p>
      ) : null}
    </div>
  );
}
