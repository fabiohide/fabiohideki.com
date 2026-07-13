import sys
import os
import urllib.request
import json
import re

# Carrega arquivo .env
def load_env(env_path):
    env = {}
    if not os.path.exists(env_path):
        raise FileNotFoundError(f"Arquivo .env nao encontrado em {env_path}")
    with open(env_path, 'r', encoding='utf-8') as f:
        content = f.read()
    for line in content.split('\n'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        parts = line.split('=', 1)
        if len(parts) == 2:
            env[parts[0].strip()] = parts[1].strip()
    return env

def make_supabase_request(url, method, headers, body=None):
    req = urllib.request.Request(url, headers=headers, method=method)
    if body is not None:
        data = json.dumps(body).encode('utf-8')
        req.add_header('Content-Type', 'application/json')
    else:
        data = None
    
    try:
        with urllib.request.urlopen(req, data=data) as response:
            status = response.status
            resp_body = response.read().decode('utf-8')
            return status, json.loads(resp_body) if resp_body else None
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        print(f"HTTP Error {e.code}: {err_body}")
        raise e
    except Exception as e:
        print(f"Error: {e}")
        raise e

def main():
    if len(sys.argv) < 3:
        print("Uso: python3 update_round_matches.py <rodada> <caminho_para_json_confrontos>")
        sys.exit(1)
        
    round_num = int(sys.argv[1])
    json_path = sys.argv[2]
    
    if not os.path.exists(json_path):
        print(f"Arquivo de confrontos {json_path} nao encontrado.")
        sys.exit(1)
        
    with open(json_path, 'r', encoding='utf-8') as f:
        matchups = json.load(f)
        
    # Carregar configuracoes
    env_path = os.path.join(os.getcwd(), '.env')
    env = load_env(env_path)
    
    supabase_url = env.get('VITE_SUPABASE_URL')
    anon_key = env.get('VITE_SUPABASE_ANON_KEY')
    
    if not supabase_url or not anon_key:
        print("Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY nao definidas no .env")
        sys.exit(1)
        
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
        "Prefer": "return=representation"
    }
    
    # 1. Validar se todos os jogadores existem no banco
    print("Validando jogadores no banco...")
    players_url = f"{supabase_url}/rest/v1/foc2026_players?select=username"
    _, players_data = make_supabase_request(players_url, "GET", headers)
    existing_usernames = set(p['username'] for p in players_data)
    
    invalid_players = []
    for i, m in enumerate(matchups):
        p1 = m.get('player_a')
        p2 = m.get('player_b')
        if not p1 or not p2:
            print(f"Erro: Confronto na posicao {i} possui jogador ausente: {m}")
            sys.exit(1)
        if p1 not in existing_usernames:
            invalid_players.append(p1)
        if p2 not in existing_usernames:
            invalid_players.append(p2)
            
    if invalid_players:
        print(f"Erro: Os seguintes usernames nao foram encontrados na tabela foc2026_players: {list(set(invalid_players))}")
        sys.exit(1)
        
    print("Todos os jogadores sao validos!")
    
    # 2. Deletar partidas existentes da Serie A para esta rodada
    # As partidas da Serie A tem ID r{round}-a-{index} e Serie B r{round}-b-{index}
    # Deletaremos apenas da Serie A para esta rodada
    delete_url = f"{supabase_url}/rest/v1/foc2026_matches?round_number=eq.{round_num}&id=like.r{round_num}-a-*"
    print(f"Deletando partidas antigas da Serie A na Rodada {round_num}...")
    status, deleted_matches = make_supabase_request(delete_url, "DELETE", headers)
    print(f"Partidas deletadas ({len(deleted_matches) if deleted_matches else 0}):")
    if deleted_matches:
        for dm in deleted_matches:
            print(f"  - ID: {dm['id']}, {dm['player_a_username']} vs {dm['player_b_username']}")
            
    # 3. Inserir as novas partidas
    new_matches = []
    for idx, m in enumerate(matchups):
        match_id = f"r{round_num}-a-{idx + 1}"
        new_matches.append({
            "id": match_id,
            "round_number": round_num,
            "player_a_username": m['player_a'],
            "player_b_username": m['player_b'],
            "player_a_keys": 0,
            "player_b_keys": 0,
            "player_a_reported": False,
            "player_b_reported": False,
            "completed": False
        })
        
    insert_url = f"{supabase_url}/rest/v1/foc2026_matches"
    print(f"Inserindo {len(new_matches)} novas partidas da Serie A na Rodada {round_num}...")
    status, inserted_matches = make_supabase_request(insert_url, "POST", headers, body=new_matches)
    print(f"Partidas inseridas com sucesso ({len(inserted_matches) if inserted_matches else 0}):")
    if inserted_matches:
        for im in sorted(inserted_matches, key=lambda x: x['id']):
            print(f"  - ID: {im['id']} | {im['player_a_username']} vs {im['player_b_username']}")
            
    print("Processo concluido!")

if __name__ == '__main__':
    main()
