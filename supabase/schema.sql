-- ──────────────────────────────────────────────────────
-- DiaTable — Schéma complet consolidé (état actuel)
--
-- Ce fichier est régénéré à partir de l'historique complet de
-- supabase/migrations/*.sql — il reflète l'état final de la base après
-- application de toutes les migrations, colonnes et politiques comprises.
-- Il peut être collé tel quel dans l'éditeur SQL Supabase pour provisionner
-- une base neuve : toutes les instructions sont idempotentes
-- (if not exists / or replace).
--
-- ⚠️ Ne PAS modifier ce fichier à la main en production : les migrations
-- datées dans supabase/migrations/ restent la source de vérité pour toute
-- base déjà en service. Après avoir ajouté une nouvelle migration,
-- reportez le changement ici aussi pour que ce snapshot reste à jour.
-- Pour le régénérer automatiquement depuis une base liée :
--   supabase db dump --linked --schema public -f supabase/schema.sql
-- ──────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ── 0. HELPER : is_admin() ───────────────────────────
create or replace function is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;


-- ── 1. PROFILES (liée à auth.users) ─────────────────
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  role          text not null default 'client'
                check (role in ('client', 'vendor', 'admin', 'driver')),
  email         text,
  avatar_url    text,
  rib           text,
  bank_name     text,
  account_name  text,
  created_at    timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Admin peut lire tous les profils"
  on profiles for select using (is_admin());

create policy "Admin peut modifier tous les profils"
  on profiles for update using (is_admin());

-- Trigger : crée un profil automatiquement à l'inscription
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role, email)
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
  id                uuid primary key default uuid_generate_v4(),
  owner_id          uuid references profiles(id) on delete set null,
  type              text not null default 'restaurant'
                    check (type in ('restaurant','homecook','popup')),
  name              text not null,
  cuisine           text not null,
  cuisine_label     text not null,
  flag              text not null,
  emoji             text not null,
  gradient          text not null,
  location          text not null,
  address           text,
  description       text,
  hours             text,
  phone             text,
  whatsapp          text,
  instagram         text,
  image_url         text,
  rating            numeric(2,1) default null,
  reviews           int default 0,
  is_verified       boolean default false,
  is_active         boolean default true,
  is_open           boolean not null default true,
  is_home_featured  boolean not null default false,
  latitude          numeric(10,7),
  longitude         numeric(10,7),
  created_at        timestamptz default now()
);

alter table restaurants enable row level security;

create policy "Public peut lire les restaurants actifs"
  on restaurants for select using (is_active = true);

create policy "Vendeur peut lire son propre restaurant"
  on restaurants for select using (auth.uid() = owner_id);

create policy "Vendeur peut créer son restaurant"
  on restaurants for insert with check (auth.uid() = owner_id);

create policy "Vendeur peut modifier son restaurant"
  on restaurants for update using (auth.uid() = owner_id);

create policy "Admin peut lire tous les restaurants"
  on restaurants for select using (is_admin());

create policy "Admin peut modifier tous les restaurants"
  on restaurants for update using (is_admin());

create policy "Admin peut supprimer un restaurant"
  on restaurants for delete using (is_admin());


-- ── 3. MENU ITEMS ────────────────────────────────────
create table if not exists menu_items (
  id              uuid primary key default uuid_generate_v4(),
  restaurant_id   uuid references restaurants(id) on delete cascade,
  category        text not null default 'Plats Principaux',
  name            text not null,
  description     text,
  price           numeric(8,2) not null,
  image_url       text,
  is_popular      boolean default false,
  is_available    boolean default true,
  prep_time_min   integer default 15,
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

create policy "Utilisateur peut modifier son avis"
  on reviews for update using (auth.uid() = user_id);

create policy "Utilisateur peut supprimer son avis"
  on reviews for delete using (auth.uid() = user_id);

-- Trigger : recalcule rating + nombre d'avis automatiquement
create or replace function update_restaurant_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  rid := coalesce(new.restaurant_id, old.restaurant_id);
  update restaurants
  set
    rating  = coalesce((select round(avg(rating)::numeric, 1) from reviews where restaurant_id = rid), rating),
    reviews = (select count(*) from reviews where restaurant_id = rid)
  where id = rid;
  return coalesce(new, old);
end;
$$;

drop trigger if exists on_review_change on reviews;
create trigger on_review_change
  after insert or update or delete on reviews
  for each row execute procedure update_restaurant_rating();


-- ── 5. TESTIMONIALS ──────────────────────────────────
-- Contenu géré par l'admin (section "Vitrine") — pas de seed ici.
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


-- ── 6. DISHES (Galerie) ──────────────────────────────
create table if not exists dishes (
  id          uuid primary key default uuid_generate_v4(),
  country     text not null,
  flag        text not null,
  cuisine     text not null,
  name        text not null,
  tag         text not null,
  description text,
  gradient    text,
  accent      text,
  size        text default 'small' check (size in ('small', 'large')),
  sort_order  int default 0,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

alter table dishes enable row level security;

create policy "Public peut lire les plats actifs"
  on dishes for select using (is_active = true);

create policy "Admin peut gérer la galerie"
  on dishes for all using (is_admin());

insert into dishes (country, flag, cuisine, name, tag, description, gradient, accent, size, sort_order) values
  ('Sénégal',       '🇸🇳', 'senegalaise', 'Thiéboudienne',    'Plat national',       'Riz au poisson cuit dans une sauce tomate riche, avec légumes et épices. Le plat emblématique du Sénégal.',                                                        'linear-gradient(145deg,#e8521a,#f4a828,#c8390e)',   '#e8521a', 'large', 10),
  ('Sénégal',       '🇸🇳', 'senegalaise', 'Yassa Poulet',     'Incontournable',      'Poulet mariné et caramélisé aux oignons et citron, servi sur riz blanc.',                                                                                           'linear-gradient(145deg,#f4a828,#e8ca5a,#c8841a)',   '#f4a828', 'small', 11),
  ('Sénégal',       '🇸🇳', 'senegalaise', 'Mafé',             'Sauce arachide',      'Ragoût de viande en sauce arachide onctueuse, servi avec du riz ou du foufou.',                                                                                     'linear-gradient(145deg,#8B4513,#D2691E,#A0522D)',   '#8B4513', 'small', 12),
  ('Liban',         '🇱🇧', 'libanaise',   'Mezze Libanais',   'Festif',              'Un festin de houmous, falafel, taboulé, fattoush et feuilles de vigne — la générosité libanaise à table.',                                                          'linear-gradient(145deg,#1b5e20,#43a047,#2e7d32)',   '#43a047', 'large', 20),
  ('Liban',         '🇱🇧', 'libanaise',   'Kafta Grillée',    'Grill',               'Brochettes d''agneau haché aux épices, persil et oignons, grillées sur braise.',                                                                                    'linear-gradient(145deg,#bf360c,#e64a19,#ff7043)',   '#e64a19', 'small', 21),
  ('Liban',         '🇱🇧', 'libanaise',   'Baklava',          'Pâtisserie',          'Feuilleté de pâte filo aux noix et pistaches, nappé de sirop de fleur d''oranger.',                                                                                 'linear-gradient(145deg,#f9a825,#fdd835,#f57f17)',   '#f9a825', 'small', 22),
  ('Chine',         '🇨🇳', 'chinoise',    'Dim Sum',          'Traditionnel',        'Délicates bouchées vapeur — har gow, siu mai, char siu bao — la cérémonie du yum cha.',                                                                              'linear-gradient(145deg,#b71c1c,#e53935,#ef5350)',   '#e53935', 'large', 30),
  ('Chine',         '🇨🇳', 'chinoise',    'Canard Laqué',     'Pékin',               'Canard rôti à la peau croustillante et laquée, servi avec crêpes, concombre et sauce hoisin.',                                                                       'linear-gradient(145deg,#880e4f,#c2185b,#e91e63)',   '#c2185b', 'small', 31),
  ('Chine',         '🇨🇳', 'chinoise',    'Ramen Sichuan',    'Épicé',               'Nouilles dans un bouillon épicé au piment de Sichuan, porc effiloché et œuf mollet.',                                                                                'linear-gradient(145deg,#e65100,#ff6d00,#ffab40)',   '#ff6d00', 'small', 32),
  ('Syrie',         '🇸🇾', 'syrienne',    'Shawarma Syrien',  'Street food',         'Viande rôtie à la broche, marinée aux épices, enroulée dans du pain pita avec ail, légumes et tahini.',                                                              'linear-gradient(145deg,#4a148c,#7b1fa2,#9c27b0)',   '#7b1fa2', 'large', 40),
  ('Syrie',         '🇸🇾', 'syrienne',    'Kibbeh',           'Classique',           'Boulettes de boulgour farci à la viande d''agneau et pignons, frites ou en soupe.',                                                                                  'linear-gradient(145deg,#311b92,#512da8,#7e57c2)',   '#512da8', 'small', 41),
  ('Syrie',         '🇸🇾', 'syrienne',    'Fatteh',           'Petit-déjeuner',      'Pain de la veille, pois chiches, yaourt à l''ail et sumac — un plat réconfortant du matin.',                                                                         'linear-gradient(145deg,#f3e5f5,#ce93d8,#ab47bc)',   '#ab47bc', 'small', 42),
  ('France',        '🇫🇷', 'francaise',   'Croissants',       'Viennoiserie',        'Feuilletés pur beurre, croustillants à l''extérieur et moelleux à l''intérieur.',                                                                                    'linear-gradient(145deg,#0d47a1,#1565c0,#42a5f5)',   '#1565c0', 'small', 50),
  ('France',        '🇫🇷', 'francaise',   'Bœuf Bourguignon', 'Cuisine du terroir',  'Mijotage de bœuf dans du vin de Bourgogne avec champignons, lardons et carottes.',                                                                                   'linear-gradient(145deg,#4e342e,#795548,#a1887f)',   '#795548', 'large', 51),
  ('France',        '🇫🇷', 'francaise',   'Crème Brûlée',     'Dessert',             'Crème vanillée sous une fine croûte de sucre caramélisé à la flamme.',                                                                                              'linear-gradient(145deg,#f8bbd0,#f48fb1,#e91e63)',   '#e91e63', 'small', 52),
  ('Italie',        '🇮🇹', 'italienne',   'Pizza Napolitaine','Patrimoine UNESCO',   'Pâte à fermentation lente, tomate San Marzano, mozzarella di bufala, basilic frais.',                                                                                'linear-gradient(145deg,#c62828,#d32f2f,#1b5e20)',   '#d32f2f', 'large', 60),
  ('Italie',        '🇮🇹', 'italienne',   'Risotto Milanese', 'Lombardie',           'Riz Arborio au bouillon de veau et safran, fini au parmesan et au beurre froid.',                                                                                    'linear-gradient(145deg,#f9a825,#fdd835,#f57f17)',   '#f57f17', 'small', 61),
  ('Italie',        '🇮🇹', 'italienne',   'Tiramisu',         'Dessert',             'Mascarpone et biscuits imbibés d''espresso et de marsala, saupoudrés de cacao.',                                                                                     'linear-gradient(145deg,#3e2723,#6d4c41,#a1887f)',   '#6d4c41', 'small', 62),
  ('Nigéria',       '🇳🇬', 'nigeriane',   'Jollof Rice',      'Incontournable',      'Riz cuit dans une sauce tomate et épices, fumé légèrement au feu de bois — fierté nationale.',                                                                        'linear-gradient(145deg,#1b5e20,#388e3c,#f9a825)',   '#388e3c', 'large', 70),
  ('Nigéria',       '🇳🇬', 'nigeriane',   'Egusi Soup',       'Traditionnel',        'Soupe épaisse aux graines de melon, légumes-feuilles, poisson fumé et épices.',                                                                                      'linear-gradient(145deg,#558b2f,#7cb342,#aed581)',   '#7cb342', 'small', 71),
  ('Nigéria',       '🇳🇬', 'nigeriane',   'Suya',             'Barbecue',            'Brochettes de bœuf marinées à la poudre de yaji et arachides, grillées sur charbon.',                                                                                'linear-gradient(145deg,#e65100,#bf360c,#ff7043)',   '#bf360c', 'small', 72),
  ('Inde',          '🇮🇳', 'indienne',    'Butter Chicken',   'Curry',               'Poulet tandoori dans une sauce tomate crémeuse au beurre, cardamome et fenugrec.',                                                                                   'linear-gradient(145deg,#e65100,#fbc02d,#ff6f00)',   '#ff6f00', 'large', 80),
  ('Inde',          '🇮🇳', 'indienne',    'Biryani',          'Festif',              'Riz basmati parfumé au safran, couches de viande marinée, oignons frits et raisins secs.',                                                                            'linear-gradient(145deg,#f57f17,#ff8f00,#ffe082)',   '#ff8f00', 'small', 81),
  ('Inde',          '🇮🇳', 'indienne',    'Samosa',           'Street food',         'Chaussons frits croustillants farcis de pommes de terre épicées, pois et gingembre.',                                                                                'linear-gradient(145deg,#f9a825,#ff6f00,#e65100)',   '#e65100', 'small', 82),
  ('Maroc',         '🇲🇦', 'marocaine',   'Tajine d''Agneau', 'Emblématique',        'Agneau fondant aux pruneaux et amandes, mijoté dans le tajine en terre cuite avec miel et épices.',                                                                   'linear-gradient(145deg,#b71c1c,#c62828,#f4a828)',   '#c62828', 'large', 90),
  ('Maroc',         '🇲🇦', 'marocaine',   'Pastilla',         'Fête',                'Feuilleté de pâte filo fourré de poulet effiloché, œufs brouillés, amandes et cannelle.',                                                                            'linear-gradient(145deg,#4a148c,#6a1b9a,#f4a828)',   '#6a1b9a', 'small', 91),
  ('Maroc',         '🇲🇦', 'marocaine',   'Harira',           'Ramadan',             'Soupe de tomates, lentilles, pois chiches et coriandre fraîche. Incontournable au coucher du soleil.',                                                               'linear-gradient(145deg,#e65100,#bf360c,#d84315)',   '#d84315', 'small', 92),
  ('Côte d''Ivoire','🇨🇮', 'ivoirienne',  'Alloco',           'Street food',         'Bananes plantains mûres frites dans de l''huile de palme, servies avec oignons et piment.',                                                                          'linear-gradient(145deg,#e65100,#ff6f00,#ffd54f)',   '#ff6f00', 'small', 100),
  ('Côte d''Ivoire','🇨🇮', 'ivoirienne',  'Kedjenou',         'Traditionnel',        'Poulet mijoté à l''étouffée dans son jus avec gombos et épices, sans matière grasse ajoutée.',                                                                       'linear-gradient(145deg,#33691e,#558b2f,#8bc34a)',   '#558b2f', 'large', 101),
  ('Turquie',       '🇹🇷', 'turque',      'Kebab Adana',      'Grill',               'Hachis d''agneau épicé modelé sur brochette large, grillé sur charbon et servi avec lavash.',                                                                         'linear-gradient(145deg,#b71c1c,#d32f2f,#ff5252)',   '#d32f2f', 'small', 110),
  ('Turquie',       '🇹🇷', 'turque',      'Börek',            'Pâtisserie',          'Feuilleté de pâte yufka farci au fromage blanc, épinards ou viande, doré au four.',                                                                                  'linear-gradient(145deg,#f57f17,#fbc02d,#fff176)',   '#fbc02d', 'small', 111),
  ('Brésil',        '🇧🇷', 'bresilienne', 'Feijoada',         'Plat national',       'Ragoût de haricots noirs et viandes fumées — saucisses, jarret, oreilles — servi sur riz blanc.',                                                                    'linear-gradient(145deg,#1b5e20,#2e7d32,#0d47a1)',   '#2e7d32', 'large', 120),
  ('Brésil',        '🇧🇷', 'bresilienne', 'Coxinha',          'Street food',         'Croquettes en forme de cuisse de poulet, fourrées de poulet effiloché et fromage à la crème.',                                                                       'linear-gradient(145deg,#f9a825,#ff8f00,#e65100)',   '#ff8f00', 'small', 121)
on conflict do nothing;


-- ── 7. TEAM ──────────────────────────────────────────
create table if not exists team (
  id          uuid primary key default uuid_generate_v4(),
  initials    text not null,
  name        text not null,
  role        text not null,
  origin      text,
  bio         text,
  avatar_bg   text default 'linear-gradient(135deg,#f4a828,#c8841a)',
  sort_order  int default 0,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

alter table team enable row level security;

create policy "Public peut lire l''équipe active"
  on team for select using (is_active = true);

create policy "Admin peut gérer l''équipe"
  on team for all using (is_admin());

insert into team (initials, name, role, origin, bio, avatar_bg, sort_order) values
  ('YB', 'Youssef Benali', 'Co-fondateur & CEO',
   '🇲🇦 Casablanca',
   'Entrepreneur marocain passionné par les cultures du monde et la tech.',
   'linear-gradient(135deg,#f4a828,#c8841a)', 1),
  ('AS', 'Aminata Sow', 'Co-fondatrice & Head of Community',
   '🇸🇳 Dakar → Casablanca',
   'Connecte les communautés africaines au Maroc depuis 2019.',
   'linear-gradient(135deg,#e8521a,#f4a828)', 2),
  ('WZ', 'Wei Zhang', 'CTO',
   '🇨🇳 Shanghai → Marrakech',
   'Développeur full-stack, ancien de Alibaba Cloud, amoureux du tajine.',
   'linear-gradient(135deg,#b71c1c,#e53935)', 3)
on conflict do nothing;


-- ── 8. RESTAURANT LIKES ──────────────────────────────
create table if not exists restaurant_likes (
  id            uuid primary key default uuid_generate_v4(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  user_id       uuid references profiles(id) on delete cascade,
  created_at    timestamptz default now(),
  unique(restaurant_id, user_id)
);

alter table restaurant_likes enable row level security;

create policy "Public peut lire les likes"
  on restaurant_likes for select using (true);

create policy "Utilisateur connecté peut liker"
  on restaurant_likes for insert with check (auth.uid() = user_id);

create policy "Utilisateur peut supprimer son like"
  on restaurant_likes for delete using (auth.uid() = user_id);


-- ── 9. RESTAURANT VIEWS ──────────────────────────────
create table if not exists restaurant_views (
  id            uuid primary key default uuid_generate_v4(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  created_at    timestamptz default now()
);

create index if not exists idx_restaurant_views_restaurant
  on restaurant_views (restaurant_id, created_at desc);

alter table restaurant_views enable row level security;

create policy "Public peut enregistrer une vue"
  on restaurant_views for insert with check (true);

create policy "Vendeur peut lire les vues de son restaurant"
  on restaurant_views for select
  using (exists (
    select 1 from restaurants r
    where r.id = restaurant_id and r.owner_id = auth.uid()
  ));

create policy "Admin peut lire toutes les vues"
  on restaurant_views for select using (is_admin());


-- ── 10. DELIVERY ZONES (par restaurant) ──────────────
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


-- ── 11. DELIVERY DRIVERS (livreurs) ──────────────────
create table if not exists delivery_drivers (
  id                    uuid primary key default uuid_generate_v4(),
  profile_id            uuid references profiles(id) on delete set null,
  type                  text not null check (type in ('external', 'restaurant')),
  restaurant_id         uuid references restaurants(id) on delete set null, -- null pour external
  full_name             text not null,
  phone                 text,
  email                 text,
  vehicle_type          text check (vehicle_type in ('moto', 'voiture', 'velo', 'pieton')),
  is_active             boolean not null default true,
  is_available          boolean not null default true,
  current_lat           numeric(10,7),
  current_lng           numeric(10,7),
  location_updated_at   timestamptz,
  created_at            timestamptz default now()
);

create index if not exists idx_drivers_restaurant       on delivery_drivers (restaurant_id) where restaurant_id is not null;
create index if not exists idx_drivers_available        on delivery_drivers (is_available, is_active) where is_available = true and is_active = true;
create index if not exists idx_delivery_drivers_email    on delivery_drivers (email) where email is not null;
create index if not exists idx_delivery_drivers_phone    on delivery_drivers (phone) where phone is not null;

alter table delivery_drivers enable row level security;

create policy "drivers_read" on delivery_drivers
  for select using (true);

-- INSERT: onboarding non authentifié (profile_id null) ou auto-inscription authentifiée
create policy "drivers_insert" on delivery_drivers
  for insert with check (
    profile_id is null
    or auth.uid() = profile_id
  );

-- UPDATE: le livreur gère son propre profil, peut le "réclamer" par email au
-- premier lien magique, ou le vendeur gère les livreurs de son restaurant
create policy "drivers_update" on delivery_drivers
  for update using (
    auth.uid() = profile_id
    or (
      profile_id is null
      and email = (select email from auth.users where id = auth.uid())
    )
    or (
      restaurant_id is not null
      and exists (
        select 1 from restaurants
        where restaurants.id = restaurant_id
          and restaurants.owner_id = auth.uid()
      )
    )
  );


-- ── 12. ORDERS ───────────────────────────────────────
create table if not exists orders (
  id                      uuid primary key default uuid_generate_v4(),
  customer_id             uuid references profiles(id) on delete set null,
  restaurant_id           uuid references restaurants(id) on delete set null,
  status                  text not null default 'pending'
                          check (status in ('pending','confirmed','preparing','ready','delivered','cancelled')),
  payment_method          text not null default 'cash_on_delivery'
                          check (payment_method in ('cash_on_delivery','card','mobile_payment')),
  payment_status          text not null default 'pending'
                          check (payment_status in ('pending','paid','refunded')),
  subtotal                numeric(10,2) not null default 0,
  delivery_fee            numeric(10,2) not null default 0,
  total                   numeric(10,2) not null default 0,
  delivery_address        text,
  delivery_phone          text,
  delivery_notes          text,
  customer_name           text,
  estimated_time          text, -- legacy free-text ETA (superseded by estimated_prep_min/estimated_delivery_at below)
  delivery_mode           text not null default 'delivery'
                          check (delivery_mode in ('delivery','pickup')),
  delivery_zone           text,
  delivery_lat            numeric(10,7),
  delivery_lng            numeric(10,7),
  estimated_delivery_at   timestamptz,
  estimated_prep_min      integer,
  driver_id               uuid references delivery_drivers(id) on delete set null,
  driver_name             text,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

create index if not exists idx_orders_customer_id on orders (customer_id, created_at desc);
create index if not exists idx_orders_driver       on orders (driver_id) where driver_id is not null;
create index if not exists idx_orders_status       on orders (status, restaurant_id);

alter table orders enable row level security;

create policy "Client peut lire ses commandes"
  on orders for select using (auth.uid() = customer_id);

create policy "Client peut créer une commande"
  on orders for insert with check (auth.uid() = customer_id);

create policy "Vendeur peut lire les commandes de son restaurant"
  on orders for select
  using (exists (
    select 1 from restaurants r
    where r.id = restaurant_id and r.owner_id = auth.uid()
  ));

create policy "Vendeur peut modifier les commandes de son restaurant"
  on orders for update
  using (exists (
    select 1 from restaurants r
    where r.id = restaurant_id and r.owner_id = auth.uid()
  ));

create policy "Admin peut lire toutes les commandes"
  on orders for select using (is_admin());

create policy "Admin peut modifier toutes les commandes"
  on orders for update using (is_admin());

-- Trigger : mise à jour updated_at
create or replace function update_order_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_order_update on orders;
create trigger on_order_update
  before update on orders
  for each row execute procedure update_order_timestamp();


-- ── 13. ORDER ITEMS ──────────────────────────────────
create table if not exists order_items (
  id              uuid primary key default uuid_generate_v4(),
  order_id        uuid references orders(id) on delete cascade,
  menu_item_id    uuid references menu_items(id) on delete set null,
  name            text not null,
  price           numeric(10,2) not null,
  quantity        int not null default 1,
  notes           text,
  created_at      timestamptz default now()
);

alter table order_items enable row level security;

create policy "Client peut lire ses order_items"
  on order_items for select
  using (exists (
    select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()
  ));

create policy "Client peut créer des order_items"
  on order_items for insert
  with check (exists (
    select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()
  ));

create policy "Vendeur peut lire les order_items de ses commandes"
  on order_items for select
  using (exists (
    select 1 from orders o
    join restaurants r on r.id = o.restaurant_id
    where o.id = order_id and r.owner_id = auth.uid()
  ));

create policy "Admin peut lire tous les order_items"
  on order_items for select using (is_admin());


-- ── 14. CONVERSATIONS ────────────────────────────────
create table if not exists conversations (
  id              uuid primary key default uuid_generate_v4(),
  customer_id     uuid references profiles(id) on delete cascade,
  vendor_id       uuid references profiles(id) on delete cascade,
  restaurant_id   uuid references restaurants(id) on delete cascade,
  order_id        uuid references orders(id) on delete set null,
  last_message    text,
  last_message_at timestamptz default now(),
  created_at      timestamptz default now(),
  unique(customer_id, restaurant_id)
);

alter table conversations enable row level security;

create policy "Participants peuvent lire leurs conversations"
  on conversations for select
  using (auth.uid() = customer_id or auth.uid() = vendor_id);

create policy "Client peut créer une conversation"
  on conversations for insert
  with check (auth.uid() = customer_id);

create policy "Participants peuvent modifier la conversation"
  on conversations for update
  using (auth.uid() = customer_id or auth.uid() = vendor_id);


-- ── 15. MESSAGES ─────────────────────────────────────
create table if not exists messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id       uuid references profiles(id) on delete set null,
  content         text not null,
  is_read         boolean default false,
  created_at      timestamptz default now()
);

alter table messages enable row level security;

create policy "Participants peuvent lire les messages"
  on messages for select
  using (exists (
    select 1 from conversations c
    where c.id = conversation_id
    and (c.customer_id = auth.uid() or c.vendor_id = auth.uid())
  ));

create policy "Participants peuvent envoyer des messages"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
      and (c.customer_id = auth.uid() or c.vendor_id = auth.uid())
    )
  );

create policy "Participants peuvent modifier les messages"
  on messages for update
  using (exists (
    select 1 from conversations c
    where c.id = conversation_id
    and (c.customer_id = auth.uid() or c.vendor_id = auth.uid())
  ));


-- ── 16. NOTIFICATIONS ────────────────────────────────
create table if not exists notifications (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references profiles(id) on delete cascade,
  type            text not null default 'info'
                  check (type in ('order','message','review','system','info')),
  title           text not null,
  body            text,
  link            text,
  is_read         boolean default false,
  created_at      timestamptz default now()
);

alter table notifications enable row level security;

create policy "Utilisateur peut lire ses notifications"
  on notifications for select using (auth.uid() = user_id);

create policy "Utilisateur peut modifier ses notifications"
  on notifications for update using (auth.uid() = user_id);

create policy "Système peut créer des notifications"
  on notifications for insert with check (true);


-- ── 17. Triggers de notification (commandes / messages) ──
create or replace function notify_new_order()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  vendor uuid;
  rest_name text;
begin
  select r.owner_id, r.name into vendor, rest_name
  from restaurants r where r.id = new.restaurant_id;

  if vendor is not null then
    insert into notifications (user_id, type, title, body, link)
    values (
      vendor,
      'order',
      'Nouvelle commande reçue',
      'Commande #' || left(new.id::text, 8) || ' pour ' || rest_name,
      '/tableau-de-bord?section=commandes'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_new_order on orders;
create trigger on_new_order
  after insert on orders
  for each row execute procedure notify_new_order();


create or replace function notify_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  conv record;
  recipient uuid;
  sender_name text;
begin
  select * into conv from conversations where id = new.conversation_id;

  if new.sender_id = conv.customer_id then
    recipient := conv.vendor_id;
  else
    recipient := conv.customer_id;
  end if;

  select full_name into sender_name from profiles where id = new.sender_id;

  insert into notifications (user_id, type, title, body, link)
  values (
    recipient,
    'message',
    'Nouveau message de ' || coalesce(sender_name, 'un utilisateur'),
    left(new.content, 100),
    '/messages'
  );

  update conversations
  set last_message = left(new.content, 100),
      last_message_at = now()
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists on_new_message on messages;
create trigger on_new_message
  after insert on messages
  for each row execute procedure notify_new_message();


create or replace function notify_order_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  status_labels jsonb := '{"confirmed":"confirmée","preparing":"en préparation","ready":"prête","delivered":"livrée","cancelled":"annulée"}'::jsonb;
  label text;
begin
  if old.status is distinct from new.status then
    label := coalesce(status_labels->>new.status, new.status);

    insert into notifications (user_id, type, title, body, link)
    values (
      new.customer_id,
      'order',
      'Commande ' || label,
      'Votre commande #' || left(new.id::text, 8) || ' est maintenant ' || label || '.',
      '/mes-commandes'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_order_status_change on orders;
create trigger on_order_status_change
  after update on orders
  for each row execute procedure notify_order_status();


-- ── 18. SUBSCRIPTIONS (plans vendeur) ────────────────
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

create index if not exists idx_subscriptions_vendor_id on subscriptions (vendor_id);
create index if not exists idx_subscriptions_vendor_active
  on subscriptions (vendor_id, plan) where status = 'active';

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

create policy "Admin peut insérer des abonnements"
  on subscriptions for insert with check (is_admin());

-- Trigger : crée automatiquement un abonnement "free" pour tout nouveau vendeur
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


-- ── 19. SUBSCRIPTION PAYMENTS (virements manuels) ────
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
  reviewed_at     timestamptz,
  created_at      timestamptz default now()
);

alter table subscription_payments enable row level security;

create policy "Vendor can manage own payments"
  on subscription_payments for all using (auth.uid() = vendor_id);

create policy "Admin can manage all payments"
  on subscription_payments for all using (is_admin());


-- ── 20. DELIVERY OFFERS (propositions aux livreurs externes) ──
create table if not exists delivery_offers (
  id            uuid primary key default uuid_generate_v4(),
  order_id      uuid not null references orders(id) on delete cascade,
  driver_id     uuid not null references delivery_drivers(id) on delete cascade,
  status        text not null default 'pending'
                check (status in ('pending', 'accepted', 'declined', 'expired')),
  distance_km   numeric(6,2),
  created_at    timestamptz default now(),
  expires_at    timestamptz default now() + interval '5 minutes',
  responded_at  timestamptz,
  unique (order_id, driver_id)
);

create index if not exists idx_offers_driver_pending on delivery_offers (driver_id, status) where status = 'pending';
create index if not exists idx_offers_order          on delivery_offers (order_id, status);

alter table delivery_offers enable row level security;

create policy "offers_select" on delivery_offers
  for select using (
    exists (
      select 1 from delivery_drivers d
      where d.id = driver_id and d.profile_id = auth.uid()
    )
    or exists (
      select 1 from orders o
      join restaurants r on r.id = o.restaurant_id
      where o.id = order_id and r.owner_id = auth.uid()
    )
  );

create policy "offers_insert" on delivery_offers
  for insert with check (
    exists (
      select 1 from orders o
      join restaurants r on r.id = o.restaurant_id
      where o.id = order_id and r.owner_id = auth.uid()
    )
  );

create policy "offers_update" on delivery_offers
  for update using (
    exists (
      select 1 from delivery_drivers d
      where d.id = driver_id and d.profile_id = auth.uid()
    )
    or exists (
      select 1 from orders o
      join restaurants r on r.id = o.restaurant_id
      where o.id = order_id and r.owner_id = auth.uid()
    )
  );

-- Notifie le client quand un livreur prend sa commande
create or replace function notify_driver_assigned()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  driver_name_val text;
  eta_txt         text := '';
begin
  if new.driver_id is not null and (old.driver_id is null or old.driver_id is distinct from new.driver_id) then

    select full_name into driver_name_val
    from delivery_drivers where id = new.driver_id;

    if new.estimated_delivery_at is not null then
      eta_txt := ' — livraison estimée à ' ||
                to_char(new.estimated_delivery_at at time zone 'Africa/Casablanca', 'HH24:MI');
    end if;

    if new.customer_id is not null then
      insert into notifications (user_id, type, title, body, link)
      values (
        new.customer_id,
        'order',
        'Un livreur a pris votre commande',
        coalesce(driver_name_val, 'Votre livreur') || ' est en route' || eta_txt || '.',
        '/mes-commandes'
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_driver_assigned on orders;
create trigger on_driver_assigned
  after update of driver_id on orders
  for each row execute procedure notify_driver_assigned();

-- Notifie le livreur quand il reçoit une nouvelle proposition de course
create or replace function notify_offer_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  driver_profile uuid;
  rest_name      text;
begin
  select profile_id into driver_profile from delivery_drivers where id = new.driver_id;

  select r.name into rest_name
  from orders o join restaurants r on r.id = o.restaurant_id
  where o.id = new.order_id;

  if driver_profile is not null then
    insert into notifications (user_id, type, title, body, link)
    values (
      driver_profile,
      'order',
      'Nouvelle course proposée',
      'Une livraison' || coalesce(' pour ' || rest_name, '') ||
        coalesce(' à ' || new.distance_km || ' km', '') || ' vous attend.',
      '/livreur'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_offer_created on delivery_offers;
create trigger on_offer_created
  after insert on delivery_offers
  for each row execute procedure notify_offer_created();

-- Expiration automatique des offres périmées (pg_cron, toutes les minutes)
create or replace function expire_stale_offers()
returns void language plpgsql security definer set search_path = public as $$
begin
  update delivery_offers
  set status = 'expired'
  where status = 'pending'
    and expires_at < now();
end;
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('expire-stale-offers')
      where exists (select 1 from cron.job where jobname = 'expire-stale-offers');
    perform cron.schedule('expire-stale-offers', '* * * * *', 'select expire_stale_offers();');
  end if;
end;
$$;


-- ── 21. vendeurs_stats (vue matérialisée) ────────────
-- Pré-calcule review_count et avg_rating par restaurant pour éviter tout
-- GROUP BY / calcul JS côté client.
create materialized view if not exists vendeurs_stats as
select
  r.id                              as restaurant_id,
  count(rv.id)::int                 as review_count,
  round(avg(rv.rating)::numeric, 1) as avg_rating
from   restaurants r
left   join reviews rv on rv.restaurant_id = r.id
group  by r.id;

create unique index if not exists idx_vendeurs_stats_restaurant_id
  on vendeurs_stats (restaurant_id);

grant select on vendeurs_stats to anon, authenticated;

create or replace function refresh_vendeurs_stats()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  refresh materialized view concurrently public.vendeurs_stats;
  return null;
end;
$$;

drop trigger if exists trg_vendeurs_stats_on_review on reviews;
create trigger trg_vendeurs_stats_on_review
  after insert or update or delete on reviews
  for each statement
  execute function refresh_vendeurs_stats();

refresh materialized view vendeurs_stats;


-- ── 22. Realtime ──────────────────────────────────────
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table orders;


-- ── 23. Index de performance ──────────────────────────
create index if not exists idx_restaurants_location          on restaurants (location);
create index if not exists idx_restaurants_cuisine            on restaurants (cuisine);
create index if not exists idx_restaurants_location_cuisine   on restaurants (location, cuisine);
create index if not exists idx_restaurants_is_active          on restaurants (is_active) where is_active = true;
create index if not exists idx_restaurants_owner_id           on restaurants (owner_id);
create index if not exists idx_restaurants_home_featured       on restaurants (is_home_featured) where is_home_featured = true;

create index if not exists idx_reviews_restaurant_id          on reviews (restaurant_id);
create index if not exists idx_reviews_user_id                on reviews (user_id);
create index if not exists idx_reviews_restaurant_created     on reviews (restaurant_id, created_at desc);

create index if not exists idx_menu_items_restaurant_id       on menu_items (restaurant_id);
create index if not exists idx_menu_items_restaurant_available on menu_items (restaurant_id, is_available) where is_available = true;

create index if not exists idx_restaurant_likes_restaurant_id on restaurant_likes (restaurant_id);
create index if not exists idx_restaurant_likes_user_restaurant on restaurant_likes (user_id, restaurant_id);

create index if not exists idx_delivery_zones_restaurant_id   on delivery_zones (restaurant_id);


-- ── 24. Rôle 'driver' — backfill ──────────────────────
-- Aligne le rôle des profils déjà rattachés à un delivery_drivers existant.
update profiles
set role = 'driver'
where id in (select profile_id from delivery_drivers where profile_id is not null)
  and role = 'client';
