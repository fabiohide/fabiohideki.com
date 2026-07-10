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
  if (!state.report.fallbackActive) {
    return pickedIds.map((id, index) => index === 0 ? `Pick normal: ${id}` : id);
  } else {
    return pickedIds.map((id, index) => {
      const isOpponent = state.opponentCollection[id] && (!state.collection[id] || state.collection[id].quantity === 0);
      const suffix = isOpponent ? '(OPONENTE)' : '(QUEBRA-REGRA)';
      const formattedId = `${id} ${suffix}`;
      return index === 0 ? `Pick Quebra-Regra: ${formattedId}` : formattedId;
    });
  }
}

