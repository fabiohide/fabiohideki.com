import { test, expect } from '@playwright/test';
import { setupMocks } from './helpers/api-mocks.js';

test.describe('Tier 3: Match Reporting & Houses Selection', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate user before each test
    await setupMocks(page, {
      username: 'fabio_hideki',
      name: 'Fábio Hideki',
      isAdmin: false,
      packOpened: true
    });

    await page.addInitScript(() => {
      window.localStorage.setItem('foc_username', 'fabio_hideki');
    });
  });

  test('3.1: Entering deck link and selecting houses enables picks and submit button', async ({ page }) => {
    await page.goto('/foc-album/#report');

    // Input deck link
    await page.fill('#deck-link-input', 'https://www.decksofkeyforge.com/decks/11111111-2222-3333-4444-555555555555');
    
    // Select 3 houses manually
    await page.click('button[data-action="toggleHouse"][data-value="BRB"]');
    await page.click('button[data-action="toggleHouse"][data-value="DIS"]');
    await page.click('button[data-action="toggleHouse"][data-value="LGS"]');

    // Select keys score (e.g. 3x1)
    const incA = page.locator('button[data-action="adjustKeys"][data-side="a"][data-amount="1"]');
    const incB = page.locator('button[data-action="adjustKeys"][data-side="b"][data-amount="1"]');
    await incA.click();
    await incA.click();
    await incA.click();
    await incB.click(); // 3x1 score

    // Verify pick list appears for the selected houses
    const pickerList = page.locator('.picker-list');
    await expect(pickerList).toBeVisible();

    // Select 3 picks (since we are in fallback mode and expected picks = 3 keys)
    await page.click('button[data-action="toggleReportPick"][data-value="BRB 1"]');
    await page.click('button[data-action="toggleReportPick"][data-value="DIS 1"]');
    await page.click('button[data-action="toggleReportPick"][data-value="LGS 1"]');

    // Submit button should be enabled
    const submitBtn = page.locator('button[data-action="submitSingleReport"]');
    await expect(submitBtn).toBeEnabled();
  });

  test('3.2: Score validations (draws, limits, WO exclusion, winner condition)', async ({ page }) => {
    await page.goto('/foc-album/#report');

    // Setup deck link and houses
    await page.fill('#deck-link-input', 'https://www.decksofkeyforge.com/decks/22222222-3333-4444-5555-666666666666');
    await page.click('button[data-action="toggleHouse"][data-value="BRB"]');
    await page.click('button[data-action="toggleHouse"][data-value="DIS"]');
    await page.click('button[data-action="toggleHouse"][data-value="LGS"]');

    // Locate steppers
    const decA = page.locator('button[data-action="adjustKeys"][data-side="a"][data-amount="-1"]');
    const incA = page.locator('button[data-action="adjustKeys"][data-side="a"][data-amount="1"]');
    const decB = page.locator('button[data-action="adjustKeys"][data-side="b"][data-amount="-1"]');
    const incB = page.locator('button[data-action="adjustKeys"][data-side="b"][data-amount="1"]');

    // Initially keys are 0x0. Set score to 3x3 (draw)
    for (let i = 0; i < 3; i++) {
      await incA.click();
      await incB.click();
    }

    const errorEl = page.locator('.alert-box.is-error');
    await expect(errorEl).toBeVisible();
    await expect(errorEl).toHaveText(/Não são permitidos empates/);

    // Set score to 2x1 (no winner with 3 keys)
    await decA.click();
    await decB.click();
    await decB.click(); // Now A is 2, B is 1
    await expect(errorEl).toBeVisible();
    await expect(errorEl).toHaveText(/O vencedor deve ter exatamente 3 chaves/);

    // Set score to 3x1 (valid winner A)
    await incA.click(); // A is 3, B is 1
    await expect(errorEl).not.toBeVisible();
  });

  test('3.3: Consolation behaviour when score is 0x3 (loser gets 0 chaves)', async ({ page }) => {
    await page.goto('/foc-album/#report');

    // Setup deck link and houses
    await page.fill('#deck-link-input', 'https://www.decksofkeyforge.com/decks/22222222-3333-4444-5555-666666666666');
    await page.click('button[data-action="toggleHouse"][data-value="BRB"]');
    await page.click('button[data-action="toggleHouse"][data-value="DIS"]');
    await page.click('button[data-action="toggleHouse"][data-value="LGS"]');

    const incB = page.locator('button[data-action="adjustKeys"][data-side="b"][data-amount="1"]');

    // Set opponent to 3 (score 0x3 = I lost, consolation)
    for (let i = 0; i < 3; i++) {
      await incB.click();
    }

    // Verify success/consolation alert is shown
    const consolationEl = page.locator('.alert-box.is-success');
    await expect(consolationEl).toBeVisible();
    await expect(consolationEl).toHaveText(/Consolação: Você fez 0 chaves/);

    // Verify submit button is enabled because 0 picks are expected
    const submitBtn = page.locator('button[data-action="submitSingleReport"]');
    await expect(submitBtn).toBeEnabled();
  });
});
