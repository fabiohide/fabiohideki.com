import { getSticker } from '../data/stickers.js';

export function stickerCard(stickerId, collection, options = {}) {
  const sticker = getSticker(stickerId);
  if (!sticker) return '';

  const owned = collection[stickerId];
  const isOwned = Boolean(owned) || Boolean(options.forceOwned);
  const classes = ['sticker-card', isOwned ? 'is-owned' : 'is-empty', sticker.type === 'crest' ? 'is-crest' : 'is-player'];
  if (options.small) classes.push('is-small');

  let actionAttr = '';
  if (isOwned) {
    actionAttr = `data-action="viewSticker" data-value="${sticker.id}"`;
  }

  return `
    <button class="${classes.join(' ')}" ${actionAttr} type="button">
      <span class="card-holo-effect" aria-hidden="true"></span>
      <span class="card-holo-glare" aria-hidden="true"></span>
      ${isOwned ? `<img class="sticker-image" src="${sticker.image}" alt="${sticker.name}" />` : `<span class="sticker-silhouette"></span><span class="sticker-code">${sticker.id}</span>`}
    </button>
  `;
}
