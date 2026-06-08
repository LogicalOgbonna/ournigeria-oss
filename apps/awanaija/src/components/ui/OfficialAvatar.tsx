"use client";

import { useState, type ReactNode } from "react";
import { SmartImage } from "./SmartImage";

type OfficialAvatarProps = {
  src?: string | null;
  alt: string;
  px: number;
  imgClassName?: string;
  /** Fallback when there's no image or it fails to load: the official's initial... */
  initial?: string;
  initialClassName?: string;
  /** ...or a custom node (e.g. a placeholder icon). Takes precedence over `initial`. */
  fallback?: ReactNode;
};

/**
 * Renders an official's optimized photo, or a fallback when the image is missing
 * OR fails to load at runtime (e.g. the source host — like nass.gov.ng — is down).
 * This is the only safe way to fall back for next/image, whose onError can't be
 * handled by a sibling-DOM toggle. Server components can render it directly.
 */
export function OfficialAvatar({
  src,
  alt,
  px,
  imgClassName,
  initial,
  initialClassName,
  fallback,
}: OfficialAvatarProps) {
  const [errored, setErrored] = useState(false);

  if (src && !errored) {
    return (
      <SmartImage
        src={src}
        alt={alt}
        px={px}
        className={imgClassName}
        onError={() => setErrored(true)}
      />
    );
  }

  if (fallback !== undefined) return <>{fallback}</>;
  return <span className={initialClassName}>{initial ?? "?"}</span>;
}
