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

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function run() {
  console.log('--- RE-GERADOR DE EXTRA PACK DA RODADA 4 (REVISADO E CORRIGIDO) ---');
  
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
      // Ignora o próprio extra pack da rodada 4 se já existir pendente, pois vamos substituí-lo
      if (p.round_number === 4 && p.pack_type === 'emblem_round') {
        return;
      }
      if (p.sticker_ids) {
        p.sticker_ids.forEach(sid => playerOwned[user].add(sid));
      }
    }
  });

  const pendingPacksToInsert = [];

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

    const ownedPlayerHouses = [];
    const unownedHouses = [];

    HOUSES.forEach(house => {
      // Tem figurinha de jogador (índice 1, 2 ou 3)?
      const hasPlayer = [1, 2, 3].some(i => owned.has(`${house} ${i}`));
      // Tem qualquer figurinha dessa casa (índice 0 a 3)?
      const hasAny = [0, 1, 2, 3].some(i => owned.has(`${house} ${i}`));

      if (hasPlayer) {
        ownedPlayerHouses.push(house);
      }
      if (!hasAny) {
        unownedHouses.push(house);
      }
    });

    // Filtra candidatas a sorteio que NÃO estão nos brasões já possuídos (garante 100% sem repetidos)
    const unownedEmblemCandidates = unownedHouses
      .map(h => `${h} 0`)
      .filter(sid => !currentEmblems.has(sid));
      
    const ownedPlayerEmblemCandidates = ownedPlayerHouses
      .map(h => `${h} 0`)
      .filter(sid => !currentEmblems.has(sid));

    const allUnownedEmblemCandidates = HOUSES
      .map(h => `${h} 0`)
      .filter(sid => !currentEmblems.has(sid));

    const selected = [];

    // Passo 1: Seleciona 1 brasão de casa não possuída (Regra A)
    if (unownedEmblemCandidates.length > 0) {
      const shuffledUnowned = shuffle(unownedEmblemCandidates);
      selected.push(shuffledUnowned[0]);
    }

    // Passo 2: Seleciona 2 brasões de casas com figurinha de jogador (Regra B)
    const candidatesB = ownedPlayerEmblemCandidates.filter(sid => !selected.includes(sid));
    const shuffledB = shuffle(candidatesB);
    
    if (shuffledB.length >= 2) {
      selected.push(shuffledB[0], shuffledB[1]);
    } else {
      shuffledB.forEach(sid => selected.push(sid));
    }

    // Passo 3: Fallback para completar 3 brasões se faltar
    if (selected.length < 3) {
      const remainingSlots = 3 - selected.length;
      const fallbackCandidates = allUnownedEmblemCandidates.filter(sid => !selected.includes(sid));
      const shuffledFallback = shuffle(fallbackCandidates);
      
      shuffledFallback.slice(0, remainingSlots).forEach(sid => selected.push(sid));
    }

    console.log(`Jogador: ${player.name} (${username})`);
    console.log(`  - Brasões já possuídos: ${currentEmblems.size} (${Array.from(currentEmblems).sort().join(', ')})`);
    console.log(`  - Sorteado: ${selected.join(', ')}`);

    if (selected.length === 3) {
      pendingPacksToInsert.push({
        player_username: username,
        round_number: 4,
        opponent_name: 'Extra Pack',
        sticker_ids: selected,
        opened: false,
        pack_type: 'emblem_round',
        challenge_name: 'Rodada 4 - Extra Pack'
      });
    } else {
      console.error(`  - ERRO: Falha ao gerar 3 figurinhas para ${username}. Obtidas: ${selected.length}`);
    }
  });

  console.log(`\nTotal de pacotes a serem gravados: ${pendingPacksToInsert.length}`);
  
  if (pendingPacksToInsert.length > 0) {
    const targetUsernames = pendingPacksToInsert.map(p => p.player_username);
    
    console.log('Limpando pacotes antigos de extra pack da Rodada 4 para todos os usuários...');
    const { error: clearErr } = await supabase
      .from('foc2026_pending_packs')
      .delete()
      .eq('round_number', 4)
      .eq('pack_type', 'emblem_round')
      .in('player_username', targetUsernames);
      
    if (clearErr) {
      console.error('Erro ao limpar pacotes antigos:', clearErr);
      process.exit(1);
    }
    
    console.log('Gravando novos pacotes da Rodada 4 no banco de dados...');
    const { error: insertErr } = await supabase
      .from('foc2026_pending_packs')
      .insert(pendingPacksToInsert);

    if (insertErr) {
      console.error('Erro ao salvar os novos pacotes no banco:', insertErr);
    } else {
      console.log('Sucesso: Todos os pacotes da Rodada 4 foram gerados e salvos no banco de dados com a nova lógica!');
      
      // Log admin action
      await supabase
        .from('foc2026_admin_logs')
        .insert({
          message: 'Admin re-gerou todos os Extra Packs da Rodada 4 garantindo brasões novos e sem repetidos',
          admin_username: 'fabio_hideki'
        });
      console.log('Ação administrativa registrada nos logs!');
    }
  }
}

run();
