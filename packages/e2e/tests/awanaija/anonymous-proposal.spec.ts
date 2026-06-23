import { test, expect } from '@playwright/test';

// Runs logged-OUT: no storageState cookie, so the user has no session.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Anonymous proposal capture @awanaija', () => {
  test('logged-out user submits a proposal without a login wall', async ({
    page,
    request,
    baseURL,
  }) => {
    // Grab a real official id from the API the app talks to.
    const res = await request.get(`${baseURL}/api/officials?limit=1`);
    expect(res.ok()).toBeTruthy();
    const official = (await res.json()).data[0];
    expect(official?.id).toBeTruthy();

    await page.goto(
      `/proposals/new?officialId=${official.id}&targetField=biography`,
    );

    // Fill the proposed value (biography renders a textarea) and submit.
    await page
      .getByRole('textbox')
      .first()
      .fill('E2E anonymous biography contribution.');
    await page.getByRole('button', { name: /submit/i }).click();

    // Success screen appears — NO "Sign in to submit your proposal" wall blocks it.
    await expect(page.getByText(/Proposal Submitted/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByText(/Sign in to submit your proposal/i),
    ).toHaveCount(0);

    // The optional, non-blocking "Log in" prompt is offered instead.
    await expect(
      page.getByRole('button', { name: /^Log in$/i }),
    ).toBeVisible();
  });
});
