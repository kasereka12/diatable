-- ──────────────────────────────────────────────────────
-- DiaTable — Supabase schema complet
-- Copiez-collez ce fichier dans l'éditeur SQL Supabase
-- ──────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ── 0. HELPER : is_admin() ───────────────────────────
create or replace function is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;


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
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid references profiles(id) on delete set null,
  type            text not null default 'restaurant' check (type in ('restaurant','homecook','popup')),
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
  image_url       text,
  rating          numeric(2,1) default null,
  reviews         int default 0,
  is_verified     boolean default false,
  is_active       boolean default true,
  created_at      timestamptz default now()
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


-- ── 8. SEED DATA ─────────────────────────────────────
-- Réinitialiser is_verified pour exiger une validation admin explicite
update restaurants set is_verified = false where is_verified = true;

insert into restaurants (name, cuisine, cuisine_label, flag, emoji, gradient, location, is_verified)
values
  ('Chez Fatou — Saveurs du Sénégal', 'senegalaise', 'Sénégalaise', '🇸🇳', '🍚', 'grad-senegal',   'Casablanca', false),
  ('Dragon Palace — Chef Wei',         'chinoise',    'Chinoise',    '🇨🇳', '🥟', 'grad-chinese',   'Marrakech',  false),
  ('Beit Beirut — Mezze & Grills',     'libanaise',   'Libanaise',   '🇱🇧', '🧆', 'grad-lebanese',  'Rabat',      false),
  ('Damas Kitchen — Shawarma & Plus',  'syrienne',    'Syrienne',    '🇸🇾', '🌯', 'grad-syrian',    'Casablanca', false),
  ('Maison Dupont — Boulangerie',      'francaise',   'Française',   '🇫🇷', '🥐', 'grad-french',    'Tanger',     false),
  ('Mama Chidi''s — Jollof & Soul',    'nigeriane',   'Nigériane',   '🇳🇬', '🍲', 'grad-nigerian',  'Casablanca', false),
  ('Spice Route — Chef Priya',         'indienne',    'Indienne',    '🇮🇳', '🍛', 'grad-indian',    'Marrakech',  false),
  ('Trattoria Romano — Pasta & Vino',  'italienne',   'Italienne',   '🇮🇹', '🍝', 'grad-italian',   'Rabat',      false),
  ('Rio Sabor — Feijoada & Caipi',     'bresilienne', 'Brésilienne', '🇧🇷', '🫘', 'grad-brazilian', 'Casablanca', false)
on conflict do nothing;

-- Reset toutes les notes et compteurs (seront recalculés par le trigger au fur et à mesure)
update restaurants set rating = null, reviews = 0;

-- ── Reset is_verified for seed data ─────────────────────────────────────────
update restaurants set is_verified = false;


-- ── restaurant_likes ─────────────────────────────────────────────────────────
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


-- ── restaurant_views ─────────────────────────────────────────────────────────
create table if not exists restaurant_views (
  id            uuid primary key default uuid_generate_v4(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  created_at    timestamptz default now()
);

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


-- ── Trigger : recalcule rating + nombre d'avis automatiquement ───────────────
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


-- ── Permettre aux utilisateurs de modifier/supprimer leur propre avis ────────
create policy "Utilisateur peut modifier son avis"
  on reviews for update using (auth.uid() = user_id);

create policy "Utilisateur peut supprimer son avis"
  on reviews for delete using (auth.uid() = user_id);


insert into testimonials (initials, name, origin, text, rating)
values
  ('AS', 'Aminata S.', 'Dakar 🇸🇳 · Vit à Casablanca',
   'J''ai enfin trouvé du vrai Thiéboudienne à Casablanca ! DiaTable m''a sauvé l''âme. C''était exactement comme chez ma grand-mère.',
   5),
  ('KM', 'Karim M.', 'Beyrouth 🇱🇧 · Vit à Rabat',
   'En tant qu''expatrié libanais, j''avais envie de vrais mezze depuis des mois. DiaTable m''a mis en contact avec une cuisinière extraordinaire à Rabat.',
   5),
  ('ZW', 'Zhang Wei', 'Chef & Vendeur 🇨🇳 · Marrakech',
   'Mon restaurant est passé de l''invisibilité au complet en 3 semaines après avoir rejoint DiaTable. Merci !',
   5)
on conflict do nothing;
