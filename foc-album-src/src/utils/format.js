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

