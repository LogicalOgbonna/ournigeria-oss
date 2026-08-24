// Lightweight in-app navigation breadcrumb so a back affordance can name the
// *actual* previous page ("Back to Abia State") instead of a hardcoded parent.
//
// The Next.js App Router does NOT expose a usable position in `history.state`
// (it only stores `__NA` + an internal tree), so we maintain our own index:
// each history entry is tagged via history.replaceState (merged into Next's
// state so we never clobber its keys), and a session counter lets us assign the
// right index to fresh pushes vs. back/forward revisits. Only labels are stored;
// navigation itself uses router.back().

const STACK_KEY = "awn:nav-stack";
const CUR_KEY = "awn:nav-cur";
const IDX_FIELD = "__awnIdx";

type Stack = Record<number, string>;

function readStack(): Stack {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(STACK_KEY) || "{}") as Stack;
  } catch {
    return {};
  }
}

function writeStack(stack: Stack): void {
  try {
    sessionStorage.setItem(STACK_KEY, JSON.stringify(stack));
  } catch {
    // sessionStorage can throw (private mode / quota) — labels are a
    // nice-to-have, so degrade silently to the generic "Back".
  }
}

function readCur(): number {
  if (typeof window === "undefined") return -1;
  const raw = sessionStorage.getItem(CUR_KEY);
  const n = raw == null ? Number.NaN : Number(raw);
  return Number.isFinite(n) ? n : -1;
}

function writeCur(n: number): void {
  try {
    sessionStorage.setItem(CUR_KEY, String(n));
  } catch {
    // ignore
  }
}

function taggedIndex(): number | null {
  if (typeof window === "undefined") return null;
  const state = window.history.state as Record<string, unknown> | null;
  const v = state?.[IDX_FIELD];
  return typeof v === "number" ? v : null;
}

/**
 * Record the current page under a stable index and return it. Called on every
 * navigation. Re-tags fresh pushes with an incremented index; reuses the
 * existing index when returning to an already-visited (back/forward) entry.
 */
export function syncEntry(label: string): number {
  if (typeof window === "undefined") return 0;

  const existing = taggedIndex();
  let idx: number;
  if (existing !== null) {
    idx = existing; // revisiting a known entry (back/forward)
  } else {
    idx = readCur() + 1; // a fresh push after wherever we currently are
    try {
      const state = (window.history.state as Record<string, unknown> | null) ?? {};
      window.history.replaceState({ ...state, [IDX_FIELD]: idx }, "");
    } catch {
      // if we can't tag, the counter still keeps us roughly correct
    }
  }

  writeCur(idx);
  const stack = readStack();
  stack[idx] = label;
  for (const key of Object.keys(stack)) {
    if (Number(key) > idx) delete stack[Number(key)]; // drop stale forward entries
  }
  writeStack(stack);
  return idx;
}

/** Our index for the current history entry (tag first, session counter as fallback). */
export function currentIndex(): number {
  const tag = taggedIndex();
  if (tag !== null) return tag;
  return Math.max(readCur(), 0);
}

/** Label of the page immediately before `idx`, or null if unknown / at the start. */
export function previousLabel(idx: number): string | null {
  if (idx <= 0) return null;
  return readStack()[idx - 1] ?? null;
}

/** Derive a readable label from a pathname when a page doesn't supply its own. */
export function humanizeLabel(pathname: string): string {
  if (!pathname || pathname === "/") return "Home";
  const seg = pathname.split("/").findLast((seg) => seg !== "") ?? "";
  const words = decodeURIComponent(seg).replaceAll("-", " ").trim();
  return words.replaceAll(/\b\w/g, (c) => c.toUpperCase()) || "Home";
}
