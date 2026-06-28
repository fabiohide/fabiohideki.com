const houses = [
  ['BRB', 'Brobnar', 'bro', ['Brasao', 'Daniel Chamon', 'Marc Emerim']],
  ['DIS', 'Dis', 'dis', ['Brasao', 'David Pereira', 'Mateus Barbosa', 'Victor Faria']],
  ['LGS', 'Logos', 'lgos', ['Brasao', 'Camilly Marcondes', 'Guilherme Monteiro', 'Vagner Gennaro']],
  ['MRS', 'Mars', 'mrs', ['Brasao', 'Daniel Mekaro', 'JP Rodriguez']],
  ['SCT', 'Sanctum', 'sct', ['Brasao', 'Leonardo Belchior', 'Rigel Duarte']],
  ['SHW', 'Shadows', 'shw', ['Brasao', 'Rodrigo Bunda', 'Diogo Costa', 'Flavio Ciampone']],
  ['UNT', 'Untamed', 'unt', ['Brasao', 'Gabriel Firmo', 'Lucas Hubacek', 'Marcos Pereira']],
  ['SAU', 'Saurian', 'sau', ['Brasao', 'Gustavo Oliveira', 'Pedro Godoy']],
  ['STA', 'Star Alliance', 'sta', ['Brasao', 'Nicholas Sukorski', 'Roberto Rocha']],
  ['UNF', 'Unfathomable', 'unf', ['Brasao', 'Gabriel Oliveira', 'Tamara Holando']],
  ['EKW', 'Ekwidon', 'ekw', ['Brasao', 'Guilherme Faria']],
  ['GST', 'Geistoid', 'gst', ['Brasao', 'Hygow Lial']],
  ['SKB', 'Skyborn', 'skb', ['Brasao', 'Fabio Hideki']],
  ['RDP', 'Redemption', 'rdp', ['Brasao', 'Gian Carlo']],
];

export const HOUSE_META = Object.fromEntries(
  houses.map(([code, name, icon]) => [code, { code, name, icon: `/assets/houses/House=${icon}.svg` }]),
);

export const STICKERS = houses.flatMap(([house, houseName, icon, names]) =>
  names.map((name, index) => ({
    id: `${house} ${index}`,
    slug: `${house.toLowerCase()}-${index}`,
    house,
    houseName,
    icon: `/assets/houses/House=${icon}.svg`,
    name,
    type: index === 0 ? 'crest' : 'player',
    image: '/assets/stickers/stickers_mock.webp',
  })),
);

export const PLAYER_STICKERS = STICKERS.filter((sticker) => sticker.type === 'player');

export const INITIAL_PLAYER_IDS = ['BRB 1', 'DIS 1', 'LGS 1', 'MRS 1', 'SCT 1', 'SHW 1'];

export const GOLDEN_CREST_IDS = ['BRB 0', 'DIS 0', 'LGS 0'];

export const ALBUM_PAGES = [
  { number: 1, background: '/assets/pages/P01.webp', kind: 'cover', stickers: [] },
  { number: 2, background: '/assets/pages/P02.webp', kind: 'cover', stickers: [] },
  { number: 3, background: '/assets/pages/pages_mock.webp', layout: 'c', stickers: ['BRB 0', 'BRB 1', 'BRB 2'] },
  { number: 4, background: '/assets/pages/pages_mock.webp', layout: 'a', stickers: ['DIS 0', 'DIS 1'] },
  { number: 5, background: '/assets/pages/pages_mock.webp', layout: 'b', stickers: ['DIS 2', 'DIS 3'] },
  { number: 6, background: '/assets/pages/pages_mock.webp', layout: 'a', stickers: ['LGS 0', 'LGS 1'] },
  { number: 7, background: '/assets/pages/pages_mock.webp', layout: 'b', stickers: ['LGS 2', 'LGS 3'] },
  { number: 8, background: '/assets/pages/pages_mock.webp', layout: 'c', stickers: ['MRS 0', 'MRS 1', 'MRS 2'] },
  { number: 9, background: '/assets/pages/pages_mock.webp', layout: 'c', stickers: ['SCT 0', 'SCT 1', 'SCT 2'] },
  { number: 10, background: '/assets/pages/pages_mock.webp', layout: 'a', stickers: ['SHW 0', 'SHW 1'] },
  { number: 11, background: '/assets/pages/pages_mock.webp', layout: 'b', stickers: ['SHW 2', 'SHW 3'] },
  { number: 12, background: '/assets/pages/pages_mock.webp', layout: 'a', stickers: ['UNT 0', 'UNT 1'] },
  { number: 13, background: '/assets/pages/pages_mock.webp', layout: 'b', stickers: ['UNT 2', 'UNT 3'] },
  { number: 14, background: '/assets/pages/pages_mock.webp', layout: 'c', stickers: ['SAU 0', 'SAU 1', 'SAU 2'] },
  { number: 15, background: '/assets/pages/pages_mock.webp', layout: 'c', stickers: ['STA 0', 'STA 1', 'STA 2'] },
  { number: 16, background: '/assets/pages/pages_mock.webp', layout: 'c', stickers: ['UNF 0', 'UNF 1', 'UNF 2'] },
  { number: 17, background: '/assets/pages/pages_mock.webp', layout: 'a', stickers: ['EKW 0', 'EKW 1'] },
  { number: 18, background: '/assets/pages/pages_mock.webp', layout: 'b', stickers: ['GST 0', 'GST 1'] },
  { number: 19, background: '/assets/pages/pages_mock.webp', layout: 'a', stickers: ['SKB 0', 'SKB 1'] },
  { number: 20, background: '/assets/pages/pages_mock.webp', layout: 'b', stickers: ['RDP 0', 'RDP 1'] },
  { number: 21, background: '/assets/pages/P21.webp', kind: 'cover', stickers: [] },
  { number: 22, background: '/assets/pages/P22.webp', kind: 'cover', stickers: [] },
];

export function getSticker(id) {
  return STICKERS.find((sticker) => sticker.id === id);
}
