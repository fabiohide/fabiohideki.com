import { createClient } from '@supabase/supabase-js';
import { STICKERS, PLAYER_STICKERS } from './data/stickers.js';
import initialPacks from './data/initial-packs.json';
import { parsePicksString } from './utils/format.js';


const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export let supabase = url && anonKey ? createClient(url, anonKey, {
  global: {
    headers: {
      'x-player-username': (typeof window !== 'undefined' && window.localStorage.getItem('foc_username')) || ''
    }
  }
}) : null;
export const hasSupabaseConfig = Boolean(supabase);

export function setSupabaseSession(username) {
  if (!url || !anonKey) return;
  supabase = createClient(url, anonKey, {
    global: {
      headers: {
        'x-player-username': username || ''
      }
    }
  });
}

// --- FUNÇÕES DE INTEGRAÇÃO ASSÍNCRONA ---

// 1. Carrega o estado completo do app para um determinado jogador
export async function fetchFullState(username) {
  if (!supabase) return null;

  // Busca jogador ativo
  const { data: playerData, error: pError } = await supabase
    .from('foc2026_players')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (pError || !playerData) {
    console.error("Jogador não encontrado no banco:", username);
    return null;
  }

  // Busca rodada ativa
  const { data: roundData } = await supabase
    .from('foc2026_rounds')
    .select('*')
    .eq('active', true)
    .single();

  const activeRound = roundData ? {
    number: roundData.number,
    name: roundData.name,
    startsAt: roundData.starts_at,
    deadline: roundData.deadline,
    sasLimit: roundData.sas_limit,
    active: roundData.active
  } : { number: 1, name: 'Rodada 1', active: true, sasLimit: 80 };

  // Roda todas as consultas de dados de apoio em paralelo para performance de rede instantânea
  const [
    collectionRes,
    challengesRes,
    matchesRes,
    allPlayersRes,
    pendingChallengesRes,
    adminLogsRes,
    stickersLogRes,
    allCollectionsRes,
    allMatchesRes,
    allChallengesRes,
    allRoundsRes,
    allPicksRes,
    pendingPacksRes
  ] = await Promise.all([
    supabase.from('foc2026_collections').select('*').eq('player_username', username),
    supabase.from('foc2026_challenges').select('*').eq('player_username', username).order('id'),
    supabase.from('foc2026_matches').select('*').eq('round_number', activeRound.number),
    supabase.from('foc2026_players').select('username, name, is_admin, pack_opened, serie'),
    supabase.from('foc2026_challenges').select('*').eq('pending_validation', true).eq('completed', false),
    supabase.from('foc2026_admin_logs').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('foc2026_stickers_log').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('foc2026_collections').select('*'),
    supabase.from('foc2026_matches').select('*'),
    supabase.from('foc2026_challenges').select('*'),
    supabase.from('foc2026_rounds').select('*').order('number'),
    supabase.from('foc2026_stickers_log').select('*').eq('type', 'pick'),
    supabase.from('foc2026_pending_packs').select('*').eq('player_username', username)
  ]);

  const collectionData = collectionRes.data;
  const challengesData = challengesRes.data;
  const matchesData = matchesRes.data;
  const allPlayersData = allPlayersRes.data;
  const pendingChallengesData = pendingChallengesRes.data;
  const adminLogsData = adminLogsRes.data;
  const stickersLogData = stickersLogRes.data;
  const allCollectionsData = allCollectionsRes.data;
  const allMatchesData = allMatchesRes.data;
  const allChallengesData = allChallengesRes.data;
  const allRoundsData = allRoundsRes.data;
  const allPicksData = allPicksRes.data;
  const pendingPacksData = pendingPacksRes.data;

  // Processa a coleção do jogador logado
  const collection = {};
  if (collectionData) {
    collectionData.forEach(c => {
      collection[c.sticker_id] = {
        quantity: c.quantity,
        source: c.source,
        isNew: c.is_new,
        acquiredRound: c.acquired_round,
        acquiredOpponent: c.acquired_opponent,
        acquiredChallenge: c.acquired_challenge
      };
    });
  }

  // Processa os desafios do jogador
  const challenges = (challengesData || []).map(c => ({
    id: c.id,
    title: c.title,
    desc: c.description,
    completed: c.completed,
    pickedId: c.picked_id,
    pendingValidation: c.pending_validation
  }));

  const playersMap = Object.fromEntries((allPlayersData || []).map(p => [p.username, p.name]));

  const formattedMatches = (matchesData || []).map(m => ({
    id: m.id,
    playerA: playersMap[m.player_a_username] || m.player_a_username,
    playerB: playersMap[m.player_b_username] || m.player_b_username,
    player_a_username: m.player_a_username,
    player_b_username: m.player_b_username,
    round_number: m.round_number,
    completed: m.completed,
    player_a_reported: m.player_a_reported,
    player_b_reported: m.player_b_reported,
    player_a_houses: m.player_a_houses,
    player_b_houses: m.player_b_houses,
    player_a_keys: m.player_a_keys,
    player_b_keys: m.player_b_keys,
    player_a_opp_keys: m.player_a_opp_keys,
    player_b_opp_keys: m.player_b_opp_keys,
    player_a_picks: m.player_a_picks,
    player_b_picks: m.player_b_picks,
    player_a_deck_name: m.player_a_deck_name,
    player_b_deck_name: m.player_b_deck_name,
    player_a_deck_sas: m.player_a_deck_sas,
    player_b_deck_sas: m.player_b_deck_sas,
    player_a_deck_set: m.player_a_deck_set,
    player_b_deck_set: m.player_b_deck_set,
    player_a_deck_url: m.player_a_deck_url,
    player_b_deck_url: m.player_b_deck_url,
    packs_released: m.packs_released
  }));

  const pendingChallenges = (pendingChallengesData || []).map(c => ({
    id: c.id,
    playerUsername: c.player_username,
    playerName: playersMap[c.player_username] || c.player_username,
    title: c.title,
    desc: c.description,
    completed: c.completed,
    pickedId: c.picked_id,
    pendingValidation: c.pending_validation
  }));

  // Identifica a partida do usuário
  const myMatch = (matchesData || []).find(
    m => m.player_a_username === username || m.player_b_username === username
  );

  let report = {
    matchId: myMatch ? myMatch.id : 'r1m1',
    housesSubmitted: false,
    reported: false,
    completed: false,
    playerAKeys: 0,
    playerBKeys: 0,
    opponentHouses: ['MRS', 'SCT', 'SHW'], // fallback padrão
    opponentReported: false,
    confirmed: false,
    conflict: false,
    confirmedAt: null,
    pickedIds: [],
    matchDeadlinePassed: false,
    fallbackActive: false,
    maxPicks: 3,
    // Novos campos de deck
    deckName: null,
    deckSas: null,
    deckSet: null,
    deckUrl: null,
    deckHouses: null,
    opponentDeckName: null,
    opponentDeckSas: null,
    opponentDeckSet: null,
    opponentDeckUrl: null,
    opponentDeckHouses: null,
    opponentKeys: 0,
    opponentPicks: null
  };

  let opponentUsername = '';
  let opponentCollection = {};
  let selectedHouseCodes = [];

  // Agrupa coleções por jogador para mapear a coleção do oponente sem novas chamadas
  const collectionsByPlayer = {};
  if (allCollectionsData) {
    allCollectionsData.forEach(c => {
      if (!collectionsByPlayer[c.player_username]) {
        collectionsByPlayer[c.player_username] = {};
      }
      collectionsByPlayer[c.player_username][c.sticker_id] = { quantity: c.quantity };
    });
  }

  if (myMatch) {
    const isPlayerA = myMatch.player_a_username === username;
    opponentUsername = isPlayerA ? myMatch.player_b_username : myMatch.player_a_username;

    // Mapeamento das casas do deck e picks concluídos das colunas do banco
    const myHousesStr = isPlayerA ? myMatch.player_a_houses : myMatch.player_b_houses;
    const oppHousesStr = isPlayerA ? myMatch.player_b_houses : myMatch.player_a_houses;

    report.housesSubmitted = Boolean(myHousesStr);
    if (myHousesStr) {
      selectedHouseCodes = myHousesStr.split(',');
    }

    if (oppHousesStr) {
      report.opponentHouses = oppHousesStr.split(',');
    }

    report.reported = isPlayerA ? myMatch.player_a_reported : myMatch.player_b_reported;
    report.opponentReported = isPlayerA ? myMatch.player_b_reported : myMatch.player_a_reported;
    report.playerAKeys = Number(isPlayerA ? myMatch.player_a_keys : myMatch.player_b_keys) || 0;
    report.playerBKeys = Number(isPlayerA ? myMatch.player_a_opp_keys : myMatch.player_b_opp_keys) || 0;
    
    // Dados do deck do jogador logado
    report.deckName = isPlayerA ? myMatch.player_a_deck_name : myMatch.player_b_deck_name;
    report.deckSas = isPlayerA ? myMatch.player_a_deck_sas : myMatch.player_b_deck_sas;
    report.deckSet = isPlayerA ? myMatch.player_a_deck_set : myMatch.player_b_deck_set;
    report.deckUrl = isPlayerA ? myMatch.player_a_deck_url : myMatch.player_b_deck_url;
    report.deckHouses = isPlayerA ? myMatch.player_a_deck_houses : myMatch.player_b_deck_houses;

    // Dados do deck do adversário
    report.opponentDeckName = isPlayerA ? myMatch.player_b_deck_name : myMatch.player_a_deck_name;
    report.opponentDeckSas = isPlayerA ? myMatch.player_b_deck_sas : myMatch.player_a_deck_sas;
    report.opponentDeckSet = isPlayerA ? myMatch.player_b_deck_set : myMatch.player_a_deck_set;
    report.opponentDeckUrl = isPlayerA ? myMatch.player_b_deck_url : myMatch.player_a_deck_url;
    report.opponentDeckHouses = isPlayerA ? myMatch.player_b_deck_houses : myMatch.player_a_deck_houses;

    report.opponentKeys = isPlayerA ? myMatch.player_b_keys : myMatch.player_a_keys;
    report.opponentPicks = isPlayerA ? myMatch.player_b_picks : myMatch.player_a_picks;

    // A partida está confirmada quando ambos reportaram
    report.confirmed = myMatch.player_a_reported && myMatch.player_b_reported;
    report.confirmedAt = myMatch.confirmed_at || null;
    // No fluxo simplificado, a conclusão é quando o próprio jogador reportou
    report.completed = report.reported;

    report.matchDeadlinePassed = myMatch.match_deadline_passed;
    report.isPlayerA = isPlayerA;

    // Puxa as figurinhas escolhidas do campo de picks do jogador
    const myPicksStr = isPlayerA ? myMatch.player_a_picks : myMatch.player_b_picks;
    report.pickedIds = parsePicksString(myPicksStr);

    // Busca a coleção do oponente EM MEMÓRIA
    if (opponentUsername && collectionsByPlayer[opponentUsername]) {
      Object.keys(collectionsByPlayer[opponentUsername]).forEach(stickerId => {
        opponentCollection[stickerId] = {
          quantity: collectionsByPlayer[opponentUsername][stickerId].quantity
        };
      });
    }

    // Default fallbackActive logic if player has not reported yet:
    const hasReported = isPlayerA ? myMatch.player_a_reported : myMatch.player_b_reported;
    const myKeys = report.playerAKeys;
    if (!hasReported && selectedHouseCodes.length === 3) {
      const oppEligible = PLAYER_STICKERS.filter(s => 
        opponentCollection[s.id] && 
        (!collection[s.id] || collection[s.id].quantity === 0)
      );
      report.fallbackActive = myKeys > 0 && oppEligible.length < myKeys;
      report.quebraRegraMotive = report.fallbackActive ? 'qty' : 'combo';
    } else {
      report.fallbackActive = myMatch.fallback_active || false;
      report.quebraRegraMotive = report.fallbackActive ? 'qty' : 'combo';
    }
  }

  // Processa logs administrativos
  const adminLogs = (adminLogsData || []).map(l => ({
    timestamp: l.created_at,
    message: l.message,
    adminUsername: l.admin_username || null
  }));

  const stickersLog = (stickersLogData || []).map(l => {
    let resolvedType = l.type;
    if (l.message && l.message.includes('(QUEBRA-REGRA)')) {
      resolvedType = 'fallback';
    } else if (l.message && l.message.includes('(OPONENTE)')) {
      resolvedType = 'pick';
    } else if (l.message && l.message.includes('(BRASÃO)')) {
      resolvedType = 'emblem';
    }
    return {
      round: l.round_number,
      timestamp: l.created_at,
      message: l.message,
      type: resolvedType
    };
  });

  const formattedPlayers = (allPlayersData || []).map(p => ({
    id: p.username,
    name: p.name,
    serie: p.serie,
    collection: collectionsByPlayer[p.username] || {}
  }));

  const standings = (allPlayersData || [])
    .filter(p => !['teste_1', 'teste_2'].includes(p.username))
    .map(p => {
      const stickersCount = Object.keys(collectionsByPlayer[p.username] || {}).length;

      let wins = 0;
      let losses = 0;
      let played = 0;
      let keys = 0;

      if (allMatchesData) {
        allMatchesData.forEach(m => {
          if (m.completed) {
            if (m.player_a_username === p.username) {
              played++;
              keys += m.player_a_keys;
              if (m.player_a_keys > m.player_b_keys) wins++;
              else if (m.player_a_keys < m.player_b_keys) losses++;
            } else if (m.player_b_username === p.username) {
              played++;
              keys += m.player_b_keys;
              if (m.player_b_keys > m.player_a_keys) wins++;
              else if (m.player_b_keys < m.player_a_keys) losses++;
            }
          }
        });
      }

      const challengesCount = (allChallengesData || [])
        .filter(c => c.player_username === p.username && c.completed).length;

      return {
        username: p.username,
        name: p.name,
        serie: p.serie || 'A',
        stickersCount,
        wins,
        losses,
        played,
        keys,
        challengesCount
      };
    });

  const welcomeOpened = playerData.pack_opened;
  const goldenOpened = Object.keys(collection).some(id => id.endsWith(' 0') || id.endsWith('0'));

  const packs = [
    {
      id: 'welcome',
      type: 'player',
      title: 'Pacotinho inicial',
      subtitle: '6 jogadores',
      image: '/assets/pack/player_pack.webp',
      opened: welcomeOpened,
      stickerIds: initialPacks.packs[username] || []
    },
    {
      id: 'golden-1',
      type: 'challenge',
      title: 'Pacotinho dourado',
      subtitle: 'Brasões',
      image: '/assets/pack/golden_pack.webp',
      opened: goldenOpened,
      disabled: true,
      stickerIds: []
    }
  ];

  let openedPendingPlayerCount = 0;
  let openedPendingChallengeCount = 0;
  let openedPendingEmblemRoundCount = 0;

  if (pendingPacksData) {
    pendingPacksData.forEach(p => {
      const resolvedType = p.pack_type === 'crest' ? 'challenge' : (p.pack_type || 'player');
      if (p.opened) {
        if (resolvedType === 'challenge') {
          openedPendingChallengeCount++;
        } else if (resolvedType === 'emblem_round') {
          openedPendingEmblemRoundCount++;
        } else {
          openedPendingPlayerCount++;
        }
      }
      packs.push({
        id: p.id,
        type: resolvedType,
        title: resolvedType === 'emblem_round' ? `Rodada ${p.round_number}: Extra Pack` : (resolvedType === 'challenge' ? 'Pacotinho dourado' : `Pacotinho Rodada ${p.round_number}`),
        subtitle: resolvedType === 'emblem_round' ? (p.challenge_name || 'Extra Pack') : (resolvedType === 'challenge' ? (p.challenge_name || 'Desafio') : `vs ${p.opponent_name || 'Adversário'}`),
        image: resolvedType === 'emblem_round' ? '/assets/pack/holo_pack.webp' : (resolvedType === 'challenge' ? '/assets/pack/golden_pack.webp' : '/assets/pack/player_pack.webp'),
        opened: p.opened,
        stickerIds: Array.isArray(p.sticker_ids) ? p.sticker_ids : JSON.parse(p.sticker_ids || '[]'),
        isPendingPack: true,
        roundNumber: p.round_number,
        challengeName: p.challenge_name
      });
    });
  }

  const packStickersCount = collectionData ? collectionData.filter(c => c.source === 'pack').length : 0;
  const extraOpened = packStickersCount > 6 || (typeof window !== 'undefined' && window.localStorage.getItem('foc_extra_pack_opened') === 'true');

  if (username === 'teste_1') {
    // Filtra figurinhas do tipo player
    const playerStickers = STICKERS.filter(s => s.type === 'player');
    const randomStickerIds = [];
    const pool = [...playerStickers];
    for (let i = 0; i < 6; i++) {
      if (pool.length === 0) break;
      const idx = Math.floor(Math.random() * pool.length);
      randomStickerIds.push(pool.splice(idx, 1)[0].id);
    }

    packs.push({
      id: 'extra_pack',
      type: 'player',
      title: 'Pacotinho extra',
      subtitle: '6 figurinhas aleatórias',
      image: '/assets/pack/player_pack.webp',
      opened: extraOpened,
      stickerIds: randomStickerIds
    });
  }

  const totalPlayerOpened = (welcomeOpened ? 1 : 0) + (username === 'teste_1' && extraOpened ? 1 : 0) + openedPendingPlayerCount;
  const totalChallengeOpened = (goldenOpened ? 1 : 0) + openedPendingChallengeCount;
  const totalEmblemRoundOpened = openedPendingEmblemRoundCount;
  const openedPacksCount = {
    player: totalPlayerOpened,
    challenge: totalChallengeOpened,
    emblem_round: totalEmblemRoundOpened
  };

  return {
    user: {
      id: playerData.username,
      name: playerData.name,
      packOpened: playerData.pack_opened,
      isAdmin: playerData.is_admin,
      serie: playerData.serie
    },
    activeRound,
    collection,
    packs,
    openedPacksCount,
    challenges,
    pendingChallenges,
    matches: formattedMatches,
    opponentCollection,
    players: formattedPlayers,
    adminLogs,
    stickersLog,
    report,
    standings,
    pendingPacks: pendingPacksData || [],
    allRounds: allRoundsData || [],
    allMatches: allMatchesData || [],
    allPicks: allPicksData || [],
    currentRoute: window.location.hash.slice(1) || 'packs',
    albumPage: 0,
    reveal: null,
    selectedHouseCodes,
    activeChallengeId: null,
    confirmChallengeId: null,
    adminTab: 'validation',
    selectedAdminPlayerId: formattedPlayers[0]?.id || 'fabio_hideki'
  };
}

// 2. Abre o pacote e adiciona as figurinhas no banco
export async function dbOpenPack(username, stickerIds, packType, roundNumber, playerName) {
  if (!supabase) return;

  await supabase.rpc('foc2026_open_pack', {
    p_sticker_ids: stickerIds,
    p_pack_type: packType,
    p_round_number: roundNumber
  });
}

// 3. Submete o reporte de etapa única (incluindo deck e picks)
export async function dbSubmitSingleReport(matchId, houses, myKeys, oppKeys, picks, deckUrl) {
  if (!supabase) return;

  const housesStr = Array.isArray(houses) ? houses.join(',') : houses;
  const picksStr = Array.isArray(picks) ? picks.join(',') : (picks || '');

  const { error } = await supabase.rpc('foc2026_submit_single_report', {
    p_match_id: matchId,
    p_houses: housesStr,
    p_my_keys: myKeys,
    p_opp_keys: oppKeys,
    p_picks: picksStr,
    p_deck_url: deckUrl
  });

  if (error) {
    throw new Error(error.message || 'Erro ao submeter o reporte.');
  }
}

// Deprecated stubs to prevent build errors
export async function dbReportMatch(matchId, username, myKeys, isPlayerA) {
  console.warn("dbReportMatch is deprecated, use dbSubmitSingleReport instead.");
}
export async function dbPickStickers(username, pickedIds, matchId, roundNumber, playerName) {
  console.warn("dbPickStickers is deprecated, use dbSubmitSingleReport instead.");
}
export async function dbReopenOwnReport(matchId, isPlayerA) {
  console.warn("dbReopenOwnReport is deprecated.");
}

// 4. Cria um pacote pendente de pós-partida para o jogador (chamado pelo Admin)
export async function dbCreatePendingPack(playerUsername, roundNumber, opponentName, stickerIds, packType = 'player', challengeName = null) {
  if (!supabase) return;
  await supabase
    .from('foc2026_pending_packs')
    .insert({
      player_username: playerUsername,
      round_number: roundNumber,
      opponent_name: opponentName || '',
      sticker_ids: stickerIds,
      pack_type: packType,
      challenge_name: challengeName
    });
}

// 5. Abre o pacote pendente na coleção (chamado ao clicar em Ver Álbum)
export async function dbOpenPendingPack(packId) {
  if (!supabase) return;
  const { error } = await supabase.rpc('foc2026_open_pending_pack', {
    p_pack_id: packId
  });
  if (error) {
    throw new Error(error.message || 'Erro ao abrir o pacote.');
  }
}

// 5b. Libera os pacotes da rodada para ambos os jogadores
export async function dbReleaseMatchPacks(matchId, playerA, playerB, roundNumber, aName, bName, aPicks, bPicks, adminUsername) {
  if (!supabase) return;

  const aPicksArr = Array.isArray(aPicks) ? aPicks : parsePicksString(aPicks);
  const bPicksArr = Array.isArray(bPicks) ? bPicks : parsePicksString(bPicks);

  const { error } = await supabase.rpc('foc2026_release_match_packs', {
    p_match_id: matchId,
    p_player_a: playerA,
    p_player_b: playerB,
    p_round_number: roundNumber,
    p_player_a_name: aName,
    p_player_b_name: bName,
    p_player_a_picks: aPicksArr,
    p_player_b_picks: bPicksArr
  });

  if (error) {
    throw new Error(error.message || 'Erro ao liberar pacotes.');
  }

  await supabase.from('foc2026_admin_logs').insert({
    message: `Admin confirmou a partida ${matchId} (${aName} vs ${bName}) e liberou os pacotes de figurinhas`,
    admin_username: adminUsername || null
  });
}

// 5c. Alega cumprimento de desafio
export async function dbClaimChallenge(username, challengeId, stickerId) {
  if (!supabase) return;

  await supabase
    .from('foc2026_challenges')
    .update({
      picked_id: stickerId,
      pending_validation: true
    })
    .eq('player_username', username)
    .eq('id', challengeId);
}

// --- AÇÕES DO ADMINISTRADOR ---

// 6. Aprovar desafio
export async function dbApproveChallenge(playerUsername, challengeId, stickerId, roundNumber, playerName, adminUsername) {
  if (!supabase) return;

  await supabase
    .from('foc2026_challenges')
    .update({
      completed: true,
      pending_validation: false
    })
    .eq('player_username', playerUsername)
    .eq('id', challengeId);

  // Busca título do desafio para o log
  const { data: challenge } = await supabase
    .from('foc2026_challenges')
    .select('title')
    .eq('player_username', playerUsername)
    .eq('id', challengeId)
    .single();

  const challengeTitle = challenge ? challenge.title : challengeId;

  // Busca o adversário do jogador na rodada atual
  const { data: matchData } = await supabase
    .from('foc2026_matches')
    .select('player_a_username, player_b_username')
    .eq('round_number', roundNumber || 1)
    .or(`player_a_username.eq.${playerUsername},player_b_username.eq.${playerUsername}`)
    .maybeSingle();

  let opponentName = '';
  if (matchData) {
    const isPlayerA = matchData.player_a_username === playerUsername;
    const oppUsername = isPlayerA ? matchData.player_b_username : matchData.player_a_username;
    
    const { data: oppPlayer } = await supabase
      .from('foc2026_players')
      .select('name')
      .eq('username', oppUsername)
      .maybeSingle();
    opponentName = oppPlayer ? oppPlayer.name : oppUsername;
  }

  // Cria um pacote pendente de tipo 'crest' (pacotinho dourado) contendo o brasão/figurinha do desafio
  await dbCreatePendingPack(playerUsername, roundNumber || 1, opponentName, [stickerId], 'crest', challengeTitle);

  await supabase
    .from('foc2026_stickers_log')
    .insert({
      player_username: playerUsername,
      round_number: roundNumber,
      message: `${playerName} completou o desafio "${challengeTitle}" e liberou um Pacotinho Dourado contendo a figurinha ${stickerId}`,
      type: 'challenge'
    });

  await supabase
    .from('foc2026_admin_logs')
    .insert({
      message: `Admin aprovou o desafio "${challengeTitle}" para ${playerName}`,
      admin_username: adminUsername || null
    });
}

// 6b. Rejeitar desafio
export async function dbRejectChallenge(playerUsername, challengeId, adminUsername) {
  if (!supabase) return;

  await supabase
    .from('foc2026_challenges')
    .update({
      picked_id: null,
      pending_validation: false,
      completed: false
    })
    .eq('player_username', playerUsername)
    .eq('id', challengeId);

  // Busca título do desafio para o log
  const { data: challenge } = await supabase
    .from('foc2026_challenges')
    .select('title')
    .eq('player_username', playerUsername)
    .eq('id', challengeId)
    .single();

  const challengeTitle = challenge ? challenge.title : challengeId;

  // Busca nome do jogador
  const { data: player } = await supabase
    .from('foc2026_players')
    .select('name')
    .eq('username', playerUsername)
    .single();

  const playerName = player ? player.name : playerUsername;

  await supabase
    .from('foc2026_admin_logs')
    .insert({
      message: `Admin rejeitou o desafio "${challengeTitle}" de ${playerName} (reporte resetado)`,
      admin_username: adminUsername || null
    });
}

// 7. Confirmar W.O. (0x0)
export async function dbConfirmWO(matchId, adminUsername) {
  if (!supabase) return;

  await supabase
    .from('foc2026_matches')
    .update({
      player_a_keys: 0,
      player_b_keys: 0,
      player_a_reported: true,
      player_b_reported: true,
      confirmed_at: new Date().toISOString(),
      player_a_picks_completed: true,
      player_b_picks_completed: true,
      completed: true
    })
    .eq('id', matchId);

  await supabase
    .from('foc2026_admin_logs')
    .insert({
      message: `Admin confirmou W.O. (0x0) para a partida ${matchId}`,
      admin_username: adminUsername || null
    });
}

// 8. Descongelar partida (+24h)
export async function dbUnfreezeMatch(matchId, roundNumber, adminUsername) {
  if (!supabase) return;

  const newDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await supabase
    .from('foc2026_rounds')
    .update({ deadline: newDeadline })
    .eq('number', roundNumber);

  await supabase
    .from('foc2026_admin_logs')
    .insert({
      message: `Admin descongelou partida ${matchId} (+24h de prazo na rodada ${roundNumber})`,
      admin_username: adminUsername || null
    });
}

// 9. Adicionar/remover figurinha via Admin
export async function dbAdminEditSticker(playerUsername, stickerId, changeAmount, playerName, adminUsername) {
  if (!supabase) return;

  const { data: existing } = await supabase
    .from('foc2026_collections')
    .select('quantity')
    .eq('player_username', playerUsername)
    .eq('sticker_id', stickerId)
    .maybeSingle();

  const newQty = Math.max(0, (existing ? existing.quantity : 0) + changeAmount);

  if (existing) {
    if (newQty === 0) {
      await supabase
        .from('foc2026_collections')
        .delete()
        .eq('player_username', playerUsername)
        .eq('sticker_id', stickerId);
    } else {
      await supabase
        .from('foc2026_collections')
        .update({ quantity: newQty, source: 'admin' })
        .eq('player_username', playerUsername)
        .eq('sticker_id', stickerId);
    }
  } else if (newQty > 0) {
    await supabase
      .from('foc2026_collections')
      .insert({
        player_username: playerUsername,
        sticker_id: stickerId,
        quantity: newQty,
        source: 'admin',
        is_new: true
      });
  }

  const actionLabel = changeAmount > 0 ? 'adicionou' : 'removeu';
  const logMessage = `Admin ${actionLabel} a figurinha ${stickerId} para ${playerName}`;

  await supabase.from('foc2026_admin_logs').insert({
    message: logMessage,
    admin_username: adminUsername || null
  });
}

// 10. Salva a submissão das 3 casas do deck do jogador no banco
export async function dbSubmitHouses(matchId, username, houseCodes, isPlayerA) {
  if (!supabase) return;
  await supabase.rpc('foc2026_submit_houses', {
    p_match_id: matchId,
    p_houses: houseCodes
  });
}

// 11. Salva a conclusão individual de picks do jogador
export async function dbCompletePicks(matchId, username, isPlayerA) {
  if (!supabase) return;

  const updateFields = isPlayerA ? {
    player_a_picks_completed: true
  } : {
    player_b_picks_completed: true
  };

  await supabase
    .from('foc2026_matches')
    .update(updateFields)
    .eq('id', matchId);

  // Se ambos os jogadores concluírem seus picks, marca completed global = true
  const { data: match } = await supabase
    .from('foc2026_matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (match && match.player_a_picks_completed && match.player_b_picks_completed) {
    await supabase
      .from('foc2026_matches')
      .update({ completed: true })
      .eq('id', matchId);
  }
}

// 12. Reseta/Rejeita a partida de volta ao estado inicial
export async function dbResetMatch(matchId, adminUsername) {
  if (!supabase) return;

  // 1. Obter informações atuais da partida antes de resetar (para remoção de figurinhas e pacotes)
  const { data: matchData } = await supabase
    .from('foc2026_matches')
    .select('player_a_username, player_b_username, round_number, player_a_picks, player_b_picks')
    .eq('id', matchId)
    .single();

  if (matchData) {
    const { player_a_username, player_b_username, round_number, player_a_picks, player_b_picks } = matchData;
    
    // Parsear escolhas de figurinhas para IDs limpos
    const aPicksArr = parsePicksString(player_a_picks);
    const bPicksArr = parsePicksString(player_b_picks);

    // Deletar pacotes pendentes gerados para essa rodada/partida
    await supabase
      .from('foc2026_pending_packs')
      .delete()
      .eq('round_number', round_number)
      .in('player_username', [player_a_username, player_b_username]);

    // Função auxiliar para decrementar/deletar figurinhas da coleção
    const removePicksFromCollection = async (username, picks) => {
      if (!picks || picks.length === 0) return;
      for (const stickerId of picks) {
        const { data: colData } = await supabase
          .from('foc2026_collections')
          .select('quantity')
          .eq('player_username', username)
          .eq('sticker_id', stickerId);
          
        if (colData && colData.length > 0) {
          const qty = colData[0].quantity;
          if (qty > 1) {
            await supabase
              .from('foc2026_collections')
              .update({ quantity: qty - 1 })
              .eq('player_username', username)
              .eq('sticker_id', stickerId);
          } else {
            await supabase
              .from('foc2026_collections')
              .delete()
              .eq('player_username', username)
              .eq('sticker_id', stickerId);
          }
        }
      }
    };

    await removePicksFromCollection(player_a_username, aPicksArr);
    await removePicksFromCollection(player_b_username, bPicksArr);

    // Remover logs de stickers de tipo 'pick' desta rodada/jogadores
    await supabase
      .from('foc2026_stickers_log')
      .delete()
      .eq('round_number', round_number)
      .eq('type', 'pick')
      .in('player_username', [player_a_username, player_b_username]);
  }

  // 2. Resetar os campos da partida
  await supabase
    .from('foc2026_matches')
    .update({
      player_a_keys: 0,
      player_b_keys: 0,
      player_a_opp_keys: 0,
      player_b_opp_keys: 0,
      player_a_picks: '',
      player_b_picks: '',
      player_a_reported: false,
      player_b_reported: false,
      confirmed_at: null,
      completed: false,
      player_a_houses: null,
      player_b_houses: null,
      player_a_picks_completed: false,
      player_b_picks_completed: false,
      player_a_deck_url: null,
      player_b_deck_url: null,
      player_a_deck_houses: null,
      player_b_deck_houses: null,
      player_a_reported_at: null,
      player_b_reported_at: null,
      packs_released: false
    })
    .eq('id', matchId);

  // Remove figurinhas obtidas via pick pós-partida de teste_1 e teste_2
  await supabase
    .from('foc2026_collections')
    .delete()
    .eq('source', 'pick')
    .in('player_username', ['teste_1', 'teste_2']);

  if (adminUsername) {
    await supabase
      .from('foc2026_admin_logs')
      .insert({
        message: `Admin rejeitou e resetou os reportes da partida ${matchId}`,
        admin_username: adminUsername
      });
  }
}

// 13. Salva o prazo da rodada manualmente
export async function dbSaveRoundDeadline(roundNumber, deadline, adminUsername) {
  if (!supabase) return;

  await supabase
    .from('foc2026_rounds')
    .update({ deadline })
    .eq('number', roundNumber);

  await supabase
    .from('foc2026_admin_logs')
    .insert({
      message: `Admin alterou o prazo da rodada ${roundNumber} para ${new Date(deadline).toLocaleString()}`,
      admin_username: adminUsername || null
    });
}

// 14. Ativa uma rodada (desativando todas as outras)
export async function dbActivateRound(roundNumber, adminUsername) {
  if (!supabase) return;

  // Desativa todas
  await supabase
    .from('foc2026_rounds')
    .update({ active: false })
    .neq('number', roundNumber);

  // Ativa a escolhida
  await supabase
    .from('foc2026_rounds')
    .update({ active: true })
    .eq('number', roundNumber);

  await supabase
    .from('foc2026_admin_logs')
    .insert({
      message: `Admin começou a rodada ${roundNumber}`,
      admin_username: adminUsername || null
    });
}

// 15. Desativa uma rodada
export async function dbDeactivateRound(roundNumber, adminUsername) {
  if (!supabase) return;

  await supabase
    .from('foc2026_rounds')
    .update({ active: false })
    .eq('number', roundNumber);

  await supabase
    .from('foc2026_admin_logs')
    .insert({
      message: `Admin encerrou a rodada ${roundNumber}`,
      admin_username: adminUsername || null
    });
}
