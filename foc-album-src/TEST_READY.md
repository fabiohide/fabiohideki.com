# TEST_READY.md — Test Readiness and E2E Test Cases Specifications

This document defines the E2E test cases grouped by Tiers 1-4, establishing concrete expectations, CSS selectors, mock payloads, and assertions.

---

## 1. Readiness Integration Checklist

Before running E2E tests, the developer must ensure:
- [x] `@playwright/test` is installed under devDependencies in `package.json`.
- [x] `playwright.config.js` is placed in the workspace root.
- [x] E2E spec files are located inside the `tests/e2e/` folder.
- [x] The `test:e2e`, `test:e2e:ui`, and `test:e2e:debug` commands are declared in `package.json`.

---

## 2. Test Verification Scope

### Tier 1: Smoke Checks
- **Test 1.1**: Authenticated user vs Unauthenticated user. Navigate to `/foc-album/` and verify that when no username is in `localStorage`, the login page `.login-view` is visible.
- **Test 1.2**: Log in by entering `teste_1` into the input fields, submitting, and verifying that the app shell loads and the bottom navigation elements become visible.
- **Test 1.3**: Admin user check. Log in as an admin (e.g., `fabio_hideki`) and verify that the admin button (the gear/admin icon) is rendered in the header. Log in as a non-admin and verify it is not rendered.

### Tier 2: Navigation Flows
- **Test 2.1**: Clicking on bottom nav tabs switches routes correctly. Click on `Álbum`, verify hash becomes `#album` and the album book container is displayed.
- **Test 2.2**: Click on `Tabela`, verify hash becomes `#table` and classification standings are displayed.
- **Test 2.3**: Click on `Reporte`, verify hash becomes `#report` and match report details are displayed.

### Tier 3: DoK Integration, SAS Badges, & Score Validations
- **Test 3.1**: Input a URL containing `high-sas` (which mocks SAS 85) in the deck link input and click search.
  - Verify that the card preview renders:
    - Deck name: "Deck Apelão do FOC"
    - Houses list.
    - Expansion set label.
  - Verify the SAS badge displays `85`.
  - Verify that the SAS difference badge shows `-1` (85 - 86).
  - Assert the SAS badge color is green (`sas-green`).
- **Test 3.2**: Paste a deck URL containing `mid-sas` (which mocks SAS 79) and click search.
  - Assert badge displays `79` with difference `-7`.
  - Assert the badge color class is yellow (`sas-yellow`).
- **Test 3.3**: Paste a deck URL containing `low-sas` (which mocks SAS 72) and click search.
  - Assert badge displays `72` with difference `-14`.
  - Assert the badge color class is red (`sas-red`).
- **Test 3.4**: Score Validation Rules.
  - Enter score inputs of 3 keys for player and 3 keys for opponent (invalid draw). Click the submit button -> verify submission is blocked and an error message is shown.
  - Enter score inputs of 0 keys for player and 3 keys for opponent -> verify that a consolation success alert is shown and sticker selection is disabled.

### Tier 4: Pack Opening & Deferred Persistence
- **Test 4.1**: E2E Match reporting and pack opening reveal flow with deferred database persistence verification.
- **Test 4.2**: Verify that during ripping/flipping of the pack, the RPC endpoint `/rpc/foc2026_open_pending_pack` is **NOT** called.
- **Test 4.3**: Verify that when clicking the "Ver Álbum" button at the end of the reveal flow, the RPC endpoint is indeed called and the user is redirected to `#album`.

---

## 3. Invalidation Conditions

The E2E tests will become invalid and fail if any of the following occur:
1. **API Endpoints Change**: Changes to Supabase schemas, tables or RPC names.
2. **Local Storage Key Alterations**: The application switches from `foc_username` to another key.
3. **HTML DOM Selectors Refactoring**: Modifying element IDs or classes (e.g. `#usernameInput`, `[data-action="submitSingleReport"]`, `#deck-link-input`).
4. **Proxy URL Redirection Change**: If the proxy URL or pattern changes.
