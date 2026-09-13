import type { APIRequestContext } from '@playwright/test';

/**
 * Shared helpers for the election-events dashboard flow
 * (tests/dashboard/13-elections.spec.ts).
 *
 * Same-origin discipline as helpers/campaigns.ts: `/api/admin/*` and
 * `/api/election/*` are rewritten to the API by apps/dashboard/next.config.ts,
 * so the stored `on_admin_session` cookie applies by construction and cleanup
 * can never reach a different database than the browser under test.
 */

/** Every event this suite creates is labelled `E2E Event <runId>`. */
const E2E_EVENT_PREFIX = 'E2E Event';

export interface ElectionAdminRow {
  id: string;
  slug: string;
  label: string | null;
  office: string;
  year: number;
  round: string;
  status: 'scheduled' | 'postponed' | 'concluded' | 'cancelled';
  published: boolean;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Off the gate for good: cancelled/concluded AND not published. */
export function isRetiredElection(
  row: Pick<ElectionAdminRow, 'status' | 'published'>,
): boolean {
  return !row.published && (row.status === 'cancelled' || row.status === 'concluded');
}

/** GET /api/admin/elections?q=E2E Event — `q` matches slug/label contains. */
export async function listE2EElections(
  request: APIRequestContext,
  runId?: string,
): Promise<ElectionAdminRow[]> {
  const q = runId ? `${E2E_EVENT_PREFIX} ${runId}` : E2E_EVENT_PREFIX;
  const res = await request.get(
    `/api/admin/elections?q=${encodeURIComponent(q)}&limit=100`,
  );
  if (!res.ok()) {
    throw new Error(`election list failed: ${res.status()} ${await res.text()}`);
  }
  const body = (await res.json()) as { total: number; rows: ElectionAdminRow[] };
  const rows = body.rows ?? [];
  // limit caps at 100 (listQuerySchema). Sweeping only the first page would
  // make the "nothing remains" assertions lie, so overflow is a hard error.
  if (body.total > rows.length) {
    throw new Error(
      `too many leftover "${E2E_EVENT_PREFIX}" events to sweep in one page ` +
        `(${body.total} total, ${rows.length} returned) — clear them by hand`,
    );
  }
  return rows;
}

export interface ElectionCleanupOptions {
  /** Only rows whose label carries this run id. */
  onlyRunId?: string;
  /** Only rows untouched for at least this long (a concurrent run's row is young). */
  olderThanMinutes?: number;
}

export interface ElectionCleanupResult {
  /** Never-published drafts the DELETE removed. */
  deleted: string[];
  /** Rows unpublished and/or cancelled — terminal but kept (audit trail). */
  retired: string[];
  /**
   * Drafts the API refused to delete. Never fatal: a draft is invisible to
   * the public gate, so it can only clutter.
   */
  skippedDrafts: { id: string; detail: string }[];
}

/** Does this leftover fall inside the sweep the caller asked for? */
export function sweepableElection(
  row: ElectionAdminRow,
  opts: ElectionCleanupOptions = {},
): boolean {
  if (isRetiredElection(row)) return false;
  if (opts.onlyRunId && !(row.label ?? '').includes(opts.onlyRunId)) return false;
  if (opts.olderThanMinutes !== undefined) {
    const stamp = Date.parse(row.updatedAt ?? row.createdAt);
    // An unparseable timestamp is treated as old: better to sweep a row this
    // suite owns than to leave a published leftover on the gate.
    if (
      Number.isFinite(stamp) &&
      Date.now() - stamp < opts.olderThanMinutes * 60_000
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Retire leftover `E2E Event` rows so they cannot linger on the public gate or
 * shadow a later run under the sibling-round rule. Which verbs apply is
 * decided by state:
 *
 *   never published (no reviewedBy) -> DELETE (row goes away; failure reported)
 *   published                       -> POST /unpublish, then fall through
 *   scheduled | postponed           -> POST /cancel (terminal, keeps the audit)
 *   cancelled | concluded           -> already retired, left alone
 *
 * NOTE a row that was ever published can never be DELETEd (the API keeps its
 * audit trail), so each published run permanently takes one
 * `uq_elections_event` key — the spec probes for a free year per run.
 * A failed unpublish/cancel throws: a published leftover on the gate must not
 * be swallowed.
 */
export async function cleanupE2EElections(
  request: APIRequestContext,
  opts: ElectionCleanupOptions = {},
): Promise<ElectionCleanupResult> {
  const rows = await listE2EElections(request, opts.onlyRunId);
  const result: ElectionCleanupResult = { deleted: [], retired: [], skippedDrafts: [] };

  for (const row of rows) {
    if (!sweepableElection(row, opts)) continue;

    if (!row.published && !row.reviewedBy) {
      const del = await request.delete(`/api/admin/elections/${row.id}`);
      if (del.ok()) result.deleted.push(row.id);
      else
        result.skippedDrafts.push({
          id: row.id,
          detail: `${del.status()} ${(await del.text()).slice(0, 200)}`,
        });
      continue;
    }

    if (row.published) {
      const res = await request.post(`/api/admin/elections/${row.id}/unpublish`, {
        data: { reason: 'E2E leftover cleanup' },
      });
      if (!res.ok()) {
        throw new Error(
          `could not unpublish leftover event ${row.id}: ` +
            `${res.status()} ${await res.text()}`,
        );
      }
    }
    if (row.status === 'scheduled' || row.status === 'postponed') {
      const res = await request.post(`/api/admin/elections/${row.id}/cancel`, {
        data: { reason: 'E2E leftover cleanup' },
      });
      if (!res.ok()) {
        throw new Error(
          `could not cancel leftover event ${row.id}: ` +
            `${res.status()} ${await res.text()}`,
        );
      }
    }
    result.retired.push(row.id);
  }

  return result;
}

/** One race off GET /api/election/gate — only what the spec asserts on. */
export interface GateRace {
  office: string;
  year: number;
  label: string | null;
}

/**
 * Whether the public gate currently carries a race with this label. A
 * transport error reads as "not there yet" so callers can poll through a dev
 * server restart.
 */
export async function gateHasLabel(
  request: APIRequestContext,
  label: string,
): Promise<boolean | 'error'> {
  try {
    const res = await request.get('/api/election/gate');
    if (!res.ok()) return 'error';
    const body = (await res.json()) as { enabled: boolean; races: GateRace[] };
    return body.enabled && body.races.some((r) => r.label === label);
  } catch {
    return 'error';
  }
}
