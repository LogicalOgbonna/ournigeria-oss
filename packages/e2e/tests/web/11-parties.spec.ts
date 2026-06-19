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
