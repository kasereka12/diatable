-- Restaurant listing page currently fetches ALL active restaurants + ALL
-- active subscriptions + ALL vendeurs_stats rows on every page load, then
-- merges/sorts/filters everything in JS. Fine at a handful of restaurants,
-- but the payload grows unbounded with the catalog size regardless of how
-- many are actually shown on screen.
--
-- This view pre-joins restaurant + current plan + review stats and exposes
-- a numeric plan_rank so a single paginated query
-- (.order() + .range()) can do the sorting/filtering/pagination in
-- Postgres instead of the browser.
--
-- Plain views run with the definer's privileges (not the caller's RLS), so
-- the is_active filter below is required in the view itself — it can't
-- rely on restaurants' own RLS policy to hide inactive rows here.
--
-- restaurants has its own legacy rating/reviews columns (always 0/null,
-- superseded by vendeurs_stats) — r.* would collide with the computed
-- rating/reviews below, so restaurant columns are listed explicitly instead.
create or replace view restaurant_listings as
select
  r.id, r.owner_id, r.type, r.name, r.cuisine, r.cuisine_label, r.flag, r.emoji, r.gradient,
  r.location, r.address, r.description, r.hours, r.phone, r.whatsapp, r.instagram, r.image_url,
  r.is_verified, r.is_active, r.is_open, r.is_home_featured,
  r.latitude, r.longitude, r.prep_time_min, r.created_at,
  coalesce(s.plan, 'free')::text as plan,
  coalesce(vs.review_count, 0)   as reviews,
  vs.avg_rating                  as rating,
  case coalesce(s.plan, 'free')
    when 'premium' then 2
    when 'pro'     then 1
    else 0
  end as plan_rank
from restaurants r
left join subscriptions s
  on s.vendor_id = r.owner_id and s.status = 'active'
left join vendeurs_stats vs
  on vs.restaurant_id = r.id
where r.is_active = true;

grant select on restaurant_listings to anon, authenticated;
