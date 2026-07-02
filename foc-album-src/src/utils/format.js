export function formatPlayerNameFromLogin(username) {
  if (!username) return '';
  if (username === 'album') return 'Álbum';
  return username
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
