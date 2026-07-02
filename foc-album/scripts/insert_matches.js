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

const MAP_A = {
  "Butinão": "leonardo_belchior",
  "David": "david_matougolias",
  "Dhrago": "marcos_dhrago",
  "Diogo": "diogo_costa",
  "Dreadsgu": "dreadsgu",
  "Dym": "daniel_mekaro",
  "Flávio": "flavio_ciampone",
  "Guilherme": "guilherme_faria",
  "Hubacek": "lucas_hubacek",
  "Kammys": "kammy",
  "Marc": "marc_emerim",
  "Nicholas": "nicholas_sukorski",
  "Pedro": "pedro_godoy",
  "Roberto": "roberto_rocha",
  "Victor": "victor_faria",
  "Álbum": "album"
};

const MAP_B = {
  "Bunda": "rodrigo_bunda",
  "Chamon": "daniel_chamon",
  "Fabit": "fabio_hideki",
  "Gabriel": "gabriel_firmo",
  "Gian": "gian_rumachella",
  "Hygow": "hygow_lial",
  "JP": "jp_rodriguez",
  "Mateus": "mateus_barbosa",
  "Monteiro": "guilherme_monteiro",
  "Rigel": "rigel_duarte",
  "Tamara": "tamara_holanda",
  "Zane": "gabriel_oliveira"
};

function parseChallongeHTML(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const match = html.match(/window\._initialStoreState\[['"]TournamentStore['"]\]\s*=\s*(\{.*?\});/);
  if (!match) {
    throw new Error(`Não foi possível encontrar a store em ${filePath}`);
  }
  return JSON.parse(match[1]);
}

async function run() {
  console.log('Iniciando parsing e inserção das partidas...');

  // Garante que as rodadas 1 a 9 existem na tabela foc2026_rounds
  console.log('Garantindo que rodadas 1 a 9 existem...');
  for (let r = 1; r <= 9; r++) {
    const { data: existingRound } = await supabase
      .from('foc2026_rounds')
      .select('*')
      .eq('number', r)
      .single();

    if (!existingRound) {
      console.log(`Inserindo rodada ${r}...`);
      const { error: insErr } = await supabase
        .from('foc2026_rounds')
        .insert({
          number: r,
          name: `Rodada ${r}`,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // prazo de 1 semana padrão
          sas_limit: 80,
          active: r === 1 // ativa apenas a rodada 1 inicialmente
        });
      if (insErr) {
        console.error(`Erro ao criar rodada ${r}:`, insErr);
      }
    }
  }

  // Deleta partidas existentes de rodadas 1 a 9 para evitar conflitos de índices únicos
  console.log('Limpando partidas antigas das rodadas 1 a 9...');
  const { error: delErr } = await supabase
    .from('foc2026_matches')
    .delete()
    .lte('round_number', 9);
  
  if (delErr) {
    console.error('Erro ao deletar partidas antigas:', delErr);
  }

  // Série A
  const dataA = parseChallongeHTML('module_a.html');
  const matchesByRoundA = dataA.matches_by_round;
  let countA = 0;

  for (let r = 1; r <= 9; r++) {
    const matches = matchesByRoundA[r] || [];
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const p1 = m.player1;
      const p2 = m.player2;

      if (!p1 || !p2) {
        console.warn(`Partida na Série A Rodada ${r} com jogador faltando.`);
        continue;
      }

      const p1Username = MAP_A[p1.display_name];
      const p2Username = MAP_A[p2.display_name];

      if (!p1Username || !p2Username) {
        console.error(`Erro de mapeamento na Série A Rodada ${r}: ${p1.display_name} -> ${p1Username}, ${p2.display_name} -> ${p2Username}`);
        continue;
      }

      // ID único da partida
      const matchId = `r${r}-a-${i + 1}`;

      const { error: matchInsertError } = await supabase
        .from('foc2026_matches')
        .insert({
          id: matchId,
          round_number: r,
          player_a_username: p1Username,
          player_b_username: p2Username,
          player_a_keys: 0,
          player_b_keys: 0,
          player_a_reported: false,
          player_b_reported: false,
          completed: false
        });

      if (matchInsertError) {
        console.error(`Erro ao inserir partida ${matchId}:`, matchInsertError);
      } else {
        countA++;
      }
    }
  }
  console.log(`Inseridas ${countA} partidas da Série A.`);

  // Série B
  const dataB = parseChallongeHTML('module_b.html');
  const matchesByRoundB = dataB.matches_by_round;
  let countB = 0;

  for (let r = 1; r <= 9; r++) {
    const matches = matchesByRoundB[r] || [];
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const p1 = m.player1;
      const p2 = m.player2;

      if (!p1 || !p2) {
        console.warn(`Partida na Série B Rodada ${r} com jogador faltando.`);
        continue;
      }

      const p1Username = MAP_B[p1.display_name];
      const p2Username = MAP_B[p2.display_name];

      if (!p1Username || !p2Username) {
        console.error(`Erro de mapeamento na Série B Rodada ${r}: ${p1.display_name} -> ${p1Username}, ${p2.display_name} -> ${p2Username}`);
        continue;
      }

      // ID único da partida
      const matchId = `r${r}-b-${i + 1}`;

      const { error: matchInsertError } = await supabase
        .from('foc2026_matches')
        .insert({
          id: matchId,
          round_number: r,
          player_a_username: p1Username,
          player_b_username: p2Username,
          player_a_keys: 0,
          player_b_keys: 0,
          player_a_reported: false,
          player_b_reported: false,
          completed: false
        });

      if (matchInsertError) {
        console.error(`Erro ao inserir partida ${matchId}:`, matchInsertError);
      } else {
        countB++;
      }
    }
  }
  console.log(`Inseridas ${countB} partidas da Série B.`);
  console.log('Processo finalizado!');
}

run();
