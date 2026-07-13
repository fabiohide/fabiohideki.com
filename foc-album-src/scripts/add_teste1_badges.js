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

async function run() {
  console.log('Gerando lista de figurinhas de todas as casas...');
  
  const stickersToAdd = [];
  houses.forEach(([house, , , names]) => {
    names.forEach((_, index) => {
      stickersToAdd.push({
        player_username: 'teste_1',
        sticker_id: `${house} ${index}`,
        quantity: 1,
        source: 'pack',
        is_new: false
      });
    });
  });

  console.log(`Pronto para adicionar/atualizar ${stickersToAdd.length} figurinhas no banco de dados para teste_1...`);

  // Fazemos a inserção em lote (batch upsert) para ser extremamente rápido e eficiente
  const { data, error } = await supabase
    .from('foc2026_collections')
    .upsert(stickersToAdd, { onConflict: 'player_username,sticker_id' });

  if (error) {
    console.error('Erro ao inserir figurinhas em lote:', error);
  } else {
    console.log(`Sucesso: ${stickersToAdd.length} figurinhas inseridas/atualizadas com sucesso para teste_1!`);
  }
}

run();
