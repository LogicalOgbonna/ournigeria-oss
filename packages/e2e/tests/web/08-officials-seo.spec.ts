import { test, expect } from '@playwright/test';

/**
 * Officials SEO: slug URLs, legacy UUID redirects, canonical + structured data.
 * Discovers a real official at runtime (via the web app's /api proxy) so it has
 * no hard-coded IDs and passes against any environment once the slug feature is
 * deployed. See plan .agent/plans/44.officials-seo-slugs-metadata.md.
 */
test.describe('Officials SEO @web', () => {
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  async function pickOfficial(request: import('@playwright/test').APIRequestContext) {
    const res = await request.get('/api/officials?limit=10');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const official = (body.data as Array<{ id: string; slug: string | null; name: string }>).find(
      (o) => !!o.slug,
    );
    expect(official, 'expected at least one official with a slug').toBeTruthy();
    return official!;
  }

  test('slug page returns 200 with name heading and slug canonical', async ({ page, request }) => {
    const official = await pickOfficial(request);
    const resp = await page.goto(`/officials/${official.slug}`);
    expect(resp?.status()).toBe(200);

    await expect(page.getByRole('heading', { name: official.name, level: 1 })).toBeVisible();

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain(`/officials/${official.slug}`);
  });

  test('legacy UUID URL permanently redirects to the slug', async ({ page, request }) => {
    const official = await pickOfficial(request);
    await page.goto(`/officials/${official.id}`);
    // After the redirect, the address bar should show the slug, not the UUID.
    await expect.poll(() => new URL(page.url()).pathname).toBe(`/officials/${official.slug}`);
    expect(UUID_RE.test(new URL(page.url()).pathname)).toBeFalsy();
  });

  test('emits Person + BreadcrumbList structured data', async ({ page, request }) => {
    const official = await pickOfficial(request);
    await page.goto(`/officials/${official.slug}`);

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = blocks.map((b) => {
      try {
        return JSON.parse(b)['@type'];
      } catch {
        return null;
      }
    });
    expect(types).toContain('Person');
    expect(types).toContain('BreadcrumbList');
  });

  test('unknown slug renders the not-found page', async ({ page }) => {
    const resp = await page.goto('/officials/this-official-does-not-exist-zzz');
    expect(resp?.status()).toBe(404);
  });
});
