# Analysis & Design Strategy: R3 (Post-match Pack Reveal) & E2E Testing (M1)

## 1. Executive Summary
This report analyzes the codebase structure of the **FOC 2026 Digital Album** and defines a comprehensive design strategy for **R3 (Post-match Pack opening reveal flow)** and the **M1 E2E Test Setup (Tiers 1-4)**.
* **R3 Core Requirement**: Intercept the pack opening flow for match-issued packages (`foc2026_pending_packs`), showcase a custom reveal animation featuring match details (*"Rodada X - [Nome do Jogador] vs [Nome do Oponente]"*), and defer actual database persistence in `foc2026_collections` until the user clicks the "Ver Álbum" button.
* **M1 Core Requirement**: Build a solid, local-first E2E testing framework using Playwright to validate all frontend routes, user interactions, and integration touchpoints (offline mock mode & network-intercepted database calls).

---

## 2. Codebase Structure Analysis
The application is a lightweight, responsive SPA built on top of **Vite, jQuery (custom event dispatcher), and Supabase**.

| Path | Primary Responsibility | Key Elements to Integrate |
|---|---|---|
| `src/supabase.js` | Database wrapper client and async fetch routines. | Fetch pending packs, map them to UI state, and export `dbOpenPendingPack` API wrapper. |
| `src/main.js` | Application state machine, routing engine, and event handlers. | Register `openPendingPack` action; intercept normal pack opening for pending packs; coordinate database triggers on "Ver Álbum". |
| `src/pages/packs.js` | Visual rendering and interaction logic for the Packs tab. | Render custom title headers for pending pack reveals; handle "Ver Álbum" clicks dynamically. |
| `src/style/pack.css` | Styling, transitions, and 3D card flipping animations. | Styles for particle effects, card flips, and golden crest glows are already present. |
| `src/components/` | Modular UI elements (sticker cards, book interface). | Ensure `stickerCard` remains render-ready for newly obtained items. |

---

## 3. R3 Design Strategy: Post-Match Pack Opening Flow
To fulfill the specifications, the pack opening sequence must behave differently depending on whether a pack is **pre-configured (welcome/extra)** or **pending (post-match)**.

### Data Model Mapping
In `src/supabase.js` (`fetchFullState`), we will query `foc2026_pending_packs` where `opened = false` and append them to the main `packs` grid state:
```javascript
// Inside fetchFullState:
const pendingPacksList = (pendingPacksData || []).map(p => ({
  id: p.id,
  type: 'player',
  title: `Pacotinho Rodada ${p.round_number}`,
  subtitle: `vs ${p.opponent_name}`,
  image: '/assets/pack/player_pack.webp',
  opened: p.opened,
  stickerIds: p.sticker_ids,
  isPendingPack: true,
  roundNumber: p.round_number,
  opponentName: p.opponent_name
}));
packs.push(...pendingPacksList);
```

### Flow Separation
1. **Normal Pack**:
   * *Abrir click* $\to$ DB calls `dbOpenPack` immediately $\to$ Client registers stickers $\to$ Animation plays $\to$ *Ver Álbum click* $\to$ Navigate to album.
2. **Pending Pack**:
   * *Abrir click* $\to$ Pack marked `opened = true` locally $\to$ Animation loaded with custom header text $\to$ **No database call yet**.
   * *Ver Álbum click* $\to$ Client registers stickers locally $\to$ DB calls `dbOpenPendingPack` RPC to persist to collections $\to$ Navigate to album.

---

## 4. Code Modifications Details

### 4.1. Changes in `src/pages/packs.js`
We modify `renderPacks`, `renderReveal`, and `initPacks` to customize the visual text and coordinate the deferred database persistence on "Ver Álbum".

#### `renderPacks`
Change lines 20-21 to pass the full `state` instead of just `state.collection`:
```javascript
// Before
${reveal ? renderReveal(reveal, state.collection) : ''}

// After
${reveal ? renderReveal(reveal, state) : ''}
```

#### `renderReveal`
Update the signature to accept `state` and dynamically render the custom title when the pack is post-match:
```javascript
function renderReveal(reveal, state) {
  const collection = state.collection;
  reveal.flippedIndexes = reveal.flippedIndexes || [];
  reveal.ripped = reveal.ripped || false;

  const cards = reveal.pack.stickerIds.map((id, index) => {
    const sticker = getSticker(id);
    const isFlipped = reveal.flippedIndexes.includes(index);
    const cardClass = isFlipped ? 'is-flipped' : '';
    const isCrest = sticker?.type === 'crest' ? 'is-crest' : '';

    return `
      <div class="flip-card ${cardClass} ${isCrest}" data-index="${index}">
        <div class="flip-card-inner">
          <div class="flip-card-back" style="padding: 0; background: transparent;">
            <img src="${getAssetUrl('/assets/sticker_back.webp')}" alt="Verso" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
          </div>
          <div class="flip-card-front">
            ${stickerCard(id, collection, { small: true, forceOwned: true })}
          </div>
        </div>
      </div>
    `;
  }).join('');

  const stateClass = reveal.ripped ? 'state-revealing' : 'state-unopened';
  const allFlipped = reveal.flippedIndexes.length === reveal.pack.stickerIds.length;
  const actionsStyle = allFlipped ? 'opacity: 1; pointer-events: auto;' : 'opacity: 0; pointer-events: none;';

  // Customize heading for pending match packs
  const headerHtml = reveal.pack.isPendingPack
    ? `
        <p class="eyebrow">Partida FOC 2026</p>
        <h2>Rodada ${reveal.pack.roundNumber} - ${state.user.name} vs ${reveal.pack.opponentName}</h2>
        <p class="reveal-hint">Clique nas figurinhas para revelá-las</p>
      `
    : `
        <p class="eyebrow">${reveal.pack.type === 'crest' ? 'Pacotinho dourado' : 'Pacotinho inicial'}</p>
        <h2>${reveal.newIds.length} novas figurinhas!</h2>
        <p class="reveal-hint">Clique nas figurinhas para revelá-las</p>
      `;

  return `
    <div class="reveal-overlay ${stateClass}" id="revealOverlay">
      <div class="reveal-overlay-bg"></div>

      <!-- Fase 1: Pacotinho Fechado -->
      <div class="pack-opening-stage">
        <div class="pack-wrapper-3d" id="packWrapper">
          <div class="pack-rip-container" id="packRipContainer">
            <div class="pack-half pack-top">
              <img src="${getAssetUrl(reveal.pack.image)}" alt="${reveal.pack.title}" />
            </div>
            <div class="pack-half pack-bottom">
              <img src="${getAssetUrl(reveal.pack.image)}" alt="${reveal.pack.title}" />
            </div>
          </div>
          <div class="pack-glow-back"></div>
        </div>
        <div class="pack-instruction">
          <h3>${reveal.pack.title}</h3>
          <p>Clique no pacote para rasgar</p>
        </div>
      </div>

      <!-- Fase 2: Figurinhas Reveladas Uma a Uma -->
      <div class="cards-reveal-stage">
        <div class="reveal-header">
          ${headerHtml}
        </div>
        <div class="reveal-cards-grid" id="revealCardsGrid">
          ${cards}
        </div>
        <div class="reveal-actions" style="${actionsStyle} transition: opacity 0.5s ease;">
          <button class="button button-secondary" data-action="goAlbum">Ver álbum</button>
        </div>
      </div>
    </div>
  `;
}
```

#### `initPacks`
Modify the `goAlbum` listener to invoke the deferred database write for pending packs:
```javascript
const btnGoAlbum = overlay.querySelector('[data-action="goAlbum"]');
if (btnGoAlbum) {
  btnGoAlbum.addEventListener('click', async () => {
    if (reveal.pack.isPendingPack) {
      state.reveal = null; // Close the overlay
      await actions.openPendingPack(reveal.pack.id);
    } else {
      state.reveal = null;
      actions.setRoute('album');
    }
  });
}
```

---

### 4.2. Changes in `src/main.js`
We import the pending pack RPC and create the `openPendingPack` handler.

1. **Import `dbOpenPendingPack`**:
   Add it to the destructured imports from `./supabase.js` on lines 16-36.

2. **Add `openPendingPack` to Action Dispatcher**:
   ```javascript
   // Inside actions object:
   const actions = {
     ...,
     openPendingPack
   };
   ```

3. **Implement `openPendingPack`**:
   ```javascript
   async function openPendingPack(packId) {
     const pack = state.packs.find((p) => p.id === packId);
     if (!pack) return;

     // 1. Optimistic UI update: add stickers to local state
     pack.stickerIds.forEach((id) => {
       if (!state.collection[id]) {
         state.collection[id] = { quantity: 1, isNew: true, source: 'pick' };
       } else {
         state.collection[id].quantity = (state.collection[id].quantity || 0) + 1;
         state.collection[id].isNew = true;
       }

       if (!state.stickersLog) state.stickersLog = [];
       state.stickersLog.unshift({
         round: pack.roundNumber,
         timestamp: new Date().toISOString(),
         message: `${state.user.name} obteve a figurinha ${id} via Pacote Rodada ${pack.roundNumber}`,
         type: 'pack'
       });
     });

     // Remove pack from local list
     state.packs = state.packs.filter((p) => p.id !== packId);

     // 2. Persist to database
     if (hasSupabaseConfig) {
       try {
         await dbOpenPendingPack(packId);
         const fetched = await fetchFullState(state.user.id);
         if (fetched) {
           state = fetched;
         }
       } catch (err) {
         console.error("Error persisting pending pack opening:", err);
       }
     }

     setRoute('album');
   }
   ```

4. **Update `openPack`**:
   In `openPack(packId)`, intercept pending packs so they bypass the normal duplicate replacements and database updates:
   ```javascript
   async function openPack(packId) {
     const pack = state.packs.find((item) => item.id === packId);
     if (!pack || pack.opened || pack.disabled) return;

     pack.opened = true;

     if (pack.isPendingPack) {
       state.reveal = { pack, newIds: pack.stickerIds, duplicateIds: [], isPendingPack: true };
       render();
       return;
     }

     // ... Normal pack opening logic (substitutions, dbOpenPack, etc.) ...
   }
   ```

---

## 5. E2E Test Setup (M1 / Tiers 1-4)
To ensure reliable, isolated, and repeatable test execution locally on Mac without polluting a production database, we structure E2E tests using **Playwright** with API mocking.

### Tier Structure Specifications
* **Tier 1 — Smoke / Initialization**:
  * Verify site boots successfully at localhost (`http://localhost:5173`).
  * Verify basic elements like title, navigation bar, and main container are present in the DOM.
  * Verify absence of critical console/runtime errors.
* **Tier 2 — Core Navigation**:
  * Verify navigation clicks between `packs`, `album`, `report`, `challenges`, and `table` routes.
  * Verify active navigation states and tab headers.
  * Verify fallback mock data loading when offline (no Supabase config).
* **Tier 3 — User Flows & Interactions**:
  * Test match score submission validations (R1: score ranges, single winner requirement, draws prevention).
  * Test DoK URL fetching card preview (mock CORS proxy response) showing deck stats and set logos.
  * Test Admin Validation tab: verify alert displays on divergent score inputs, verify "Liberar Figurinhas" is disabled until reports align.
* **Tier 4 — E2E Flow & Persistence (Deferred DB Writes)**:
  * Intercept Supabase API calls (`**/rest/v1/foc2026_pending_packs**` and `**/rpc/foc2026_open_pending_pack**`).
  * Click "Abrir" on a pending pack. Verify the ripping animation plays.
  * Click on individual cards. Verify the `is-flipped` classes are added.
  * Verify that *during* the animation/flips, no requests are sent to `/rpc/foc2026_open_pending_pack`.
  * Click "Ver Álbum". Verify that:
    1. A POST/RPC request is successfully triggered to `/rpc/foc2026_open_pending_pack`.
    2. The route transitions to `#album`.
    3. The collection state reflects the new stickers.

### Implementation Setup on Mac
1. **Initialize Playwright in project**:
   ```bash
   pnpm add -D @playwright/test
   pnpm exec playwright install chromium
   ```

2. **`playwright.config.js` configuration**:
   ```javascript
   import { defineConfig } from '@playwright/test';

   export default defineConfig({
     testDir: './tests/e2e',
     use: {
       baseURL: 'http://localhost:5173',
       trace: 'on-first-retry',
     },
     webServer: {
       command: 'pnpm run dev',
       url: 'http://localhost:5173',
       reuseExistingServer: !process.env.CI,
     },
   });
   ```

3. **Sample Tier 4 Deferred Save Test Case (`tests/e2e/tier4-packs.spec.js`)**:
   ```javascript
   import { test, expect } from '@playwright/test';

   test.describe('Deferred Pack Opening Flow (R3)', () => {
     test('should play reveal animation and only write to DB upon clicking Ver Álbum', async ({ page }) => {
       // Mock fetch state to return a pending pack
       await page.route('**/rest/v1/foc2026_pending_packs*', async (route) => {
         await route.fulfill({
           status: 200,
           contentType: 'application/json',
           body: JSON.stringify([{
             id: '11111111-2222-3333-4444-555555555555',
             player_username: 'fabio_hideki',
             round_number: 2,
             opponent_name: 'Flávio',
             sticker_ids: ['FOC-01', 'FOC-02'],
             opened: false
           }])
         });
       });

       // Intercept the RPC call to track when it triggers
       let rpcTriggered = false;
       await page.route('**/rpc/foc2026_open_pending_pack', async (route) => {
         rpcTriggered = true;
         await route.fulfill({ status: 200, body: '' });
       });

       // Load packs page
       await page.goto('/#packs');

       // Verify pending pack card is visible
       const openButton = page.locator('button[data-action="openPack"][data-value="11111111-2222-3333-4444-555555555555"]');
       await expect(openButton).toBeVisible();
       await openButton.click();

       // Overlay opens: Click to rip the pack wrapper
       const packWrapper = page.locator('#packWrapper');
       await expect(packWrapper).toBeVisible();
       await packWrapper.click();

       // Verify transition to cards reveal stage
       const revealOverlay = page.locator('#revealOverlay');
       await expect(revealOverlay).toHaveClass(/state-revealing/);

       // Verify the header details are rendered correctly
       const header = page.locator('.reveal-header h2');
       await expect(header).toHaveText('Rodada 2 - Fábio Hideki vs Flávio');

       // Check that flip cards exist
       const cards = page.locator('.flip-card');
       await expect(cards).toHaveCount(2);

       // Flip all cards to reveal
       await cards.nth(0).click();
       await expect(cards.nth(0)).toHaveClass(/is-flipped/);
       await cards.nth(1).click();
       await expect(cards.nth(1)).toHaveClass(/is-flipped/);

       // Verify DB RPC has NOT been triggered yet
       expect(rpcTriggered).toBe(false);

       // Click Ver Álbum
       const verAlbumBtn = page.locator('button[data-action="goAlbum"]');
       await expect(verAlbumBtn).toBeVisible();
       await verAlbumBtn.click();

       // Verify DB RPC is now called and page redirects
       expect(rpcTriggered).toBe(true);
       await expect(page).toHaveURL(/#album/);
     });
   });
   ```

---

## 6. Execution & Actionable Plan
The following steps outline the implementation sequence for the implementer:
1. **Pre-requisites**: Run `pnpm install` and install Playwright.
2. **Database Integration**: Update `src/supabase.js` to map pending packs and expose the `dbOpenPendingPack` export.
3. **Core Pack Page**: Apply edits to `src/pages/packs.js` to modify `renderPacks`, `renderReveal` parameters, and `goAlbum` listener.
4. **State Orchestration**: Update `src/main.js` with `openPendingPack` action logic and `openPack` interceptor.
5. **Testing**: Run local Dev Server (`pnpm run dev`) and execute Playwright tests (`pnpm exec playwright test`).
