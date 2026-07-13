const houses = [
  ['BRB', 'Brobnar', 'bro', ['Brasao', 'Daniel Chamon', 'Marc Emerim']],
  ['DIS', 'Dis', 'dis', ['Brasao', 'David MatouGolias', 'Mateus Barbosa', 'Victor Faria']],
  ['LGS', 'Logos', 'lgos', ['Brasao', 'Kammy', 'Guilherme Monteiro']],
  ['MRS', 'Mars', 'mrs', ['Brasao', 'Daniel Mekaro', 'JP Rodriguez']],
  ['SCT', 'Sanctum', 'sct', ['Brasao', 'Leo Butinão', 'Rigel Duarte']],
  ['RDP', 'Redemption', 'rdp', ['Brasao', 'Gian Rumachella']],
  ['SHW', 'Shadows', 'shw', ['Brasao', 'Rodrigo Bunda', 'Diogo Costa', 'Flávio Ciampone']],
  ['UNT', 'Untamed', 'unt', ['Brasao', 'Gabriel Firmo', 'Lucas Hubacek', 'Marcos Dhrago']],
  ['SAU', 'Saurian', 'sau', ['Brasao', 'DreadsGu', 'Pedro Godoy']],
  ['STA', 'Star Alliance', 'sta', ['Brasao', 'Nicholas Sukorski', 'Roberto Rocha']],
  ['UNF', 'Unfathomable', 'unf', ['Brasao', 'Gabriel Oliveira', 'Tamara Holanda']],
  ['EKW', 'Ekwidon', 'ekw', ['Brasao', 'Guilherme Faria']],
  ['GST', 'Geistoid', 'gst', ['Brasao', 'Hygow Lial']],
  ['SKB', 'Skyborn', 'skb', ['Brasao', 'Fábio Hideki']],
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
    image: index === 0
      ? `/assets/stickers/${house === 'STA' ? 'STR' : house}_0.webp`
      : `/assets/stickers/${house === 'STA' ? 'STR' : house}_${index}.webp`,
  })),
);

export const PLAYER_STICKERS = STICKERS.filter((sticker) => sticker.type === 'player');

export const INITIAL_PLAYER_IDS = ['BRB 1', 'DIS 1', 'LGS 1', 'MRS 1', 'SCT 1', 'SHW 1'];

export const GOLDEN_CREST_IDS = ['BRB 0', 'DIS 0', 'LGS 0'];

export const ALBUM_PAGES = [
  { number: 1,  background: '/assets/pages/P01.webp',        kind: 'cover', stickers: [] },
  { number: 2,  background: '/assets/pages/P02.webp',        kind: 'cover', stickers: [] },
  { number: 3,  background: '/assets/pages/P03_3A.webp',     layout: '3A', stickers: ['BRB 0', 'BRB 1', 'BRB 2'] },
  { number: 4,  background: '/assets/pages/P04_2A.webp',     layout: '2A', stickers: ['DIS 0', 'DIS 1'] },
  { number: 5,  background: '/assets/pages/P05_2A.webp',     layout: '2A', stickers: ['DIS 2', 'DIS 3'] },
  { number: 6,  background: '/assets/pages/P06_3A.webp',     layout: '3A', stickers: ['LGS 0', 'LGS 1', 'LGS 2'] },
  { number: 7,  background: '/assets/pages/P07_3B.webp',     layout: '3B', stickers: ['MRS 0', 'MRS 1', 'MRS 2'] },
  { number: 8,  background: '/assets/pages/P08_3A.webp',     layout: '3A', stickers: ['SCT 0', 'SCT 1', 'SCT 2'] },
  { number: 9,  background: '/assets/pages/P09_2A.webp',     layout: '2A', stickers: ['RDP 0', 'RDP 1'] },
  { number: 10, background: '/assets/pages/P10_2A.webp',     layout: '2A', stickers: ['SHW 0', 'SHW 1'] },
  { number: 11, background: '/assets/pages/P11_2A.webp',     layout: '2A', stickers: ['SHW 2', 'SHW 3'] },
  { number: 12, background: '/assets/pages/P12_2A.webp',     layout: '2A', stickers: ['UNT 0', 'UNT 1'] },
  { number: 13, background: '/assets/pages/P13_2A.webp',     layout: '2A', stickers: ['UNT 2', 'UNT 3'] },
  { number: 14, background: '/assets/pages/P14_3A.webp',     layout: '3A', stickers: ['SAU 0', 'SAU 1', 'SAU 2'] },
  { number: 15, background: '/assets/pages/P15_3B.webp',     layout: '3B', stickers: ['STA 0', 'STA 1', 'STA 2'] },
  { number: 16, background: '/assets/pages/P16_3A.webp',     layout: '3A', stickers: ['UNF 0', 'UNF 1', 'UNF 2'] },
  { number: 17, background: '/assets/pages/P17_2A.webp',     layout: '2A', stickers: ['EKW 0', 'EKW 1'] },
  { number: 18, background: '/assets/pages/P18_2A.webp',     layout: '2A', stickers: ['GST 0', 'GST 1'] },
  { number: 19, background: '/assets/pages/P19_2A.webp',     layout: '2A', stickers: ['SKB 0', 'SKB 1'] },
  { number: 20, background: '/assets/pages/P20.webp',        kind: 'cover', stickers: [] },
];

export function getSticker(id) {
  return STICKERS.find((sticker) => sticker.id === id);
}

export function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pool global do pack inicial:
// 27 jogadores reais × 6 figurinhas = 162 slots.
// As contas de teste ficam fora desse pool.
// Nenhum jogador real pode receber figurinha repetida no pack inicial.
// Distribuição artificial de raridade:
// - 3 figurinhas raras com 4 cópias
// - 6 figurinhas incomuns com 5 cópias
// - 9 figurinhas padrão com 6 cópias
// - 6 figurinhas comuns com 7 cópias
// - 3 figurinhas abundantes com 8 cópias
// Total: 3*4 + 6*5 + 9*6 + 6*7 + 3*8 = 162
export const POOL_CONFIG = {
  'BRB 1': 4,
  'DIS 1': 4,
  'LGS 1': 4,

  'MRS 1': 5,
  'SCT 1': 5,
  'RDP 1': 5,
  'SHW 1': 5,
  'UNT 1': 5,
  'SAU 1': 5,

  'STA 1': 6,
  'UNF 1': 6,
  'EKW 1': 6,
  'GST 1': 6,
  'SKB 1': 6,
  'BRB 2': 6,
  'DIS 2': 6,
  'LGS 2': 6,
  'MRS 2': 6,

  'SCT 2': 7,
  'SHW 2': 7,
  'UNT 2': 7,
  'SAU 2': 7,
  'STA 2': 7,
  'UNF 2': 7,

  'DIS 3': 8,
  'SHW 3': 8,
  'UNT 3': 8,
};

export const TEST_ACCOUNT_USERNAMES = ['teste_1', 'teste_2', 'album'];
