import type { ChainEntry, Official, Position } from "@/lib/api";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.ournigeria.ng";
import { SITE_URL } from "@/lib/constants";
export { SITE_URL };

// Humanized role labels for titles/descriptions/JSON-LD.
const ROLE_LABELS: Record<string, string> = {
  governor: "Governor",
  deputy_governor: "Deputy Governor",
  senator: "Senator",
  representative: "Federal Representative",
  rep: "Federal Representative",
  mha: "State House of Assembly Member",
  lga_chairman: "LGA Chairman",
  councilor: "Councilor",
};

export async function getOfficial(idOrSlug: string): Promise<Official | null> {
  try {
    const res = await fetch(`${API_URL}/api/officials/${encodeURIComponent(idOrSlug)}`, {
      next: { revalidate: 120 }, // 2 min cache
    });
    if (!res.ok) return null;
    return (await res.json()) as Official;
  } catch {
    return null;
  }
}

export function roleLabel(role?: string | null): string {
  if (!role) return "Public Official";
  return ROLE_LABELS[role] ?? role.replaceAll("_", " ");
}

export function absoluteImage(imageUrl: string | null): string | undefined {
  if (!imageUrl) return undefined;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `${SITE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

// Retention Phase 1 — the other people who represent this official's area.
// One call to the by-location chain (councilor → chairman → MHA → rep →
// senator → governor); we drop the current official and unresolved slots.
// Best-effort: failure returns [] and the section simply doesn't render.
export async function getPeers(
  position: Position | undefined,
  currentOfficialId: string,
): Promise<ChainEntry[]> {
  if (!position?.stateCode) return [];
  const qs = new URLSearchParams({ state: position.stateCode });
  if (position.lgaCode) qs.set("lga", position.lgaCode);
  if (position.wardCode) qs.set("ward", position.wardCode);
  try {
    const res = await fetch(`${API_URL}/api/officials/by-location?${qs.toString()}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const { chain } = (await res.json()) as { chain: ChainEntry[] };
    return (chain || []).filter(
      (entry) => entry.official && entry.official.id !== currentOfficialId,
    );
  } catch {
    return [];
  }
}