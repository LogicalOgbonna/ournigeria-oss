import { nameMatchScore, KEEP_THRESHOLD } from "./assembly-reconcile";

export interface DatasetMember {
  constituency_code: string; name: string | null; party: string | null;
  gender?: string | null; leadership_role?: string | null; returning?: boolean;
  image_url?: string | null; confidence: "high" | "medium" | "low";
  sources: string[]; note?: string; profile?: Record<string, unknown> | null;
}
export interface LiveHolder { id: string; official_id: string; name: string }
export interface SeatDecision {
  action: "install" | "unchanged" | "review";
  downgradePositionId: string | null;
  reason: string;
}

export function decideSeat(m: DatasetMember, live: LiveHolder | null): SeatDecision {
  if (!m.name || m.confidence === "low") {
    return { action: "review", downgradePositionId: null, reason: m.name ? "low confidence" : "unsourced" };
  }
  if (live) {
    const score = nameMatchScore(m.name, live.name);
    if (score >= KEEP_THRESHOLD) {
      return { action: "unchanged", downgradePositionId: null, reason: `already held by ${live.name}` };
    }
    return { action: "install", downgradePositionId: live.id, reason: `replace ${live.name} with ${m.name}` };
  }
  return { action: "install", downgradePositionId: null, reason: `install ${m.name} (no active holder)` };
}
