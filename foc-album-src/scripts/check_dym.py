import json
import re

with open('module_a.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Procura por window._initialStoreState['TournamentStore'] =
match = re.search(r"window\._initialStoreState\[['\"]TournamentStore['\"]\]\s*=\s*(\{.*?\});", html, re.DOTALL)
if match:
    data = json.loads(match.group(1))
    
    # Encontra todos os players
    players = {}
    for r_num, matches in data.get('matches_by_round', {}).items():
        for m in matches:
            for key in ['player1', 'player2']:
                p = m.get(key)
                if p:
                    players[p['id']] = p
                    
    # Procura por Dym
    for p_id, p in players.items():
        if p['display_name'] == 'Dym':
            print("Dym found:", p)
else:
    print("Not found")
