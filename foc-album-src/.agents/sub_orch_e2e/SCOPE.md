# Scope: E2E Testing Track

## Architecture
Opaque-box testing of the frontend web interface using Playwright.
No dependency on database internals. Focuses on user-facing paths and routes, verifying error handling, mock rendering, and API boundary calls (network interception).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Complete E2E Testing Suite | Install Playwright, configure playwright.config.js, write Tiers 1-4 tests, and publish TEST_INFRA.md and TEST_READY.md | None | IN_PROGRESS |

## Interface Contracts
- Playwright intercepts network calls targeting `https://corsproxy.io/?*` (DoK API) and mock returns valid JSON.
- Playwright intercepts REST / RPC calls targeting Supabase (e.g. `/rest/v1/foc2026_pending_packs` and `/rpc/foc2026_open_pending_pack`) to verify deferred persistence.
