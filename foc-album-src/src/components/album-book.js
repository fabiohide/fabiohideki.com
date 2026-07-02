import { getSticker } from '../data/stickers.js';
import { stickerCard } from '../components/sticker-card.js';

export function renderAlbumBook(state, actions) {
  const pagesHtml = state.albumPages.map((page) => {
    const layout = page.layout ? `layout-${page.layout}` : '';
    const isCover = page.kind === 'cover';
    
    return `
      <div class="page-wrapper-turn">
        <article class="album-page ${layout}" style="background-image: url('${page.background || '/assets/pages/pages_mock.webp'}')">
          ${!isCover ? page.stickers.map((id) => {
            const sticker = getSticker(id);
            return `<div class="album-slot" aria-label="${sticker?.name || id}">${stickerCard(id, state.collection)}</div>`;
          }).join('') : ''}
        </article>
      </div>
    `;
  }).join('');

  return `
    <div id="album-container-wrapper">
      <div id="album-flipbook">
        ${pagesHtml}
      </div>
    </div>
  `;
}

function getDimensions() {
  const container = document.getElementById('album-container-wrapper');
  const containerWidth = container ? container.clientWidth : window.innerWidth;
  const isMobile = window.innerWidth < 768;

  // Sempre exibe em modo double (2 páginas lado a lado)
  const width = isMobile ? Math.min(containerWidth - 12, 680) : Math.min(containerWidth - 48, 800);
  const pageWidth = width / 2;
  const height = Math.round(pageWidth * 1.4);

  return { width, height, isMobile };
}

export function initAlbumBook(state, actions) {
  const $flipbook = window.jQuery('#album-flipbook');
  if (!$flipbook.length) return;

  const initialDims = getDimensions();

  $flipbook.turn({
    width: initialDims.width,
    height: initialDims.height,
    display: 'double', // Sempre página dupla (2 páginas por vez)
    acceleration: true,
    gradients: false,
    elevation: 50,
    page: state.albumPage + 1,
    when: {
      turning: function(event, page) {
        state.albumPage = page - 1;
        
        // Limpa classes ativas anteriores nos indicadores do rail
        document.querySelectorAll('.page-rail button').forEach((btn) => btn.classList.remove('is-active'));
        
        // Ativa os indicadores para todas as páginas visíveis na view atual
        const view = $flipbook.turn('view', page);
        view.forEach((p) => {
          if (p > 0) {
            const indicator = document.querySelector(`.page-rail button[data-value="${p - 1}"]`);
            if (indicator) indicator.classList.add('is-active');
          }
        });

        // Rola suavemente o rail para centralizar o botão ativo
        const activeIndicator = document.querySelector(`.page-rail button[data-value="${page - 1}"]`);
        if (activeIndicator) {
          activeIndicator.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }
        
        // Gerenciamento dinâmico de desabilitação dos botões Prev/Next
        const prevBtn = document.querySelector('[data-action="pagePrev"]');
        const nextBtn = document.querySelector('[data-action="pageNext"]');
        
        if (prevBtn) prevBtn.disabled = (page === 1);
        if (nextBtn) {
          nextBtn.disabled = view.includes(state.albumPages.length);
        }
      }
    }
  });

  // Configura ResizeObserver no wrapper para redimensionamento e display responsivos e fluidos
  const container = document.getElementById('album-container-wrapper');
  if (container && typeof window.ResizeObserver !== 'undefined') {
    const resizeObserver = new window.ResizeObserver((entries) => {
      for (let entry of entries) {
        const containerWidth = entry.contentRect.width;
        if (containerWidth <= 0) return;

        const isMobile = window.innerWidth < 768;
        const width = isMobile ? Math.min(containerWidth - 12, 680) : Math.min(containerWidth - 48, 800);
        const pageWidth = width / 2;
        const height = Math.round(pageWidth * 1.4);

        const currentWidth = $flipbook.width();
        const currentHeight = $flipbook.height();

        if (currentWidth !== width || currentHeight !== height) {
          $flipbook.turn('size', width, height);
        }
      }
    });

    resizeObserver.observe(container);
  }
}
