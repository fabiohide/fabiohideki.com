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
