-- Alter table to add new columns for single-step reporting
alter table public.foc2026_matches
  add column if not exists player_a_opp_keys int not null default 0 check (player_a_opp_keys between 0 and 3),
  add column if not exists player_b_opp_keys int not null default 0 check (player_b_opp_keys between 0 and 3),
  add column if not exists player_a_picks text not null default '',
  add column if not exists player_b_picks text not null default '';

-- Create RPC to submit houses, keys, opponent keys and picks in one go
create or replace function public.foc2026_submit_single_report(
  p_match_id text,
  p_houses text[],
  p_my_keys int,
  p_opp_keys int,
  p_picks text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text := public.foc2026_current_username();
  v_match public.foc2026_matches%rowtype;
  v_sticker text;
  v_player_name text;
begin
  if v_username is null then
    raise exception 'not authenticated';
  end if;

  if array_length(p_houses, 1) <> 3 then
    raise exception 'exactly 3 houses required';
  end if;

  if p_my_keys < 0 or p_my_keys > 3 or p_opp_keys < 0 or p_opp_keys > 3 then
    raise exception 'keys must be between 0 and 3';
  end if;

  select * into v_match from public.foc2026_matches where id = p_match_id for update;
  if not found or v_username not in (v_match.player_a_username, v_match.player_b_username) then
    raise exception 'match not found for user';
  end if;

  select name into v_player_name from public.foc2026_players where username = v_username;

  if v_username = v_match.player_a_username then
    update public.foc2026_matches
    set player_a_houses = array_to_string(p_houses, ','),
        player_a_keys = p_my_keys,
        player_a_opp_keys = p_opp_keys,
        player_a_picks = array_to_string(p_picks, ','),
        player_a_reported = true,
        player_a_picks_completed = true
    where id = p_match_id;
  else
    update public.foc2026_matches
    set player_b_houses = array_to_string(p_houses, ','),
        player_b_keys = p_my_keys,
        player_b_opp_keys = p_opp_keys,
        player_b_picks = array_to_string(p_picks, ','),
        player_b_reported = true,
        player_b_picks_completed = true
    where id = p_match_id;
  end if;

  -- Log picks in stickers log so that admin/history can see it
  foreach v_sticker in array p_picks loop
    declare
      v_house_code text := split_part(trim(v_sticker), ' ', 1);
      v_has_emblem boolean := false;
      v_opp_username text;
      v_opp_stickers_count int := 0;
      v_log_type text := 'pick';
    begin
      if v_username = v_match.player_a_username then
        v_opp_username := v_match.player_b_username;
      else
        v_opp_username := v_match.player_a_username;
      end if;

      select (quantity > 0) into v_has_emblem 
      from public.foc2026_collections 
      where player_username = v_opp_username 
        and sticker_id = v_house_code || ' 0';
        
      if coalesce(v_has_emblem, false) then
        
        select count(*) into v_opp_stickers_count 
        from public.foc2026_collections c
        join public.foc2026_stickers s on s.id = c.sticker_id
        where c.player_username = v_opp_username 
          and s.house = v_house_code 
          and s.type = 'player' 
          and c.quantity > 0;
          
        if coalesce(v_opp_stickers_count, 0) = 0 then
          v_log_type := 'emblem';
        end if;
      end if;

      insert into public.foc2026_stickers_log(player_username, round_number, message, type)
      values (
        v_username,
        v_match.round_number,
        coalesce(v_player_name, v_username) || ' solicitou a figurinha ' || v_sticker || ' via Pick pós-partida',
        v_log_type
      );
    end;
  end loop;

  -- Se ambos os jogadores reportaram, a partida está concluída!
  update public.foc2026_matches
  set confirmed_at = coalesce(confirmed_at, now()),
      completed = true
  where id = p_match_id
    and player_a_reported = true
    and player_b_reported = true;
end;
$$;
