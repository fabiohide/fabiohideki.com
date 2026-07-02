import re
import json

def get_initial_store_state(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Procura por window._initialStoreState['TournamentStore'] =
    match = re.search(r"window\._initialStoreState\['TournamentStore'\]\s*=\s*(\{.*?\});", html, re.DOTALL)
    if not match:
        # Tenta sem aspas ou aspas duplas
        match = re.search(r"window\._initialStoreState\[['\"]TournamentStore['\"]\]\s*=\s*(\{.*?\});", html, re.DOTALL)
    
    if match:
        try:
            return json.loads(match.group(1))
        except Exception as e:
            print(f"Erro ao parsear JSON em {filename}: {e}")
            return None
    else:
        print(f"Não encontrou _initialStoreState em {filename}")
        return None

def analyze_tournament(filename, name):
    state = get_initial_store_state(filename)
    if not state:
        return
    
    print(f"\n--- {name} ---")
    matches_by_round = state.get('matches_by_round', {})
    
    players = set()
    for r_num, matches in matches_by_round.items():
        for m in matches:
            p1 = m.get('player1')
            p2 = m.get('player2')
            if p1:
                players.add((p1.get('id'), p1.get('display_name')))
            if p2:
                players.add((p2.get('id'), p2.get('display_name')))
                
    print(f"Total de participantes únicos: {len(players)}")
    for p_id, p_name in sorted(players, key=lambda x: x[1]):
        print(f"  {p_id}: {p_name}")

analyze_tournament("module_a.html", "Série A")
analyze_tournament("module_b.html", "Série B")
