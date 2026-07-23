-- Fix: the average-prep-time vendor field (added in a previous migration
-- pass) assumed restaurants.prep_time_min already existed — it never did,
-- only menu_items.prep_time_min does. This was causing Checkout's restaurant
-- lookup query to fail with a 400 (column does not exist).

alter table restaurants
  add column if not exists prep_time_min integer default 15;
