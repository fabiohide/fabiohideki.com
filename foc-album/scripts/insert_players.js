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

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const allPlayers = [
  // Série A
  { username: 'leonardo_belchior', name: 'Leo Butinão', serie: 'A' },
  { username: 'david_matougolias', name: 'David Pereira Neto', serie: 'A' },
  { username: 'marcos_dhrago', name: 'Marcos Dhrago', serie: 'A' },
  { username: 'diogo_costa', name: 'Diogo Costa', serie: 'A' },
  { username: 'dreadsgu', name: 'DreadsGu', serie: 'A' },
  { username: 'daniel_mekaro', name: 'Daniel Mekaro', serie: 'A' },
  { username: 'flavio_ciampone', name: 'Flávio Ciampone', serie: 'A' },
  { username: 'guilherme_faria', name: 'Guilherme Faria', serie: 'A' },
  { username: 'lucas_hubacek', name: 'Lucas Hubacek', serie: 'A' },
  { username: 'kammy', name: 'Camilly Marcondes', serie: 'A' },
  { username: 'marc_emerim', name: 'Marc Emerim', serie: 'A' },
  { username: 'nicholas_sukorski', name: 'Nicholas Sukorski', serie: 'A' },
  { username: 'pedro_godoy', name: 'Pedro Godoy', serie: 'A' },
  { username: 'roberto_rocha', name: 'Roberto Rocha', serie: 'A' },
  { username: 'victor_faria', name: 'Victor Faria', serie: 'A' },
  { username: 'album', name: 'O Albúm', serie: 'A' },

  // Série B
  { username: 'rodrigo_bunda', name: 'Rodrigo Bunda', serie: 'B' },
  { username: 'daniel_chamon', name: 'Daniel Chamon', serie: 'B' },
  { username: 'fabio_hideki', name: 'Fábio Hideki', serie: 'B' },
  { username: 'gabriel_firmo', name: 'Gabriel Firmo', serie: 'B' },
  { username: 'gian_rumachella', name: 'Gian Rumachella', serie: 'B' },
  { username: 'hygow_lial', name: 'Hygow Lial', serie: 'B' },
  { username: 'jp_rodriguez', name: 'JP Rodriguez', serie: 'B' },
  { username: 'mateus_barbosa', name: 'Mateus Barbosa', serie: 'B' },
  { username: 'guilherme_monteiro', name: 'Guilherme Monteiro', serie: 'B' },
  { username: 'rigel_duarte', name: 'Rigel Duarte', serie: 'B' },
  { username: 'tamara_holanda', name: 'Tamara Holanda', serie: 'B' },
  { username: 'gabriel_oliveira', name: 'Gabriel Oliveira', serie: 'B' }
];

async function run() {
  console.log('Inserindo/atualizando jogadores no banco de dados...');

  for (const p of allPlayers) {
    const { data: existing } = await supabase
      .from('foc2026_players')
      .select('*')
      .eq('username', p.username)
      .single();

    if (existing) {
      console.log(`Jogador ${p.username} já existe. Atualizando série para ${p.serie}...`);
      const { error } = await supabase
        .from('foc2026_players')
        .update({ serie: p.serie, name: p.name })
        .eq('username', p.username);
      if (error) console.error(`Erro ao atualizar ${p.username}:`, error);
    } else {
      console.log(`Jogador ${p.username} não existe. Inserindo...`);
      const { error } = await supabase
        .from('foc2026_players')
        .insert({
          username: p.username,
          name: p.name,
          serie: p.serie,
          pack_opened: false,
          is_admin: p.username === 'fabio_hideki'
        });
      if (error) console.error(`Erro ao inserir ${p.username}:`, error);
    }
  }

  console.log('Inserção/atualização de jogadores concluída!');
}

run();
