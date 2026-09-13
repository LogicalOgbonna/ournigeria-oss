import { expect, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Shared helpers for the election-ticket dashboard flows
 * (tests/dashboard/12-campaigns.spec.ts).
 *
 * Every API call here is SAME-ORIGIN against the dashboard: `/api/admin/*` and
 * `/api/campaigns/*` are rewritten to the API by `apps/dashboard/next.config.ts`.
 * That is deliberate — it means the stored `on_admin_session` cookie applies by
 * construction (no cross-port cookie assumption), and cleanup can never reach a
 * different database than the browser under test, however `API_URL` is set for
 * the dashboard process.
 *
 * Callers pass Playwright's `request` fixture, whose `baseURL` and
 * `storageState` come from the `dashboard-chromium` project.
 */

/** Every ticket this suite creates is named `E2E Candidate <runId>`. */
const E2E_CANDIDATE_PREFIX = 'E2E Candidate';

/** Statuses nothing can bring back — `retire` is one-way. */
const TERMINAL = ['withdrawn', 'dissolved'] as const;

export interface CampaignRow {
  id: string;
  status:
    | 'draft'
    | 'active'
    | 'suspended'
    | 'withdrawn'
    | 'dissolved'
    | 'concluded';
  candidateName: string;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export function isTerminal(row: Pick<CampaignRow, 'status'>): boolean {
  return (TERMINAL as readonly string[]).includes(row.status);
}

/** GET /api/admin/campaigns?q=E2E Candidate — every leftover, whatever its status. */
export async function listE2ECampaigns(
  request: APIRequestContext,
  /** Scope the server-side search to one run's tickets (`E2E Candidate <runId>`). */
  runId?: string,
): Promise<CampaignRow[]> {
  const q = runId ? `${E2E_CANDIDATE_PREFIX} ${runId}` : E2E_CANDIDATE_PREFIX;
  const res = await request.get(`/api/admin/campaigns?q=${encodeURIComponent(q)}&limit=100`);
  if (!res.ok()) {
    throw new Error(`campaign list failed: ${res.status()} ${await res.text()}`);
  }
  const body = (await res.json()) as { total: number; rows: CampaignRow[] };
  const rows = body.rows ?? [];
  // `limit` is capped at 100 by listQuerySchema. Silently cleaning only the
  // first page would leave leftovers behind AND make the "nothing remains"
  // assertions lie, so an overflowing page is a hard error, not a warning.
  if (body.total > rows.length) {
    throw new Error(
      `too many leftover "${E2E_CANDIDATE_PREFIX}" tickets to sweep in one page ` +
        `(${body.total} total, ${rows.length} returned) — clear them by hand`,
    );
  }
  return rows;
}

export interface CleanupOptions {
  /** Only rows whose candidate name carries this run id. */
  onlyRunId?: string;
  /**
   * Only rows untouched for at least this long. A concurrent run's in-flight
   * ticket is minutes old; sweeping it would pull the rug out from under it.
   */
  olderThanMinutes?: number;
}

export interface CleanupResult {
  /** Ids deleted or withdrawn. */
  retired: string[];
  /**
   * Drafts the API refused to delete. Never fatal: a draft is invisible to the
   * public and cannot hold the race key, so it can only clutter — and there is
   * no verb that retires a never-published draft, so there is no recovery to
   * attempt either.
   */
  skippedDrafts: { id: string; detail: string }[];
}

/**
 * Retire leftover `E2E Candidate` tickets so a fresh run can publish into the
 * same race key. `uq_campaigns_race_party_faction` is partial over PUBLIC rows,
 * so an abandoned live/suspended ticket would 409 the next run's Approve.
 *
 * Which verb applies is decided by status:
 *   draft, never reviewed          -> DELETE (row goes away; failure is reported)
 *   active | concluded | suspended -> POST /withdraw (terminal, keeps the audit)
 *   withdrawn | dissolved          -> already terminal, left alone
 *
 * A withdraw that fails DOES throw: those statuses are always retirable, so a
 * failure there means the next run cannot publish and must not be swallowed.
 */
export async function cleanupE2ECampaigns(
  request: APIRequestContext,
  opts: CleanupOptions = {},
): Promise<CleanupResult> {
  const rows = await listE2ECampaigns(request, opts.onlyRunId);
  const result: CleanupResult = { retired: [], skippedDrafts: [] };

  for (const row of rows) {
    if (!sweepable(row, opts)) continue;

    if (row.status === 'draft') {
      const del = await request.delete(`/api/admin/campaigns/${row.id}`);
      if (del.ok()) result.retired.push(row.id);
      else
        result.skippedDrafts.push({
          id: row.id,
          detail: `${del.status()} ${(await del.text()).slice(0, 200)}`,
        });
      continue;
    }

    const res = await request.post(`/api/admin/campaigns/${row.id}/withdraw`, {
      data: { reason: 'E2E leftover cleanup' },
    });
    if (!res.ok()) {
      throw new Error(
        `could not retire leftover ticket ${row.id} (${row.status}): ` +
          `${res.status()} ${await res.text()}`,
      );
    }
    result.retired.push(row.id);
  }

  return result;
}

/** Does this leftover fall inside the sweep the caller asked for? */
export function sweepable(row: CampaignRow, opts: CleanupOptions = {}): boolean {
  if (isTerminal(row)) return false;
  if (opts.onlyRunId && !row.candidateName.includes(opts.onlyRunId)) return false;
  if (opts.olderThanMinutes !== undefined) {
    const stamp = Date.parse(row.updatedAt ?? row.createdAt);
    // An unparseable timestamp is treated as old: better to sweep a row this
    // suite owns than to leave a race-key blocker behind.
    if (Number.isFinite(stamp) && Date.now() - stamp < opts.olderThanMinutes * 60_000) {
      return false;
    }
  }
  return true;
}

/**
 * The header chip on /dashboard/campaigns/[id] — "Draft", "In review", "Live",
 * "Live · re-review", "Hidden", "Withdrawn".
 *
 * Scoped to the block that owns the <h1> so the rail-order cards (which render
 * the same chip) can never be picked up by accident.
 */
export function statusChip(page: Page) {
  return page
    .getByRole('heading', { level: 1 })
    .locator('xpath=..')
    .getByTestId('status-chip')
    .first();
}

/** Pick a Radix Select option by its visible label. */
export async function selectOption(
  page: Page,
  triggerId: string,
  label: string | RegExp,
) {
  await page.locator(`#${triggerId}`).click();
  await page.getByRole('option', { name: label }).click();
  // Radix returns focus to the trigger and unmounts the listbox on select;
  // waiting for that keeps the next click from landing on a closing overlay.
  await expect(page.getByRole('listbox')).toHaveCount(0);
}

/**
 * Drive one of the ReasonDialog-backed verbs: click the verb button, type the
 * mandatory reason (min 3 chars), confirm.
 *
 * ReasonDialog deliberately keeps a rejected request's message INLINE and stays
 * open, so the outcome is polled rather than waited on: a 409 surfaces the
 * API's own sentence in the failure output instead of a bare "dialog never
 * hid" timeout.
 */
export async function runVerb(
  page: Page,
  buttonName: RegExp,
  confirmName: RegExp,
  reason: string,
) {
  await page.getByRole('button', { name: buttonName }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox').fill(reason);
  await dialog.getByRole('button', { name: confirmName }).click();

  await expect
    .poll(
      async () => {
        if (!(await dialog.isVisible().catch(() => false))) return 'closed';
        const problem = dialog.getByTestId('reason-error');
        if ((await problem.count()) === 0) return 'pending';
        return `rejected: ${(await problem.first().innerText()).trim()}`;
      },
      { timeout: 15_000, message: `${buttonName} was rejected by the API` },
    )
    .toBe('closed');
}
