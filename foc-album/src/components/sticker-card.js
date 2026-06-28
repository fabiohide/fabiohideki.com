import { getSticker } from '../data/stickers.js';

export function stickerCard(stickerId, collection, options = {}) {
  const sticker = getSticker(stickerId);
  if (!sticker) return '';

  const owned = collection[stickerId];
  const isOwned = Boolean(owned);
  const count = owned?.quantity || 0;
  const showNew = owned?.isNew;
  const classes = ['sticker-card', isOwned ? 'is-owned' : 'is-empty', sticker.type === 'crest' ? 'is-crest' : 'is-player'];
  if (options.small) classes.push('is-small');

  return `
    <button class="${classes.join(' ')}" ${showNew ? `data-action="clearNew" data-value="${sticker.id}"` : ''} type="button">
      <span class="sticker-glow"></span>
      ${isOwned ? `<img class="sticker-image" src="${sticker.image}" alt="${sticker.name}" />` : '<span class="sticker-silhouette"></span>'}
      <span class="sticker-code">${sticker.id}</span>
      ${showNew ? '<span class="new-tag">NEW</span>' : ''}
      ${count > 1 ? `<span class="copy-count">x${count}</span>` : ''}
    </button>
  `;
}
