import { test, expect } from '@playwright/test';

test.describe('Feedback Feature @web', () => {
  // ─── FAB Button ──────────────────────────────────────────────────────

  test.describe('Feedback FAB', () => {
    test('feedback FAB button is visible on the home page', async ({ page }) => {
      await page.goto('/');

      const fab = page.locator('[data-tour="feedback-button"]');
      await expect(fab).toBeVisible();
    });

    test('clicking FAB opens feedback modal', async ({ page }) => {
      await page.goto('/');

      const fab = page.locator('[data-tour="feedback-button"]');
      await fab.click();

      // Modal should appear with the "Send Feedback" heading
      await expect(
        page.getByRole('heading', { name: /send feedback/i }),
      ).toBeVisible();
    });
  });

  // ─── Feedback Modal ──────────────────────────────────────────────────

  test.describe('Feedback Modal', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.locator('[data-tour="feedback-button"]').click();
      await expect(
        page.getByRole('heading', { name: /send feedback/i }),
      ).toBeVisible();
    });

    test('category pills are selectable', async ({ page }) => {
      const categories = ['Bug', 'Feature', 'Data Issue', 'General'];

      for (const category of categories) {
        const pill = page.getByRole('button', { name: category, exact: true });
        await expect(pill).toBeVisible();
        await pill.click();

        // The selected pill should have the active style (emerald background)
        await expect(pill).toHaveClass(/bg-emerald-600/);
      }
    });

    test('subject and message fields accept input', async ({ page }) => {
      const subjectInput = page.getByPlaceholder(/brief summary/i);
      await expect(subjectInput).toBeVisible();
      await subjectInput.fill('Test subject input');
      await expect(subjectInput).toHaveValue('Test subject input');

      const messageTextarea = page.getByPlaceholder(/describe your feedback/i);
      await expect(messageTextarea).toBeVisible();
      await messageTextarea.fill('Test message content');
      await expect(messageTextarea).toHaveValue('Test message content');
    });

    test('empty subject/message prevents submission', async ({ page }) => {
      // Leave subject and message empty — submit button should be disabled
      const submitButton = page.getByRole('button', {
        name: /submit feedback/i,
      });
      await expect(submitButton).toBeDisabled();

      // Fill only subject — still disabled
      const subjectInput = page.getByPlaceholder(/brief summary/i);
      await subjectInput.fill('Only subject');
      await expect(submitButton).toBeDisabled();

      // Clear subject, fill only message — still disabled
      await subjectInput.clear();
      const messageTextarea = page.getByPlaceholder(/describe your feedback/i);
      await messageTextarea.fill('Only message');
      await expect(submitButton).toBeDisabled();
    });

    test('submit with valid data succeeds and shows success state', async ({
      page,
    }) => {
      // Select a category
      await page
        .getByRole('button', { name: 'Bug', exact: true })
        .click();

      // Fill subject and message
      const subjectInput = page.getByPlaceholder(/brief summary/i);
      await subjectInput.fill('E2E Test Bug Report');

      const messageTextarea = page.getByPlaceholder(/describe your feedback/i);
      await messageTextarea.fill(
        'This is an automated E2E test feedback submission.',
      );

      // Submit button should be enabled now
      const submitButton = page.getByRole('button', {
        name: /submit feedback/i,
      });
      await expect(submitButton).toBeEnabled();
      await submitButton.click();

      // Wait for success state — "Thank you!" heading appears
      await expect(page.getByText(/thank you/i)).toBeVisible({
        timeout: 15_000,
      });
      await expect(
        page.getByText(/submitted successfully/i),
      ).toBeVisible();
    });
  });

  // ─── Profile Feedback Tab ────────────────────────────────────────────

  test.describe('Profile Feedback History', () => {
    test('profile feedback tab shows submitted feedback', async ({ page }) => {
      // First submit feedback so there is at least one item
      await page.goto('/');
      await page.locator('[data-tour="feedback-button"]').click();
      await expect(
        page.getByRole('heading', { name: /send feedback/i }),
      ).toBeVisible();

      await page
        .getByRole('button', { name: 'Feature', exact: true })
        .click();
      await page
        .getByPlaceholder(/brief summary/i)
        .fill('E2E Profile Tab Test');
      await page
        .getByPlaceholder(/describe your feedback/i)
        .fill('Feedback created to verify profile history tab.');

      await page
        .getByRole('button', { name: /submit feedback/i })
        .click();

      // Wait for success state
      await expect(page.getByText(/thank you/i)).toBeVisible({
        timeout: 15_000,
      });

      // Navigate to the profile feedback tab
      await page.goto('/profile?tab=feedback');

      // The feedback list should load and contain the submitted item
      await expect(
        page.getByText('E2E Profile Tab Test'),
      ).toBeVisible({ timeout: 15_000 });
    });
  });
});
