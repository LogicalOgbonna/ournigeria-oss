import type { PartyDetail } from "@/lib/api";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.ournigeria.ng";
export { SITE_URL } from "@/lib/constants";

export async function getParty(acronym: string): Promise<PartyDetail | null> {
  try {
    const res = await fetch(`${API_URL}/api/parties/${encodeURIComponent(acronym)}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return (await res.json()) as PartyDetail;
  } catch {
    return null;
  }
}

/**
 * Derive the party's absolute logo URL and its schema.org `sameAs` links
 * (website + socials, normalized to absolute https URLs), for JSON-LD/OG.
 */
export function partyMediaLinks(party: PartyDetail): {
  image: string | undefined;
  sameAs: string[];
} {
  const image =
    party.logoUrl && /^https?:\/\//i.test(party.logoUrl) ? party.logoUrl : undefined;
  const sameAs = [
    party.website
      ? /^https?:\/\//i.test(party.website)
        ? party.website
        : `https://${party.website}`
      : null,
    party.twitterHandle ? `https://x.com/${party.twitterHandle.replace(/^@/, "")}` : null,
    party.facebookUrl
      ? /^https?:\/\//i.test(party.facebookUrl)
        ? party.facebookUrl
        : `https://${party.facebookUrl.replace(/^\/+/, "")}`
      : null,
  ].filter((link): link is string => Boolean(link));
  return { image, sameAs };
}
