import { test, expect } from '@playwright/test';

const CHAT_MESSAGE = 'What is the budget for Lagos State in 2024?';

test.describe('Conversation Sharing @web', () => {
  test.slow();

  let shareUrl: string;

  // Send a message and wait for an AI response so there is an active conversation
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Type a message in the chat input
    const textarea = page.locator('textarea');
    await textarea.waitFor({ timeout: 15_000 });
    await textarea.fill(CHAT_MESSAGE);

    // Click the send button
    const sendButton = page.locator('button:has(svg.lucide-arrow-up)');
    await sendButton.click();

    // Wait for at least one assistant response to appear
    // The share button only shows when there is an active conversation with messages
    await page.locator('[data-tour="share-button"]').waitFor({ timeout: 60_000 });
  });

  test('share button opens share dialog', async ({ page }) => {
    const shareButton = page.locator('[data-tour="share-button"]');
    await expect(shareButton).toBeVisible();

    await shareButton.click();

    // The share dialog should appear with the heading "Share Conversation"
    await expect(
      page.getByText('Share Conversation'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('toggle public/private works', async ({ page }) => {
    // Open share dialog
    await page.locator('[data-tour="share-button"]').click();
    await expect(page.getByText('Share Conversation')).toBeVisible();

    // Initially the conversation should be private
    await expect(page.getByText('Private')).toBeVisible();
    await expect(page.getByText('Only you can see this conversation')).toBeVisible();

    // Click the toggle to make it public
    await page.getByText('Private').click();

    // Should now show public state
    await expect(page.getByText('Public')).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText('Anyone with the link can view this conversation'),
    ).toBeVisible();

    // Toggle back to private
    await page.getByText('Public').click();
    await expect(page.getByText('Private')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Only you can see this conversation')).toBeVisible();
  });

  test('when public, shareable URL is displayed', async ({ page }) => {
    // Open share dialog and toggle to public
    await page.locator('[data-tour="share-button"]').click();
    await expect(page.getByText('Share Conversation')).toBeVisible();

    // Toggle to public
    await page.getByText('Private').click();
    await expect(page.getByText('Public')).toBeVisible({ timeout: 10_000 });

    // A shareable URL input should now be visible with /chat/ in the value
    const urlInput = page.locator('input[readonly]');
    await expect(urlInput).toBeVisible({ timeout: 5_000 });

    const urlValue = await urlInput.inputValue();
    expect(urlValue).toMatch(/\/chat\/.+/);

    // Store the share URL for other tests
    shareUrl = urlValue;
  });

  test('copy button is present', async ({ page }) => {
    // Open share dialog and toggle to public
    await page.locator('[data-tour="share-button"]').click();
    await expect(page.getByText('Share Conversation')).toBeVisible();

    // Toggle to public
    await page.getByText('Private').click();
    await expect(page.getByText('Public')).toBeVisible({ timeout: 10_000 });

    // The copy button should be visible
    const copyButton = page.getByRole('button', { name: /copy/i });
    await expect(copyButton).toBeVisible();
  });

  test('public URL loads without auth (incognito context)', async ({
    page,
    browser,
  }) => {
    // Open share dialog and make conversation public
    await page.locator('[data-tour="share-button"]').click();
    await expect(page.getByText('Share Conversation')).toBeVisible();
    await page.getByText('Private').click();
    await expect(page.getByText('Public')).toBeVisible({ timeout: 10_000 });

    // Grab the share URL
    const urlInput = page.locator('input[readonly]');
    await expect(urlInput).toBeVisible({ timeout: 5_000 });
    const publicUrl = await urlInput.inputValue();
    expect(publicUrl).toMatch(/\/chat\/.+/);

    // Open a brand-new incognito context (no auth cookies)
    const incognitoContext = await browser.newContext();
    const incognitoPage = await incognitoContext.newPage();

    try {
      await incognitoPage.goto(publicUrl);

      // The page should load successfully and not redirect to /login
      await incognitoPage.waitForLoadState('domcontentloaded');
      expect(incognitoPage.url()).toContain('/chat/');
      expect(incognitoPage.url()).not.toContain('/login');
    } finally {
      await incognitoContext.close();
    }
  });

  test('public view shows conversation messages (read-only)', async ({
    page,
    browser,
  }) => {
    // Make conversation public and get the share URL
    await page.locator('[data-tour="share-button"]').click();
    await expect(page.getByText('Share Conversation')).toBeVisible();
    await page.getByText('Private').click();
    await expect(page.getByText('Public')).toBeVisible({ timeout: 10_000 });

    const urlInput = page.locator('input[readonly]');
    await expect(urlInput).toBeVisible({ timeout: 5_000 });
    const publicUrl = await urlInput.inputValue();

    // Open in incognito
    const incognitoContext = await browser.newContext();
    const incognitoPage = await incognitoContext.newPage();

    try {
      await incognitoPage.goto(publicUrl);
      await incognitoPage.waitForLoadState('domcontentloaded');

      // The user's original message should be visible on the public page
      await expect(
        incognitoPage.getByText(CHAT_MESSAGE),
      ).toBeVisible({ timeout: 15_000 });

      // There should be no chat input textarea (read-only view)
      await expect(incognitoPage.locator('textarea')).toHaveCount(0);
    } finally {
      await incognitoContext.close();
    }
  });

  test('public view has "Ask your own question" CTA', async ({
    page,
    browser,
  }) => {
    // Make conversation public and get the share URL
    await page.locator('[data-tour="share-button"]').click();
    await expect(page.getByText('Share Conversation')).toBeVisible();
    await page.getByText('Private').click();
    await expect(page.getByText('Public')).toBeVisible({ timeout: 10_000 });

    const urlInput = page.locator('input[readonly]');
    await expect(urlInput).toBeVisible({ timeout: 5_000 });
    const publicUrl = await urlInput.inputValue();

    // Open in incognito
    const incognitoContext = await browser.newContext();
    const incognitoPage = await incognitoContext.newPage();

    try {
      await incognitoPage.goto(publicUrl);
      await incognitoPage.waitForLoadState('domcontentloaded');

      // The CTA link should be visible
      const ctaLink = incognitoPage.getByRole('link', {
        name: /ask your own question/i,
      });
      await expect(ctaLink).toBeVisible({ timeout: 15_000 });

      // The CTA should link to the home page
      await expect(ctaLink).toHaveAttribute('href', '/');
    } finally {
      await incognitoContext.close();
    }
  });

  test('toggling back to private makes URL inaccessible', async ({
    page,
    browser,
  }) => {
    // Make conversation public first
    await page.locator('[data-tour="share-button"]').click();
    await expect(page.getByText('Share Conversation')).toBeVisible();
    await page.getByText('Private').click();
    await expect(page.getByText('Public')).toBeVisible({ timeout: 10_000 });

    // Grab the public URL
    const urlInput = page.locator('input[readonly]');
    await expect(urlInput).toBeVisible({ timeout: 5_000 });
    const publicUrl = await urlInput.inputValue();

    // Toggle back to private
    await page.getByText('Public').click();
    await expect(page.getByText('Private')).toBeVisible({ timeout: 10_000 });

    // Close the share dialog
    await page.keyboard.press('Escape');

    // Open the old public URL in incognito — should 404 or redirect
    const incognitoContext = await browser.newContext();
    const incognitoPage = await incognitoContext.newPage();

    try {
      const response = await incognitoPage.goto(publicUrl);

      // Either the server returns a 404 status, or the page shows "Not Found",
      // or the user gets redirected away from the /chat/ slug
      const is404Response = response !== null && response.status() === 404;
      const hasNotFoundText = await incognitoPage
        .getByText(/not found/i)
        .isVisible()
        .catch(() => false);
      const wasRedirected = !incognitoPage.url().includes('/chat/');

      expect(is404Response || hasNotFoundText || wasRedirected).toBe(true);
    } finally {
      await incognitoContext.close();
    }
  });
});
