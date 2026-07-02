import { createClient } from '@supabase/supabase-js';
import { STICKERS } from './data/stickers.js';
import initialPacks from './data/initial-packs.json';

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
    allPicksRes
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
    supabase.from('foc2026_stickers_log').select('*').eq('type', 'pick')
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

  // Processa a coleção do jogador logado
  const collection = {};
  if (collectionData) {
    collectionData.forEach(c => {
      collection[c.sticker_id] = {
        quantity: c.quantity,
        source: c.source,
        isNew: c.is_new
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
    playerB: playersMap[m.player_b_username] || m.player_b_username
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
    maxPicks: 3
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
    report.playerAKeys = isPlayerA ? myMatch.player_a_keys : myMatch.player_b_keys;
    report.playerBKeys = isPlayerA ? myMatch.player_b_keys : myMatch.player_a_keys;

    // A partida está confirmada (etapa de picks liberada) quando ambos reportaram
    report.confirmed = myMatch.player_a_reported && myMatch.player_b_reported;
    report.confirmedAt = myMatch.confirmed_at || null;
    // O status "concluído" (picks finalizados) é individual de cada jogador
    report.completed = isPlayerA ? myMatch.player_a_picks_completed : myMatch.player_b_picks_completed;

    report.matchDeadlinePassed = myMatch.match_deadline_passed;
    report.fallbackActive = myMatch.fallback_active;
    report.isPlayerA = isPlayerA;

    // Se confirmada, puxa as figurinhas que o jogador escolheu via pick na coleção
    if (report.confirmed) {
      const picks = collectionData
        ? collectionData.filter(c => c.source === 'pick').map(c => c.sticker_id)
        : [];
      report.pickedIds = picks;
    }

    // Busca a coleção do oponente EM MEMÓRIA
    if (opponentUsername && collectionsByPlayer[opponentUsername]) {
      Object.keys(collectionsByPlayer[opponentUsername]).forEach(stickerId => {
        opponentCollection[stickerId] = {
          quantity: collectionsByPlayer[opponentUsername][stickerId].quantity
        };
      });
    }
  }

  // Processa logs administrativos
  const adminLogs = (adminLogsData || []).map(l => ({
    timestamp: l.created_at,
    message: l.message
  }));

  const stickersLog = (stickersLogData || []).map(l => ({
    round: l.round_number,
    timestamp: l.created_at,
    message: l.message,
    type: l.type
  }));

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
      type: 'crest',
      title: 'Pacotinho dourado',
      subtitle: 'Brasões',
      image: '/assets/pack/golden_pack.webp',
      opened: goldenOpened,
      disabled: true,
      stickerIds: []
    }
  ];

  if (username === 'teste_1') {
    const packStickersCount = collectionData ? collectionData.filter(c => c.source === 'pack').length : 0;
    const extraOpened = packStickersCount > 6 || (typeof window !== 'undefined' && window.localStorage.getItem('foc_extra_pack_opened') === 'true');

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
    challenges,
    pendingChallenges,
    matches: formattedMatches,
    opponentCollection,
    players: formattedPlayers,
    adminLogs,
    stickersLog,
    report,
    standings,
    allRounds: allRoundsData || [],
    allMatches: allMatchesData || [],
    allPicks: allPicksData || [],
    currentRoute: 'packs',
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

// 3. Salva reporte de partida de um jogador
export async function dbReportMatch(matchId, username, keys, isPlayerA) {
  if (!supabase) return;

  await supabase.rpc('foc2026_report_own_keys', {
    p_match_id: matchId,
    p_keys: keys
  });
}

export async function dbReopenOwnReport(matchId, isPlayerA) {
  if (!supabase) return;

  await supabase.rpc('foc2026_reopen_own_report', {
    p_match_id: matchId
  });
}

// 4. Salva as figurinhas obtidas no pick pós-partida
export async function dbPickStickers(username, stickerIds, matchId, roundNumber, playerName) {
  if (!supabase) return;

  await supabase.rpc('foc2026_claim_picks', {
    p_match_id: matchId,
    p_sticker_ids: stickerIds,
    p_round_number: roundNumber
  });
}

// 5. Alega cumprimento de desafio
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
export async function dbApproveChallenge(playerUsername, challengeId, stickerId, roundNumber, playerName) {
  if (!supabase) return;

  await supabase
    .from('foc2026_challenges')
    .update({
      completed: true,
      pending_validation: false
    })
    .eq('player_username', playerUsername)
    .eq('id', challengeId);

  // Injeta figurinha na coleção do jogador
  const { data: existing } = await supabase
    .from('foc2026_collections')
    .select('quantity')
    .eq('player_username', playerUsername)
    .eq('sticker_id', stickerId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('foc2026_collections')
      .update({ quantity: existing.quantity + 1, source: 'challenge', is_new: true })
      .eq('player_username', playerUsername)
      .eq('sticker_id', stickerId);
  } else {
    await supabase
      .from('foc2026_collections')
      .insert({
        player_username: playerUsername,
        sticker_id: stickerId,
        quantity: 1,
        source: 'challenge',
        is_new: true
      });
  }

  // Busca título do desafio para o log
  const { data: challenge } = await supabase
    .from('foc2026_challenges')
    .select('title')
    .eq('player_username', playerUsername)
    .eq('id', challengeId)
    .single();

  const challengeTitle = challenge ? challenge.title : challengeId;

  await supabase
    .from('foc2026_stickers_log')
    .insert({
      player_username: playerUsername,
      round_number: roundNumber,
      message: `${playerName} obteve a figurinha ${stickerId} via Desafio: ${challengeTitle}`,
      type: 'challenge'
    });

  await supabase
    .from('foc2026_admin_logs')
    .insert({
      message: `Admin aprovou o desafio "${challengeTitle}" para ${playerName}`
    });
}

// 7. Confirmar W.O. (0x0)
export async function dbConfirmWO(matchId) {
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
      message: `Admin confirmou W.O. (0x0) para a partida ${matchId}`
    });
}

// 8. Descongelar partida (+24h)
export async function dbUnfreezeMatch(matchId, roundNumber) {
  if (!supabase) return;

  const newDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await supabase
    .from('foc2026_rounds')
    .update({ deadline: newDeadline })
    .eq('number', roundNumber);

  await supabase
    .from('foc2026_admin_logs')
    .insert({
      message: `Admin descongelou partida ${matchId} (+24h de prazo na rodada ${roundNumber})`
    });
}

// 9. Adicionar/remover figurinha via Admin
export async function dbAdminEditSticker(playerUsername, stickerId, changeAmount, playerName) {
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

  await supabase.from('foc2026_admin_logs').insert({ message: logMessage });
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

// 12. Reseta a partida entre teste_1 e teste_2 de volta ao estado inicial
export async function dbResetMatch(matchId) {
  if (!supabase) return;

  await supabase
    .from('foc2026_matches')
    .update({
      player_a_keys: 0,
      player_b_keys: 0,
      player_a_reported: false,
      player_b_reported: false,
      confirmed_at: null,
      completed: false,
      player_a_houses: null,
      player_b_houses: null,
      player_a_picks_completed: false,
      player_b_picks_completed: false
    })
    .eq('id', matchId);

  // Remove figurinhas obtidas via pick pós-partida de teste_1 e teste_2
  await supabase
    .from('foc2026_collections')
    .delete()
    .eq('source', 'pick')
    .in('player_username', ['teste_1', 'teste_2']);
}

// 13. Salva o prazo da rodada manualmente
export async function dbSaveRoundDeadline(roundNumber, deadline) {
  if (!supabase) return;

  await supabase
    .from('foc2026_rounds')
    .update({ deadline })
    .eq('number', roundNumber);

  await supabase
    .from('foc2026_admin_logs')
    .insert({
      message: `Admin alterou o prazo da rodada ${roundNumber} para ${new Date(deadline).toLocaleString()}`
    });
}

// 14. Ativa uma rodada (desativando todas as outras)
export async function dbActivateRound(roundNumber) {
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
      message: `Admin começou a rodada ${roundNumber}`
    });
}

// 15. Desativa uma rodada
export async function dbDeactivateRound(roundNumber) {
  if (!supabase) return;

  await supabase
    .from('foc2026_rounds')
    .update({ active: false })
    .eq('number', roundNumber);

  await supabase
    .from('foc2026_admin_logs')
    .insert({
      message: `Admin encerrou a rodada ${roundNumber}`
    });
}
