import './style/base.css';
import './style/card.css';
import './style/pack.css';
import './style/album.css';
import './style/report.css';
import './style/challenges.css';

import { createInitialState } from './data/mock-state.js';
import { renderPacks, initPacks } from './pages/packs.js';
import { renderAlbum } from './pages/album.js';
import { initAlbumBook } from './components/album-book.js';
import { renderReport, initCountdown } from './pages/report.js';
import { renderChallenges, renderChallengePicker, renderChallengeConfirmation } from './pages/challenges.js';
import { renderAdmin } from './pages/admin.js';
import { renderTable } from './pages/table.js';
import {
  hasSupabaseConfig,
  fetchFullState,
  dbOpenPack,
  dbReportMatch,
  dbPickStickers,
  dbClaimChallenge,
  dbApproveChallenge,
  dbRejectChallenge,
  dbConfirmWO,
  dbUnfreezeMatch,
  dbAdminEditSticker,
  dbSubmitHouses,
  dbCompletePicks,
  dbReopenOwnReport,
  dbResetMatch,
  dbSaveRoundDeadline,
  dbActivateRound,
  dbDeactivateRound,
  setSupabaseSession,
  dbSubmitSingleReport,
  dbOpenPendingPack,
  dbReleaseMatchPacks
} from './supabase.js';
import { stickerCard } from './components/sticker-card.js';
import { getAssetUrl, formatPicksForReport, parsePicksString } from './utils/format.js';
import { parseDokResponse } from './utils/sas.js';
import { validateScore } from './utils/validation.js';
import './style/login.css';

import { ALBUM_PAGES, GOLDEN_CREST_IDS, INITIAL_PLAYER_IDS, PLAYER_STICKERS, STICKERS, getSticker } from './data/stickers.js';

let state = createInitialState();
if (!('activeChallengeId' in state)) state.activeChallengeId = null;
if (!('confirmChallengeId' in state)) state.confirmChallengeId = null;
if (!('adminTab' in state)) state.adminTab = 'rounds';
if (!('selectedAdminPlayerId' in state)) state.selectedAdminPlayerId = 'fabio_hideki';
if (!('reportTab' in state)) state.reportTab = 'match';
if (!('tableTab' in state)) state.tableTab = state.user.serie || 'A';
const app = document.querySelector('#app');

function setRoute(route) {
  state.currentRoute = route;
  state.showSuccessModal = false; // Reset success modal
  window.history.replaceState(null, '', `#${route}`);
  render();
}

async function openPack(packId) {
  const pack = state.packs.find((item) => item.id === packId);
  if (!pack || pack.opened || pack.disabled) return;

  if (pack.isPendingPack) {
    pack.opened = true;
    state.reveal = {
      pack,
      newIds: pack.stickerIds,
      duplicateIds: [],
      ripped: false,
      flippedIndexes: []
    };
    render();
    return;
  }

  pack.opened = true;
  if (pack.type === 'player') state.user.packOpened = true;
  if (pack.id === 'extra_pack') {
    localStorage.setItem('foc_extra_pack_opened', 'true');
  }
  if (pack.id === 'emblem_round_3') {
    localStorage.setItem(`foc_emblem_round_opened_${state.user.id}`, 'true');
  }

  const newIds = [];
  const duplicateIds = [];
  const configuredIds = Array.isArray(pack.stickerIds) ? pack.stickerIds : [];
  const fallbackIds = getFallbackPackStickerIds(pack.type);
  const sourceStickerIds = configuredIds.length ? configuredIds : fallbackIds;

  const allStickersOfType = STICKERS.filter((s) => s.type === pack.type);
  const finalStickerIds = [];

  sourceStickerIds.forEach((id) => {
    if ((state.collection[id] && state.collection[id].quantity > 0) || finalStickerIds.includes(id)) {
      const substitute = allStickersOfType.find(
        (s) => (!state.collection[s.id] || state.collection[s.id].quantity === 0) && !finalStickerIds.includes(s.id)
      );
      if (substitute) {
        finalStickerIds.push(substitute.id);
      } else {
        finalStickerIds.push(id);
      }
    } else {
      finalStickerIds.push(id);
    }
  });

  pack.stickerIds = finalStickerIds;

  if (hasSupabaseConfig) {
    // Adiciona localmente na coleção de forma síncrona instantânea para evitar race conditions
    pack.stickerIds.forEach((id) => {
      state.collection[id] = { quantity: 1, isNew: true, source: pack.type === 'emblem_round' ? 'emblem_round' : 'pack' };
    });
    state.user.packOpened = true;

    await dbOpenPack(state.user.id, pack.stickerIds, pack.type, state.activeRound.number, state.user.name);
    const fetched = await fetchFullState(state.user.id);
    if (fetched) {
      const finalIds = [...pack.stickerIds];
      state = fetched;
      state.reveal = { pack, newIds: finalIds, duplicateIds };
    }
  } else {
    pack.stickerIds.forEach((id) => {
      state.collection[id] = { quantity: 1, isNew: true, source: pack.type === 'emblem_round' ? 'emblem_round' : 'pack' };
      newIds.push(id);

      if (!state.stickersLog) state.stickersLog = [];
      state.stickersLog.push({
        round: state.activeRound.number,
        timestamp: new Date().toISOString(),
        message: `${state.user.name} obteve a figurinha ${id} via Pacotinho`,
        type: 'pack'
      });
    });
    state.reveal = { pack, newIds, duplicateIds };
  }
  render();
}



function setAlbumPage(index) {
  state.albumPage = Math.max(0, Math.min(index, ALBUM_PAGES.length - 1));
  render();
}

function getFallbackPackStickerIds(packType) {
  if (packType === 'challenge' || packType === 'emblem_round') {
    const missingCrests = STICKERS
      .filter((sticker) => sticker.type === 'crest')
      .filter((sticker) => !state.collection[sticker.id] || state.collection[sticker.id].quantity === 0)
      .map((sticker) => sticker.id);
    return (missingCrests.length ? missingCrests : GOLDEN_CREST_IDS).slice(0, 3);
  }

  const missingPlayers = PLAYER_STICKERS
    .filter((sticker) => !state.collection[sticker.id] || state.collection[sticker.id].quantity === 0)
    .map((sticker) => sticker.id);

  return (missingPlayers.length ? missingPlayers : INITIAL_PLAYER_IDS).slice(0, 6);
}

function toggleHouse(houseCode) {
  if (state.report.housesSubmitted) return;
  if (!state.selectedHouseCodes) {
    state.selectedHouseCodes = [];
  }
  const index = state.selectedHouseCodes.indexOf(houseCode);
  if (index > -1) {
    state.selectedHouseCodes.splice(index, 1);
  } else {
    if (state.selectedHouseCodes.length < 3) {
      state.selectedHouseCodes.push(houseCode);
    }
  }
  // Clear selected picks when houses change
  state.selectedPickIds = [];

  if (state.selectedHouseCodes.length === 3) {
    const oppEligible = PLAYER_STICKERS.filter(s => 
      state.opponentCollection[s.id] && 
      (!state.collection[s.id] || state.collection[s.id].quantity === 0)
    );
    const myKeys = state.report.playerAKeys;
    state.report.fallbackActive = myKeys > 0 && oppEligible.length < myKeys;
    state.report.quebraRegraMotive = state.report.fallbackActive ? 'qty' : 'combo';
  }

  render();
}

async function submitHouses() {
  if (state.selectedHouseCodes.length !== 3) return;
  if (hasSupabaseConfig) {
    await dbSubmitHouses(state.report.matchId, state.user.id, state.selectedHouseCodes, state.report.isPlayerA);
    const fetched = await fetchFullState(state.user.id);
    if (fetched) state = fetched;
  } else {
    state.report.housesSubmitted = true;
  }
  render();
}

function setKeys(side, value) {
  const next = Number(value);
  if (next < 0 || next > 3) return;
  if (side === 'a') {
    state.report.playerAKeys = next;
    state.selectedPickIds = [];
  }
  if (side === 'b') {
    state.report.playerBKeys = next;
    state.selectedPickIds = [];
  }

  // Update fallbackActive dynamically when keys change, if houses are selected
  const myKeys = state.report.playerAKeys;
  const selectedCodes = state.selectedHouseCodes || [];
  if (selectedCodes.length === 3) {
    const oppEligible = PLAYER_STICKERS.filter(s => 
      state.opponentCollection[s.id] && 
      (!state.collection[s.id] || state.collection[s.id].quantity === 0)
    );
    state.report.fallbackActive = myKeys > 0 && oppEligible.length < myKeys;
    state.report.quebraRegraMotive = state.report.fallbackActive ? 'qty' : 'combo';
  }

  render();
}

function adjustKeys(side, amount) {
  if (state.report.reported && !state.report.conflict) return;
  const current = side === 'a' ? state.report.playerAKeys : state.report.playerBKeys;
  setKeys(side, current + Number(amount));
}

function simulateOpponent(consistent = true) {
  state.report.opponentReported = true;
  if (consistent) {
    state.report.opponentKeysA = state.report.playerAKeys;
    state.report.opponentKeysB = state.report.playerBKeys;
    state.report.confirmed = true;
    state.report.conflict = false;
    state.report.confirmedAt = new Date().toISOString();
  } else {
    state.report.opponentKeysA = state.report.playerAKeys === 3 ? 1 : 3;
    state.report.opponentKeysB = state.report.playerBKeys === 3 ? 1 : 3;
    state.report.confirmed = false;
    state.report.conflict = true;
  }
  render();
}

async function reportMatch() {
  if (!state.report.housesSubmitted) return;
  state.report.reported = true;
  if (state.report.opponentReported) {
    state.report.confirmed = true;
    state.report.conflict = false;
    state.report.confirmedAt = new Date().toISOString();
  }
  render();

  if (hasSupabaseConfig) {
    await dbReportMatch(state.report.matchId, state.user.id, state.report.playerAKeys, state.report.isPlayerA);
    const fetched = await fetchFullState(state.user.id);
    if (fetched) state = fetched;
  } else {
    state.report.conflict = false;
    if (!state.report.opponentReported) {
      state.report.confirmed = false;
      setTimeout(() => {
        if (state.report.reported && !state.report.opponentReported) {
          simulateOpponent(true);
        }
      }, 2000);
    }
  }
  render();
}

async function editReport() {
  if (state.report.confirmed || state.report.completed) return;
  if (hasSupabaseConfig) {
    await dbReopenOwnReport(state.report.matchId, state.report.isPlayerA);
    const fetched = await fetchFullState(state.user.id);
    if (fetched) state = fetched;
  } else {
    state.report.reported = false;
    state.report.conflict = false;
  }
  render();
}

async function pasteDeckLink() {
  try {
    const text = await navigator.clipboard.readText();
    state.report.deckUrl = text.trim();
    render();
  } catch (err) {
    console.error('Falha ao acessar o clipboard:', err);
  }
}

function toggleReportPick(stickerId) {
  if (!state.selectedPickIds) state.selectedPickIds = [];
  const index = state.selectedPickIds.indexOf(stickerId);
  const selectedCodes = state.selectedHouseCodes || [];
  const myKeys = state.report.playerAKeys;

  const oppEligible = PLAYER_STICKERS.filter(s => 
    state.opponentCollection[s.id] && 
    (!state.collection[s.id] || state.collection[s.id].quantity === 0)
  );
  
  const oppEligibleInSelected = oppEligible.filter(s => selectedCodes.includes(s.house));
  
  let pool = [];
  let maxPicks = myKeys;
  
  if (!state.report.fallbackActive) {
    // Pick Normal
    // 1. Add opponent eligible stickers
    const eligibleInSelected = oppEligibleInSelected.map(s => ({ ...s, source: 'opponent' }));
    pool = [...eligibleInSelected];
    
    // 2. Add emblem fallback stickers for selected houses where opponent has 0 player stickers
    selectedCodes.forEach(hc => {
      const oppHasZero = !PLAYER_STICKERS.some(s => s.house === hc && state.opponentCollection[s.id] && state.opponentCollection[s.id].quantity > 0);
      if (oppHasZero) {
        const oppHasEmblem = state.opponentCollection[hc + ' 0'] && state.opponentCollection[hc + ' 0'].quantity > 0;
        if (oppHasEmblem) {
          const missingInHouse = PLAYER_STICKERS.filter(s => 
            s.house === hc && 
            (!state.collection[s.id] || state.collection[s.id].quantity === 0)
          );
          missingInHouse.forEach(s => {
            pool.push({ ...s, source: 'emblem' });
          });
        }
      }
    });

    const maxPicksPossible = selectedCodes.reduce((sum, hc) => {
      const hasEligible = pool.some(s => s.house === hc);
      return sum + (hasEligible ? 1 : 0);
    }, 0);
    maxPicks = Math.min(myKeys, maxPicksPossible);
  } else {
    const poolMap = new Map();
    selectedCodes.forEach(houseCode => {
      const oppEligibleInHouse = oppEligibleInSelected.filter(s => s.house === houseCode);
      if (oppEligibleInHouse.length > 0) {
        oppEligibleInHouse.forEach(s => {
          poolMap.set(s.id, s);
        });
      } else {
        const playerMissingInHouse = PLAYER_STICKERS.filter(s => 
          s.house === houseCode && 
          (!state.collection[s.id] || state.collection[s.id].quantity === 0)
        );
        playerMissingInHouse.forEach(s => {
          poolMap.set(s.id, s);
        });
      }
    });
    pool = Array.from(poolMap.values());
    const maxPicksPossible = selectedCodes.reduce((sum, hc) => {
      const hasEligible = pool.some(s => s.house === hc);
      return sum + (hasEligible ? 1 : 0);
    }, 0);
    maxPicks = Math.min(myKeys, maxPicksPossible);
  }

  if (index > -1) {
    state.selectedPickIds.splice(index, 1);
  } else {
    const targetSticker = pool.find(s => s.id === stickerId);
    if (targetSticker) {
      const sameHouseIndex = state.selectedPickIds.findIndex(id => {
        const s = pool.find(item => item.id === id);
        return s && s.house === targetSticker.house;
      });
      if (sameHouseIndex > -1) {
        state.selectedPickIds.splice(sameHouseIndex, 1);
      }
    }
    if (state.selectedPickIds.length < maxPicks) {
      state.selectedPickIds.push(stickerId);
    }
  }
  render();
}

async function submitSingleReport() {
  const report = state.report;

  report.deckHouses = state.selectedHouseCodes.join(',');

  if (state.selectedHouseCodes.length !== 3) {
    state.reportModal = {
      type: 'error',
      title: 'Seleção Incompleta',
      message: 'Por favor, selecione exatamente 3 casas para o seu deck.'
    };
    render();
    return;
  }
  if (!report.deckUrl) {
    state.reportModal = {
      type: 'error',
      title: 'Link Ausente',
      message: 'Por favor, insira o link do seu deck.'
    };
    render();
    return;
  }

  const pickedIds = state.selectedPickIds || [];
  const matchId = report.matchId;

  if (hasSupabaseConfig) {
    const btn = document.querySelector('[data-action="submitSingleReport"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Enviando...';
    }
    try {
      await dbSubmitSingleReport(
        matchId,
        report.deckHouses.split(','),
        report.playerAKeys,
        report.playerBKeys,
        formatPicksForReport(pickedIds, state),
        report.deckUrl
      );

      const fetched = await fetchFullState(state.user.id);
      if (fetched) {
        state = fetched;
        state.report.reported = true;
        state.report.completed = true;
        state.reportModal = {
          type: 'success',
          title: 'Reporte Enviado!',
          message: 'Seu reporte de partida foi salvo com sucesso.'
        };
      }
    } catch (err) {
      console.error(err);
      state.reportModal = {
        type: 'error',
        title: 'Falha no Reporte',
        message: err.message || 'Ocorreu um erro ao enviar o reporte. Verifique sua conexão ou se a assinatura da função no banco de dados está atualizada.'
      };
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Reportar Partida';
      }
    }
  } else {
    // Offline Simulation
    state.report.housesSubmitted = true;
    state.report.reported = true;
    state.report.completed = true;

    const formattedPicks = formatPicksForReport(pickedIds, state);
    const match = state.matches.find(m => m.id === matchId);
    if (match) {
      if (state.report.isPlayerA) {
        match.player_a_picks = formattedPicks.join(',');
        match.player_a_reported = true;
        match.player_a_houses = report.deckHouses;
        match.player_a_keys = report.playerAKeys;
        match.player_a_opp_keys = report.playerBKeys;
      } else {
        match.player_b_picks = formattedPicks.join(',');
        match.player_b_reported = true;
        match.player_b_houses = report.deckHouses;
        match.player_b_keys = report.playerBKeys;
        match.player_b_opp_keys = report.playerAKeys;
      }
    }

    pickedIds.forEach(id => {
      if (state.collection[id]) {
        state.collection[id].quantity += 1;
      } else {
        state.collection[id] = { quantity: 1, source: 'pick', isNew: true };
      }
    });

    state.reportModal = {
      type: 'success',
      title: 'Reporte Simulado!',
      message: 'Seu reporte foi simulado com sucesso no modo offline.'
    };
  }
  render();
}

function closeReportModal() {
  state.reportModal = null;
  render();
}

async function pickSticker(stickerId) {
  if (state.report.pickedIds.includes(stickerId)) return;
  if (!getCurrentPickPool().some((sticker) => sticker.id === stickerId)) return;
  const maxPicks = getCurrentPickLimit();
  if (state.report.pickedIds.length >= maxPicks) return;

  state.report.pickedIds.push(stickerId);
  render();
}

function getCurrentPickLimit() {
  const { eligible } = getPickPools();
  return state.report.fallbackActive || eligible.length === 0 ? 3 : state.report.playerAKeys;
}

function getCurrentPickPool() {
  const { eligible, fallbackPool } = getPickPools();
  return state.report.fallbackActive || eligible.length === 0 ? fallbackPool : eligible;
}

function getPickPools() {
  const selectedCodes = state.selectedHouseCodes || [];
  const eligible = PLAYER_STICKERS
    .filter((sticker) => selectedCodes.includes(sticker.house))
    .filter((sticker) => state.opponentCollection[sticker.id])
    .filter((sticker) => !state.collection[sticker.id] || state.collection[sticker.id].quantity === 0);

  const fallbackPool = PLAYER_STICKERS
    .filter((sticker) => selectedCodes.includes(sticker.house))
    .filter((sticker) => !state.collection[sticker.id] || state.collection[sticker.id].quantity === 0);

  return { eligible, fallbackPool };
}

async function completePicks() {
  const pickedIds = [...state.report.pickedIds];
  if (hasSupabaseConfig) {
    if (pickedIds.length) {
      await dbPickStickers(state.user.id, pickedIds, state.report.matchId, state.activeRound.number, state.user.name);
    } else {
      await dbPickStickers(state.user.id, [], state.report.matchId, state.activeRound.number, state.user.name);
    }
    const fetched = await fetchFullState(state.user.id);
    if (fetched) state = fetched;
  } else {
    pickedIds.forEach((stickerId) => {
      if (state.collection[stickerId]) {
        state.collection[stickerId].quantity += 1;
        state.collection[stickerId].isNew = true;
        state.collection[stickerId].source = 'pick';
      } else {
        state.collection[stickerId] = { quantity: 1, isNew: true, source: 'pick' };
      }
      if (!state.stickersLog) state.stickersLog = [];
      
      const isOpponent = state.opponentCollection[stickerId] && (!state.collection[stickerId] || state.collection[stickerId].quantity === 0);
      const houseCode = stickerId.split(' ')[0];
      const hasEmblem = state.collection[houseCode + ' 0'] && state.collection[houseCode + ' 0'].quantity > 0;
      const oppHasZero = !PLAYER_STICKERS.some(s => s.house === houseCode && state.opponentCollection[s.id] && state.opponentCollection[s.id].quantity > 0);
      
      let sourceLabel = '(QUEBRA-REGRA)';
      let logType = 'fallback';
      if (isOpponent) {
        sourceLabel = '(OPONENTE)';
        logType = 'pick';
      } else if (hasEmblem && oppHasZero) {
        sourceLabel = '(BRASÃO)';
        logType = 'emblem';
      }
      
      state.stickersLog.push({
        round: state.activeRound.number,
        timestamp: new Date().toISOString(),
        message: `${state.user.name} obteve a figurinha ${stickerId} ${sourceLabel} via Pick pós-partida`,
        type: logType
      });
    });
    state.report.completed = true;
  }
  if (pickedIds.length) {
    state.reveal = {
      pack: {
        id: `pick-${state.report.matchId}`,
        type: 'player',
        title: 'Pacotinho de picks',
        subtitle: `${pickedIds.length} figurinhas`,
        image: '/assets/pack/player_pack.webp',
        opened: true,
        stickerIds: pickedIds,
      },
      newIds: pickedIds,
      duplicateIds: [],
      ripped: false,
      flippedIndexes: [],
    };
    state.currentRoute = 'packs';
    window.history.replaceState(null, '', '#packs');
  }
  render();
}

async function resetMatch() {
  state.selectedHouseCodes = [];
  state.selectedPickIds = [];
  if (hasSupabaseConfig) {
    const resetBtn = document.querySelector('[data-action="resetMatch"]');
    if (resetBtn) {
      resetBtn.disabled = true;
      resetBtn.textContent = 'Resetando...';
    }
    await dbResetMatch(state.report.matchId);
    const fetched = await fetchFullState(state.user.id);
    if (fetched) state = fetched;
    render();
  }
}

function claimChallenge(challengeId) {
  const challenge = state.challenges.find(c => c.id === challengeId);
  if (!challenge || challenge.completed || challenge.pendingValidation) return;
  const usedChallengeSlots = state.challenges.filter(c => c.completed || c.pendingValidation).length;
  if (usedChallengeSlots >= 4) return;

  // Abre o modal de confirmação do desafio
  state.confirmChallengeId = challengeId;
  render();
}

function confirmChallenge(challengeId) {
  state.activeChallengeId = challengeId;
  state.confirmChallengeId = null;
  render();
}

function cancelChallenge() {
  state.confirmChallengeId = null;
  render();
}

async function approveChallenge(challengeId, playerUsername) {
  if (hasSupabaseConfig) {
    const pending = state.pendingChallenges || [];
    const challenge = pending.find(c => c.id === challengeId && c.playerUsername === playerUsername);
    if (!challenge) return;

    const stickerId = challenge.pickedId;
    const playerName = challenge.playerName;

    await dbApproveChallenge(playerUsername, challengeId, stickerId, state.activeRound.number, playerName, state.user.id);
    const fetched = await fetchFullState(state.user.id);
    if (fetched) state = fetched;
  } else {
    const challenge = state.challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    challenge.completed = true;
    challenge.pendingValidation = false;

    if (challenge.pickedId) {
      if (state.collection[challenge.pickedId]) {
        state.collection[challenge.pickedId].quantity += 1;
      } else {
        state.collection[challenge.pickedId] = { quantity: 1, source: 'challenge' };
      }

      if (!state.stickersLog) state.stickersLog = [];
      state.stickersLog.push({
        round: state.activeRound.number,
        timestamp: new Date().toISOString(),
        message: `${state.user.name} obteve a figurinha ${challenge.pickedId} via Desafio: ${challenge.title}`,
        type: 'challenge'
      });
    }

    if (!state.adminLogs) state.adminLogs = [];
    state.adminLogs.push({
      timestamp: new Date().toISOString(),
      message: `Admin aprovou o desafio "${challenge.title}" para ${state.user.name}`
    });
  }

  render();
}

async function rejectChallenge(challengeId, playerUsername) {
  if (confirm("Tem certeza que deseja rejeitar o reporte deste desafio? Isso resetará a submissão do jogador.")) {
    if (hasSupabaseConfig) {
      await dbRejectChallenge(playerUsername, challengeId, state.user.id);
      const fetched = await fetchFullState(state.user.id);
      if (fetched) state = fetched;
    } else {
      const challenge = state.challenges.find(c => c.id === challengeId && c.playerUsername === playerUsername);
      if (challenge) {
        challenge.completed = false;
        challenge.pendingValidation = false;
        challenge.pickedId = null;
      }
      if (!state.adminLogs) state.adminLogs = [];
      state.adminLogs.push({
        timestamp: new Date().toISOString(),
        message: `Admin rejeitou o desafio "${challengeId}" de ${playerUsername}`
      });
    }
    render();
  }
}

async function rejectMatch(matchId) {
  if (confirm("Tem certeza que deseja rejeitar esta partida? Isso apagará os dados reportados por ambos os jogadores.")) {
    if (hasSupabaseConfig) {
      await dbResetMatch(matchId, state.user.id);
      const fetched = await fetchFullState(state.user.id);
      if (fetched) state = fetched;
    } else {
      const match = state.matches.find(m => m.id === matchId);
      if (match) {
        match.player_a_keys = 0;
        match.player_b_keys = 0;
        match.player_a_opp_keys = 0;
        match.player_b_opp_keys = 0;
        match.player_a_picks = '';
        match.player_b_picks = '';
        match.player_a_reported = false;
        match.player_b_reported = false;
        match.player_a_houses = null;
        match.player_b_houses = null;
        match.player_a_deck_url = null;
        match.player_b_deck_url = null;
        match.player_a_deck_houses = null;
        match.player_b_deck_houses = null;
        match.player_a_reported_at = null;
        match.player_b_reported_at = null;
        match.confirmed_at = null;
        match.completed = false;
        match.player_a_picks_completed = false;
        match.player_b_picks_completed = false;
        match.packs_released = false;
      }
      if (!state.adminLogs) state.adminLogs = [];
      state.adminLogs.push({
        timestamp: new Date().toISOString(),
        message: `Admin rejeitou e resetou os reportes da partida ${matchId}`
      });
    }
    render();
  }
}

function closeChallengePicke() {
  state.activeChallengeId = null;
  render();
}

async function pickChallengeSticker(challengeId, stickerId) {
  const challenge = state.challenges.find(c => c.id === challengeId);
  if (!challenge) return;
  challenge.pendingValidation = true;
  challenge.pickedId = stickerId;
  state.activeChallengeId = null;

  if (hasSupabaseConfig) {
    await dbClaimChallenge(state.user.id, challengeId, stickerId);
    const fetched = await fetchFullState(state.user.id);
    if (fetched) state = fetched;
  }
  render();
}

async function releasePacks(matchId) {
  const match = state.matches.find(m => m.id === matchId);
  if (!match) return;

  if (hasSupabaseConfig) {
    const btn = document.querySelector(`[data-action="releasePacks"][data-match="${matchId}"]`);
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Aprovando...';
    }
    try {
      await dbReleaseMatchPacks(
        matchId,
        match.player_a_username,
        match.player_b_username,
        match.round_number,
        match.playerA,
        match.playerB,
        match.player_a_picks,
        match.player_b_picks,
        state.user.id
      );
      const fetched = await fetchFullState(state.user.id);
      if (fetched) state = fetched;
    } catch (err) {
      console.error(err);
      alert('Erro ao liberar as figurinhas.');
    }
  } else {
    // Offline Simulation
    match.packs_released = true;
    match.completed = true;

    // Simular a criação de pending packs offline na lista de pacotes
    if (match.player_a_picks) {
      const stickerIds = match.player_a_picks.split(',').filter(Boolean);
      if (stickerIds.length > 0) {
        state.packs.push({
          id: `pending-pack-sim-a-${match.id}`,
          type: 'player',
          title: `Pacotinho Rodada ${match.round_number}`,
          subtitle: `vs ${match.playerB}`,
          image: '/assets/pack/player_pack.webp',
          opened: false,
          stickerIds,
          isPendingPack: true
        });
      }
    }
    if (match.player_b_picks) {
      const stickerIds = match.player_b_picks.split(',').filter(Boolean);
      if (stickerIds.length > 0) {
        state.packs.push({
          id: `pending-pack-sim-b-${match.id}`,
          type: 'player',
          title: `Pacotinho Rodada ${match.round_number}`,
          subtitle: `vs ${match.playerA}`,
          image: '/assets/pack/player_pack.webp',
          opened: false,
          stickerIds,
          isPendingPack: true
        });
      }
    }

    if (!state.adminLogs) state.adminLogs = [];
    state.adminLogs.push({
      timestamp: new Date().toISOString(),
      message: `Admin liberou pacotinhos para ${match.playerA} e ${match.playerB} (Partida: ${matchId})`
    });
  }
  render();
}

async function confirmWO(matchId) {
  if (hasSupabaseConfig) {
    await dbConfirmWO(matchId, state.user.id);
    const fetched = await fetchFullState(state.user.id);
    if (fetched) state = fetched;
  } else {
    state.report.playerAKeys = 0;
    state.report.playerBKeys = 0;
    state.report.housesSubmitted = true;
    state.report.reported = true;
    state.report.confirmed = true;
    state.report.completed = true;
    state.report.confirmedAt = new Date().toISOString();

    if (!state.adminLogs) state.adminLogs = [];
    state.adminLogs.push({
      timestamp: new Date().toISOString(),
      message: `Confirmado W.O. (0 a 0) para a partida ${matchId}`
    });
  }

  render();
}

async function unfreezeMatch(matchId) {
  if (hasSupabaseConfig) {
    await dbUnfreezeMatch(matchId, state.activeRound.number, state.user.id);
    const fetched = await fetchFullState(state.user.id);
    if (fetched) state = fetched;
  } else {
    state.activeRound.deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    if (!state.adminLogs) state.adminLogs = [];
    state.adminLogs.push({
      timestamp: new Date().toISOString(),
      message: `Partida ${matchId} descongelada. Prazo estendido por 24h.`
    });
  }

  render();
}

async function adminAddSticker(playerId, stickerId) {
  if (state.adminEditCollection && state.adminEditCollection.playerId === playerId) {
    const current = state.adminEditCollection.quantities[stickerId] || 0;
    state.adminEditCollection.quantities[stickerId] = current + 1;
  }
  render();
}

async function adminRemoveSticker(playerId, stickerId) {
  if (state.adminEditCollection && state.adminEditCollection.playerId === playerId) {
    const current = state.adminEditCollection.quantities[stickerId] || 0;
    state.adminEditCollection.quantities[stickerId] = Math.max(0, current - 1);
  }
  render();
}

function adminCancelStickers() {
  state.adminEditCollection = null;
  render();
}

async function adminConfirmStickers(playerId) {
  const player = state.players.find(p => p.id === playerId);
  if (!player || !state.adminEditCollection) return;

  const originalCollection = player.collection || {};
  const currentQuantities = state.adminEditCollection.quantities;

  const changes = [];
  STICKERS.forEach(s => {
    const originalQty = originalCollection[s.id]?.quantity || 0;
    const newQty = currentQuantities[s.id] || 0;
    if (originalQty !== newQty) {
      changes.push({
        id: s.id,
        diff: newQty - originalQty
      });
    }
  });

  if (changes.length === 0) {
    state.adminEditCollection = null;
    render();
    return;
  }

  // Mostra loader simples ou desativa cliques temporariamente
  const btn = document.querySelector('[data-action="adminConfirmStickers"]');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Salvando...';
  }

  if (hasSupabaseConfig) {
    try {
      await Promise.all(changes.map(c =>
        dbAdminEditSticker(playerId, c.id, c.diff, player.name, state.user.id)
      ));

      const fetched = await fetchFullState(state.user.id);
      if (fetched) {
        const currentAdminTab = state.adminTab;
        const currentSelectedPlayer = state.selectedAdminPlayerId;
        state = fetched;
        state.adminTab = currentAdminTab;
        state.selectedAdminPlayerId = currentSelectedPlayer;
      }
    } catch (err) {
      console.error("Erro ao salvar edições de figurinhas:", err);
      alert("Erro ao salvar edições no banco de dados.");
    }
  } else {
    changes.forEach(c => {
      if (!player.collection) player.collection = {};
      if (!player.collection[c.id]) {
        player.collection[c.id] = { quantity: 0, source: 'admin' };
      }
      player.collection[c.id].quantity += c.diff;
      if (player.collection[c.id].quantity <= 0) {
        delete player.collection[c.id];
      }

      const label = c.diff > 0 ? 'adicionou' : 'removeu';
      const logMessage = `Admin ${label} a figurinha ${c.id} ${c.diff > 0 ? 'para' : 'de'} ${player.name}`;

      if (!state.adminLogs) state.adminLogs = [];
      state.adminLogs.push({
        timestamp: new Date().toISOString(),
        message: logMessage
      });

      if (!state.stickersLog) state.stickersLog = [];
      state.stickersLog.push({
        round: state.activeRound.number,
        timestamp: new Date().toISOString(),
        message: logMessage,
        type: 'admin'
      });
    });
  }

  state.adminEditCollection = null;
  render();
}

function setAdminTab(tab) {
  state.adminTab = tab;
  render();
}

async function saveRoundDeadline(roundNumber, deadlineVal) {
  if (!deadlineVal) return;
  // Define o prazo para o final do dia escolhido (23:59:59)
  const deadline = new Date(deadlineVal + 'T23:59:59').toISOString();

  if (hasSupabaseConfig) {
    await dbSaveRoundDeadline(roundNumber, deadline, state.user.id);
    const fetched = await fetchFullState(state.user.id);
    if (fetched) {
      const currentAdminTab = state.adminTab;
      const currentSelectedPlayer = state.selectedAdminPlayerId;
      state = fetched;
      state.adminTab = currentAdminTab;
      state.selectedAdminPlayerId = currentSelectedPlayer;
    }
  } else {
    if (!state.allRounds) state.allRounds = [];
    const round = state.allRounds.find(r => r.number === roundNumber);
    if (round) round.deadline = deadline;
  }
  render();
}

async function activateRound(roundNumber) {
  if (hasSupabaseConfig) {
    await dbActivateRound(roundNumber, state.user.id);
    const fetched = await fetchFullState(state.user.id);
    if (fetched) {
      const currentAdminTab = state.adminTab;
      const currentSelectedPlayer = state.selectedAdminPlayerId;
      state = fetched;
      state.adminTab = currentAdminTab;
      state.selectedAdminPlayerId = currentSelectedPlayer;
    }
  } else {
    if (!state.allRounds) state.allRounds = [];
    state.allRounds.forEach(r => r.active = false);
    const round = state.allRounds.find(r => r.number === roundNumber);
    if (round) {
      round.active = true;
      state.activeRound = {
        number: round.number,
        name: round.name,
        startsAt: round.startsAt,
        deadline: round.deadline,
        sasLimit: round.sasLimit || 80,
        active: true
      };
    }
  }
  render();
}

async function deactivateRound(roundNumber) {
  if (hasSupabaseConfig) {
    await dbDeactivateRound(roundNumber, state.user.id);
    const fetched = await fetchFullState(state.user.id);
    if (fetched) {
      const currentAdminTab = state.adminTab;
      const currentSelectedPlayer = state.selectedAdminPlayerId;
      state = fetched;
      state.adminTab = currentAdminTab;
      state.selectedAdminPlayerId = currentSelectedPlayer;
    }
  } else {
    if (!state.allRounds) state.allRounds = [];
    const round = state.allRounds.find(r => r.number === roundNumber);
    if (round) {
      round.active = false;
      if (state.activeRound && state.activeRound.number === roundNumber) {
        state.activeRound.active = false;
      }
    }
  }
  render();
}

const actions = {
  setRoute,
  openPack,
  setAlbumPage,
  toggleHouse,
  submitHouses,
  setKeys,
  adjustKeys,
  reportMatch,
  simulateOpponent,
  pickSticker,
  completePicks,
  resetMatch,
  editReport,
  claimChallenge,
  closeChallengePicke,
  pickChallengeSticker,
  confirmWO,
  unfreezeMatch,
  adminAddSticker,
  adminRemoveSticker,
  setAdminTab,
};

function routeView() {
  if (state.currentRoute === 'album') return renderAlbum(state, actions);
  if (state.currentRoute === 'report') return renderReport(state, actions);
  if (state.currentRoute === 'table') return renderTable(state);
  if (state.currentRoute === 'admin') return renderAdmin(state);
  return renderPacks(state, actions);
}

function navItem(route, label, icon) {
  const active = state.currentRoute === route ? 'is-active' : '';
  const disabled = route === 'report' && !state.user.packOpened ? 'is-disabled' : '';
  const badge = route === 'packs' && state.packs.some((pack) => !pack.opened) ? '<span class="nav-badge"></span>' : '';
  return `
    <button class="nav-item ${active} ${disabled}" data-route="${route}" ${disabled ? 'disabled' : ''}>
      <span class="nav-icon">${icon}</span>
      <span>${label}</span>
      ${badge}
    </button>
  `;
}

function renderLoginView() {
  return `
    <div class="login-view">
      <div class="login-card">
        <img src="${getAssetUrl('/assets/logo.png')}" alt="Logo FOC" class="login-logo">
        <h1>Copa do Mundo do FOC 2026™</h1>
        
        <form class="login-form" id="loginForm">
          <div class="login-input-group">
            <label for="usernameInput">Login do Jogador</label>
            <input type="text" id="usernameInput" class="login-input" placeholder="Ex: fabio_hideki" required autofocus>
          </div>
          
          <button type="submit" class="login-btn" id="loginSubmitBtn">
            <span class="btn-text">Entrar no Álbum</span>
            <div class="login-spinner" id="loginSpinner"></div>
          </button>
        </form>
        
        <div class="login-error" id="loginError">Jogador não encontrado no banco de dados.</div>
      </div>
    </div>
  `;
}

function initLoginEvents() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById('usernameInput');
    const submitBtn = document.getElementById('loginSubmitBtn');
    const spinner = document.getElementById('loginSpinner');
    const btnText = submitBtn.querySelector('.btn-text');
    const errorEl = document.getElementById('loginError');

    const username = usernameInput.value.trim().toLowerCase();
    if (!username) return;

    submitBtn.disabled = true;
    spinner.style.display = 'block';
    if (btnText) btnText.style.display = 'none';
    errorEl.style.display = 'none';

    try {
      const fetchedState = await fetchFullState(username);
      if (fetchedState) {
        localStorage.setItem('foc_username', username);
        setSupabaseSession(username);
        state = fetchedState;
        render();
      } else {
        errorEl.textContent = 'Jogador não cadastrado ou erro na rede.';
        errorEl.style.display = 'block';
        submitBtn.disabled = false;
        spinner.style.display = 'none';
        if (btnText) btnText.style.display = 'block';
      }
    } catch (err) {
      console.error(err);
      errorEl.textContent = 'Erro ao conectar ao banco de dados.';
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      spinner.style.display = 'none';
      if (btnText) btnText.style.display = 'block';
    }
  });
}

function render() {
  if (!state.selectedPickIds) state.selectedPickIds = [];
  if (!state.selectedHouseCodes) state.selectedHouseCodes = [];

  if (hasSupabaseConfig && !localStorage.getItem('foc_username')) {
    app.innerHTML = renderLoginView();
    initLoginEvents();
    return;
  }

  const mainEl = app.querySelector('.app-main');
  const savedScrollTop = mainEl ? mainEl.scrollTop : 0;

  const unopened = state.packs.filter((pack) => !pack.opened).length;
  const collected = Object.keys(state.collection).filter(id => {
    const s = getSticker(id);
    return s && s.type === 'player';
  }).length;

  app.innerHTML = `
    <div class="app-shell">
      <header class="app-header">
        <div class="header-logo-container">
          <img src="${getAssetUrl('/assets/logo.png')}" alt="Logo FOC" class="header-logo" />
          <h1 class="header-title">Copa do Mundo do <br class="mobile-only-break" />FOC 2026™</h1>
        </div>
        <div class="header-actions" style="display: flex; gap: 8px; align-items: center;">
          ${hasSupabaseConfig ? `
            <button class="button button-secondary" data-action="logout" type="button" style="height: 32px; min-height: auto; font-size: 0.72rem; padding: 0 10px; border-radius: var(--radius-sm); border-color: rgba(255,255,255,0.08); font-family: 'Fixture', sans-serif; font-weight: 700; text-transform: uppercase;">Sair</button>
          ` : ''}
          ${state.user.isAdmin ? `
            <button class="header-admin-btn" data-route="admin" type="button" aria-label="Painel Admin">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
          ` : ''}
        </div>
      </header>

      <main class="app-main">
        <section class="panel collection-summary" style="margin-bottom: 20px;">
          <div>
            <span class="panel-label">Coleção atual</span>
            <strong>${collected}/27</strong>
          </div>
          <div class="meter"><span style="width: ${(collected / 27) * 100}%"></span></div>
        </section>
        ${routeView()}
      </main>

      <nav class="bottom-nav">
        ${navItem('packs', 'Pacotinhos', `<svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;"><path d="M80 90L75 84L70 90L65 84L60 90L55 84L50 90L45 84L40 90L35 84L30 90L25 84L20 90V10L25 16L30 10L35 16L40 10L45 16L50 10L55 16L60 10L65 16L70 10L75 16L80 10V90ZM39.8701 51.3975C34.4191 51.3977 30.0002 55.8166 30 61.2676V71.1387C30.0001 76.5898 34.419 81.0086 39.8701 81.0088H60.1299C65.581 81.0086 69.9999 76.5898 70 71.1387C70 65.6875 65.581 61.2678 60.1299 61.2676H70C69.9998 55.8166 65.5809 51.3977 60.1299 51.3975H39.8701ZM39.8701 19.9912C34.4191 19.9914 30.0002 24.4103 30 29.8613H39.8701C34.419 29.8616 30 34.2812 30 39.7324V49.6025H70V39.7324H60.1299C65.581 39.7322 69.9999 35.3125 70 29.8613C69.9998 24.4103 65.5809 19.9914 60.1299 19.9912H39.8701Z" fill="currentColor"/></svg>`)}
        ${navItem('album', 'Álbum', `<svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;"><path d="M83 90H23V10H83V90ZM42.8701 51.3975C37.4191 51.3977 33.0002 55.8166 33 61.2676V71.1387C33.0001 76.5898 37.419 81.0086 42.8701 81.0088H63.1299C68.581 81.0086 72.9999 76.5898 73 71.1387C73 65.6875 68.581 61.2678 63.1299 61.2676H73C72.9998 55.8166 68.5809 51.3977 63.1299 51.3975H42.8701ZM42.8701 19.9912C37.4191 19.9914 33.0002 24.4103 33 29.8613H42.8701C37.419 29.8616 33 34.2812 33 39.7324V49.6025H73V39.7324H63.1299C68.581 39.7322 72.9999 35.3125 73 29.8613C72.9998 24.4103 68.5809 19.9914 63.1299 19.9912H42.8701Z" fill="currentColor"/><rect x="18" y="10" width="4" height="80" fill="currentColor"/></svg>`)}
        ${navItem('report', 'Reporte', `<svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;"><path d="M69 10C75.0751 10 80 14.9249 80 21V79C80 85.0751 75.0751 90 69 90H31C24.9249 90 20 85.0751 20 79V21C20 14.9249 24.9249 10 31 10H69ZM44.7334 53.1758L40.9805 50.0947C36.1342 46.1153 28.9794 46.8178 25 51.6641L36.4912 61.0996C36.9512 61.4773 37.4328 61.8126 37.9297 62.1064L46.3887 69.0518L75.5879 33.4922L66.8125 26.2861L44.7334 53.1758Z" fill="currentColor"/></svg>`)}
        ${navItem('table', 'Tabela', `<svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;"><path d="M69 10C75.0751 10 80 14.9249 80 21V79C80 85.0751 75.0751 90 69 90H31C24.9249 90 20 85.0751 20 79V21C20 14.9249 24.9249 10 31 10H69ZM34 74H66V66H34V74ZM34 61H66V53H34V61ZM34 48H66V41H34V48ZM34 28V36H66V28H34Z" fill="currentColor"/></svg>`)}
      </nav>

      ${renderHighlightOverlay()}
      ${renderChallengePicker(state)}
      ${renderChallengeConfirmation(state)}
    </div>
  `;

  app.querySelectorAll('[data-route]').forEach((button) => {
    button.addEventListener('click', () => setRoute(button.dataset.route));
  });

  app.querySelectorAll('[data-action]').forEach((element) => {
    element.addEventListener('click', async () => {
      const action = element.dataset.action;
      const value = element.dataset.value;
      if (action === 'setReportTab') {
        state.reportTab = value;
        render();
        return;
      }
      if (action === 'setTableTab') {
        state.tableTab = value;
        render();
        return;
      }
      if (action === 'logout') {
        localStorage.removeItem('foc_username');
        setSupabaseSession('');
        state = createInitialState();
        render();
        return;
      }
      if (action === 'openPack') openPack(value);
      if (action === 'viewSticker') viewSticker(value, element);
      if (action === 'closeHighlight') closeHighlight();
      if (action === 'pagePrev') {
        const $fb = window.jQuery('#album-flipbook');
        if ($fb.length && typeof $fb.turn === 'function' && $fb.turn('is')) {
          $fb.turn('previous');
        } else {
          setAlbumPage(state.albumPage - 1);
        }
      }
      if (action === 'pageNext') {
        const $fb = window.jQuery('#album-flipbook');
        if ($fb.length && typeof $fb.turn === 'function' && $fb.turn('is')) {
          $fb.turn('next');
        } else {
          setAlbumPage(state.albumPage + 1);
        }
      }
      if (action === 'setPage') {
        const pageNum = Number(value);
        const $fb = window.jQuery('#album-flipbook');
        if ($fb.length && typeof $fb.turn === 'function' && $fb.turn('is')) {
          $fb.turn('page', pageNum + 1);
        } else {
          setAlbumPage(pageNum);
        }
      }
      if (action === 'toggleHouse') toggleHouse(value);
      if (action === 'adjustKeys') {
        const side = element.dataset.side;
        const amount = Number(element.dataset.amount);
        adjustKeys(side, amount);
      }
      if (action === 'simulateOpponent') simulateOpponent(value === 'consistent');
      if (action === 'submitHouses') submitHouses();
      if (action === 'reportMatch') reportMatch();
      if (action === 'editReport') editReport();
      if (action === 'toggleReportPick') toggleReportPick(value);
      if (action === 'toggleQuebraRegra') {
        state.report.fallbackActive = !state.report.fallbackActive;
        state.selectedPickIds = [];
        if (state.report.fallbackActive) {
          const selectedCodes = state.selectedHouseCodes || [];
          const oppEligible = PLAYER_STICKERS.filter(s => 
            state.opponentCollection[s.id] && 
            (!state.collection[s.id] || state.collection[s.id].quantity === 0)
          );
          const oppEligibleInSelected = oppEligible.filter(s => selectedCodes.includes(s.house));
          const myKeys = state.report.playerAKeys;
          state.report.quebraRegraMotive = oppEligibleInSelected.length < myKeys ? 'qty' : 'combo';
        }
        render();
        return;
      }
      if (action === 'setQuebraRegraMotive') {
        state.report.quebraRegraMotive = value;
        render();
        return;
      }
      if (action === 'submitSingleReport') submitSingleReport();
      if (action === 'closeReportModal') closeReportModal();
      if (action === 'pasteDeckLink') pasteDeckLink();
      if (action === 'fetchDeck') fetchDeck();
      if (action === 'removeDeck') removeDeck();
      if (action === 'pickSticker') pickSticker(value);
      if (action === 'completePicks') completePicks();
      if (action === 'resetMatch') resetMatch();
      if (action === 'goAlbum') {
        const reveal = state.reveal;
        if (reveal && reveal.pack && reveal.pack.isPendingPack) {
          // Marca o pacote como aberto imediatamente na lista local
          const packInState = state.packs.find(p => p.id === reveal.pack.id);
          if (packInState) packInState.opened = true;

          if (hasSupabaseConfig) {
            await dbOpenPendingPack(reveal.pack.id);
            const fetched = await fetchFullState(state.user.id);
            if (fetched) {
              state = fetched;
            }
          } else {
            reveal.pack.stickerIds.forEach(id => {
              state.collection[id] = { quantity: 1, isNew: true, source: reveal.pack.type === 'challenge' ? 'challenge' : 'pick' };
            });
          }
        }
        state.reveal = null;
        setRoute('album');
      }
      if (action === 'claimChallenge') claimChallenge(value);
      if (action === 'confirmChallenge') confirmChallenge(value);
      if (action === 'cancelChallenge') cancelChallenge();
      if (action === 'closeChallengePicke') closeChallengePicke();
      if (action === 'rejectChallenge') {
        const playerUsername = element.dataset.player;
        rejectChallenge(value, playerUsername);
      }
      if (action === 'approveChallenge') {
        const playerUsername = element.dataset.player;
        approveChallenge(value, playerUsername);
      }
      if (action === 'rejectMatch') {
        rejectMatch(value);
      }
      if (action === 'pickChallengeSticker') {
        const challengeId = element.dataset.challenge;
        pickChallengeSticker(challengeId, value);
      }
      if (action === 'setAdminTab') setAdminTab(value);
      if (action === 'confirmWO') confirmWO(value);
      if (action === 'releasePacks') {
        const matchId = element.dataset.match;
        releasePacks(matchId);
      }
      if (action === 'unfreezeMatch') unfreezeMatch(value);
      if (action === 'adminAddSticker') {
        const playerId = element.dataset.player;
        adminAddSticker(playerId, value);
      }
      if (action === 'adminRemoveSticker') {
        const playerId = element.dataset.player;
        adminRemoveSticker(playerId, value);
      }
      if (action === 'adminCancelStickers') {
        adminCancelStickers();
      }
      if (action === 'adminConfirmStickers') {
        const playerId = element.dataset.player;
        adminConfirmStickers(playerId);
      }
      if (action === 'saveRoundDeadline') {
        const roundNumber = Number(element.dataset.round);
        const input = app.querySelector(`.round-deadline-input[data-round="${roundNumber}"]`);
        if (input) {
          saveRoundDeadline(roundNumber, input.value);
        }
      }
      if (action === 'activateRound') {
        const roundNumber = Number(element.dataset.round);
        activateRound(roundNumber);
      }
      if (action === 'deactivateRound') {
        const roundNumber = Number(element.dataset.round);
        deactivateRound(roundNumber);
      }
    });
  });

  const adminSelect = app.querySelector('#adminPlayerSelect');
  if (adminSelect) {
    adminSelect.addEventListener('change', () => {
      state.selectedAdminPlayerId = adminSelect.value;
      render();
    });
  }

  app.querySelectorAll('[data-keys]').forEach((input) => {
    input.addEventListener('change', () => setKeys(input.dataset.keys, input.value));
  });

  const deckInput = app.querySelector('#deck-link-input');
  if (deckInput) {
    deckInput.addEventListener('input', () => {
      state.report.deckUrl = deckInput.value.trim();

      const submitBtn = app.querySelector('[data-action="submitSingleReport"]');
      if (submitBtn) {
        const hasDeckLink = Boolean(state.report.deckUrl);
        const hasThreeHouses = state.selectedHouseCodes && state.selectedHouseCodes.length === 3;
        const validation = validateScore(state.report.playerAKeys, state.report.playerBKeys, state.user.isAdmin);
        const isScoreValid = validation.valid;

        let correctPicks = false;
        const myKeys = state.report.playerAKeys;
        if (isScoreValid && hasThreeHouses) {
          const selectedCodes = state.selectedHouseCodes || [];
          const oppEligible = PLAYER_STICKERS.filter(s =>
            state.opponentCollection[s.id] &&
            (!state.collection[s.id] || state.collection[s.id].quantity === 0)
          );
          const oppEligibleInSelected = oppEligible.filter(s => selectedCodes.includes(s.house));

          let pool = [];
          if (!state.report.fallbackActive) {
            // Pick Normal
            // 1. Add opponent eligible stickers
            const eligibleInSelected = oppEligibleInSelected.map(s => ({ ...s, source: 'opponent' }));
            pool = [...eligibleInSelected];
            
            // 2. Add emblem fallback stickers for selected houses where opponent has 0 player stickers
            selectedCodes.forEach(hc => {
              const oppHasZero = !PLAYER_STICKERS.some(s => s.house === hc && state.opponentCollection[s.id] && state.opponentCollection[s.id].quantity > 0);
              if (oppHasZero) {
                const oppHasEmblem = state.opponentCollection[hc + ' 0'] && state.opponentCollection[hc + ' 0'].quantity > 0;
                if (oppHasEmblem) {
                  const missingInHouse = PLAYER_STICKERS.filter(s => 
                    s.house === hc && 
                    (!state.collection[s.id] || state.collection[s.id].quantity === 0)
                  );
                  missingInHouse.forEach(s => {
                    pool.push({ ...s, source: 'emblem' });
                  });
                }
              }
            });

            const maxPicksPossible = selectedCodes.reduce((sum, hc) => {
              const hasEligible = pool.some(s => s.house === hc);
              return sum + (hasEligible ? 1 : 0);
            }, 0);
            maxPicks = Math.min(myKeys, maxPicksPossible);
          } else {
            const playerMissing = PLAYER_STICKERS.filter(s =>
              selectedCodes.includes(s.house) &&
              (!state.collection[s.id] || state.collection[s.id].quantity === 0)
            );

            const poolMap = new Map();
            oppEligibleInSelected.forEach(s => {
              poolMap.set(s.id, s);
            });
            playerMissing.forEach(s => {
              if (!poolMap.has(s.id)) {
                poolMap.set(s.id, s);
              }
            });
            pool = Array.from(poolMap.values());
            const maxPicksPossible = selectedCodes.reduce((sum, hc) => {
              const hasEligible = pool.some(s => s.house === hc);
              return sum + (hasEligible ? 1 : 0);
            }, 0);
            maxPicks = Math.min(myKeys, maxPicksPossible);
          }
          correctPicks = myKeys === 0 || state.selectedPickIds.length === maxPicks;
        }

        const canSubmit = hasDeckLink && hasThreeHouses && isScoreValid && correctPicks;
        submitBtn.disabled = !canSubmit;
      }
    });
  }

  if (state.currentRoute === 'album') {
    initAlbumBook(state, actions);
  }
  if (state.currentRoute === 'packs') {
    initPacks(state, actions);
  }
  if (state.currentRoute === 'report') {
    initCountdown(state);
  }

  // Inicializa efeito 3D drag nas figurinhas reveladas
  if (state.currentRoute === 'packs' && state.reveal && state.reveal.ripped) {
    app.querySelectorAll('.flip-card.is-flipped .sticker-card').forEach((card) => {
      init3DCard(card);
    });
  }

  // Inicializa efeito 3D drag na figurinha em destaque + animação FLIP de entrada
  if (state.highlightedStickerId) {
    const overlay = document.getElementById('highlightOverlay');
    const highlightCard = document.getElementById('highlightCard3D');
    if (highlightCard && _highlightOriginRect && overlay) {
      const destRect = highlightCard.getBoundingClientRect();
      const originRect = _highlightOriginRect;
      const scaleX = originRect.width / destRect.width;
      const scaleY = originRect.height / destRect.height;
      const tx = originRect.left + originRect.width / 2 - (destRect.left + destRect.width / 2);
      const ty = originRect.top + originRect.height / 2 - (destRect.top + destRect.height / 2);

      // Estado inicial: card na posição de origem, overlay invisível
      overlay.style.opacity = '0';
      highlightCard.style.transform = `translate(${tx}px, ${ty}px) scale(${scaleX}, ${scaleY})`;
      highlightCard.style.opacity = '0';
      highlightCard.style.transition = 'none';

      // Força reflow para que o estado inicial seja aplicado antes do PLAY
      highlightCard.getBoundingClientRect();

      // PLAY — anima para o destino (centro da tela)
      requestAnimationFrame(() => {
        overlay.style.transition = 'opacity 0.28s ease';
        overlay.style.opacity = '1';
        highlightCard.style.transition = 'transform 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.28s ease';
        highlightCard.style.transform = 'translate(0,0) scale(1)';
        highlightCard.style.opacity = '1';
      });

      const cardNode = highlightCard.querySelector('.sticker-card');
      if (cardNode) init3DCard(cardNode);
    } else if (highlightCard) {
      const cardNode = highlightCard.querySelector('.sticker-card');
      if (cardNode) init3DCard(cardNode);
    }
  }

  const newMainEl = app.querySelector('.app-main');
  if (newMainEl) {
    newMainEl.scrollTop = savedScrollTop;
  }
}

// ── Destaque de Figurinha com animação FLIP ────────────────────────
let _highlightOriginRect = null;

function viewSticker(stickerId, originElement) {
  if (state.collection[stickerId]) {
    state.collection[stickerId].isNew = false;
  }
  // Captura o rect de origem para a animação FLIP
  if (originElement) {
    _highlightOriginRect = originElement.getBoundingClientRect();
  }
  state.highlightedStickerId = stickerId;
  render();
}

function closeHighlight() {
  const overlay = document.getElementById('highlightOverlay');
  const wrapper = document.getElementById('highlightCard3D');
  if (overlay && wrapper && _highlightOriginRect) {
    // Anima de volta para a origem
    const destRect = wrapper.getBoundingClientRect();
    const originRect = _highlightOriginRect;
    const scaleX = originRect.width / destRect.width;
    const scaleY = originRect.height / destRect.height;
    const tx = originRect.left + originRect.width / 2 - (destRect.left + destRect.width / 2);
    const ty = originRect.top + originRect.height / 2 - (destRect.top + destRect.height / 2);
    overlay.classList.add('is-leaving');
    wrapper.style.transition = 'transform 0.32s cubic-bezier(0.4, 0, 1, 1), opacity 0.28s ease';
    wrapper.style.transform = `translate(${tx}px, ${ty}px) scale(${scaleX}, ${scaleY})`;
    wrapper.style.opacity = '0';
    overlay.style.transition = 'opacity 0.32s ease';
    overlay.style.opacity = '0';
    setTimeout(() => {
      state.highlightedStickerId = null;
      _highlightOriginRect = null;
      render();
    }, 340);
  } else {
    state.highlightedStickerId = null;
    _highlightOriginRect = null;
    render();
  }
}

function renderHighlightOverlay() {
  if (!state.highlightedStickerId) return '';

  const stickerId = state.highlightedStickerId;
  const owned = state.collection[stickerId];
  let sourceText = '';

  if (owned && owned.source) {
    if (owned.source === 'pack') {
      sourceText = 'Pacotinho inicial.';
    } else if (owned.source === 'pick') {
      const round = owned.acquiredRound;
      const opp = owned.acquiredOpponent;
      if (round && opp) {
        if (opp === 'Extra Pack') {
          sourceText = `Rodada ${round}: Extra Pack`;
        } else {
          sourceText = `Rodada ${round}: vs ${opp}`;
        }
      } else {
        const match = state.matches.find(m => m.id === state.report.matchId);
        const roundNum = state.activeRound.number;
        if (match) {
          sourceText = `Rodada ${roundNum}: ${match.playerA} x ${match.playerB}`;
        } else {
          sourceText = `Rodada ${roundNum}: Pick pós-partida.`;
        }
      }
    } else if (owned.source === 'challenge') {
      const challengeTitle = owned.acquiredChallenge || (() => {
        const challenge = state.challenges.find(c => c.pickedId === stickerId);
        return challenge ? challenge.title : 'Conclusão de Desafio';
      })();
      const round = owned.acquiredRound;
      const opp = owned.acquiredOpponent;
      
      if (round && opp) {
        sourceText = `${challengeTitle}<br/><span style="font-size: 0.78rem; color: var(--color-ash); font-weight: normal;">Rodada ${round} · vs ${opp}</span>`;
      } else if (round) {
        sourceText = `${challengeTitle}<br/><span style="font-size: 0.78rem; color: var(--color-ash); font-weight: normal;">Rodada ${round}</span>`;
      } else {
        sourceText = challengeTitle;
      }
    } else if (owned.source === 'emblem_round') {
      sourceText = 'Rodada 3 - Extra Pack.';
    } else if (owned.source === 'admin') {
      sourceText = 'Ajuste de Administrador.';
    }
  }

  return `
    <div class="highlight-overlay" id="highlightOverlay">
      <div class="highlight-overlay-bg" data-action="closeHighlight"></div>
      <div class="highlight-content">
        <button class="close-highlight-btn" data-action="closeHighlight">✕</button>
        <div class="highlight-card-wrapper" id="highlightCard3D">
          ${stickerCard(stickerId, state.collection, { forceOwned: true })}
        </div>
        ${sourceText ? `<p class="highlight-source-label">${sourceText}</p>` : ''}
      </div>
    </div>
  `;
}

function init3DCard(cardElement) {
  if (!cardElement) return;

  // Spring physics state
  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;
  let rafId = null;
  let isInteracting = false;

  const SPRING_STIFFNESS = 0.12;
  const SPRING_DAMPING = 0.8;
  const MAX_ROT = 20;

  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }
  function round(v, p = 100) { return Math.round(v * p) / p; }

  function setCardVars(rotX, rotY, px, py, fromLeft, fromTop, fromCenter, opacity) {
    cardElement.style.setProperty('--rotate-x', `${rotX}deg`);
    cardElement.style.setProperty('--rotate-y', `${rotY}deg`);
    cardElement.style.setProperty('--pointer-x', `${px}%`);
    cardElement.style.setProperty('--pointer-y', `${py}%`);
    cardElement.style.setProperty('--pointer-from-left', fromLeft);
    cardElement.style.setProperty('--pointer-from-top', fromTop);
    cardElement.style.setProperty('--pointer-from-center', round(fromCenter));
    cardElement.style.setProperty('--card-opacity', round(opacity));
    cardElement.style.transform =
      `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.04,1.04,1.04)`;
  }

  function springTick() {
    const dx = targetRotX - currentRotX;
    const dy = targetRotY - currentRotY;
    currentRotX += dx * SPRING_STIFFNESS;
    currentRotY += dy * SPRING_STIFFNESS;
    currentRotX *= SPRING_DAMPING + (1 - SPRING_DAMPING);
    currentRotY *= SPRING_DAMPING + (1 - SPRING_DAMPING);

    // Still moving — keep ticking
    if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
      rafId = requestAnimationFrame(springTick);
    } else {
      currentRotX = targetRotX;
      currentRotY = targetRotY;
      rafId = null;
    }
  }

  function handleMove(e) {
    const rect = cardElement.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (!isInteracting) return;

    const absX = clientX - rect.left;
    const absY = clientY - rect.top;

    // 0–100 percent position of pointer inside card
    const px = clamp(round((100 / rect.width) * absX), 0, 100);
    const py = clamp(round((100 / rect.height) * absY), 0, 100);

    // Normalized -0.5 to 0.5 from center
    const fromLeft = clamp(absX / rect.width, 0, 1);
    const fromTop = clamp(absY / rect.height, 0, 1);
    const fromCenter = Math.sqrt((fromLeft - 0.5) ** 2 + (fromTop - 0.5) ** 2) * 2;

    targetRotY = round(clamp((fromLeft - 0.5) * MAX_ROT * 2, -MAX_ROT, MAX_ROT));
    targetRotX = round(clamp((fromTop - 0.5) * -MAX_ROT * 2, -MAX_ROT, MAX_ROT));

    setCardVars(currentRotX, currentRotY, px, py, fromLeft, fromTop, fromCenter, Math.min(1, fromCenter + 0.1));

    if (!rafId) rafId = requestAnimationFrame(springTick);

    if (e.cancelable) e.preventDefault();
  }

  function handleEnter(e) {
    isInteracting = true;
    cardElement.classList.add('is-active');
    cardElement.style.transition = 'none';
    handleMove(e);
  }

  function handleLeave() {
    isInteracting = false;
    cardElement.classList.remove('is-active');
    targetRotX = 0;
    targetRotY = 0;
    cardElement.style.transition =
      'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease';
    cardElement.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    cardElement.style.setProperty('--card-opacity', '0');
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  // Mouse events — react to move anywhere inside card (no drag needed)
  cardElement.addEventListener('mouseenter', handleEnter);
  cardElement.addEventListener('mousemove', handleMove);
  cardElement.addEventListener('mouseleave', handleLeave);

  // Touch events
  cardElement.addEventListener('touchstart', handleEnter, { passive: false });
  cardElement.addEventListener('touchmove', handleMove, { passive: false });
  cardElement.addEventListener('touchend', handleLeave);
  cardElement.addEventListener('touchcancel', handleLeave);
}


// Inicialização Assíncrona
async function initApp() {
  const hashRoute = window.location.hash.replace('#', '');
  if (['packs', 'album', 'report', 'challenges', 'admin'].includes(hashRoute)) {
    state.currentRoute = hashRoute;
  }

  if (hasSupabaseConfig) {
    const cachedUser = localStorage.getItem('foc_username');
    if (cachedUser) {
      // Exibe loading temporário
      app.innerHTML = `
        <div class="login-view">
          <div class="login-spinner" style="display: block;"></div>
        </div>
      `;
      try {
        const fetchedState = await fetchFullState(cachedUser);
        if (fetchedState) {
          state = fetchedState;
          if (['packs', 'album', 'report', 'challenges', 'admin'].includes(hashRoute)) {
            state.currentRoute = hashRoute;
          }
        } else {
          localStorage.removeItem('foc_username');
        }
      } catch (err) {
        console.error("Erro carregando estado inicial do banco:", err);
        localStorage.removeItem('foc_username');
      }
    }
  }

  render();
}

initApp();
