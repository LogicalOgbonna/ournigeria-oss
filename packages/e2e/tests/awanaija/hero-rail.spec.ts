import { test, expect } from '@playwright/test';

// The homepage hero rail. Public page, so run logged-OUT.
test.use({ storageState: { cookies: [], origins: [] } });

const RAIL = '[data-testid="candidate-rail"]';

// A first-time visitor gets the welcome onboarding over the whole page, which
// swallows clicks on the rail's dots. These tests are about the rail, so mark
// the onboarding seen before anything renders.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('hasSeenWelcomeModal', 'true');
  });
});

/**
 * Where the rail comes to rest. The defect this file guards against is not
 * "the rail never reaches the target" — it passes through it — but that it
 * settles somewhere else, so every assertion has to be made once the scroll
 * has actually stopped moving.
 */
async function railAtRest(page: import('@playwright/test').Page) {
  let last = -1;
  for (let i = 0; i < 25; i++) {
    const now = (await railCard(page)).x;
    if (now === last) return railCard(page);
    last = now;
    await page.waitForTimeout(200);
  }
  return railCard(page);
}

/** Index of the dot currently marked selected, or -1. */
async function activeDot(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const tabs = Array.from(
      document.querySelectorAll('[role="tablist"][aria-label="Candidates"] [role="tab"]'),
    );
    return tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
  });
}

/** Homepage with the rail mounted and the dots reachable. */
async function openHome(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForSelector(RAIL);
  const dots = page.getByRole('tablist', { name: 'Candidates' });
  await expect(dots).toBeVisible();
  return dots.getByRole('tab');
}

/** Where the rail is actually parked, in whole cards. */
async function railCard(page: import('@playwright/test').Page) {
  return page.$eval(RAIL, (el) => {
    const kids = Array.from(el.children) as HTMLElement[];
    const pitch =
      kids.length > 1
        ? kids[1].offsetLeft - kids[0].offsetLeft
        : kids[0]?.offsetWidth || 1;
    return { x: Math.round(el.scrollLeft), card: el.scrollLeft / pitch, pitch };
  });
}

test.describe('Homepage candidate rail @awanaija', () => {
  // Regression: the rail used to page with `scrollTo({behavior:'smooth'})` for
  // any distance. The wrap from the last poster back to the first has ~6900px
  // to cover, which outlived the 800ms settle guard — so the rail's own
  // in-flight scroll positions read back as a user gesture, the parent called
  // `autoplay.stop()`, and the carousel died parked on the third poster.
  // Long jumps are instant now, so they land exactly where they were asked to.
  test('jumping from the last poster back to the first lands on the first', async ({
    page,
  }) => {
    const tabs = await openHome(page);
    const count = await tabs.count();
    expect(count).toBeGreaterThan(4); // presidential field, not a stub

    // Park at the far end — the position the wrap starts from.
    await tabs.nth(count - 1).click();
    const end = await railAtRest(page);
    expect(end.x).toBe(
      await page.$eval(RAIL, (el) => el.scrollWidth - el.clientWidth),
    );

    // The move that used to break: a long jump back to the first poster.
    await tabs.first().click();
    const home = await railAtRest(page);
    expect(home.x).toBe(0);

    // And it stayed there — the rail used to be dragged back off the first
    // poster by its own in-flight scroll, landing on the third.
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  });

  // Every poster is a way into that party's campaign for the cycle. The year
  // comes from the gate's presidential race, falling back to 2027 while the
  // gate carries no `president` race — so this asserts the shape, not the year.
  test('each poster links to that party campaign page, and the page exists', async ({
    page,
  }) => {
    await openHome(page);
    const posters = page.locator('[data-testid="candidate-rail"] li a[href^="/elections/"]');
    const total = await posters.count();
    expect(total).toBeGreaterThan(4);

    const hrefs = await posters.evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') ?? ''),
    );
    for (const href of hrefs) {
      expect(href).toMatch(/^\/elections\/\d{4}\/[A-Za-z][A-Za-z0-9-]{1,15}$/);
    }

    // Follow one for real — a well-formed href that 404s is still a dead end.
    const first = posters.first();
    const target = await first.getAttribute('href');
    await first.click();
    await page.waitForURL(`**${target}`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Coming');
  });

  // The rail spans the top of the homepage, so on a laptop a cursor is resting
  // somewhere over it most of the time. Pausing for that read as a broken
  // carousel. WCAG 2.2.2 is satisfied by the *stop* on a deliberate interaction
  // — tapping a dot or scrolling by hand — not by hovering.
  test('keeps sliding with the mouse held over a poster', async ({ page }) => {
    await openHome(page);
    const rail = page.locator(RAIL);
    await rail.evaluate((el) => el.scrollIntoView({ block: 'center' }));

    const box = await rail.locator('li').first().boundingBox();
    if (!box) throw new Error('no poster to hover');
    const x = Math.round(box.x + box.width / 2);
    const y = Math.round(box.y + box.height / 2);
    await page.mouse.move(x, y);

    // Prove the cursor really is over a poster, or the test proves nothing.
    const onPoster = await page.evaluate(
      ([px, py]) => !!document.elementFromPoint(px, py)?.closest('li'),
      [x, y],
    );
    expect(onPoster).toBe(true);

    // Autoplay ticks every 4.5s. Hold still and watch for it to move on.
    const startedAt = await activeDot(page);
    await expect
      .poll(async () => activeDot(page), { timeout: 12_000, intervals: [500] })
      .not.toBe(startedAt);
  });

  test('a neighbouring hop still lands on its own poster', async ({ page }) => {
    const tabs = await openHome(page);
    await tabs.nth(1).click();

    await expect
      .poll(async () => Math.round((await railCard(page)).card), {
        timeout: 5000,
      })
      .toBe(1);
  });

  // A dot is a page, not a poster. The trailing posters are already on screen
  // when the rail runs out of travel, so they share the final page instead of
  // each getting a dot that advances over a rail which cannot move — which is
  // what used to freeze the carousel for two ticks before every wrap.
  test('there is a dot per reachable page, not per poster', async ({ page }) => {
    const tabs = await openHome(page);
    const dots = await tabs.count();

    const { posters, pitch, end } = await page.$eval(RAIL, (el) => {
      const kids = Array.from(el.children) as HTMLElement[];
      return {
        posters: kids.length,
        pitch: kids[1].offsetLeft - kids[0].offsetLeft,
        end: Math.max(0, el.scrollWidth - el.clientWidth),
      };
    });

    // More posters than the rail has room to page through.
    expect(posters).toBeGreaterThan(dots);
    expect(dots).toBe(Math.floor(end / pitch) + 1);

    // Every dot moves the rail somewhere new — no dead ticks.
    const seen = new Set<number>();
    for (let i = 0; i < dots; i++) {
      await tabs.nth(i).click();
      const { x } = await railAtRest(page);
      expect(seen.has(x)).toBe(false);
      seen.add(x);
    }

    // The final page shows the last poster in full, rather than stopping at its
    // left edge and clipping the leftover pixels off the end of the rail.
    const clipped = await page.$eval(RAIL, (el) => {
      const last = el.lastElementChild as HTMLElement;
      return last.offsetLeft + last.offsetWidth - (el.scrollLeft + el.clientWidth);
    });
    expect(clipped).toBeLessThanOrEqual(1);
  });

  // Tapping the last page must not report a phantom change back to the parent,
  // which reads any reported change as a deliberate interaction and stops the
  // autoplay for good.
  test('the last page holds the end without drifting', async ({
    page,
  }) => {
    const tabs = await openHome(page);
    const count = await tabs.count();

    await tabs.nth(count - 1).click();
    await expect
      .poll(async () => (await railCard(page)).x, { timeout: 5000 })
      .toBe(
        await page.$eval(RAIL, (el) => el.scrollWidth - el.clientWidth),
      );

    // Still parked at the end a moment later — nothing dragged it back.
    const settled = (await railCard(page)).x;
    await page.waitForTimeout(1200);
    expect((await railCard(page)).x).toBe(settled);
    await expect(tabs.nth(count - 1)).toHaveAttribute('aria-selected', 'true');
  });
});
