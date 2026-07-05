import { test, expect } from '@playwright/test';
import { setupMocks } from './helpers/api-mocks.js';

test.describe('Tier 1: Smoke Checks', () => {
  test('1.1: Unauthenticated user sees login form', async ({ page }) => {
    // Set up standard mock responses
    await setupMocks(page, { packOpened: true });

    // Open home page
    await page.goto('/foc-album/');

    // Assert login view is visible
    const loginView = page.locator('.login-view');
    await expect(loginView).toBeVisible();

    // Assert inputs and buttons
    const usernameInput = page.locator('#usernameInput');
    await expect(usernameInput).toBeVisible();
    await expect(usernameInput).toHaveAttribute('required', '');

    const submitBtn = page.locator('#loginSubmitBtn');
    await expect(submitBtn).toBeVisible();
  });

  test('1.2: Authenticated user logs in successfully', async ({ page }) => {
    await setupMocks(page, {
      username: 'teste_1',
      name: 'Jogador Teste',
      isAdmin: false,
      packOpened: true
    });

    await page.goto('/foc-album/');

    // Log in
    await page.fill('#usernameInput', 'teste_1');
    await page.click('#loginSubmitBtn');

    // Verify transition to main screen and bottom navigation presence
    const bottomNav = page.locator('nav.bottom-nav');
    await expect(bottomNav).toBeVisible();

    // Verify nav items
    await expect(page.locator('button[data-route="packs"]')).toBeVisible();
    await expect(page.locator('button[data-route="album"]')).toBeVisible();
    await expect(page.locator('button[data-route="report"]')).toBeVisible();
    await expect(page.locator('button[data-route="table"]')).toBeVisible();
  });

  test('1.3: Admin user sees admin panel icon', async ({ page }) => {
    // Case A: Admin user logs in
    await setupMocks(page, {
      username: 'fabio_hideki',
      isAdmin: true,
      packOpened: true
    });

    // We can pre-authenticate using localStorage in page init
    await page.addInitScript(() => {
      window.localStorage.setItem('foc_username', 'fabio_hideki');
    });

    await page.goto('/foc-album/');

    // Verify admin button is visible
    const adminBtn = page.locator('[data-route="admin"]');
    await expect(adminBtn).toBeVisible();
  });

  test('1.4: Non-admin user does not see admin panel icon', async ({ page }) => {
    // Case B: Non-admin user logs in
    await setupMocks(page, {
      username: 'regular_player',
      isAdmin: false,
      packOpened: true
    });

    await page.addInitScript(() => {
      window.localStorage.setItem('foc_username', 'regular_player');
    });

    await page.goto('/foc-album/');

    // Verify admin button is NOT visible
    const adminBtn = page.locator('[data-route="admin"]');
    await expect(adminBtn).not.toBeVisible();
  });
});
