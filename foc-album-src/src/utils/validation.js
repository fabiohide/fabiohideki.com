import { PLAYER_STICKERS } from '../data/stickers.js';

export const HOUSE_NAME_TO_CODE = {
  'brobnar': 'BRB',
  'dis': 'DIS',
  'logos': 'LGS',
  'mars': 'MRS',
  'sanctum': 'SCT',
  'redemption': 'RDP',
  'shadows': 'SHW',
  'untamed': 'UNT',
  'saurian': 'SAU',
  'star alliance': 'STA',
  'staralliance': 'STA',
  'unfathomable': 'UNF',
  'ekwidon': 'EKW',
  'geistoid': 'GST',
  'skyborn': 'SKB'
};

export function validateScore(myKeys, oppKeys, isAdmin = false) {
  const mk = Number(myKeys);
  const ok = Number(oppKeys);

  if (isNaN(mk) || isNaN(ok)) {
    return { valid: false, message: 'Os placares devem ser numéricos.' };
  }

  if (mk < 0 || mk > 3 || ok < 0 || ok > 3) {
    return { valid: false, message: 'As chaves devem estar entre 0 e 3.' };
  }

  if (mk === 0 && ok === 0) {
    if (isAdmin) {
      return { valid: true, isWO: true };
    } else {
      return { valid: false, message: 'W.O. (0x0) é exclusivo para administradores.' };
    }
  }

  if (mk === ok) {
    return { valid: false, message: 'Não são permitidos empates.' };
  }

  const hasWinner3 = (mk === 3 || ok === 3);
  if (!hasWinner3) {
    return { valid: false, message: 'O vencedor deve ter exatamente 3 chaves.' };
  }

  const loserKeys = mk === 3 ? ok : mk;
  if (loserKeys < 0 || loserKeys > 2) {
    return { valid: false, message: 'O perdedor deve ter entre 0 e 2 chaves.' };
  }

  return { valid: true, isWO: false };
}

export function calculateMaxPicksAndPool(state) {
  const selectedCodes = state.selectedHouseCodes || [];
  const myKeys = state.report.playerAKeys;
  const isFallback = state.report.fallbackActive;

  let pool = [];
  if (!isFallback) {
    // Modo Normal
    selectedCodes.forEach(hc => {
      const oppHasEmblem = state.opponentCollection[hc + ' 0'] && state.opponentCollection[hc + ' 0'].quantity > 0;
      const houseStickers = PLAYER_STICKERS.filter(s => s.house === hc);
      
      houseStickers.forEach(s => {
        const playerMissing = !state.collection[s.id] || state.collection[s.id].quantity === 0;
        if (!playerMissing) return;

        const oppOwnsSticker = state.opponentCollection[s.id] && state.opponentCollection[s.id].quantity > 0;
        if (oppHasEmblem) {
          pool.push({ ...s, source: oppOwnsSticker ? 'opponent' : 'emblem' });
        } else if (oppOwnsSticker) {
          pool.push({ ...s, source: 'opponent' });
        }
      });
    });
  } else {
    // Modo Quebra-Regra
    const poolMap = new Map();
    selectedCodes.forEach(houseCode => {
      const oppHasEmblem = state.opponentCollection[houseCode + ' 0'] && state.opponentCollection[houseCode + ' 0'].quantity > 0;
      const houseStickers = PLAYER_STICKERS.filter(s => s.house === houseCode);
      
      const oppEligibleInHouse = houseStickers.filter(s => {
        const playerMissing = !state.collection[s.id] || state.collection[s.id].quantity === 0;
        if (!playerMissing) return false;
        const oppOwnsSticker = state.opponentCollection[s.id] && state.opponentCollection[s.id].quantity > 0;
        return oppHasEmblem || oppOwnsSticker;
      });

      if (oppEligibleInHouse.length > 0) {
        oppEligibleInHouse.forEach(s => {
          const oppOwnsSticker = state.opponentCollection[s.id] && state.opponentCollection[s.id].quantity > 0;
          poolMap.set(s.id, { ...s, source: oppOwnsSticker ? 'opponent' : 'emblem' });
        });
      } else {
        const playerMissingInHouse = houseStickers.filter(s => 
          !state.collection[s.id] || state.collection[s.id].quantity === 0
        );
        playerMissingInHouse.forEach(s => {
          poolMap.set(s.id, { ...s, source: 'fallback' });
        });
      }
    });
    pool = Array.from(poolMap.values());
  }

  // maxPicks limitado a 1 por casa selecionada com opção elegível
  const maxPicksPossible = selectedCodes.reduce((sum, hc) => {
    const hasEligible = pool.some(s => s.house === hc);
    return sum + (hasEligible ? 1 : 0);
  }, 0);

  const maxPicks = Math.min(myKeys, maxPicksPossible);

  return { pool, maxPicks };
}
