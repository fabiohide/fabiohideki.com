# TEST_READY.md — Test Readiness and E2E Test Cases Specifications

This document defines the E2E test cases grouped by Tiers 1-4, establishing concrete expectations, CSS selectors, mock payloads, and assertions.

---

## Tier 1: Smoke Checks

**Objective**: Verify the web application boots successfully and displays critical layout features.

### Test 1.1: Authentication Screen Boot
- **Preconditions**: `hasSupabaseConfig = true`, `foc_username` is not set in `localStorage`.
- **Steps**:
  1. Open the base URL (`/foc-album/`).
  2. Assert that the login page element `.login-view` is visible.
  3. Assert that the username input `input#usernameInput` is present and focused.
  4. Assert that the submit button `button#loginSubmitBtn` is present.

### Test 1.2: App Shell and Navigation Menu
- **Preconditions**: Mock player `fabio_hideki` is logged in.
- **Steps**:
  1. Set `foc_username` as `fabio_hideki` in local storage and load the application.
  2. Verify that the bottom navigation menu `nav.bottom-nav` is visible.
  3. Verify that the bottom navigation contains buttons for `Pacotinhos` (packs), `Álbum` (album), `Reporte` (report), and `Tabela` (table).
  4. Verify header element `.app-header` shows the title "Copa do Mundo do FOC 2026™".

---

## Tier 2: Navigation Flows

**Objective**: Verify routing state updates on user navigation and loads the correct views.

### Test 2.1: Navigation Bar Route Changes
- **Preconditions**: Player is logged in.
- **Steps**:
  1. Click on the `Álbum` navigation item (`nav.bottom-nav a[data-route="album"]` or `button[data-route="album"]`).
  2. Assert that the window URL hash changes to `#album`.
  3. Assert that the view contains the album component `.album-view` or `.book-container`.
  4. Click on the `Tabela` navigation item.
  5. Assert that the URL hash is `#table` and `.table-view` is displayed.

### Test 2.2: Sub-tabs Navigation
- **Preconditions**: Player is logged in.
- **Steps**:
  1. Go to `#report`.
  2. Click the `Desafios` tab button (`button[data-action="setReportTab"][data-value="challenges"]`).
  3. Verify the display transitions to the challenges listing `.challenges-list`.
  4. Click the `Partida` tab button.
  5. Verify the display transitions to the match reporting content.

---

## Tier 3: DoK Integration, SAS Badges, & Score Validations

**Objective**: Verify score rules, local validations, and Decks of Keyforge integration.

### Test 3.1: DoK Deck Retrieval and SAS Badge Rendering
- **Preconditions**: Match reporting page is loaded.
- **Steps**:
  1. Input a URL containing `high-sas` in the deck link input (e.g. `https://www.decksofkeyforge.com/decks/high-sas`).
  2. Click the "Buscar" or "Enviar" button.
  3. Verify that the card preview renders:
     - Deck name: "Deck Apelão do FOC"
     - Houses list with 3 white icons.
     - Expansion set label.
  4. Verify the SAS badge displays `85`.
  5. Verify that the SAS difference badge shows `-1` (85 - 86).
  6. Assert the SAS badge color is green (checks if class contains `sas-green` or matches background color `#00e680`).

### Test 3.2: SAS Color Ranges Validation
- **Steps**:
  1. Paste a deck URL containing `mid-sas` (which mocks SAS 79). Click search.
     - Assert badge displays `79` with difference `-7`.
     - Assert the badge color class is yellow (`sas-yellow`).
  2. Paste a deck URL containing `low-sas` (which mocks SAS 72). Click search.
     - Assert badge displays `72` with difference `-14`.
     - Assert the badge color class is red (`sas-red`).

### Test 3.3: Score Validation Rules
- **Preconditions**: Match score form is loaded.
- **Steps**:
  1. Enter score inputs of 3 keys for player and 3 keys for opponent (invalid draw).
     - Click the submit button.
     - Verify submission is blocked and an error message like "Empate não permitido" or "O placar deve ter um vencedor" is shown.
  2. Enter keys: 4 keys for player and 1 key for opponent (invalid keys count).
     - Assert validation error is shown.
  3. Enter keys: 2 keys for player and 1 key for opponent (no winner with 3 keys).
     - Assert validation error is shown.
  4. Enter keys: 3 keys for player and 1 key for opponent (valid score).
     - Verify form validation passes, unlocking the submit button or picker.

---

## Tier 4: Pack Opening & Deferred Persistence

**Objective**: Validate the animation sequence and ensure persistence to collections ONLY happens on the "Ver Álbum" action.

### Test 4.1: Custom Post-Match Header
- **Preconditions**: Active state has a pending pack in `foc2026_pending_packs` (player: `fabio_hideki`, round: 2, opponent: `Flávio`, stickers: `['FOC-01', 'FOC-02']`).
- **Steps**:
  1. Load `#packs` page.
  2. Assert the pending pack card is visible, showing label `"Pacotinho Rodada 2"` and subtitle `"vs Flávio"`.
  3. Click "Abrir".
  4. Verify that the reveal animation overlay `.reveal-overlay` is loaded.
  5. Click on the pack wrapper (`#packWrapper`) to trigger the ripping animation.
  6. Wait for the rip transition (1.2 seconds) to complete.
  7. Assert that the header `.reveal-header h2` displays exactly: `"Rodada 2 - Fábio Hideki vs Flávio"`.

### Test 4.2: Deferred Database Persistence
- **Steps**:
  1. Under the reveal overlay, assert that 2 flip cards (`.flip-card`) are displayed.
  2. Click the first card -> Verify it adds the `.is-flipped` class.
  3. Click the second card -> Verify it adds the `.is-flipped` class.
  4. **Crucial Check**: Assert that during card flips, no HTTP POST call has been made to `/rest/v1/rpc/foc2026_open_pending_pack`.
  5. Locate the `.reveal-actions` container and verify the "Ver álbum" button is visible and enabled.
  6. Listen to POST events targeting `/rest/v1/rpc/foc2026_open_pending_pack`.
  7. Click the "Ver álbum" button.
  8. **Assertion**: Verify the POST request is triggered with payload `{ p_pack_id: 'pending-pack-uuid' }`.
  9. Assert the application redirects to `#album` and the new stickers `FOC-01` and `FOC-02` are added to the collection state.
