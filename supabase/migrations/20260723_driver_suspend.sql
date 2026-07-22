-- Lets a vendor suspend one of their own restaurant-attached drivers without
-- touching is_active (the admin validation gate) — a suspended driver stops
-- receiving delivery offers but keeps its validated status, so the vendor
-- can un-suspend it later without going through admin review again.

alter table delivery_drivers
  add column if not exists is_suspended boolean not null default false;
