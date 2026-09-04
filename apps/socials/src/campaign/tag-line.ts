import { xWeightedLength } from "../intelligence/safety-filter.js";

/**
 * X-weighted length with t.co URL normalization: X wraps every URL to a fixed
 * 23-char t.co link, so the raw URL's length (campaign deep links run 150+
 * chars) must not count against the 280 budget. Everything else uses the same
 * weighting the SafetyFilter uses.
 */
export function xWeightedLengthTco(text: string): number {
  let stripped = "";
  let last = 0;
  let urls = 0;
  for (const m of text.matchAll(/https?:\/\/\S+/g)) {
    stripped += text.slice(last, m.index);
    last = m.index! + m[0].length;
    urls++;
  }
  stripped += text.slice(last);
  return xWeightedLength(stripped) + urls * 23;
}

export interface AppendTagsResult {
  text: string;
  /** Handles actually appended (order preserved), WITHOUT the @ prefix. */
  applied: string[];
}

export interface AppendTagsOptions {
  maxWeighted?: number;
  /** Text before the handles on the tag line. Default "cc". Pass "" for none. */
  lead?: string;
  /** Text after the handles — e.g. a question directed at the tagged locals. */
  tail?: string;
}

/**
 * Append a tag line to a campaign tweet, respecting X's character budget. The
 * line reads `\n\n${lead} @a @b${tail}` (lead defaults to "cc"). Handles are
 * added one by one; the first that would push the t.co-aware weighted length
 * past `maxWeighted` is dropped (and so are the rest — order is best-first).
 * Handles already in the text (or duplicated in the input) are skipped so we
 * never double-tag. No handles fit → text returned unchanged.
 */
export function appendTags(
  text: string,
  handles: string[],
  opts: AppendTagsOptions = {},
): AppendTagsResult {
  const { maxWeighted = 280, lead = "cc", tail = "" } = opts;
  const render = (hs: string[]): string =>
    `\n\n${lead ? lead + " " : ""}${hs.map((h) => "@" + h).join(" ")}${tail}`;

  const applied: string[] = [];
  for (const raw of handles) {
    const handle = raw.replace(/^@/, "").trim();
    // Single choke point for handle hygiene: scouted handles come from parsed
    // X payloads, so anything outside X's own screen_name grammar (letters,
    // digits, underscore, ≤15 chars) is dropped rather than interpolated into
    // a RegExp and a public tweet.
    if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) continue;
    if (applied.some((h) => h.toLowerCase() === handle.toLowerCase())) continue;
    if (new RegExp(`@${handle}\\b`, "i").test(text)) continue;
    if (xWeightedLengthTco(text + render([...applied, handle])) > maxWeighted) {
      break;
    }
    applied.push(handle);
  }
  if (applied.length === 0) return { text, applied: [] };
  return { text: text + render(applied), applied };
}

export interface ParsedTagLine {
  /** Tweet text WITHOUT the tag line (no trailing blank line). */
  body: string;
  /** "cc" for legacy lines, "" for the directed-question form. */
  lead: string;
  /** Handles on the line, WITHOUT the @ prefix, in order. */
  handles: string[];
  /** Everything after the handles (e.g. " — you're from X, do you know…"). */
  tail: string;
}

const TAG_LINE_RE =
  /^(cc )?(@[A-Za-z0-9_]{1,15}(?: @[A-Za-z0-9_]{1,15})*)([^\n]*)$/;

/**
 * Parse the tag line appendTags produced back out of a stored draft, so the
 * publish path can re-validate consent long after the draft was written.
 * Returns null when the text carries no recognizable tag line.
 */
export function parseTagLine(text: string): ParsedTagLine | null {
  const idx = text.lastIndexOf("\n\n");
  if (idx === -1) return null;
  const m = TAG_LINE_RE.exec(text.slice(idx + 2));
  if (!m) return null;
  return {
    body: text.slice(0, idx),
    lead: (m[1] ?? "").trim(),
    handles: m[2].split(" ").map((h) => h.slice(1)),
    tail: m[3] ?? "",
  };
}

/**
 * Rebuild a draft keeping only `keep` (subset of the parsed handles, order
 * preserved). Zero survivors → the whole tag line is dropped: a question
 * addressed at nobody must not publish.
 */
export function rebuildTagLine(parsed: ParsedTagLine, keep: string[]): string {
  if (keep.length === 0) return parsed.body;
  const lead = parsed.lead ? parsed.lead + " " : "";
  return `${parsed.body}\n\n${lead}${keep.map((h) => "@" + h).join(" ")}${parsed.tail}`;
}
