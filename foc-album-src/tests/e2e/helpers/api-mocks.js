import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * API Mocking helper for Playwright E2E tests.
 * Mocks Supabase REST API endpoints, RPC calls, and Decks of Keyforge API (via corsproxy.io).
 */

export async function setupMocks(page, customState = {}) {
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('ERROR') || msg.text().includes('error')) {
      console.log('PAGE LOG ERROR:', msg.text());
    } else {
      console.log('PAGE LOG:', msg.text());
    }
  });
  page.on('pageerror', exception => console.error('PAGE ERROR:', exception.stack || exception.message));

  // Combine default state with any overrides
  const state = {
    username: 'fabio_hideki',
    name: 'Fábio Hideki',
    isAdmin: true,
    packOpened: true,
    serie: 'A',
    activeRound: {
      number: 1,
      name: 'Rodada 1',
      active: true,
      sas_limit: 80,
      starts_at: new Date().toISOString(),
      deadline: new Date(Date.now() + 86400000).toISOString(),
    },
    collections: [
      { player_username: 'fabio_hideki', sticker_id: 'BRB 0', quantity: 1, source: 'pack', is_new: false },
      { player_username: 'fabio_hideki', sticker_id: 'DIS 0', quantity: 1, source: 'pack', is_new: false },
    ],
    challenges: [
      { id: 'c1', title: 'Deck SAS abaixo do limite', description: 'Vencer com deck cujo SAS seja 5 ou mais abaixo do limite da rodada', completed: false, pending_validation: false, player_username: 'fabio_hideki', picked_id: null }
    ],
    matches: [
      {
        id: 'r1m1',
        round_number: 1,
        player_a_username: 'fabio_hideki',
        player_b_username: 'flavio_ciampone',
        player_a_reported: false,
        player_b_reported: false,
        player_a_houses: null,
        player_b_houses: null,
        player_a_keys: 0,
        player_b_keys: 0,
        player_a_opp_keys: 0,
        player_b_opp_keys: 0,
        player_a_picks: null,
        player_b_picks: null,
        player_a_deck_name: null,
        player_b_deck_name: null,
        player_a_deck_sas: null,
        player_b_deck_sas: null,
        player_a_deck_set: null,
        player_b_deck_set: null,
        player_a_deck_url: null,
        player_b_deck_url: null,
        completed: false,
        match_deadline_passed: false,
        fallback_active: false
      }
    ],
    pendingPacks: [],
    adminLogs: [],
    stickersLog: [],
    ...customState,
  };

  // Intercept Supabase API calls
  await page.route(/\/rest\/v1\/.*/, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // 1. RPC POST calls
    if (method === 'POST' && url.includes('/rpc/')) {
      const body = route.request().postDataJSON() || {};
      
      if (url.includes('foc2026_open_pack')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }

      if (url.includes('foc2026_submit_single_report')) {
        // Mock updating the match object in our state
        const match = state.matches.find(m => m.id === body.p_match_id);
        if (match) {
          const isPlayerA = match.player_a_username === state.username;
          if (isPlayerA) {
            match.player_a_houses = body.p_houses;
            match.player_a_keys = body.p_my_keys;
            match.player_a_opp_keys = body.p_opp_keys;
            match.player_a_picks = body.p_picks;
            match.player_a_deck_url = body.p_deck_url;
            match.player_a_reported = true;
          } else {
            match.player_b_houses = body.p_houses;
            match.player_b_keys = body.p_my_keys;
            match.player_b_opp_keys = body.p_opp_keys;
            match.player_b_picks = body.p_picks;
            match.player_b_deck_url = body.p_deck_url;
            match.player_b_reported = true;
          }
          if (match.player_a_reported && match.player_b_reported) {
            match.completed = true;
          }
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }

      if (url.includes('foc2026_open_pending_pack')) {
        // Add stickers to collection
        const pendingPack = state.pendingPacks.find(p => p.id === body.p_pack_id);
        if (pendingPack) {
          pendingPack.opened = true;
          const stickerIds = pendingPack.sticker_ids || [];
          stickerIds.forEach(sid => {
            state.collections.push({
              player_username: state.username,
              sticker_id: sid,
              quantity: 1,
              source: 'pack',
              is_new: true
            });
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }

      if (url.includes('foc2026_submit_houses')) {
        const match = state.matches.find(m => m.id === body.p_match_id);
        if (match) {
          const isPlayerA = match.player_a_username === state.username;
          if (isPlayerA) {
            match.player_a_houses = body.p_houses;
          } else {
            match.player_b_houses = body.p_houses;
          }
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }

      // Default RPC fallback
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    }

    // 2. Table GET queries
    if (method === 'GET') {
      // foc2026_players query
      if (url.includes('/foc2026_players')) {
        // Check if single or maybeSingle check
        if ((url.includes('select=*') || url.includes('select=%2A')) && url.includes('username=eq.')) {
          const matchedUsername = url.match(/username=eq\.([^&]+)/)?.[1] || state.username;
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              username: matchedUsername,
              name: matchedUsername === 'fabio_hideki' ? 'Fábio Hideki' : (matchedUsername === 'regular_player' ? 'Regular Player' : state.name),
              is_admin: matchedUsername === 'fabio_hideki' ? true : state.isAdmin,
              pack_opened: state.packOpened,
              serie: state.serie
            }),
          });
        }
        // General select players list
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { username: state.username, name: state.name, is_admin: state.isAdmin, pack_opened: state.packOpened, serie: state.serie },
            { username: 'flavio_ciampone', name: 'Flávio Ciampone', is_admin: false, pack_opened: true, serie: 'A' }
          ]),
        });
      }

      // foc2026_rounds query
      if (url.includes('/foc2026_rounds')) {
        if (url.includes('active=eq.true')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(state.activeRound),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([state.activeRound]),
        });
      }

      // foc2026_collections query
      if (url.includes('/foc2026_collections')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(state.collections),
        });
      }

      // foc2026_challenges query
      if (url.includes('/foc2026_challenges')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(state.challenges),
        });
      }

      // foc2026_matches query
      if (url.includes('/foc2026_matches')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(state.matches),
        });
      }

      // foc2026_pending_packs query
      if (url.includes('/foc2026_pending_packs')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(state.pendingPacks),
        });
      }

      // foc2026_admin_logs query
      if (url.includes('/foc2026_admin_logs')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(state.adminLogs),
        });
      }

      // foc2026_stickers_log query
      if (url.includes('/foc2026_stickers_log')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(state.stickersLog),
        });
      }
    }

    // Default REST fallback
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Intercept CORS Proxy to Decks of Keyforge API
  await page.route(/.*(corsproxy\.io|corsfix\.com|allorigins|thingproxy).*/, async (route) => {
    const urlString = route.request().url();
    const queryParamIndex = urlString.indexOf('?');
    const targetUrl = queryParamIndex !== -1 ? decodeURIComponent(urlString.substring(queryParamIndex + 1)) : '';
    console.log('INTERCEPTED CORS PROXY:', urlString, 'TARGET:', targetUrl);
    
    let name = 'Deck do Campeão FOC';
    let sas = 80;
    let expansion = 'Mass Mutation';
    let houses = ['Brobnar', 'Dis', 'Logos'];

    if (targetUrl.includes('high-sas') || targetUrl.includes('11111111-2222-3333-4444-555555555555')) {
      sas = 85;
      name = 'Deck Apelão do FOC';
      houses = ['Brobnar', 'Dis', 'Logos'];
    } else if (targetUrl.includes('low-sas') || targetUrl.includes('33333333-4444-5555-6666-777777777777')) {
      sas = 72;
      name = 'Deck Fraco de Treino';
      houses = ['Brobnar', 'Dis', 'Logos'];
    } else if (targetUrl.includes('mid-sas') || targetUrl.includes('22222222-3333-4444-5555-666666666666')) {
      sas = 79;
      name = 'Deck Equilibrado';
      houses = ['Brobnar', 'Dis', 'Logos'];
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        deck: {
          name,
          sasRating: sas,
          expansion,
          houses: houses.map(h => ({ name: h }))
        }
      })
    });
  });

  // Intercept jQuery CDN request and serve it locally from node_modules
  await page.route('https://code.jquery.com/jquery-3.7.1.min.js', async (route) => {
    const jqueryPath = path.resolve(__dirname, '../../../node_modules/jquery/dist/jquery.min.js');
    const jqueryContent = fs.readFileSync(jqueryPath, 'utf8');
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: jqueryContent
    });
  });
}
