import { test, expect } from '@playwright/test';

// Retention Phase 1 — in-session related-entity links. Runs logged-OUT
// (these are public SEO pages). Grabs real geo/official data from the API the
// app talks to, then verifies the related-links surfaces render and navigate.
test.use({ storageState: { cookies: [], origins: [] } });

// Data is gathered from the API directly (the app's /api proxy isn't relied on
// here). Defaults to the dev API; override with E2E_API_URL.
const API = (
  process.env.E2E_API_URL || 'https://api.example.invalid/api'
).replace(/\/$/, '');

const slug = (name: string) => name.toLowerCase().replace(/\s+/g, '-');
const wardSlug = (name: string) =>
  name.toLowerCase().split('/')[0].replace(/\s+/g, '-');

test.describe('Related-entity links @awanaija', () => {
  test('ward page lists other wards in the LGA and they navigate', async ({
    page,
    request,
  }) => {
    // Find a state → LGA → that has at least 2 wards (so a sibling exists).
    const states = await (await request.get(`${API}/geo/states`)).json();
    let target: { state: string; lga: string; wards: { code: string; name: string }[] } | null =
      null;

    for (const st of states.slice(0, 8)) {
      const lgas = await (
        await request.get(`${API}/geo/lgas?state=${st.code}`)
      ).json();
      for (const lga of (lgas || []).slice(0, 4)) {
        const wards = await (
          await request.get(`${API}/geo/wards?lga=${lga.code}`)
        ).json();
        if ((wards || []).length >= 2) {
          target = { state: st.name, lga: lga.name, wards };
          break;
        }
      }
      if (target) break;
    }

    expect(target, 'a LGA with >=2 wards').toBeTruthy();
    const t = target!;
    const first = t.wards[0];

    await page.goto(
      `/states/${slug(t.state)}/${slug(t.lga)}/${wardSlug(first.name)}`,
    );

    // The "Other wards in {LGA}" section renders with at least one sibling link.
    const related = page.getByTestId('related-links');
    await expect(related).toBeVisible({ timeout: 15000 });
    await expect(
      related.getByRole('heading', { name: new RegExp(`Other wards in`, 'i') }),
    ).toBeVisible();

    const siblingLinks = related.getByRole('link');
    expect(await siblingLinks.count()).toBeGreaterThan(0);

    // Clicking a sibling navigates to another ward page under the same LGA.
    await siblingLinks.first().click();
    await page.waitForURL(
      new RegExp(`/states/${slug(t.state)}/${slug(t.lga)}/[^/]+$`),
    );
    await expect(
      page.getByRole('heading', { level: 1, name: /ward/i }),
    ).toBeVisible({ timeout: 15000 });
  });

  test('official page links the jurisdictions they serve', async ({
    page,
    request,
  }) => {
    // Find an official whose primary position has a state (governors always do).
    const list = await (
      await request.get(`${API}/officials?limit=50`)
    ).json();
    let found: { slug: string; state: string } | null = null;

    for (const o of list.data || []) {
      const detail = await (
        await request.get(`${API}/officials/${o.slug ?? o.id}`)
      ).json();
      const pos = detail.positions?.[0];
      if (pos?.state) {
        found = { slug: detail.slug ?? detail.id, state: pos.state };
        break;
      }
    }

    expect(found, 'an official with a state position').toBeTruthy();
    await page.goto(`/officials/${found!.slug}`);

    const related = page.getByTestId('related-links');
    await expect(related).toBeVisible({ timeout: 15000 });
    await expect(
      related.getByRole('heading', { name: /where they serve/i }),
    ).toBeVisible();

    // The state card navigates to that state's page.
    await related.getByRole('link').first().click();
    await page.waitForURL(new RegExp(`/states/${slug(found!.state)}`));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 15000,
    });
  });

  test('official page shows other representatives for the area', async ({
    page,
    request,
  }) => {
    // A governor reliably has at least one peer (the state's senator).
    const list = await (
      await request.get(`${API}/officials?role=governor&limit=1`)
    ).json();
    const gov = list.data?.[0];
    expect(gov, 'a governor').toBeTruthy();

    await page.goto(`/officials/${gov.slug ?? gov.id}`);
    const peers = page.getByTestId('peer-officials');
    await expect(peers).toBeVisible({ timeout: 15000 });
    await expect(
      peers.getByRole('heading', { name: /other representatives for/i }),
    ).toBeVisible();
    // Clicking a peer goes to another official page.
    await peers.getByRole('link').first().click();
    await page.waitForURL(/\/officials\/[^/]+$/);
  });

  test('constituency page shows the rep and coverage', async ({
    page,
    request,
  }) => {
    // Find a federal constituency, then its detail. Skips until the
    // /geo/constituencies/:code endpoint is deployed (dev/CI validates it).
    const states = await (await request.get(`${API}/geo/states`)).json();
    let code: string | null = null;
    for (const st of states.slice(0, 6)) {
      const cons = await (
        await request.get(`${API}/geo/constituencies?state=${st.code}&type=federal`)
      ).json();
      if (Array.isArray(cons) && cons.length) {
        code = cons[0].code;
        break;
      }
    }
    expect(code, 'a federal constituency code').toBeTruthy();

    const detail = await request.get(`${API}/geo/constituencies/${code}`);
    test.skip(
      detail.status() === 404,
      'constituency detail endpoint not deployed on this API yet',
    );
    expect(detail.ok()).toBeTruthy();

    await page.goto(`/constituencies/${code}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole('heading', { name: /who represents you/i }),
    ).toBeVisible();
  });

  test('state page groups reps by constituency type', async ({ page, request }) => {
    const states = await (await request.get(`${API}/geo/states`)).json();
    const st = states[0];
    const detail = await (
      await request.get(`${API}/geo/states/${slug(st.name)}`)
    ).json();
    // Skips until the state-details constituencies grouping is deployed.
    test.skip(
      !detail.constituencies,
      'state constituencies grouping not deployed on this API yet',
    );

    await page.goto(`/states/${slug(st.name)}`);
    await expect(page.getByText('Senatorial Districts')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Federal Constituencies')).toBeVisible();
    await expect(page.getByText('State Constituencies')).toBeVisible();

    // Expand a section → each item links to its constituency page.
    await page.getByText('Senatorial Districts').click();
    await expect(
      page.locator('a[href^="/constituencies/"]').first(),
    ).toBeVisible({ timeout: 10000 });
  });
});
