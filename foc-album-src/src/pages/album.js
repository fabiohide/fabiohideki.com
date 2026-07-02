import { ALBUM_PAGES, getSticker, HOUSE_META, STICKERS } from '../data/stickers.js';
import { renderAlbumBook } from '../components/album-book.js';
import { getAssetUrl } from '../utils/format.js';

export function renderAlbum(state) {
  // Adiciona a referência para o array de páginas no state
  state.albumPages = ALBUM_PAGES;

  return `
    <section class="page-view album-view">
      <div class="album-stage">
        ${renderAlbumBook(state)}
      </div>

      <div class="album-controls-bar">
        <button class="control-btn" data-action="pagePrev" ${state.albumPage === 0 ? 'disabled' : ''}>‹</button>
        <button class="control-btn" data-action="pageNext" ${state.albumPage === ALBUM_PAGES.length - 1 ? 'disabled' : ''}>›</button>
      </div>

      <div class="page-rail">
        ${ALBUM_PAGES.map((item, index) => `
          <button class="${index === state.albumPage ? 'is-active' : ''}" data-action="setPage" data-value="${index}">
            ${String(item.number).padStart(2, '0')}
          </button>
        `).join('')}
      </div>

      <section class="house-progress">
        ${Object.values(HOUSE_META).map((house) => renderHouseProgress(house, state.collection)).join('')}
      </section>
    </section>
  `;
}

function renderHouseProgress(house, collection) {
  const houseStickers = STICKERS.filter((sticker) => sticker.house === house.code);
  const owned = houseStickers.filter((sticker) => collection[sticker.id]).length;
  return `
    <article>
      <img src="${getAssetUrl(house.icon)}" alt="" />
      <span>${house.code}</span>
      <strong>${owned}/${houseStickers.length}</strong>
    </article>
  `;
}
