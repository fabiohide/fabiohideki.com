export function formatPlayerNameFromLogin(username) {
  if (!username) return '';
  if (username === 'album') return 'Álbum';
  return username
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('/assets')) {
    const base = import.meta.env.BASE_URL || '/';
    const cleanBase = base.endsWith('/') ? base : base + '/';
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return cleanBase + cleanPath;
  }
  return path;
}

export function parsePicksString(picksStr) {
  if (!picksStr) return [];
  let cleanStr = picksStr.replace(/^(Pick normal:\s*|Pick Quebra-Regra:\s*)/i, '');
  return cleanStr.split(',')
    .map(item => item.replace(/\s*\(.*?\)\s*/g, '').trim())
    .filter(Boolean);
}

export function formatPicksForReport(pickedIds, state) {
  if (!pickedIds || pickedIds.length === 0) return [];
  
  const formattedPicks = pickedIds.map((id) => {
    const isOpponent = state.opponentCollection[id] && (!state.collection[id] || state.collection[id].quantity === 0);
    const houseCode = id.split(' ')[0];
    const hasEmblem = state.collection[houseCode + ' 0'] && state.collection[houseCode + ' 0'].quantity > 0;
    const oppHasZero = !PLAYER_STICKERS.some(s => s.house === houseCode && state.opponentCollection[s.id] && state.opponentCollection[s.id].quantity > 0);
    
    let suffix = '(QUEBRA-REGRA)';
    if (isOpponent) {
      suffix = '(OPONENTE)';
    } else if (hasEmblem && oppHasZero) {
      suffix = '(BRASÃO)';
    }
    return `${id} ${suffix}`;
  });

  if (!state.report.fallbackActive) {
    return formattedPicks.map((formattedId, index) => index === 0 ? `Pick normal: ${formattedId}` : formattedId);
  } else {
    return formattedPicks.map((formattedId, index) => index === 0 ? `Pick Quebra-Regra: ${formattedId}` : formattedId);
  }
}

