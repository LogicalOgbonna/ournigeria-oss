import { test, expect } from '@playwright/test';

/**
 * Political party pages: directory, detail, computed footprint, Organization
 * JSON-LD, case-insensitive acronym, 404 on unknown. Discovers a real party at
 * runtime via the web app's /api proxy so it has no hard-coded data and passes
 * against any environment once deployed. See
 * docs/superpowers/specs/2026-06-19-political-party-page-design.md.
 */
test.describe('Political parties @web', () => {
  async function pickParty(request: import('@playwright/test').APIRequestContext) {
    const res = await request.get('/api/parties');
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as Array<{ acronym: string; name: string; isActive: boolean }>;
    const party = body.find((p) => p.isActive);
    expect(party, 'expected at least one active party').toBeTruthy();
    return party!;
  }

  test('directory lists parties and links to detail', async ({ page, request }) => {
    const party = await pickParty(request);
    const resp = await page.goto('/parties');
    expect(resp?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Political Parties', level: 1 })).toBeVisible();
    await expect(page.locator(`a[href="/parties/${party.acronym}"]`).first()).toBeVisible();
  });

  test('detail page renders footprint + Organization JSON-LD', async ({ page, request }) => {
    const party = await pickParty(request);
    const resp = await page.goto(`/parties/${party.acronym}`);
    expect(resp?.status()).toBe(200);

    await expect(page.getByRole('heading', { name: party.name, level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Electoral footprint' })).toBeVisible();

    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const hasOrg = ld.some((t) => {
      try {
        return JSON.parse(t)['@type'] === 'Organization';
      } catch {
        return false;
      }
    });
    expect(hasOrg, 'expected Organization JSON-LD').toBeTruthy();

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain(`/parties/${party.acronym}`);
  });

  test('elected-officials accordion lazy-loads officeholders on expand', async ({ page, request }) => {
    // Pick the party with the most seats (top of the directory) — guaranteed officeholders.
    const res = await request.get('/api/parties');
    const list = (await res.json()) as Array<{ acronym: string; seats: number }>;
    const top = list.sort((a, b) => b.seats - a.seats)[0];
    expect(top?.seats, 'expected a party with officeholders').toBeGreaterThan(0);

    await page.goto(`/parties/${top.acronym}`);
    await expect(page.getByRole('heading', { name: 'Elected officials' })).toBeVisible();

    // Expand the Governors group — its officials lazy-load.
    await page.getByRole('button', { name: /Governors/ }).click();
    const officialLink = page.locator('a[href^="/officials/"]').first();
    await expect(officialLink).toBeVisible();

    // The "View all" link targets the filtered officials directory.
    const viewAll = page.locator('a[href^="/officials?party="]').first();
    await expect(viewAll).toBeVisible();
    expect(await viewAll.getAttribute('href')).toMatch(/\/officials\?party=.+&role=.+/);
  });

  test('detail shows the states-governed map', async ({ page, request }) => {
    const res = await request.get('/api/parties');
    const list = (await res.json()) as Array<{ acronym: string; seats: number }>;
    const top = list.sort((a, b) => b.seats - a.seats)[0];
    await page.goto(`/parties/${top.acronym}`);
    await expect(page.getByRole('heading', { name: 'States governed' })).toBeVisible();
  });

  test('detail renders the candidates (flagbearers) section', async ({ page, request }) => {
    const party = await pickParty(request);
    await page.goto(`/parties/${party.acronym}`);
    // Present regardless of whether any primary winners are recorded yet.
    await expect(page.getByRole('heading', { name: /Flagbearers/ })).toBeVisible();
  });

  test('directory cards surface party officers when present', async ({ page, request }) => {
    const res = await request.get('/api/parties');
    const list = (await res.json()) as Array<{ acronym: string; officers: { name: string }[] }>;
    const withOfficer = list.find((p) => p.officers && p.officers.length > 0);
    if (!withOfficer) test.skip(true, 'no party officers seeded yet');

    await page.goto('/parties');
    const card = page.locator(`a[href="/parties/${withOfficer!.acronym}"]`);
    await expect(card).toContainText(withOfficer!.officers[0].name);
  });

  test('detail shows party leadership, linking officers to their official profiles', async ({ page, request }) => {
    const res = await request.get('/api/parties');
    const list = (await res.json()) as Array<{
      acronym: string;
      officers: { name: string; officialSlug: string | null }[];
    }>;
    const withOfficer = list.find((p) => p.officers && p.officers.length > 0);
    if (!withOfficer) test.skip(true, 'no party officers seeded yet');

    await page.goto(`/parties/${withOfficer!.acronym}`);
    await expect(page.getByRole('heading', { name: 'Party leadership' })).toBeVisible();
    await expect(page.getByText(withOfficer!.officers[0].name).first()).toBeVisible();

    // A linked officer is clickable through to their official profile.
    const linked = withOfficer!.officers.find((o) => o.officialSlug);
    if (linked) {
      await expect(page.locator(`a[href="/officials/${linked.officialSlug}"]`).first()).toBeVisible();
    }
  });

  test('lowercase acronym resolves', async ({ page, request }) => {
    const party = await pickParty(request);
    const resp = await page.goto(`/parties/${party.acronym.toLowerCase()}`);
    expect(resp?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: party.name, level: 1 })).toBeVisible();
  });

  test('unknown acronym returns 404', async ({ page }) => {
    const resp = await page.goto('/parties/ZZZNOTAREALPARTY');
    expect(resp?.status()).toBe(404);
  });
});
