# Project: FOC 2026 Album Update

## Architecture
The project is a frontend single-page application built with Vite, jQuery, and Supabase.
- **`src/main.js`**: Main entry point, routes and global state.
- **`src/supabase.js`**: Data layer communicating with Supabase RPCs and tables.
- **`src/pages/`**: View components (report, admin, packs, table).
- **`src/components/`**: Reusable widgets (sticker-card, album-book).
- **`src/style/`**: Page-specific styling.

## Milestones
| # | Name | Scope | Dependencies | Status | Conversation ID |
|---|------|-------|-------------|--------|-----------------|
| 1 | M1: E2E Test Suite Setup | Set up testing infrastructure (opaque-box E2E) and write basic test cases | None | PLANNED | TBD |
| 2 | M2: Single-Step Match Report & DoK Integration (R1) | Collapsible pre-match view, Your Deck section with DoK search (CORS proxy), SAS calculation badges and difference, local score validations, success modal | M1 | PLANNED | TBD |
| 3 | M3: Admin Panel & Packaging (R2) | Display reports, alert on divergence, enable "Liberar Figurinhas" button, insert pending packs, W.O. button | M2 | PLANNED | TBD |
| 4 | M4: Pack Opening & Persistence (R3) | Load pending packs, reveal animation with match details, save to collection on "Ver Álbum" click | M3 | PLANNED | TBD |
| 5 | M5: Unit Testing & Verification (R4 + Tiers) | Implement unit tests for SAS and score validation; pass 100% of test suite; forensic audit | M4 | PLANNED | TBD |

## Interface Contracts
### `src/supabase.js` ↔ Supabase Database RPCs
- `dbSubmitSingleReport(matchId, houses, myKeys, oppKeys, picks, deckName, deckSas, deckSet, deckUrl)`
  - Invokes `foc2026_submit_single_report` RPC with deck metadata columns.
- `dbCreatePendingPack(playerUsername, roundNumber, opponentName, stickerIds)`
  - Inserts record into `foc2026_pending_packs`.
- `dbOpenPendingPack(packId)`
  - Invokes `foc2026_open_pending_pack` RPC to insert stickers into `foc2026_collections` and mark pack as opened.

## Code Layout
- `index.html` - Application root html
- `src/main.js` - Routing, main state machine, event listeners
- `src/supabase.js` - Supabase clients and wrappers
- `src/pages/report.js` - Match reporting page
- `src/pages/admin.js` - Administrator panel page
- `src/pages/packs.js` - Sticker pack opening page
- `src/data/stickers.js` - Stickers inventory data
- `tests/` - Local unit and E2E test cases

## Deployment & Build Workflow
The application is deployed using GitHub Pages. The deployment workflow uploads the static files inside the **`./foc-album`** directory (in the project root) directly.
For changes to go live, you **must run the build locally and commit the compiled output folder**:
1. Run `npm run build` inside `foc-album-src`.
2. Go to the project root directory and stage both the source files and the built files:
   ```bash
   git add foc-album-src/ foc-album/
   ```
   *Warning: Staging only `foc-album-src` (e.g. running `git add .` inside the src folder) will not deploy the compiled JavaScript/HTML assets to production.*
3. Commit and push:
   ```bash
   git commit -m "build: compile and update assets"
   git push origin main
   ```

## Recent Updates (Round 4 Emblem Corrections & UI Adjustments)
1. **Round 4 Emblem Extra Packs**:
   - **Rollback**: Deleted and reverted all incorrect/flawed Round 4 emblem openings from `foc2026_collections` and `foc2026_stickers_log`.
   - **Re-generation**: Populated `foc2026_pending_packs` with duplicate-free unopened packs of exactly 3 distinct emblem stickers per player (1 representing an unrepresented house, 2 representing represented player houses, with fallback to all unowned emblems).
2. **House Pick (Deck Selection Grid)**:
   - Modified the house selector grid in the report view to ONLY render a green hexagon (`#00cc66`) on houses where:
     - The opponent has the emblem (`oppHasEmblem` is true);
     - The opponent owns exactly 0 player stickers of that house (`oppPlayerStickersCount === 0`);
     - The player is missing some stickers of that house (`playerIsMissingStickers` is true).
     - Otherwise, no hexagon is shown.
3. **Pre-match Accordions (Stickers Available)**:
   - Omitted gray/inactive emblems when they are not owned by the player/opponent (no longer renders empty gray hexagons).
   - Display owned emblems in distinct color states (Blue for player, Green for opponent).
   - **Pickable Border Highlighting**: Accordion borders are highlighted in color (blue/green) only if the house has active pickable options (either a missing player sticker or a pickable emblem). If there is nothing to pick (e.g., you already own all player stickers the opponent owns of that house), the border stays as default gray, and only the emblem icon is shown in a dimmed/translucent state.

