import urllib.request
import urllib.parse
import json

url_base = "https://vzuzwvhktwzitqhthsor.supabase.co/rest/v1"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6dXp3dmhrdHd6aXRxaHRoc29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NzIwNjEsImV4cCI6MjA5NzA0ODA2MX0.8wNlb4UPv31XIRc5Wkk-ca9IMcId5IeFwd08Pc7zOA8",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6dXp3dmhrdHd6aXRxaHRoc29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NzIwNjEsImV4cCI6MjA5NzA0ODA2MX0.8wNlb4UPv31XIRc5Wkk-ca9IMcId5IeFwd08Pc7zOA8",
    "x-player-username": "fabio_hideki",
    "Prefer": "return=representation"
}

def request(endpoint, method="GET", body=None):
    url = f"{url_base}/{endpoint}"
    parts = url.split("?", 1)
    if len(parts) == 2:
        safe_url = parts[0] + "?" + urllib.parse.quote(parts[1], safe="=&*.")
    else:
        safe_url = parts[0]
        
    req = urllib.request.Request(safe_url, headers=headers, method=method)
    data = json.dumps(body).encode('utf-8') if body is not None else None
    if body is not None:
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, data=data) as resp:
            content = resp.read().decode('utf-8')
            return resp.status, json.loads(content) if content else None
    except urllib.error.HTTPError as e:
        print(f"HTTPError {e.code}: {e.read().decode('utf-8')}")
        raise e

def main():
    player = "daniel_chamon"
    challenge_id = "c7" # ≥ 20 criaturas
    sticker_id = "DIS 3"
    
    print(f"--- RESETANDO DESAFIO '≥ 20 criaturas' PARA {player} (usando x-player-username: fabio_hideki) ---")
    
    # 1. Resetar Desafio na tabela foc2026_challenges
    patch_body = {
        "completed": False,
        "picked_id": None,
        "pending_validation": False
    }
    status, res_c = request(f"foc2026_challenges?player_username=eq.{player}&id=eq.{challenge_id}", method="PATCH", body=patch_body)
    print("1. Desafio atualizado:", res_c)
    
    # 2. Deletar figurinha da colecao foc2026_collections
    status, res_coll = request(f"foc2026_collections?player_username=eq.{player}&sticker_id=eq.{sticker_id}&source=eq.challenge", method="DELETE")
    print("2. Figurinha removida da colecao:", res_coll)
    
    # 3. Deletar logs referentes a este desafio da foc2026_stickers_log (IDs 1095 e 1096)
    status, res_log = request(f"foc2026_stickers_log?player_username=eq.{player}&id=in.(1095,1096)", method="DELETE")
    print("3. Logs do desafio removidos:", res_log)
    
    # 4. Registrar log de acao administrativa
    log_body = {
        "message": f"Admin resetou o desafio '≥ 20 criaturas' (id: c7) e a figurinha DIS 3 de Daniel Chamon",
        "admin_username": "fabio_hideki"
    }
    status, res_admin = request("foc2026_admin_logs", method="POST", body=log_body)
    print("4. Log administrativo registrado:", res_admin)
    
    print("\n--- VERIFICACAO FINAL ---")
    _, c_check = request(f"foc2026_challenges?player_username=eq.{player}&id=eq.{challenge_id}")
    print("Status do desafio:", c_check)
    
    _, coll_check = request(f"foc2026_collections?player_username=eq.{player}&sticker_id=eq.{sticker_id}")
    print("Colecao DIS 3:", coll_check)

if __name__ == '__main__':
    main()
