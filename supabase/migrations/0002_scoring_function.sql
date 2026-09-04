-- Recommendation scoring — deterministic, explainable, no LLM in the ranking
-- path (see PS6 brief §5). The LLM (client-side heuristic today, swappable
-- for a real API later — see src/lib/concierge.ts) only ever produces the
-- {tags, budget_max, time_window} filter object fed into this function.

create or replace function haversine_km(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision
language sql
immutable
as $$
  select 2 * 6371 * asin(sqrt(
    sin(radians(lat2 - lat1) / 2) ^ 2 +
    cos(radians(lat1)) * cos(radians(lat2)) * sin(radians(lng2 - lng1) / 2) ^ 2
  ));
$$;

create or replace function get_recommendations(
  p_user_id uuid default null,
  p_tags text[] default null,
  p_budget_max numeric default null,
  p_time_window text default null,
  p_limit int default 50
)
returns table (
  id uuid,
  host_id uuid,
  title text,
  description text,
  tags text[],
  price numeric,
  capacity int,
  location_name text,
  time_slots text[],
  duration_label text,
  image_url text,
  review_count int,
  rating numeric,
  host_name text,
  interest_match numeric,
  budget_fit numeric,
  time_fit numeric,
  proximity numeric,
  hidden_gem_bonus numeric,
  score numeric
)
language plpgsql
stable
as $$
declare
  v_tags text[];
  v_budget_max numeric;
  v_time_window text;
  v_lat double precision;
  v_lng double precision;
begin
  select
    coalesce(p_tags, tp.interest_tags, '{}'),
    coalesce(p_budget_max, tp.budget_max, 100000),
    coalesce(p_time_window, tp.time_window, 'any'),
    coalesce(tp.lat, 23.0225),
    coalesce(tp.lng, 72.5714)
  into v_tags, v_budget_max, v_time_window, v_lat, v_lng
  from (select 1) dummy
  left join traveler_profiles tp on tp.user_id = p_user_id;

  return query
  with scored as (
    select
      e.*,
      p.name as host_name_,
      case
        when array_length(v_tags, 1) is null or array_length(v_tags, 1) = 0 then 0.5
        else (
          select count(*)::numeric from unnest(e.tags) t where t = any(v_tags)
        ) / greatest(array_length(v_tags, 1), 1)
      end as interest_match_,
      case
        when e.price <= v_budget_max then 1
        else greatest(0, 1 - (e.price - v_budget_max) / greatest(v_budget_max, 1))
      end as budget_fit_,
      case
        when v_time_window = 'any' then 1
        when v_time_window = any(e.time_slots) then 1
        when array_length(e.time_slots, 1) is null then 0.5
        else 0.2
      end as time_fit_,
      1 / (1 + haversine_km(v_lat, v_lng, e.lat, e.lng) / 5) as proximity_,
      case
        when e.review_count < 25 and e.rating >= 4.5 then 0.15
        when e.review_count < 50 and e.rating >= 4.3 then 0.08
        else 0
      end as hidden_gem_bonus_
    from experiences e
    join profiles p on p.id = e.host_id
    where e.status = 'live'
  )
  select
    s.id, s.host_id, s.title, s.description, s.tags, s.price, s.capacity,
    s.location_name, s.time_slots, s.duration_label, s.image_url,
    s.review_count, s.rating, s.host_name_,
    round(s.interest_match_, 3), round(s.budget_fit_, 3), round(s.time_fit_, 3),
    round(s.proximity_::numeric, 3), round(s.hidden_gem_bonus_, 3),
    round(
      (0.40 * s.interest_match_ + 0.25 * s.budget_fit_ + 0.15 * s.time_fit_ +
      0.10 * s.proximity_ + 0.10 * s.hidden_gem_bonus_)::numeric,
    3) as score_
  from scored s
  order by score_ desc, s.rating desc
  limit p_limit;
end;
$$;

grant execute on function get_recommendations to anon, authenticated;
grant execute on function haversine_km to anon, authenticated;
