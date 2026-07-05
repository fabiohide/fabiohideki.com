# E2E Test Readiness Checklist (`TEST_READY.md`)

This document outlines the test execution checklist, scope of verification, and invalidation conditions to verify that the E2E suite is functional and accurate.

---

## 1. Readiness Integration Checklist

Before running E2E tests, the developer must ensure:
- [ ] `@playwright/test` is installed under devDependencies in `package.json`.
- [ ] `playwright.config.js` is placed in the workspace root.
- [ ] E2E spec files are located inside the `tests/e2e/` folder.
- [ ] The `test:e2e` and `test:e2e:ui` commands are declared in `package.json`.
- [ ] The local port `5173` is free, or the webServer configuration reuse flags are set.

---

## 2. Test Verification Scope

### Tier 1: Smoke Checks
- Verify that navigating to `/` prompts user to log in if no username exists in localStorage.
- Verify logging in via form submission.
- Verify that header elements (Admin icon button) render correctly depending on mocked user privileges.

### Tier 2: Navigation
- Verify that clicking navigation items switches pages and updates the URL hash (`#packs`, `#album`, `#report`, `#table`).
- Verify that direct navigation via hash URL renders the corresponding component view.

### Tier 3: DoK Integration & Placar Form Validations
- **Link Submission**: Verify clipboard/text link entry triggers network fetch and renders cards, SAS badges with color codes, and houses.
- **SAS Badge Calculation**:
  - Max SAS 86 reference.
  - Green badge: SAS 86 - 82 (difference 0 to -4).
  - Yellow badge: SAS 81 - 77 (difference -5 to -9).
  - Red badge: SAS <= 76 (difference <= -10).
- **Score Input validations**:
  - Keys from 0 to 3.
  - Ties must display a validation error.
  - One player must have exactly 3 keys.
  - Loser must have 0 to 2 keys.
  - Consolation message must show if score is 3 x 0 (loser gets 0 chaves).
  - Normal players cannot submit 0x0 (W.O. is admin-only).
- **Consolation Sticker Picker**: Verify sticker items are select-toggled and reporting is locked until score validations pass.

### Tier 4: Pack Opening & Deferred Persistence
- Verify pending packs are loaded and shown in the pacotinhos view.
- Verify opening triggers reveal animation with header `Rodada X - [Nome do Jogador] vs [Nome do Oponente]`.
- Verify database persistence to `foc2026_collections` and `foc2026_pending_packs` (RPC `foc2026_open_pending_pack`) is **deferred** and only triggers upon clicking "Ver Álbum" at the end of the reveal animation.

---

## 3. Invalidation Conditions

The E2E tests will become invalid and fail if any of the following occur:
1. **API Endpoints Change**:
   - Changes to the RPC signature (e.g. altering parameter names or returning fields of `foc2026_submit_single_report` or `foc2026_open_pending_pack`).
2. **Local Storage Key Alterations**:
   - The application switches from `foc_username` to another localStorage key for keeping the session user.
3. **HTML DOM Selectors / Class Names Refactoring**:
   - Modifying element ids/classes (e.g., `#btnSubmitSingleReport`, `#dokUrlInput`, `.sas-badge`) without updating selectors inside spec files.
4. **Proxy URL Redirection Change**:
   - If the application switches from `corsproxy.io` to another proxy without altering the routing RegExp in the Playwright spec.
