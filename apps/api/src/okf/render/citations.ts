import type { EvidenceView } from "../../evidence/evidence.service";

const MAX_SNIPPET = 160;

export function renderCitation(ev: EvidenceView, snapshotBaseUrl: string): string {
  const snippet = ev.snippet.length > MAX_SNIPPET ? `${ev.snippet.slice(0, MAX_SNIPPET)}…` : ev.snippet;
  const parts: string[] = [`[${ev.publisher} — "${snippet}"](${ev.url})`];
  parts.push(`${ev.sourceTier} tier`);
  if (ev.hasSnapshot && snapshotBaseUrl) {
    parts.push(`[archived copy](${snapshotBaseUrl}/evidence-snapshots/${ev.id})`);
  }
  if (!ev.originalAccessible) parts[0] += " (original removed)";
  if (ev.archiveUrl) parts.push(`[web archive](${ev.archiveUrl})`);
  parts.push(`retrieved ${ev.retrievedAt.slice(0, 10)}`);
  return parts.join(" · ");
}

/** Per-document footnote allocator. Stable order, dedup by evidence id. */
export class CitationRegistry {
  private order: EvidenceView[] = [];
  private index = new Map<string, number>();

  ref(ev: EvidenceView): string {
    let n = this.index.get(ev.id);
    if (n === undefined) {
      this.order.push(ev);
      n = this.order.length;
      this.index.set(ev.id, n);
    }
    return `[^e${n}]`;
  }

  refs(evs: EvidenceView[]): string {
    return evs.map((e) => this.ref(e)).join("");
  }

  footnotes(snapshotBaseUrl: string): string {
    if (this.order.length === 0) return "";
    return this.order.map((ev, i) => `[^e${i + 1}]: ${renderCitation(ev, snapshotBaseUrl)}`).join("\n");
  }
}
