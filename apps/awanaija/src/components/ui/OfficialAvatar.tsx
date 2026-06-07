"use client";

import { useState } from "react";
import { SmartImage } from "./SmartImage";

type OfficialAvatarProps = {
  src?: string | null;
  alt: string;
  /** Shown when there's no image or it fails to load (e.g. the official's initial). */
  initial: string;
  px: number;
  imgClassName?: string;
  initialClassName?: string;
};

/**
 * Renders an official's optimized photo, or their initial as a fallback when
 * the image is missing or fails to load. Replaces the old raw-<img> +
 * sibling-DOM-toggle pattern (which can't work with next/image's onError).
 */
export function OfficialAvatar({
  src,
  alt,
  initial,
  px,
  imgClassName,
  initialClassName,
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

  return <span className={initialClassName}>{initial}</span>;
}
