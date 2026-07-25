import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  global: {
    headers: {
      'x-player-username': 'fabio_hideki'
    }
  }
});

const HOUSES = [
  'BRB', 'DIS', 'LGS', 'MRS', 'SCT', 'RDP', 'SHW', 'UNT', 'SAU', 'STA', 'UNF', 'EKW', 'GST', 'SKB'
];

const HOUSE_NAMES = {
  'BRB': 'Brobnar',
  'DIS': 'Dis',
  'LGS': 'Logos',
  'MRS': 'Mars',
  'SCT': 'Sanctum',
  'RDP': 'Redemption',
  'SHW': 'Shadows',
  'UNT': 'Untamed',
  'SAU': 'Saurian',
  'STA': 'Star Alliance',
  'UNF': 'Unfathomable',
  'EKW': 'Ekwidon',
  'GST': 'Geistoid',
  'SKB': 'Skyborn'
};

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function run() {
  const isWriteMode = process.argv.includes('--write');
  console.log(`--- GERADOR E DISTRIBUIDOR DE EXTRA PACK DA RODADA 6 (${isWriteMode ? 'MODO GRAVAÇÃO' : 'MODO SIMULAÇÃO/DRY-RUN'}) ---`);

  // 1. Busca todos os jogadores
  const { data: players, error: playersError } = await supabase
    .from('foc2026_players')
    .select('username, name');

  if (playersError) {
    console.error('Erro ao buscar jogadores:', playersError);
    process.exit(1);
  }

  // 2. Busca todas as coleções
  const { data: collections, error: colError } = await supabase
    .from('foc2026_collections')
    .select('player_username, sticker_id, quantity');

  if (colError) {
    console.error('Erro ao buscar coleções:', colError);
    process.exit(1);
  }

  // 3. Busca pacotes pendentes (não abertos)
  const { data: pendingPacks, error: pendingError } = await supabase
    .from('foc2026_pending_packs')
    .select('player_username, sticker_ids, round_number, pack_type')
    .eq('opened', false);

  if (pendingError) {
    console.error('Erro ao buscar pacotes pendentes:', pendingError);
    process.exit(1);
  }

  // Agrupa coleções e pendentes
  const playerOwned = {};
  players.forEach(p => {
    playerOwned[p.username] = new Set();
  });

  collections.forEach(c => {
    if (c.quantity > 0 && playerOwned[c.player_username]) {
      playerOwned[c.player_username].add(c.sticker_id);
    }
  });

  pendingPacks.forEach(p => {
    const user = p.player_username;
    if (playerOwned[user]) {
      // Ignora o próprio extra pack da rodada 6 se já existir pendente, pois vamos substituí-lo
      if (p.round_number === 6 && p.pack_type === 'emblem_round') {
        return;
      }
      if (p.sticker_ids) {
        p.sticker_ids.forEach(sid => playerOwned[user].add(sid));
      }
    }
  });

  const pendingPacksToInsert = [];
  const playersEmblemsSummary = [];

  players.forEach(player => {
    const username = player.username;
    if (username === 'admin' || username === 'album' || username === 'teste_1' || username === 'teste_2') {
      return;
    }

    const owned = playerOwned[username] || new Set();
    
    // Brasões já possuídos (fórmula ou fisicamente na coleção ou pendentes)
    const currentEmblems = new Set();
    owned.forEach(sid => {
      if (sid.endsWith(' 0')) {
        currentEmblems.add(sid);
      }
    });

    playersEmblemsSummary.push({
      name: player.name,
      username: username,
      emblems: Array.from(currentEmblems).map(sid => sid.split(' ')[0])
    });

    const ownedPlayerHouses = [];
    const noPlayerHouses = [];

    HOUSES.forEach(house => {
      // Tem figurinha de jogador (índice 1, 2 ou 3)?
      const hasPlayer = [1, 2, 3].some(i => owned.has(`${house} ${i}`));

      if (hasPlayer) {
        ownedPlayerHouses.push(house);
      } else {
        noPlayerHouses.push(house);
      }
    });

    // Filtra candidatas de brasões que NÃO possui
    // Regra A: Brasões de casas que o jogador não tem figurinha de jogador E não tem o brasão
    const ruleACandidates = noPlayerHouses
      .map(h => `${h} 0`)
      .filter(sid => !currentEmblems.has(sid));

    // Regra B: Brasões de casas que o jogador tem figurinha de jogador E não tem o brasão
    const ruleBCandidates = ownedPlayerHouses
      .map(h => `${h} 0`)
      .filter(sid => !currentEmblems.has(sid));

    // Candidatas gerais de brasões não possuídos
    const allUnownedEmblemCandidates = HOUSES
      .map(h => `${h} 0`)
      .filter(sid => !currentEmblems.has(sid));

    const selected = [];

    // Passo 1: Seleciona 1 brasão de casa sem figurinha de jogador (Regra A)
    if (ruleACandidates.length > 0) {
      const shuffledA = shuffle(ruleACandidates);
      selected.push(shuffledA[0]);
    }

    // Passo 2: Seleciona brasões das outras casas não possuídas (Regra B/Outros) para completar 3
    const remainingCandidates = allUnownedEmblemCandidates.filter(sid => !selected.includes(sid));
    const shuffledRemaining = shuffle(remainingCandidates);

    const needed = 3 - selected.length;
    shuffledRemaining.slice(0, needed).forEach(sid => selected.push(sid));

    // Passo 3: Se o jogador tiver pouquíssimos brasões restantes (ex: já tem 13 brasões), completamos com repetidos aleatórios
    if (selected.length < 3) {
      const missing = 3 - selected.length;
      const fallbackCandidates = HOUSES.map(h => `${h} 0`).filter(sid => !selected.includes(sid));
      const shuffledFallback = shuffle(fallbackCandidates);
      shuffledFallback.slice(0, missing).forEach(sid => selected.push(sid));
    }

    console.log(`Jogador: ${player.name} (${username})`);
    console.log(`  - Brasões já possuídos: ${currentEmblems.size} (${Array.from(currentEmblems).sort().map(sid => sid.split(' ')[0]).join(', ') || 'Nenhum'})`);
    console.log(`  - Casas sem figurinhas de jogador e sem brasão: ${ruleACandidates.map(sid => sid.split(' ')[0]).join(', ') || 'Nenhuma'}`);
    console.log(`  - Sorteado para o Extra Pack: ${selected.map(sid => sid.split(' ')[0]).join(', ')}`);

    if (selected.length === 3) {
      pendingPacksToInsert.push({
        player_username: username,
        round_number: 6,
        opponent_name: 'Extra Pack',
        sticker_ids: selected,
        opened: false,
        pack_type: 'emblem_round',
        challenge_name: 'Rodada 6 - Extra Pack'
      });
    } else {
      console.error(`  - ERRO: Falha ao gerar 3 figurinhas para ${username}. Obtidas: ${selected.length}`);
    }
  });

  // Mostra o resumo geral de brasões de cada player
  console.log('\n=============================================');
  console.log('RESUMO GERAL: BRASÕES DE CADA JOGADOR');
  console.log('=============================================');
  playersEmblemsSummary.sort((a, b) => b.emblems.length - a.emblems.length).forEach(p => {
    const listStr = p.emblems.sort().map(h => HOUSE_NAMES[h] || h).join(', ');
    console.log(`${p.name} (${p.username}): ${p.emblems.length} brasões [${listStr || 'Nenhum'}]`);
  });
  console.log('=============================================\n');

  if (isWriteMode && pendingPacksToInsert.length > 0) {
    const targetUsernames = pendingPacksToInsert.map(p => p.player_username);
    
    console.log('Limpando pacotes antigos de extra pack da Rodada 6 para todos os usuários...');
    const { error: clearErr } = await supabase
      .from('foc2026_pending_packs')
      .delete()
      .eq('round_number', 6)
      .eq('pack_type', 'emblem_round')
      .in('player_username', targetUsernames);
      
    if (clearErr) {
      console.error('Erro ao limpar pacotes antigos:', clearErr);
      process.exit(1);
    }
    
    console.log('Gravando novos pacotes da Rodada 6 no banco de dados...');
    const { error: insertErr } = await supabase
      .from('foc2026_pending_packs')
      .insert(pendingPacksToInsert);

    if (insertErr) {
      console.error('Erro ao salvar os novos pacotes no banco:', insertErr);
    } else {
      console.log('Sucesso: Todos os pacotes da Rodada 6 foram gerados e salvos no banco de dados!');
      
      // Log admin action
      await supabase
        .from('foc2026_admin_logs')
        .insert({
          message: 'Admin gerou e distribuiu os Extra Packs da Rodada 6 (3 brasões inéditos, se possível 1 de casa sem player)',
          admin_username: 'fabio_hideki'
        });
      console.log('Ação administrativa registrada nos logs!');
    }
  }
}

run();
