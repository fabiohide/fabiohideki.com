import { GOLDEN_CREST_IDS, INITIAL_PLAYER_IDS, STICKERS } from './stickers.js';

export function createInitialState() {
  const collection = Object.fromEntries(
    INITIAL_PLAYER_IDS.slice(0, 3).map((id) => [id, { quantity: 1, isNew: true, source: 'pack' }]),
  );

  return {
    currentRoute: 'packs',
    user: { id: 'fabio', name: 'Fabio Hideki', packOpened: false },
    activeRound: {
      number: 1,
      name: 'Rodada 1',
      active: true,
      startsAt: new Date().toISOString(),
    },
    packs: [
      {
        id: 'welcome',
        type: 'player',
        title: 'Pack inicial',
        subtitle: '6 jogadores',
        image: '/assets/pack/player_pack.webp',
        opened: false,
        stickerIds: INITIAL_PLAYER_IDS,
      },
      {
        id: 'golden-1',
        type: 'crest',
        title: 'Pack dourado',
        subtitle: 'Brasoes',
        image: '/assets/pack/golden_pack.webp',
        opened: false,
        stickerIds: GOLDEN_CREST_IDS,
      },
    ],
    collection,
    albumPage: 0,
    reveal: null,
    selectedHouseCodes: ['BRB', 'DIS', 'LGS'],
    report: {
      matchId: 'r1m1',
      housesSubmitted: false,
      reported: false,
      completed: false,
      playerAKeys: 2,
      playerBKeys: 1,
      opponentHouses: ['MRS', 'SCT', 'SHW'],
      pickedIds: [],
    },
    matches: [
      { id: 'r1m1', playerA: 'Fabio Hideki', playerB: 'Flavio Ciampone' },
      { id: 'r1m2', playerA: 'Pedro Godoy', playerB: 'Gian Carlo' },
      { id: 'r1m3', playerA: 'Camilly Marcondes', playerB: 'Guilherme Monteiro' },
      { id: 'r1m4', playerA: 'Daniel Chamon', playerB: 'Marc Emerim' },
    ],
    opponentCollection: Object.fromEntries(
      STICKERS.filter((sticker) => sticker.type === 'player').map((sticker, index) => [
        sticker.id,
        { quantity: index % 4 === 0 ? 2 : 1 },
      ]),
    ),
  };
}
