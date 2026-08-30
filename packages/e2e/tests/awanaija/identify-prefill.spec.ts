import { test, expect } from '@playwright/test';

// Regression tests for the "Help us identify them" deep-link prefill.
//
// Bug history: senders across the app spell the House-of-Reps role both ways
// ("rep" from geo/officials endpoints, "representative" in the identify form's
// ROLE_OPTIONS). A role=rep link used to match nothing, so the form opened with
// no seat selected and the constituency context was discarded. The form now
// normalizes the alias at the boundary (ctxFromParams/roleConfig), and links
// carrying a constituencyCode skip the manual gate entirely.

// Runs logged-OUT, same as the other awanaija specs.
test.use({ storageState: { cookies: [], origins: [] } });

const SEAT_PARAMS =
  'stateCode=abia&stateName=Abia' +
  '&lgaCode=abia_aba_north&lgaName=Aba%20North' +
  '&wardCode=abia_aba_north_ariaria_market&wardName=Ariaria%20Market' +
  '&constituencyCode=fed_abia_aba_north_aba_south&constituencyName=Aba%20North%2FAba%20South';

test.describe('Identify deep-link prefill @awanaija', () => {
  for (const role of ['rep', 'representative']) {
    test(`role=${role} with constituency context skips the seat gate pre-filled`, async ({
      page,
    }) => {
      await page.goto(`/proposals/new?role=${role}&${SEAT_PARAMS}`);

      // Full context → no "Identify an official" gate; we land on the seat
      // itself (either the blank identify form or the seat-verification view,
      // depending on whether candidates already exist).
      await expect(
        page.getByRole('heading', { name: /House of Reps/i }),
      ).toBeVisible({ timeout: 15000 });
      await expect(
        page.getByRole('heading', { name: 'Identify an official' }),
      ).toHaveCount(0);

      // The pre-filled seat context is displayed, constituency included.
      await expect(
        page.getByText('Abia › Aba North › Ariaria Market › Aba North/Aba South').first(),
      ).toBeVisible();
    });
  }

  test('locked deep-link context still offers a change-location escape', async ({
    page,
  }) => {
    await page.goto(`/proposals/new?role=rep&${SEAT_PARAMS}`);
    await expect(
      page.getByRole('heading', { name: /House of Reps/i }),
    ).toBeVisible({ timeout: 15000 });

    // The prefilled constituency comes from ward-mapping data that can be
    // wrong; the user must be able to correct the seat without editing the URL.
    // On the verification view the equivalent escape is "Suggest a different
    // name"; on the blank form it's the change-location link.
    const escape = page
      .getByRole('button', { name: /Change position \/ location|Suggest a different name/i })
      .first();
    await expect(escape).toBeVisible();
  });

  test('role=rep without a constituency falls back to the manual gate', async ({
    page,
  }) => {
    await page.goto('/proposals/new?role=rep&stateCode=abia&stateName=Abia');

    // Partial context → the gate renders, with the aliased role already
    // selected (previously role=rep matched no option at all).
    await expect(
      page.getByRole('heading', { name: 'Identify an official' }),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByRole('button', { name: /House of Reps Member/i }),
    ).toHaveClass(/border-emerald-500/);
    // Location cascade only renders once a role is recognized.
    await expect(page.getByText('Select constituency')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });
});
