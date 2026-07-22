-- ──────────────────────────────────────────────────────
-- DiaTable — Delivery Zones, Prep Time & Subscription Payments
-- Copiez-collez ce fichier dans l'éditeur SQL Supabase
-- ──────────────────────────────────────────────────────

-- ── 1. Delivery zones per restaurant ────────────────────
create table if not exists delivery_zones (
  id              uuid primary key default uuid_generate_v4(),
  restaurant_id   uuid references restaurants(id) on delete cascade,
  quartier        text not null,
  price           numeric(10,2) not null default 0,
  created_at      timestamptz default now()
);

alter table delivery_zones enable row level security;

create policy "Vendor can manage own zones"
  on delivery_zones for all using (
    exists (select 1 from restaurants where id = delivery_zones.restaurant_id and owner_id = auth.uid())
  );

create policy "Anyone can read zones"
  on delivery_zones for select using (true);


-- ── 2. Prep time per menu item ──────────────────────────
alter table menu_items
  add column if not exists prep_time_min integer default 15;


-- ── 3. Add restaurant lat/lng for GPS distance calc ─────
alter table restaurants
  add column if not exists latitude  numeric(10,7),
  add column if not exists longitude numeric(10,7);


-- ── 4. Store delivery zone on orders ────────────────────
alter table orders
  add column if not exists delivery_zone  text,
  add column if not exists estimated_time integer;


-- ── 5. Subscription payment receipts ────────────────────
create table if not exists subscription_payments (
  id              uuid primary key default uuid_generate_v4(),
  vendor_id       uuid references profiles(id) on delete cascade,
  plan            text not null check (plan in ('pro','premium')),
  bank            text not null,
  reference       text not null,
  sender_name     text not null,
  receipt_url     text,
  status          text not null default 'pending'
                  check (status in ('pending','approved','rejected')),
  created_at      timestamptz default now()
);

alter table subscription_payments enable row level security;

create policy "Vendor can manage own payments"
  on subscription_payments for all using (auth.uid() = vendor_id);

create policy "Admin can manage all payments"
  on subscription_payments for all using (is_admin());
