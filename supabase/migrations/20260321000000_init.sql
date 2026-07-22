-- ──────────────────────────────────────────────────────
-- DiaTable — Supabase schema complet
-- Copiez-collez ce fichier dans l'éditeur SQL Supabase
-- ──────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ── 1. PROFILES (liée à auth.users) ─────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text not null default 'client' check (role in ('client', 'vendor', 'admin')),
  email       text,
  avatar_url  text,
  created_at  timestamptz default now()
);

alter table profiles enable row level security;

-- Chaque utilisateur peut lire et modifier son propre profil
create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Trigger : crée un profil automatiquement à l'inscription
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- ── 2. RESTAURANTS ──────────────────────────────────
create table if not exists restaurants (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid references profiles(id) on delete set null,
  name            text not null,
  cuisine         text not null,
  cuisine_label   text not null,
  flag            text not null,
  emoji           text not null,
  gradient        text not null,
  location        text not null,
  address         text,
  description     text,
  hours           text,
  phone           text,
  whatsapp        text,
  instagram       text,
  rating          numeric(2,1) default 4.5,
  reviews         int default 0,
  is_verified     boolean default false,
  is_active       boolean default true,
  created_at      timestamptz default now()
);

alter table restaurants enable row level security;

create policy "Public peut lire les restaurants actifs"
  on restaurants for select using (is_active = true);

create policy "Vendeur peut créer son restaurant"
  on restaurants for insert with check (auth.uid() = owner_id);

create policy "Vendeur peut modifier son restaurant"
  on restaurants for update using (auth.uid() = owner_id);


-- ── 3. MENU ITEMS ────────────────────────────────────
create table if not exists menu_items (
  id              uuid primary key default uuid_generate_v4(),
  restaurant_id   uuid references restaurants(id) on delete cascade,
  category        text not null default 'Plats Principaux',
  name            text not null,
  description     text,
  price           numeric(8,2) not null,
  is_popular      boolean default false,
  is_available    boolean default true,
  created_at      timestamptz default now()
);

alter table menu_items enable row level security;

create policy "Public peut lire les items de menu"
  on menu_items for select using (is_available = true);

create policy "Vendeur peut gérer ses items"
  on menu_items for all
  using (exists (
    select 1 from restaurants r
    where r.id = restaurant_id and r.owner_id = auth.uid()
  ));


-- ── 4. REVIEWS ───────────────────────────────────────
create table if not exists reviews (
  id              uuid primary key default uuid_generate_v4(),
  restaurant_id   uuid references restaurants(id) on delete cascade,
  user_id         uuid references profiles(id) on delete set null,
  rating          int not null check (rating between 1 and 5),
  text            text,
  created_at      timestamptz default now()
);

alter table reviews enable row level security;

create policy "Public peut lire les avis"
  on reviews for select using (true);

create policy "Utilisateur connecté peut écrire un avis"
  on reviews for insert with check (auth.uid() = user_id);


-- ── 5. TESTIMONIALS ──────────────────────────────────
create table if not exists testimonials (
  id          uuid primary key default uuid_generate_v4(),
  initials    text not null,
  name        text not null,
  origin      text not null,
  text        text not null,
  rating      int default 5,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

alter table testimonials enable row level security;

create policy "Public peut lire les témoignages actifs"
  on testimonials for select using (is_active = true);


-- ── 6. SEED DATA ─────────────────────────────────────
-- Demo seed data removed — see 20260720_remove_demo_seed_data.sql for cleanup
-- of any environment where it was already applied. Do not reintroduce demo
-- restaurants/testimonials into this migration; use a separate dev-only seed
-- script instead so production never ships fictitious content.
