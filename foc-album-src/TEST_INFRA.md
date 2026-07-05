# TEST_INFRA.md — Testing Infrastructure Setup

This document describes the E2E testing infrastructure setup using Playwright, including dependencies, server configuration, network mocking strategies, and commands to run tests.

---

## 1. Installation and Dependencies

The project uses `pnpm` as its package manager. To set up Playwright and its browser binaries, run the following commands:

```bash
# 1. Install Playwright test runner as a development dependency
pnpm add -D @playwright/test

# 2. Install Playwright browser binaries and OS-level dependencies
pnpm exec playwright install --with-deps
```

---

## 2. Playwright Configuration (`playwright.config.js`)

Create a `playwright.config.js` in the project root directory. Since the Vite server runs with a base path of `/foc-album/` (defined in `vite.config.js`), the Playwright `baseURL` must point to `http://localhost:5173/foc-album/`.

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173/foc-album/',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173/foc-album/',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 3. Network Mocking Strategy (Supabase and CORS Proxy)

To run E2E tests in a hermetic environment without a live database or internet connection, Playwright's network routing API (`page.route`) is used to mock API endpoints.

### 3.1. Supabase REST and RPC Mocking Helper
Define a helper `tests/e2e/helpers/api-mocks.js` to intercept Supabase client calls.

### 3.2. Decks of Keyforge (DoK) CORS Proxy Mocking
To mock the asynchronous retrieval of deck specifications via `corsproxy.io`, the endpoints are intercepted and respond with mocked JSON payloads (representing deck name, SAS score, expansion, and houses list).

---

## 4. How to Run E2E Tests

Add the following scripts to `package.json`:

```json
"scripts": {
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:debug": "playwright test --debug"
}
```

Execute them using `pnpm`:

```bash
# Run tests in headless mode
pnpm run test:e2e

# Run tests in UI interactive mode
pnpm run test:e2e:ui

# Debug tests step-by-step
pnpm run test:e2e:debug
```
