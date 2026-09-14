"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import {
  GENERIC_CANDIDATE_BOX,
  GENERIC_MATE_BOX,
  GENERIC_CHIP,
  POSTER_H,
  POSTER_W,
  type PosterArtDraft,
  type PosterBox,
} from "@/lib/poster-art";

/**
 * Dashboard replica of the awanaija homepage poster, so operators see what the
 * public site will render BEFORE publishing. Deliberate copy of
 * apps/awanaija/src/components/civic/CandidateTicket.tsx (the source of
 * truth): same 404×695 canvas, same paint order, same generic fallback
 * geometry. If the awanaija poster changes, this must follow. Fonts differ
 * slightly (dashboard has no display serif; the poster is sans anyway).
 *
 * `draft = null` renders the GENERIC layout — exactly what awanaija shows for
 * a ticket without authored geometry.
 */
export type DragTarget = "candidate" | "mate" | "chip";

export function PosterPreview({
  width,
  brandColor,
  candidateName,
  candidateShortName,
  mateName,
  candidateSrc,
  mateSrc,
  logoSrc,
  draft,
  onMove,
  className,
}: {
  /** Painted width in px; height follows the 404:695 ratio. */
  readonly width: number;
  readonly brandColor: string | null;
  readonly candidateName: string;
  readonly candidateShortName?: string | null;
  readonly mateName?: string | null;
  readonly candidateSrc: string | null;
  readonly mateSrc: string | null;
  readonly logoSrc: string | null;
  readonly draft: PosterArtDraft | null;
  /** Present = boxes are draggable; deltas arrive in poster coordinates. */
  readonly onMove?: (target: DragTarget, dx: number, dy: number) => void;
  readonly className?: string;
}) {
  const scale = width / POSTER_W;
  const drag = useRef<{ target: DragTarget; lastX: number; lastY: number } | null>(null);

  const candidateBox = draft?.candidate ?? GENERIC_CANDIDATE_BOX;
  const mateBox = draft ? draft.mate : GENERIC_MATE_BOX;
  const chip = draft?.chip ?? GENERIC_CHIP;
  const radius = `${chip.radius.tl}px ${chip.radius.tr}px ${chip.radius.br}px ${chip.radius.bl}px`;

  function startDrag(target: DragTarget) {
    return (e: React.PointerEvent<HTMLElement>) => {
      if (!onMove) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { target, lastX: e.clientX, lastY: e.clientY };
    };
  }
  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    if (!drag.current || !onMove) return;
    const dx = (e.clientX - drag.current.lastX) / scale;
    const dy = (e.clientY - drag.current.lastY) / scale;
    drag.current.lastX = e.clientX;
    drag.current.lastY = e.clientY;
    onMove(drag.current.target, dx, dy);
  }
  function endDrag() {
    drag.current = null;
  }

  const draggable = onMove
    ? "cursor-move outline-dashed outline-1 outline-white/40 hover:outline-emerald-400"
    : "";

  return (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-[12px]", className)}
      style={{
        width,
        height: Math.round((width * POSTER_H) / POSTER_W),
        backgroundColor: brandColor ?? "#94a3b8",
      }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: POSTER_W, height: POSTER_H, transform: `scale(${scale})` }}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* Raised-hands motif, same placement as the public poster. */}
        <div className="pointer-events-none absolute left-[-124.87px] top-[-343.96px] flex h-[850.5px] w-[919.7px] items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/poster/ticket-hands.svg"
            alt=""
            aria-hidden
            className="h-[592.57px] w-[737.35px] max-w-none rotate-[25.25deg]"
          />
        </div>

        {/* Mate under candidate — same paint order as ArtworkPhotos. The
            public renderer letterboxes authored boxes (object-contain) but
            crops in generic mode (object-cover object-top) — mirror both. */}
        {mateBox && mateSrc ? (
          <PhotoBox
            src={mateSrc}
            alt={mateName ?? ""}
            box={mateBox}
            fit={draft ? "contain" : "cover"}
            className={draggable}
            onPointerDown={onMove ? startDrag("mate") : undefined}
          />
        ) : null}
        {candidateSrc ? (
          <PhotoBox
            src={candidateSrc}
            alt={candidateName}
            box={candidateBox}
            fit={draft ? "contain" : "cover"}
            className={draggable}
            onPointerDown={onMove ? startDrag("candidate") : undefined}
          />
        ) : null}

        {draft?.scrim ? (
          <span
            aria-hidden
            className="pointer-events-none absolute blur-[46.7px]"
            style={{
              left: draft.scrim.x,
              top: draft.scrim.y,
              width: draft.scrim.w,
              height: draft.scrim.h,
              opacity: draft.scrim.opacity ?? 1,
              background:
                draft.scrim.color ??
                "linear-gradient(-3.37deg, rgb(19,19,19) 71.7%, rgba(121,121,121,0) 116.9%)",
            }}
          />
        ) : null}

        <p className="pointer-events-none absolute left-[41px] top-[40px] w-[250px] font-sans text-white">
          <span className="text-[49px] font-bold leading-[55px]">
            {candidateShortName ?? surnameOf(candidateName)}
          </span>
          {mateName ? (
            <span className="text-[32px] font-medium leading-[38px]">
              {" & "}
              {surnameOf(mateName)}
            </span>
          ) : null}
        </p>

        {logoSrc ? (
          <span
            className={cn("absolute z-20 overflow-hidden", draggable)}
            style={{
              left: chip.x,
              top: chip.y,
              width: chip.w,
              height: chip.h,
              borderRadius: radius,
              touchAction: "none",
            }}
            onPointerDown={onMove ? startDrag("chip") : undefined}
          >
            {chip.plaque ? (
              <span className="absolute inset-0 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoSrc}
                  alt=""
                  className="pointer-events-none absolute object-contain"
                  style={{
                    left: chip.plaque.inset.x,
                    top: chip.plaque.inset.y,
                    width: chip.plaque.inset.size,
                    height: chip.plaque.inset.size,
                  }}
                />
              </span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoSrc}
                alt=""
                className="pointer-events-none h-full w-full object-cover"
              />
            )}
          </span>
        ) : null}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/poster/long_logo_dark.svg"
          alt="OurNigeria"
          className="pointer-events-none absolute left-[20px] top-[636px] h-[28px] w-[101px]"
        />
        <span
          className="pointer-events-none absolute left-[20px] top-[664px] font-sans text-[12.5px] leading-[12px]"
          style={{ color: draft?.urlColor.trim() || "#ffffff" }}
        >
          www.ournigeria.ng
        </span>
      </div>
    </div>
  );
}

function PhotoBox({
  src,
  alt,
  box,
  fit,
  className,
  onPointerDown,
}: {
  readonly src: string;
  readonly alt: string;
  readonly box: PosterBox;
  readonly fit: "contain" | "cover";
  readonly className?: string;
  readonly onPointerDown?: (e: React.PointerEvent<HTMLElement>) => void;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={cn(
        "absolute max-w-none",
        fit === "contain" ? "object-contain" : "object-cover object-top",
        className,
      )}
      style={{ left: box.x, top: box.y, width: box.w, height: box.h, touchAction: "none" }}
      onPointerDown={onPointerDown}
    />
  );
}

/** Same rule as the public renderer: the last whitespace-delimited token. */
function surnameOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? "";
}
