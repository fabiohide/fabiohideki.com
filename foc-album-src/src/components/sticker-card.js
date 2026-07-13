import { getSticker } from '../data/stickers.js';
import { getAssetUrl } from '../utils/format.js';

export function stickerCard(stickerId, collection, options = {}) {
  const sticker = getSticker(stickerId);
  if (!sticker) return '';

  const owned = collection[stickerId];
  const isOwned = Boolean(owned) || Boolean(options.forceOwned);
  const classes = ['sticker-card', isOwned ? 'is-owned' : 'is-empty', sticker.type === 'crest' ? 'is-crest' : 'is-player'];
  if (options.small) classes.push('is-small');

  let inlineStyle = '';
  if (sticker.type === 'crest' && isOwned) {
    const houseCode = sticker.house === 'STA' ? 'STR' : sticker.house;
    const foilUrl = getAssetUrl(`/assets/stickers/${houseCode}_0-foil.webp`);
    const maskUrl = getAssetUrl(`/assets/stickers/${houseCode}_0-mask.webp`);
    inlineStyle = `style="--foil: url('${foilUrl}'); --mask: url('${maskUrl}');"`;
  }

  let actionAttr = '';
  if (isOwned && !options.noAction) {
    actionAttr = `data-action="viewSticker" data-value="${sticker.id}"`;
  }

  return `
    <button class="${classes.join(' ')}" ${actionAttr} ${inlineStyle} type="button">
      <span class="card-holo-effect" aria-hidden="true"></span>
      <span class="card-holo-glare" aria-hidden="true"></span>
      ${isOwned ? `<img class="sticker-image" src="${getAssetUrl(sticker.image)}" alt="${sticker.name}" />` : `<span class="sticker-silhouette"></span><span class="sticker-code">${sticker.id}</span>`}
    </button>
  `;
}
