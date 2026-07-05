import { test, expect } from '@playwright/test';
import { setupMocks } from './helpers/api-mocks.js';

test.describe('Tier 3: Match Reporting & DoK Integration', () => {
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

  test('3.1: Searching high-sas deck link renders name, houses, expansion, and green SAS badge', async ({ page }) => {
    await page.goto('/foc-album/#report');

    // Input high-sas deck link
    await page.fill('#deck-link-input', 'https://www.decksofkeyforge.com/decks/11111111-2222-3333-4444-555555555555-high-sas');
    await page.click('button[data-action="fetchDeck"]');

    // Assert deck card details are visible
    const deckCard = page.locator('.deck-card');
    await expect(deckCard).toBeVisible();

    await expect(deckCard.locator('h4')).toHaveText('Deck Apelão do FOC');
    
    // Check houses listed (should have Brobnar, Dis, Logos in some format)
    const housesText = await deckCard.locator('.house-chip').allTextContents();
    const joinedHouses = housesText.join(' ');
    expect(joinedHouses).toContain('BRB');
    expect(joinedHouses).toContain('DIS');
    expect(joinedHouses).toContain('LGS');

    // Check SAS badge and difference
    const sasBadge = deckCard.locator('.status-pill');
    await expect(sasBadge).toHaveText(/SAS 85 \(-1\)/);
    // Green range starts at SAS 82
    await expect(sasBadge).toHaveClass(/sas-green/);
  });

  test('3.2: SAS Color Ranges Validation (yellow and red)', async ({ page }) => {
    await page.goto('/foc-album/#report');

    // 1. Check mid-sas (SAS 79 -> Yellow)
    await page.fill('#deck-link-input', 'https://www.decksofkeyforge.com/decks/22222222-3333-4444-5555-666666666666-mid-sas');
    await page.click('button[data-action="fetchDeck"]');
    
    let sasBadge = page.locator('.deck-card .status-pill');
    await expect(sasBadge).toBeVisible();
    await expect(sasBadge).toHaveText(/SAS 79 \(-7\)/);
    await expect(sasBadge).toHaveClass(/sas-yellow/);

    // Remove deck to search again
    await page.click('button[data-action="removeDeck"]');
    await expect(page.locator('#deck-link-input')).toBeVisible();

    // 2. Check low-sas (SAS 72 -> Red)
    await page.fill('#deck-link-input', 'https://www.decksofkeyforge.com/decks/33333333-4444-5555-6666-777777777777-low-sas');
    await page.click('button[data-action="fetchDeck"]');
    
    sasBadge = page.locator('.deck-card .status-pill');
    await expect(sasBadge).toBeVisible();
    await expect(sasBadge).toHaveText(/SAS 72 \(-14\)/);
    await expect(sasBadge).toHaveClass(/sas-red/);
  });

  test('3.3: Score validations (draws, limits, WO exclusion, winner condition)', async ({ page }) => {
    await page.goto('/foc-album/#report');

    // Fetch a valid deck so the score section displays fully
    await page.fill('#deck-link-input', 'https://www.decksofkeyforge.com/decks/22222222-3333-4444-5555-666666666666-mid-sas');
    await page.click('button[data-action="fetchDeck"]');

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

  test('3.4: Consolation behaviour when score is 0x3 (loser gets 0 chaves)', async ({ page }) => {
    await page.goto('/foc-album/#report');

    // Fetch a valid deck
    await page.fill('#deck-link-input', 'https://www.decksofkeyforge.com/decks/22222222-3333-4444-5555-666666666666-mid-sas');
    await page.click('button[data-action="fetchDeck"]');
    await expect(page.locator('.deck-card')).toBeVisible();

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
