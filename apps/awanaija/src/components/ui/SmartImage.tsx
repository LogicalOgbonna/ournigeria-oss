"use client";

import Image from "next/image";

// Hosts we know next/image can optimize. MUST stay in sync with the
// `images.remotePatterns` allowlist in next.config.ts — feeding an
// unconfigured host to next/image throws at render time, so anything not
// listed here falls back to a plain (but sized + lazy) <img>.
const OPTIMIZABLE_REMOTE_HOSTS = ["nass.gov.ng"];

function isOptimizable(src: string): boolean {
  if (src.startsWith("/")) return true; // local /public asset
  try {
    const u = new URL(src);
    return u.protocol === "https:" && OPTIMIZABLE_REMOTE_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

type SmartImageProps = {
  src: string;
  alt: string;
  /** Intrinsic square size (px) to optimize/encode to — usually the rendered avatar size. */
  px: number;
  className?: string;
  onError?: () => void;
  /** Set true only for an above-the-fold LCP image; otherwise it lazy-loads. */
  priority?: boolean;
};

/**
 * Avatar/photo image that routes optimizable sources through next/image
 * (AVIF/WebP, DPR srcset, lazy by default) and degrades gracefully to a sized
 * <img> for unknown remote hosts. Replaces raw <img> tags that were shipping
 * full-resolution PNGs (e.g. a 361KB governor portrait) into tiny boxes.
 */
export function SmartImage({ src, alt, px, className, onError, priority }: SmartImageProps) {
  if (isOptimizable(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        width={px}
        height={px}
        className={className}
        onError={onError}
        priority={priority}
      />
    );
  }

  // Unknown host: don't hand it to the optimizer (would throw). Still sized + lazy.
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      width={px}
      height={px}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={className}
      onError={onError}
    />
  );
}
