-- ──────────────────────────────────────────────────────
-- DiaTable — Subscriptions, Delivery Mode & Vendor Banking
-- Copiez-collez ce fichier dans l'éditeur SQL Supabase
-- ──────────────────────────────────────────────────────

-- ── 1. Extend profiles with banking info ────────────────
alter table profiles
  add column if not exists rib          text,
  add column if not exists bank_name    text,
  add column if not exists account_name text;


-- ── 2. SUBSCRIPTIONS ────────────────────────────────────
create table if not exists subscriptions (
  id              uuid primary key default uuid_generate_v4(),
  vendor_id       uuid references profiles(id) on delete cascade unique,
  plan            text not null default 'free'
                  check (plan in ('free','pro','premium')),
  status          text not null default 'active'
                  check (status in ('active','expired','cancelled')),
  started_at      timestamptz default now(),
  expires_at      timestamptz,
  created_at      timestamptz default now()
);

alter table subscriptions enable row level security;

create policy "Vendeur peut lire son abonnement"
  on subscriptions for select using (auth.uid() = vendor_id);

create policy "Vendeur peut modifier son abonnement"
  on subscriptions for update using (auth.uid() = vendor_id);

create policy "Vendeur peut créer son abonnement"
  on subscriptions for insert with check (auth.uid() = vendor_id);

create policy "Admin peut lire tous les abonnements"
  on subscriptions for select using (is_admin());

create policy "Admin peut modifier tous les abonnements"
  on subscriptions for update using (is_admin());


-- ── 3. Extend orders with delivery_mode + estimated_time ──
alter table orders
  add column if not exists delivery_mode text not null default 'delivery'
    check (delivery_mode in ('delivery','pickup'));


-- ── 4. Auto-create free subscription for new vendors ────
create or replace function handle_vendor_subscription()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'vendor' and (old.role is null or old.role <> 'vendor') then
    insert into subscriptions (vendor_id, plan, status)
    values (new.id, 'free', 'active')
    on conflict (vendor_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_vendor_role_change on profiles;
create trigger on_vendor_role_change
  after insert or update on profiles
  for each row execute procedure handle_vendor_subscription();
