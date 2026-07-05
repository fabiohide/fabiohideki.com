import { test, expect } from '@playwright/test';
import { setupMocks } from './helpers/api-mocks.js';

test.describe('Tier 2: Navigation Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Standard setup with regular player logged in
    await setupMocks(page, {
      username: 'regular_player',
      name: 'Regular Player',
      isAdmin: false,
      packOpened: true
    });

    await page.addInitScript(() => {
      window.localStorage.setItem('foc_username', 'regular_player');
    });
  });

  test('2.1: Navigation Bar switches routes and updates URL hashes', async ({ page }) => {
    await page.goto('/foc-album/');

    // Click Album tab
    await page.click('button[data-route="album"]');
    await expect(page).toHaveURL(/.*#album/);
    
    // Check album elements (like book container or class)
    const albumView = page.locator('.album-view, .book-container');
    await expect(albumView).toBeVisible();

    // Click Tabela tab
    await page.click('button[data-route="table"]');
    await expect(page).toHaveURL(/.*#table/);
    
    const tableView = page.locator('.table-view, .panel.standings-panel');
    await expect(tableView).toBeVisible();

    // Click Report tab
    await page.click('button[data-route="report"]');
    await expect(page).toHaveURL(/.*#report/);
    
    const reportView = page.locator('.report-view, .page-view.report-view');
    await expect(reportView).toBeVisible();

    // Click Pacotinhos tab
    await page.click('button[data-route="packs"]');
    await expect(page).toHaveURL(/.*#packs/);
  });

  test('2.2: Sub-tabs navigation on Match Report page', async ({ page }) => {
    await page.goto('/foc-album/#report');

    // Make sure we are on report page
    await expect(page.locator('.report-view')).toBeVisible();

    // Switch to Desafios tab
    await page.click('button[data-action="setReportTab"][data-value="challenges"]');
    
    // Verify that the challenges listing is visible
    const challengesList = page.locator('.challenges-list, .challenges-grid');
    await expect(challengesList).toBeVisible();

    // Switch back to Partida tab
    await page.click('button[data-action="setReportTab"][data-value="match"]');
    
    // Verify that match info panel is visible
    const matchPanel = page.locator('.match-card').first();
    await expect(matchPanel).toBeVisible();
  });
});
