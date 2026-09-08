import fs from 'node:fs';
import path from 'node:path';
import {
  test,
  expect,
  request as apiRequest,
  type APIRequestContext,
} from '@playwright/test';
import {
  cleanupE2ECampaigns,
  isTerminal,
  listE2ECampaigns,
  runVerb,
  selectOption,
  statusChip,
  sweepable,
  type CleanupResult,
} from '../../helpers/campaigns';

/**
 * Election tickets (campaign dashboard) — the manager → reviewer → rail-order
 * lifecycle, end to end through the UI.
 *
 * SERIAL by necessity: every test after the first works on the ONE ticket the
 * create flow opened, so the id/slug are module-level and a failure early on
 * skips the rest rather than reporting five unrelated failures.
 *
 * The race is Presidential 2099 — far enough out that no real ticket shares the
 * key, so `uq_campaigns_race_party_faction` (partial over public rows) cannot
 * collide with seeded data when the ticket goes live.
 *
 * Every API call goes through the DASHBOARD origin (`/api/admin/*` and
 * `/api/campaigns/*` are rewritten by apps/dashboard/next.config.ts), so the
 * checks and the browser always see the same database.
 */

test.describe.configure({ mode: 'serial' });

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://spending-dashboard.arinze.online';
const AUTH_FILE = path.resolve(__dirname, '../../.auth/admin-user.json');

/** Lowercase hex — the name is slugified into the public URL. */
const RUN_ID = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
const CANDIDATE = `E2E Candidate ${RUN_ID}`;
const VISION = `Fix the roads, publish the books. (${RUN_ID})`;
const YEAR = '2099';

/**
 * A leftover younger than this belongs to a run that may still be in flight;
 * sweeping it would pull the rug out from under a parallel worker.
 */
const LEFTOVER_AGE_MINUTES = 10;

const SUPER_ADMIN_REASON =
  'this spec approves its own ticket; needs super_admin, emits campaign.self_approved';

let superAdmin = false;
let ticketId = '';
let ticketSlug = '';

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

function reportCleanup(label: string, result: CleanupResult) {
  annotate(
    label,
    result.retired.length
      ? `retired ${result.retired.length}: ${result.retired.join(', ')}`
      : 'nothing to retire',
  );
  if (result.skippedDrafts.length) {
    annotate(
      `${label}-skipped-drafts`,
      result.skippedDrafts.map((d) => `${d.id} (${d.detail})`).join('; '),
    );
  }
}

test.describe('Election tickets @dashboard', () => {
  /**
   * Last-ditch teardown for THIS run's ticket, whatever happened above — a
   * failure between Approve and Withdraw would otherwise leave a live ticket
   * holding the Presidential/2099/APC race key and 409 every later run.
   *
   * It builds its own context because the `request` fixture is test-scoped and
   * gone by the time an afterAll hook runs.
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
      reportCleanup('teardown', await cleanupE2ECampaigns(ctx, { onlyRunId: RUN_ID }));
    } catch (err) {
      // A teardown that throws would mask the real failure above it.
      annotate('teardown-failed', String(err));
    } finally {
      await ctx?.dispose();
    }
  });

  test('retires leftover E2E tickets from earlier runs', async ({ request }) => {
    const me = await request.get('/api/admin/auth/me');
    expect(me.ok(), `GET /api/admin/auth/me failed: ${me.status()}`).toBeTruthy();
    const roles = ((await me.json()) as { roles?: string[] }).roles ?? [];
    superAdmin = roles.includes('super_admin');
    annotate('admin-roles', roles.join(', ') || '(none)');
    test.skip(!superAdmin, SUPER_ADMIN_REASON);

    // Only rows that have sat untouched: a ticket minutes old may belong to a
    // run still in progress.
    const result = await cleanupE2ECampaigns(request, {
      olderThanMinutes: LEFTOVER_AGE_MINUTES,
    });
    reportCleanup('cleanup', result);

    // Nothing old enough to sweep is left holding the race key. Drafts are
    // excluded: they are invisible to the public, cannot take the race key, and
    // the API has no verb that retires one it refuses to delete.
    //
    // Deliberately UNSCOPED, unlike the per-run reads elsewhere: this verifies
    // the sweep two lines up, which is itself unscoped (it must clear EARLIER
    // runs' leftovers). Passing RUN_ID here would ask about tickets this run
    // has not created yet, so the assertion would pass vacuously and could
    // never catch a leftover the sweep failed to retire.
    const stuck = (await listE2ECampaigns(request)).filter(
      (r) =>
        r.status !== 'draft' &&
        sweepable(r, { olderThanMinutes: LEFTOVER_AGE_MINUTES }),
    );
    expect(
      stuck.map((r) => `${r.id} (${r.status})`),
      'leftover tickets could not be retired',
    ).toEqual([]);
  });

  test('manager creates a draft ticket from the two-step wizard', async ({ page }) => {
    requireSuperAdmin();
    await page.goto('/dashboard/campaigns');
    await expect(page.getByRole('heading', { name: 'Election Tickets' })).toBeVisible();

    await page.getByRole('link', { name: /new ticket/i }).click();
    await expect(page.getByRole('heading', { name: 'New Ticket' })).toBeVisible();

    // --- step 1: the race ---
    await expect(page.getByText('Step 1 · The race')).toBeVisible();
    await selectOption(page, 'race-type', 'Presidential');

    const yearInput = page.locator('#race-year');
    await yearInput.fill(YEAR);
    // RaceKeyFields only commits the year on blur/Enter.
    await yearInput.blur();

    await selectOption(page, 'party', /^APC\b/);
    await page.getByRole('button', { name: /^Next/ }).click();

    // --- step 2: the people ---
    await expect(page.getByText('Step 2 · The people')).toBeVisible();
    // The step-1 summary carries the race key forward.
    await expect(page.getByText(YEAR, { exact: true })).toBeVisible();

    const candidateBox = page.getByRole('combobox', { name: 'Candidate' });
    await candidateBox.fill(CANDIDATE);
    // A brand-new name matches no official, so the free-text row is the pick.
    const freeText = page.getByRole('option', { name: /Not an official yet/ });
    await expect(freeText).toBeVisible();
    await freeText.click();

    // The picker collapses to the chosen name; no running mate on this ticket.
    await expect(page.getByText(CANDIDATE, { exact: true })).toBeVisible();
    // The slug follows the name until it is edited by hand.
    await expect(page.locator('input[id$="-slug"]')).toHaveValue(
      `e2e-candidate-${RUN_ID}`,
    );

    await page.getByRole('button', { name: /create draft/i }).click();

    await page.waitForURL(
      /\/dashboard\/campaigns\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
    );
    ticketId = page.url().split('/dashboard/campaigns/')[1].split('?')[0];
    expect(ticketId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );

    await expect(page.getByRole('heading', { level: 1, name: CANDIDATE })).toBeVisible();
    await expect(statusChip(page)).toHaveText('Draft');
  });

  test('manager edits the vision line and submits for review', async ({ page, request }) => {
    requireSuperAdmin();
    expect(ticketId, 'the create test must run first').not.toBe('');
    await page.goto(`/dashboard/campaigns/${ticketId}`);
    await expect(statusChip(page)).toHaveText('Draft');

    // Read the slug the API settled on (it may take a -2 suffix); the public
    // check in the next test needs the real one, not the derived guess.
    const detail = await request.get(`/api/admin/campaigns/${ticketId}`);
    expect(detail.ok()).toBeTruthy();
    ticketSlug = ((await detail.json()) as { slug: string }).slug;
    expect(ticketSlug).toBeTruthy();

    const vision = page.locator('textarea[id$="-vision"]');
    await expect(vision).toBeVisible();
    await vision.fill(VISION);
    await expect(page.getByText(/1 unsaved change/)).toBeVisible();

    await page.getByRole('button', { name: 'Save', exact: true }).click();
    // A draft saves straight through — the reason prompt is for non-draft rows.
    await expect(page.getByText('Ticket saved')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('No unsaved changes.')).toBeVisible();

    await page.getByRole('button', { name: /submit for review/i }).click();
    await expect(statusChip(page)).toHaveText('In review');
  });

  test('reviewer approves the ticket and it becomes publicly readable', async ({
    page,
    request,
  }) => {
    requireSuperAdmin();
    expect(ticketSlug, 'the submit test must run first').not.toBe('');
    await page.goto(`/dashboard/campaigns/${ticketId}`);
    await expect(statusChip(page)).toHaveText('In review');

    await runVerb(page, /^Approve$/, /^Approve$/, 'E2E approval — automated test');
    await expect(statusChip(page)).toHaveText('Live');

    // The public endpoint is the real proof: status active + reviewed +
    // confidence above low is what `GET /api/campaigns/:slug` requires.
    await expectPublicStatus(request, ticketSlug, 200);
  });

  test('reviewer unpublishes the ticket and it drops off the public API', async ({
    page,
    request,
  }) => {
    requireSuperAdmin();
    await page.goto(`/dashboard/campaigns/${ticketId}`);
    await expect(statusChip(page)).toHaveText('Live');

    await runVerb(page, /^Unpublish$/, /^Unpublish$/, 'E2E unpublish — automated test');
    await expect(statusChip(page)).toHaveText('Hidden');

    await expectPublicStatus(request, ticketSlug, 404);
  });

  test('rail order ranks the suspended ticket and saves', async ({ page }) => {
    requireSuperAdmin();
    await page.goto('/dashboard/campaigns/order');
    await expect(page.getByRole('heading', { name: 'Rail Order' })).toBeVisible();

    await selectOption(page, 'race-type', 'Presidential');
    const yearInput = page.locator('#race-year');
    await yearInput.fill(YEAR);
    await yearInput.blur();

    // A suspended ticket is still rankable (isOrderable) — only withdrawn and
    // dissolved rows are dropped, since nothing brings those back to the rail.
    const unranked = page.getByRole('region', { name: /^Unranked/ });
    await expect(unranked.getByText(CANDIDATE)).toBeVisible();
    await expect(page.getByRole('button', { name: /^Save order$/ })).toBeDisabled();

    // dnd-kit's PointerSensor ignores Playwright's dragTo (it needs real
    // pointer events with movement), so the rail is driven through the
    // explicit move buttons — the same three callbacks the drag path uses.
    await page.getByRole('button', { name: `Add ${CANDIDATE} to the rail` }).click();

    const ranked = page.getByRole('region', { name: /^Ranked/ });
    await expect(ranked.getByText(CANDIDATE)).toBeVisible();
    await expect(page.getByText('Unsaved changes')).toBeVisible();

    await page.getByRole('button', { name: /^Save order$/ }).click();
    await expect(page.getByText(/Order saved/)).toBeVisible();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    // The server's own numbering came back: position 1 on the rail.
    await expect(ranked.getByRole('button', { name: `Move ${CANDIDATE} up` })).toBeDisabled();
  });

  test('reviewer withdraws the ticket (cleanup)', async ({ page, request }) => {
    requireSuperAdmin();
    await page.goto(`/dashboard/campaigns/${ticketId}`);
    await expect(statusChip(page)).toHaveText('Hidden');

    await runVerb(page, /^Withdraw$/, /^Withdraw$/, 'E2E teardown — automated test');
    await expect(statusChip(page)).toHaveText('Withdrawn');

    // Everything THIS run created is terminal. Older rows are the previous
    // test's business, not this assertion's.
    const mine = (await listE2ECampaigns(request, RUN_ID)).filter((r) =>
      r.candidateName.includes(RUN_ID),
    );
    expect(mine.length, 'this run created exactly one ticket').toBe(1);
    expect(mine.filter((r) => !isTerminal(r))).toEqual([]);
  });
});

/**
 * Poll the public ticket endpoint until it reaches `want`. A transport error
 * (the dev server restarting, a socket hang-up) reads as 0 and is retried
 * rather than aborting the test.
 */
async function expectPublicStatus(
  request: APIRequestContext,
  slug: string,
  want: number,
) {
  await expect
    .poll(
      async () => {
        try {
          return (await request.get(`/api/campaigns/${slug}`)).status();
        } catch {
          return 0;
        }
      },
      {
        timeout: 15_000,
        message: `public ticket ${slug} never settled on ${want}`,
      },
    )
    .toBe(want);
}
