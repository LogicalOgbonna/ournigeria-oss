import { test, expect } from '@playwright/test';

test.describe('Chat Interface @web', () => {
  // ─── Welcome state ──────────────────────────────────────────────────

  test.describe('Welcome State', () => {
    test('chat page loads with WelcomeHero and suggested questions', async ({
      page,
    }) => {
      await page.goto('/');

      // WelcomeHero shows the branding title
      await expect(
        page.getByRole('heading', { name: /ournigeria/i }),
      ).toBeVisible();

      // Suggested question cards are rendered (grid of 6)
      const suggestionCards = page.locator('.grid .cursor-pointer');
      await expect(suggestionCards.first()).toBeVisible({ timeout: 10_000 });

      const count = await suggestionCards.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('chat input is present with placeholder text', async ({ page }) => {
      await page.goto('/');

      const textarea = page.locator('textarea');
      await expect(textarea).toBeVisible();
      await expect(textarea).toHaveAttribute('placeholder', /.+/);
    });
  });

  // ─── Tool & language selectors ────────────────────────────────────

  test.describe('Selectors', () => {
    test('tool selector dropdown works and can select different tools', async ({
      page,
    }) => {
      await page.goto('/');

      const toolSelector = page.locator('[data-tour="tool-selector"]');
      await expect(toolSelector).toBeVisible();

      // Default label should be "Auto"
      await expect(toolSelector.locator('button').first()).toContainText(
        'Auto',
      );

      // Open the dropdown
      await toolSelector.locator('button').first().click();

      // Dropdown options should appear — verify at least Budget and Corruption
      const dropdown = page.locator('[data-tour="tool-selector"] > div');
      await expect(dropdown.getByText('Budget')).toBeVisible();
      await expect(
        dropdown.getByText('Corruption Tracker'),
      ).toBeVisible();
      await expect(dropdown.getByText('GovSpend')).toBeVisible();

      // Select "Budget"
      await dropdown
        .locator('button', { hasText: /^Budget$/ })
        .click();

      // Button label should now read "Budget"
      await expect(toolSelector.locator('button').first()).toContainText(
        'Budget',
      );

      // "Locked to" indicator should appear
      await expect(page.getByText(/locked to budget/i)).toBeVisible();
    });

    test('language selector works and can toggle English/Pidgin', async ({
      page,
    }) => {
      await page.goto('/');

      const langSelector = page.locator('[data-tour="language-selector"]');
      await expect(langSelector).toBeVisible();

      // Default should be English
      await expect(langSelector.locator('button').first()).toContainText(
        'English',
      );

      // Open language dropdown
      await langSelector.locator('button').first().click();

      // Options should appear
      const langDropdown = page.locator(
        '[data-tour="language-selector"] > div',
      );
      await expect(langDropdown.getByText('English')).toBeVisible();
      await expect(langDropdown.getByText('Pidgin')).toBeVisible();

      // Select Pidgin
      await langDropdown
        .locator('button', { hasText: /^Pidgin$/ })
        .click();

      // Button label should now read "Pidgin"
      await expect(langSelector.locator('button').first()).toContainText(
        'Pidgin',
      );
    });
  });

  // ─── Send message validation ──────────────────────────────────────

  test.describe('Message Validation', () => {
    test('empty message cannot be sent (send button disabled)', async ({
      page,
    }) => {
      await page.goto('/');

      const textarea = page.locator('textarea');
      await expect(textarea).toBeVisible();

      // Ensure textarea is empty
      await textarea.fill('');

      // The send button should be disabled when input is empty
      const sendButton = page.locator('textarea ~ button, textarea + * button').last();
      await expect(sendButton).toBeDisabled();
    });
  });

  // ─── Sending messages & SSE streaming ─────────────────────────────

  test.describe('Chat Messaging', () => {
    test('typing a message and pressing Enter sends it', async ({ page }) => {
      test.slow(); // SSE streaming needs generous timeout

      await page.goto('/');

      const textarea = page.locator('textarea');
      await expect(textarea).toBeVisible();

      await textarea.fill('What is the education budget for Lagos state?');
      await textarea.press('Enter');

      // User message should appear as a bubble with the sent text
      await expect(
        page.getByText('What is the education budget for Lagos state?'),
      ).toBeVisible({ timeout: 10_000 });
    });

    test('user message appears in chat as a bubble', async ({ page }) => {
      test.slow();

      await page.goto('/');

      const textarea = page.locator('textarea');
      await textarea.fill('How much did Nigeria spend on healthcare?');
      await textarea.press('Enter');

      // User message bubble: green gradient, right-aligned
      const userBubble = page.locator(
        '.bg-gradient-to-br.from-emerald-600.to-emerald-700',
      );
      await expect(userBubble.first()).toBeVisible({ timeout: 10_000 });
      await expect(userBubble.first()).toContainText(
        'How much did Nigeria spend on healthcare?',
      );
    });

    test('SSE streaming shows assistant response', async ({ page }) => {
      test.slow();

      await page.goto('/');

      const textarea = page.locator('textarea');
      await textarea.fill('What is Lagos state budget for 2024?');
      await textarea.press('Enter');

      // Wait for either typing indicator or streaming text to appear
      const typingOrResponse = page
        .locator('.animate-pulse, .bg-emerald-400')
        .first()
        .or(
          page.locator(
            '.rounded-2xl.rounded-tl-sm.bg-slate-50, .rounded-2xl.rounded-tl-sm.dark\\:bg-slate-800',
          ).first(),
        );
      await expect(typingOrResponse).toBeVisible({ timeout: 30_000 });

      // Wait for an actual assistant response to finish rendering
      // Assistant messages live in slate-50 rounded bubbles
      const assistantBubble = page.locator(
        '.rounded-2xl.rounded-tl-sm',
      );
      await expect(assistantBubble.first()).toBeVisible({ timeout: 90_000 });

      // Verify the response contains some meaningful text (more than 10 chars)
      const responseText = await assistantBubble.first().textContent();
      expect(responseText?.length).toBeGreaterThan(10);
    });

    test('assistant message shows feedback buttons (thumbs up/down)', async ({
      page,
    }) => {
      test.slow();

      await page.goto('/');

      const textarea = page.locator('textarea');
      await textarea.fill('How much did Kano state allocate for education?');
      await textarea.press('Enter');

      // Wait for assistant response to appear
      const assistantBubble = page.locator('.rounded-2xl.rounded-tl-sm');
      await expect(assistantBubble.first()).toBeVisible({ timeout: 90_000 });

      // Feedback buttons should be visible after response
      const thumbsUp = page.locator('button[title="Good response"]');
      const thumbsDown = page.locator('button[title="Poor response"]');

      await expect(thumbsUp.first()).toBeVisible({ timeout: 15_000 });
      await expect(thumbsDown.first()).toBeVisible();
    });
  });

  // ─── Suggested questions ──────────────────────────────────────────

  test.describe('Suggested Questions', () => {
    test('clicking a suggested question populates and sends', async ({
      page,
    }) => {
      test.slow();

      await page.goto('/');

      // Wait for suggested question cards to render
      const suggestionCards = page.locator('.grid .cursor-pointer');
      await expect(suggestionCards.first()).toBeVisible({ timeout: 10_000 });

      // Capture the text of the first suggestion
      const questionText = await suggestionCards
        .first()
        .locator('p')
        .first()
        .textContent();
      expect(questionText).toBeTruthy();

      // Click the first suggestion
      await suggestionCards.first().click();

      // The WelcomeHero should disappear and the question should appear as a user message
      await expect(
        page.getByText(questionText!, { exact: false }),
      ).toBeVisible({ timeout: 10_000 });

      // Either typing indicator or streaming response should follow
      const typingOrResponse = page
        .locator('.animate-pulse, .bg-emerald-400')
        .first()
        .or(
          page.locator('.rounded-2xl.rounded-tl-sm').first(),
        );
      await expect(typingOrResponse).toBeVisible({ timeout: 30_000 });
    });
  });
});
