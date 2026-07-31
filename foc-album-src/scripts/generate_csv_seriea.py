import os
import requests
import csv

# 1. Carrega as variáveis do .env
env = {}
with open(".env", "r") as f:
    for line in f:
        if "=" in line:
            parts = line.strip().split("=")
            if len(parts) >= 2:
                env[parts[0].strip()] = "=".join(parts[1:]).strip()

url = env["VITE_SUPABASE_URL"]
headers = {
    "apikey": env["VITE_SUPABASE_ANON_KEY"],
    "Authorization": f"Bearer {env['VITE_SUPABASE_ANON_KEY']}",
}

print("Iniciando coleta de dados do Supabase...")

# 2. Busca dados das tabelas
players = requests.get(f"{url}/rest/v1/foc2026_players?select=*", headers=headers).json()
matches = requests.get(f"{url}/rest/v1/foc2026_matches?select=*", headers=headers).json()
collections = requests.get(f"{url}/rest/v1/foc2026_collections?select=*", headers=headers).json()
challenges = requests.get(f"{url}/rest/v1/foc2026_challenges?select=*", headers=headers).json()

# Filtra para Série A (jogadores reais, excluindo contas especiais)
a_players = [p for p in players if p.get("serie") == "A" and p["username"] not in ['teste_1', 'teste_2', 'admin', 'album']]
a_usernames = {p["username"] for p in a_players}

print(f"Encontrados {len(a_players)} jogadores na Série A.")

# Mapeia coleções
collections_by_player = {}
for p in a_players:
    collections_by_player[p["username"]] = {}

for c in collections:
    user = c["player_username"]
    if user in a_usernames:
        sid = c["sticker_id"]
        qty = c["quantity"]
        if qty > 0:
            collections_by_player[user][sid] = qty

# 3. Calcula classificação
standings = []
for p in a_players:
    username = p["username"]
    # Quantidade de figurinhas de jogador (não terminam em ' 0')
    stickers_count = sum(1 for sid, qty in collections_by_player[username].items() if not sid.endswith(" 0") and qty > 0)
    
    played = 0
    wins = 0
    losses = 0
    keys = 0
    
    for m in matches:
        if m["completed"]:
            if m["player_a_username"] == username:
                played += 1
                keys += m["player_a_keys"]
                if m["player_a_keys"] > m["player_b_keys"]:
                    wins += 1
                elif m["player_a_keys"] < m["player_b_keys"]:
                    losses += 1
            elif m["player_b_username"] == username:
                played += 1
                keys += m["player_b_keys"]
                if m["player_b_keys"] > m["player_a_keys"]:
                    wins += 1
                elif m["player_b_keys"] < m["player_a_keys"]:
                    losses += 1

    # Desafios completados
    completed_challenges = sum(1 for c in challenges if c["player_username"] == username and c["completed"])
    
    standings.append({
        "name": p["name"],
        "stickers_count": stickers_count,
        "wins": wins,
        "losses": losses,
        "played": played,
        "keys": keys,
        "challenges": completed_challenges
    })

# Ordenação oficial: Figurinhas desc -> Vitórias desc -> Chaves desc -> Desafios desc -> Nome asc
standings.sort(key=lambda x: (-x["stickers_count"], -x["wins"], -x["keys"], -x["challenges"], x["name"]))

# 4. Grava o arquivo CSV
output_path = os.path.abspath(os.path.join(os.getcwd(), "foc_serie_a_classificacao.csv"))

with open(output_path, "w", newline="", encoding="utf-8") as csvfile:
    writer = csv.writer(csvfile, delimiter=";")
    # Cabeçalho
    writer.writerow(["Posicao", "Jogador", "Figurinhas do Album", "Vitorias", "Derrotas", "Jogos", "Chaves Forjadas", "Desafios Completados"])
    
    # Linhas de dados
    for idx, p in enumerate(standings, start=1):
        writer.writerow([
            idx,
            p["name"],
            p["stickers_count"],
            p["wins"],
            p["losses"],
            p["played"],
            p["keys"],
            p["challenges"]
        ])

print(f"Arquivo CSV criado com sucesso em: {output_path}")

# Imprime o conteúdo formatado em Markdown para exibição no chat
print("\n--- FORMATO TABELA ---")
print("| Pos | Jogador | Figurinhas do Álbum | Vitórias | Derrotas | Jogos | Chaves Forjadas | Desafios Completados |")
print("|---|---|---|---|---|---|---|---|")
for idx, p in enumerate(standings, start=1):
    print(f"| {idx} | {p['name']} | {p['stickers_count']} | {p['wins']} | {p['losses']} | {p['played']} | {p['keys']} | {p['challenges']} |")
