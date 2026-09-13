import fs from 'node:fs';
import path from 'node:path';
import {
  test,
  expect,
  request as apiRequest,
  type APIRequestContext,
} from '@playwright/test';
import { runVerb, selectOption, statusChip } from '../../helpers/campaigns';
import {
  cleanupE2EElections,
  gateHasLabel,
  isRetiredElection,
  listE2EElections,
  sweepableElection,
  type ElectionAdminRow,
  type ElectionCleanupResult,
} from '../../helpers/elections';

/**
 * Election events (/dashboard/elections) — create draft → publish → the public
 * gate reflects it → unpublish → cancel, end to end through the UI (plan 68 §6).
 *
 * SERIAL by necessity: every test after the first works on the ONE event the
 * create flow opened, so the id/year are module-level and an early failure
 * skips the rest.
 *
 * The event is an LGA-chairman poll scoped to one LGA in a probed FREE year
 * (2060–2100): `uq_elections_event` is a TOTAL unique over
 * (office, year, round, scope) — a cancelled leftover still holds its key, and
 * a row that was ever published can never be deleted — so each run must take a
 * fresh key. The narrow LGA scope also keeps the gate's sibling-round rule
 * (one race per office+scope) away from any real published event.
 *
 * Every API call goes through the DASHBOARD origin (`/api/admin/*` and
 * `/api/election/*` are rewritten by apps/dashboard/next.config.ts), so the
 * checks and the browser always see the same database.
 */

test.describe.configure({ mode: 'serial' });

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://spending-dashboard.arinze.online';
const AUTH_FILE = path.resolve(__dirname, '../../.auth/admin-user.json');

const RUN_ID = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
const LABEL = `E2E Event ${RUN_ID}`;

/** Free years are probed in this window (createSchema caps year at 2100). */
const YEAR_MIN = 2060;
const YEAR_MAX = 2100;

/**
 * A leftover younger than this belongs to a run that may still be in flight;
 * sweeping it would pull the rug out from under a parallel worker.
 */
const LEFTOVER_AGE_MINUTES = 10;

const SUPER_ADMIN_REASON =
  'this spec both writes (elections.write) and publishes (campaigns.review); needs super_admin';

let superAdmin = false;
let eventId = '';
let eventYear = 0;

/** Guard for every test downstream of the role check in test 1. */
function requireSuperAdmin() {
  test.skip(!superAdmin, SUPER_ADMIN_REASON);
}

function annotate(type: string, description: string) {
  try {
    test.info().annotations.push({ type, description });
  } catch {
    // Outside a test/hook with a TestInfo — the console is the fallback.
    console.warn(`[${type}] ${description}`);
  }
}

function reportCleanup(label: string, result: ElectionCleanupResult) {
  annotate(
    label,
    result.deleted.length || result.retired.length
      ? `deleted ${result.deleted.length} (${result.deleted.join(', ')}); ` +
          `retired ${result.retired.length} (${result.retired.join(', ')})`
      : 'nothing to sweep',
  );
  if (result.skippedDrafts.length) {
    annotate(
      `${label}-skipped-drafts`,
      result.skippedDrafts.map((d) => `${d.id} (${d.detail})`).join('; '),
    );
  }
}

test.describe('Election events @dashboard', () => {
  /**
   * Last-ditch teardown for THIS run's event, whatever happened above — a
   * failure between Publish and Unpublish would otherwise leave a live race on
   * the public gate. Builds its own context because the `request` fixture is
   * test-scoped and gone by the time an afterAll hook runs.
   */
  test.afterAll(async () => {
    if (!fs.existsSync(AUTH_FILE)) {
      annotate('teardown', `no ${AUTH_FILE} — nothing could be retired`);
      return;
    }
    let ctx: APIRequestContext | undefined;
    try {
      ctx = await apiRequest.newContext({
        baseURL: DASHBOARD_URL,
        storageState: AUTH_FILE,
      });
      reportCleanup('teardown', await cleanupE2EElections(ctx, { onlyRunId: RUN_ID }));
    } catch (err) {
      // A teardown that throws would mask the real failure above it.
      annotate('teardown-failed', String(err));
    } finally {
      await ctx?.dispose();
    }
  });

  test('retires leftover E2E events and turns the gate on', async ({ request }) => {
    const me = await request.get('/api/admin/auth/me');
    expect(me.ok(), `GET /api/admin/auth/me failed: ${me.status()}`).toBeTruthy();
    const roles = ((await me.json()) as { roles?: string[] }).roles ?? [];
    superAdmin = roles.includes('super_admin');
    annotate('admin-roles', roles.join(', ') || '(none)');
    test.skip(!superAdmin, SUPER_ADMIN_REASON);

    // Only rows that have sat untouched — an event minutes old may belong to a
    // run still in progress.
    const result = await cleanupE2EElections(request, {
      olderThanMinutes: LEFTOVER_AGE_MINUTES,
    });
    reportCleanup('cleanup', result);

    // No old leftover is still published or upcoming: a published E2E event
    // would sit on the gate AND could shadow this run's race under the
    // sibling-round rule. (Unscoped on purpose — it verifies the sweep above,
    // which must clear EARLIER runs' leftovers.)
    const stuck = (await listE2EElections(request)).filter(
      (r) =>
        !isRetiredElection(r) &&
        r.reviewedBy !== null && // never-reviewed drafts are gate-invisible clutter at worst
        sweepableElection(r, { olderThanMinutes: LEFTOVER_AGE_MINUTES }),
    );
    expect(
      stuck.map((r) => `${r.id} (${r.status}${r.published ? ', published' : ''})`),
      'leftover events could not be retired',
    ).toEqual([]);

    // The kill switch may have been left off by a crashed run or by hand; the
    // gate assertions below need it on. This is also the D10.8 endpoint check.
    const gate = await request.post('/api/admin/elections/gate', {
      data: { enabled: true },
    });
    expect(gate.ok(), `gate toggle failed: ${gate.status()}`).toBeTruthy();
    expect(((await gate.json()) as { enabled: boolean }).enabled).toBe(true);
  });

  test('writer creates a draft event from the form', async ({ page, request }) => {
    requireSuperAdmin();

    // Probe a year no lga_chairman event holds yet — see the header comment on
    // why keys burn. Conservative: any scope counts as taken.
    const res = await request.get('/api/admin/elections?office=lga_chairman&limit=100');
    expect(res.ok(), `election list failed: ${res.status()}`).toBeTruthy();
    const rows = ((await res.json()) as { rows: ElectionAdminRow[] }).rows ?? [];
    const taken = new Set(rows.filter((r) => r.round === 'general').map((r) => r.year));
    for (let y = YEAR_MIN; y <= YEAR_MAX; y++) {
      if (!taken.has(y)) {
        eventYear = y;
        break;
      }
    }
    expect(
      eventYear,
      `no free year in ${YEAR_MIN}–${YEAR_MAX} — retire old E2E lga_chairman events by hand`,
    ).toBeGreaterThan(0);
    annotate('event-year', String(eventYear));

    await page.goto('/dashboard/elections');
    await expect(page.getByRole('heading', { name: 'Election Events' })).toBeVisible();

    await page.getByRole('link', { name: /new event/i }).click();
    await expect(page.getByRole('heading', { name: 'New Event' })).toBeVisible();

    await selectOption(page, 'election-office', 'LGA Chairman');
    await page.locator('#election-year').fill(String(eventYear));
    await page.locator('#election-label').fill(LABEL);

    // Scope: state, then the state's first LGA (the LGA list loads after the
    // state is picked; ListField renders a skeleton until then).
    await selectOption(page, 'election-state', /^Abia$/);
    const lgaTrigger = page.locator('#election-lga');
    await expect(lgaTrigger).toBeEnabled();
    await lgaTrigger.click();
    await page.getByRole('option').first().click();
    await expect(page.getByRole('listbox')).toHaveCount(0);

    await page.getByRole('button', { name: /create draft/i }).click();

    await page.waitForURL(
      /\/dashboard\/elections\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
    );
    eventId = page.url().split('/dashboard/elections/')[1].split('?')[0];
    expect(eventId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );

    await expect(page.getByRole('heading', { level: 1, name: LABEL })).toBeVisible();
    await expect(statusChip(page)).toHaveText('Draft');
  });

  test('reviewer publishes the event and the public gate reflects it', async ({
    page,
    request,
  }) => {
    requireSuperAdmin();
    expect(eventId, 'the create test must run first').not.toBe('');
    await page.goto(`/dashboard/elections/${eventId}`);
    await expect(statusChip(page)).toHaveText('Draft');

    await runVerb(page, /^Publish$/, /^Publish$/, 'E2E publish — automated test');
    await expect(statusChip(page)).toHaveText('Published');

    // The public gate is the real proof — the same endpoint awanaija reads.
    await expect
      .poll(() => gateHasLabel(request, LABEL), {
        timeout: 15_000,
        message: `gate never picked up "${LABEL}"`,
      })
      .toBe(true);
  });

  test('reviewer unpublishes the event and it drops off the gate', async ({
    page,
    request,
  }) => {
    requireSuperAdmin();
    await page.goto(`/dashboard/elections/${eventId}`);
    await expect(statusChip(page)).toHaveText('Published');

    await runVerb(page, /^Unpublish$/, /^Unpublish$/, 'E2E unpublish — automated test');
    await expect(statusChip(page)).toHaveText('Draft');

    await expect
      .poll(() => gateHasLabel(request, LABEL), {
        timeout: 15_000,
        message: `gate never dropped "${LABEL}"`,
      })
      .toBe(false);
  });

  test('reviewer cancels the event (cleanup)', async ({ page, request }) => {
    requireSuperAdmin();
    await page.goto(`/dashboard/elections/${eventId}`);
    await expect(statusChip(page)).toHaveText('Draft');

    // The verb button is "Cancel"; the dialog's confirm is "Cancel event".
    await runVerb(page, /^Cancel$/, /^Cancel event$/, 'E2E teardown — automated test');
    await expect(statusChip(page)).toHaveText('Cancelled');

    // Everything THIS run created is retired. Older rows are the previous
    // test's business, not this assertion's.
    const mine = (await listE2EElections(request, RUN_ID)).filter((r) =>
      (r.label ?? '').includes(RUN_ID),
    );
    expect(mine.length, 'this run created exactly one event').toBe(1);
    expect(mine.filter((r) => !isRetiredElection(r))).toEqual([]);
  });
});
