/**
 * Avatar (small) variant URL for a stored image.
 *
 * The API's ImageStorageService writes two webp variants per image and persists
 * the `-600` URL in `image_url`; the `-128` avatar is the same S3/CDN key with
 * the size suffix swapped. Any URL that isn't one of our `-600.webp` variants
 * (legacy single-size S3, external host, local /public path) is returned
 * unchanged — so this is safe to call everywhere, including before the image
 * backfill has run.
 */
export function cdnAvatar(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.replace(/-600\.webp((?:\?|#).*)?$/, "-128.webp$1");
}
