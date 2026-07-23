-- Global, admin-configurable dynamic delivery pricing (base fee + price per km,
-- applied to the real distance between restaurant and customer). This replaces
-- the vendor-defined flat "delivery_zones" prices as the source of the
-- delivery fee at checkout — the zones table/UI is left in place but is no
-- longer read for pricing.

create table if not exists platform_settings (
  id                     smallint primary key default 1,
  delivery_base_fee      numeric(10,2) not null default 8,
  delivery_price_per_km  numeric(10,2) not null default 2.5,
  updated_at             timestamptz default now(),
  constraint platform_settings_singleton check (id = 1)
);

insert into platform_settings (id) values (1)
  on conflict (id) do nothing;

alter table platform_settings enable row level security;

drop policy if exists "Tout le monde peut lire les réglages" on platform_settings;
create policy "Tout le monde peut lire les réglages"
  on platform_settings for select using (true);

drop policy if exists "Admin peut modifier les réglages" on platform_settings;
create policy "Admin peut modifier les réglages"
  on platform_settings for update using (is_admin());

drop trigger if exists on_platform_settings_update on platform_settings;
create trigger on_platform_settings_update
  before update on platform_settings
  for each row execute procedure update_order_timestamp();
