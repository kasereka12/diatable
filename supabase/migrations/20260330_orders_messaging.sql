-- ──────────────────────────────────────────────────────
-- DiaTable — Orders, Messaging & Notifications
-- Copiez-collez ce fichier dans l'éditeur SQL Supabase
-- ──────────────────────────────────────────────────────

-- ── 1. ORDERS ───────────────────────────────────────────
create table if not exists orders (
  id              uuid primary key default uuid_generate_v4(),
  customer_id     uuid references profiles(id) on delete set null,
  restaurant_id   uuid references restaurants(id) on delete set null,
  status          text not null default 'pending'
                  check (status in ('pending','confirmed','preparing','ready','delivered','cancelled')),
  payment_method  text not null default 'cash_on_delivery'
                  check (payment_method in ('cash_on_delivery','card','mobile_payment')),
  payment_status  text not null default 'pending'
                  check (payment_status in ('pending','paid','refunded')),
  subtotal        numeric(10,2) not null default 0,
  delivery_fee    numeric(10,2) not null default 0,
  total           numeric(10,2) not null default 0,
  delivery_address text,
  delivery_phone  text,
  delivery_notes  text,
  customer_name   text,
  estimated_time  text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

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


-- ── 2. ORDER ITEMS ──────────────────────────────────────
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


-- ── 3. CONVERSATIONS ────────────────────────────────────
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


-- ── 4. MESSAGES ─────────────────────────────────────────
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


-- ── 5. NOTIFICATIONS ────────────────────────────────────
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


-- ── 6. TRIGGER : mise à jour updated_at sur orders ──────
create or replace function update_order_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_order_update
  before update on orders
  for each row execute procedure update_order_timestamp();


-- ── 7. TRIGGER : notification sur nouvelle commande ─────
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

create trigger on_new_order
  after insert on orders
  for each row execute procedure notify_new_order();


-- ── 8. TRIGGER : notification sur nouveau message ───────
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

  -- Update conversation last_message
  update conversations
  set last_message = left(new.content, 100),
      last_message_at = now()
  where id = new.conversation_id;

  return new;
end;
$$;

create trigger on_new_message
  after insert on messages
  for each row execute procedure notify_new_message();


-- ── 9. TRIGGER : notification sur changement statut commande ─
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

create trigger on_order_status_change
  after update on orders
  for each row execute procedure notify_order_status();


-- ── 10. Enable Realtime for messages and notifications ──
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table orders;
