import { GOLDEN_CREST_IDS, PLAYER_STICKERS, STICKERS, shuffleArray } from './stickers.js';

export function createInitialState() {
  const playerIds = PLAYER_STICKERS.map(s => s.id);
  const randomInitialIds = shuffleArray(playerIds).slice(0, 6);

  const targetIds = ['BRB 0', 'BRB 1', 'BRB 2', 'DIS 0', 'DIS 1', 'DIS 2', 'DIS 3'];
  const collection = Object.fromEntries(
    [...randomInitialIds.slice(0, 3), ...targetIds].map((id) => [id, { quantity: 1, isNew: true, source: 'pack' }]),
  );

  return {
    currentRoute: 'packs',
    user: { id: 'fabio_hideki', name: 'Fábio Hideki', packOpened: true, isAdmin: true, serie: 'B' },
    activeRound: {
      number: 1,
      name: 'Rodada 1',
      active: true,
      startsAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      sasLimit: 80,
    },
    packs: [
      {
        id: 'welcome',
        type: 'player',
        title: 'Pacotinho inicial',
        subtitle: '6 jogadores',
        image: '/assets/pack/player_pack.webp',
        opened: true,
        stickerIds: randomInitialIds,
      },
      {
        id: 'golden-1',
        type: 'crest',
        title: 'Pacotinho dourado',
        subtitle: 'Brasões',
        image: '/assets/pack/golden_pack.webp',
        opened: false,
        disabled: true,
        stickerIds: GOLDEN_CREST_IDS,
      },
    ],
    collection,
    albumPage: 0,
    reveal: null,
    selectedHouseCodes: [],
    report: {
      matchId: '',
      housesSubmitted: false,
      reported: false,
      completed: false,
      playerAKeys: 0,
      playerBKeys: 0,
      opponentHouses: [],
      opponentReported: false,
      confirmed: false,
      conflict: false,
      confirmedAt: null,
      pickedIds: [],
      matchDeadlinePassed: false,
      fallbackActive: false,
      maxPicks: 3,
    },
    challenges: [
      { id: 'c1', title: 'Deck SAS abaixo do limite',  desc: 'Vencer com deck cujo SAS seja 5 ou mais abaixo do limite da rodada',   completed: false, pickedId: null, pendingValidation: false },
      { id: 'c2', title: 'Aember bonus mínimo',         desc: 'Vencer com deck com bônus de aember de 8 ou menos',                    completed: false, pickedId: null, pendingValidation: false },
      { id: 'c3', title: 'Keycheat único',              desc: 'Vencer usando exatamente 1 keycheat na partida',                        completed: false, pickedId: null, pendingValidation: false },
      { id: 'c4', title: 'Creature control mínimo',     desc: 'Vencer com deck com creature control de 8 ou menos',                    completed: false, pickedId: null, pendingValidation: false },
      { id: 'c5', title: '1 Maverick no deck',          desc: 'Vencer com um deck que tenha exatamente 1 Maverick',                    completed: false, pickedId: null, pendingValidation: false },
      { id: 'c6', title: '≥ 6 artefatos',               desc: 'Vencer com um deck que tenha pelo menos 6 artefatos',                   completed: false, pickedId: null, pendingValidation: false },
      { id: 'c7', title: '≥ 20 criaturas',              desc: 'Vencer com um deck que tenha pelo menos 20 criaturas',                  completed: false, pickedId: null, pendingValidation: false },
      { id: 'c8', title: 'Pós-MM econômico',            desc: 'Vencer com deck pós-Mass Mutation com no máximo 6 propagações',        completed: false, pickedId: null, pendingValidation: false },
    ],
    matches: [
      { id: 'r1m_test', playerA: 'teste_1', playerB: 'teste_2' },
    ],
    opponentCollection: Object.fromEntries(
      STICKERS.filter((sticker) => sticker.type === 'player').map((sticker, index) => [
        sticker.id,
        { quantity: index % 4 === 0 ? 2 : 1 },
      ]),
    ),
  };

  const players = [
    { id: 'fabio_hideki', name: 'Fábio Hideki', serie: 'B', collection: state.collection },
    { id: 'flavio_ciampone', name: 'Flávio Ciampone', serie: 'A', collection: state.opponentCollection },
    { id: 'pedro_godoy', name: 'Pedro Godoy', serie: 'A', collection: {} },
    { id: 'gian_rumachella', name: 'Gian Rumachella', serie: 'B', collection: {} },
  ];

  state.players = players;
  state.standings = [
    { username: 'fabio_hideki', name: 'Fábio Hideki', serie: 'B', stickersCount: 6, wins: 2, losses: 2, played: 4, keys: 6, challengesCount: 0 },
    { username: 'flavio_ciampone', name: 'Flávio Ciampone', serie: 'A', stickersCount: 4, wins: 1, losses: 3, played: 4, keys: 4, challengesCount: 1 },
    { username: 'pedro_godoy', name: 'Pedro Godoy', serie: 'A', stickersCount: 0, wins: 0, losses: 0, played: 0, keys: 0, challengesCount: 0 },
    { username: 'gian_rumachella', name: 'Gian Rumachella', serie: 'B', stickersCount: 0, wins: 0, losses: 0, played: 0, keys: 0, challengesCount: 0 }
  ];
  state.adminLogs = [
    { timestamp: new Date().toISOString(), message: 'Painel administrativo inicializado.' }
  ];
  state.stickersLog = [
    ...randomInitialIds.slice(0, 3).map(id => ({
      round: 1,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      message: `Fábio Hideki obteve a figurinha ${id} via Pacotinho inicial`,
      type: 'pack'
    }))
  ];

  return state;
}
