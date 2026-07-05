# Scope: Implementation Track

## Architecture
Vite, jQuery, and Supabase web app.
Modifying `src/pages/report.js`, `src/pages/admin.js`, `src/pages/packs.js`, `src/main.js`, and `src/supabase.js`.
Creating `src/utils/validation.js`, `src/utils/sas.js` and `tests/run-tests.js`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | R1: Single-Step Match Report & DoK Integration | Collapsible accordion, DoK API query via CORS proxy, SAS color calculations, local score validation form, and picks selection. | None | PLANNED |
| 2 | R2: Admin Panel Validation & Pack Release | Render reports side-by-side, highlight divergences, add WO button, atomic package release RPC. | M1 | PLANNED |
| 3 | R3: Pack Opening & Deferred Persistence | Map pending packs, customize card reveal header, defer DB write until clicking "Ver Álbum". | M2 | PLANNED |
| 4 | R4: Unit Tests | Implement zero-dependency unit tests for score and SAS logic. | M3 | PLANNED |
| 5 | E2E Integration & Verification | Wait for E2E tests, execute E2E, fix bugs, run Challenger-driven adversarial coverage hardening (Tier 5), Forensic Audit. | M4 | PLANNED |

## Interface Contracts
- `dbSubmitSingleReport(matchId, houses, myKeys, oppKeys, picks, deckName, deckSas, deckSet, deckUrl)` maps to SQL RPC `foc2026_submit_single_report`.
- `dbReleaseMatchPacks(matchId, playerA, playerB, roundNumber, aName, bName, aPicks, bPicks)` maps to SQL RPC `foc2026_release_match_packs`.
- `dbOpenPendingPack(packId)` maps to SQL RPC `foc2026_open_pending_pack`.
