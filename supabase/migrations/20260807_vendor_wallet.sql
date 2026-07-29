-- ──────────────────────────────────────────────────────
-- Portefeuille vendeur (solde interne + retraits)
--
-- Modèle "comptabilité bancaire" : chaque commande payée par carte
-- (YouCan Pay) crédite un solde interne par restaurant (sous-total moins
-- une commission plateforme réglable). Le vendeur demande un retrait contre
-- ce solde ; l'admin le vire manuellement puis le marque "payé". Deux
-- exports Excel côté admin permettent de réconcilier avant chaque virement.
--
-- Les commandes en espèces ne créditent PAS le solde : le restaurant
-- encaisse déjà le cash en main propre, la plateforme ne détient rien.
-- ──────────────────────────────────────────────────────

-- ── Commission plateforme (réglable par l'admin) ─────
alter table platform_settings
  add column if not exists commission_pct numeric(5,2) not null default 10;

-- ── Ledger : crédits (revenus des commandes cartes) ──
-- Table immuable, alimentée uniquement par le trigger sur orders
-- (aucune policy insert côté client). amount = montant net crédité.
create table if not exists wallet_transactions (
  id                uuid primary key default uuid_generate_v4(),
  restaurant_id     uuid not null references restaurants(id) on delete cascade,
  order_id          uuid references orders(id) on delete set null,
  type              text not null default 'credit' check (type in ('credit')),
  amount            numeric(10,2) not null,      -- net crédité (sous-total - commission)
  gross_amount      numeric(10,2),               -- sous-total avant commission
  commission_amount numeric(10,2),               -- commission retenue
  commission_pct    numeric(5,2),                -- taux appliqué (snapshot)
  description       text,
  created_at        timestamptz default now()
);

-- Un seul crédit par commande, même si le webhook est redélivré. Index unique
-- plein (non partiel) pour servir de cible fiable au ON CONFLICT du trigger ;
-- les crédits sans order_id restent possibles (NULLs distincts en Postgres).
create unique index if not exists uniq_wallet_credit_per_order
  on wallet_transactions (order_id);

create index if not exists idx_wallet_tx_restaurant
  on wallet_transactions (restaurant_id, created_at desc);

alter table wallet_transactions enable row level security;

create policy "Vendeur lit les transactions de son restaurant"
  on wallet_transactions for select
  using (exists (
    select 1 from restaurants r
    where r.id = restaurant_id and r.owner_id = auth.uid()
  ));

create policy "Admin lit toutes les transactions"
  on wallet_transactions for select using (is_admin());

-- Aucun insert/update/delete côté client : le ledger est écrit par le
-- trigger credit_wallet_on_paid_order (security definer) et lu seulement.

-- ── Demandes de retrait (cycle de vie + snapshot bancaire) ──
create table if not exists withdrawals (
  id             uuid primary key default uuid_generate_v4(),
  restaurant_id  uuid not null references restaurants(id) on delete cascade,
  vendor_id      uuid references profiles(id) on delete set null,
  amount         numeric(10,2) not null check (amount > 0),
  status         text not null default 'pending'
                 check (status in ('pending','approved','paid','rejected')),
  -- Compte de destination figé au moment de la demande.
  rib            text,
  bank_name      text,
  account_name   text,
  admin_note     text,
  requested_at   timestamptz default now(),
  reviewed_at    timestamptz,
  paid_at        timestamptz,
  created_at     timestamptz default now()
);

create index if not exists idx_withdrawals_restaurant
  on withdrawals (restaurant_id, created_at desc);
create index if not exists idx_withdrawals_status
  on withdrawals (status);

alter table withdrawals enable row level security;

create policy "Vendeur lit ses retraits"
  on withdrawals for select
  using (exists (
    select 1 from restaurants r
    where r.id = restaurant_id and r.owner_id = auth.uid()
  ));

-- Le vendeur crée une demande pour son propre restaurant. Le montant
-- disponible est vérifié par le trigger enforce_withdrawal_balance.
create policy "Vendeur demande un retrait"
  on withdrawals for insert
  with check (
    auth.uid() = vendor_id
    and exists (
      select 1 from restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

create policy "Admin gère tous les retraits"
  on withdrawals for all using (is_admin());

-- ── Vue solde par restaurant ─────────────────────────
-- security_invoker : la vue s'exécute avec les droits de l'appelant, donc
-- les policies RLS ci-dessus filtrent naturellement (le vendeur ne voit que
-- son restaurant, l'admin voit tout). available_balance réserve aussi les
-- retraits en attente/approuvés pour empêcher un double retrait.
create or replace view restaurant_wallets
  with (security_invoker = true) as
select
  r.id       as restaurant_id,
  r.owner_id as owner_id,
  r.name     as restaurant_name,
  coalesce(c.total, 0)                                   as total_credited,
  coalesce(w.paid_total, 0)                              as total_withdrawn,
  coalesce(w.pending_total, 0)                           as pending_withdrawals,
  coalesce(c.total, 0) - coalesce(w.paid_total, 0)
    - coalesce(w.pending_total, 0)                       as available_balance
from restaurants r
left join (
  select restaurant_id, sum(amount) as total
  from wallet_transactions
  where type = 'credit'
  group by restaurant_id
) c on c.restaurant_id = r.id
left join (
  select restaurant_id,
    sum(amount) filter (where status = 'paid')                    as paid_total,
    sum(amount) filter (where status in ('pending','approved'))   as pending_total
  from withdrawals
  group by restaurant_id
) w on w.restaurant_id = r.id;

grant select on restaurant_wallets to authenticated;

-- ── Trigger : crédite le solde à la confirmation d'un paiement carte ──
create or replace function credit_wallet_on_paid_order()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  pct        numeric;
  commission numeric;
  net        numeric;
begin
  if new.payment_status = 'paid'
     and old.payment_status is distinct from 'paid'
     and new.payment_method = 'card'
     and new.restaurant_id is not null then

    select commission_pct into pct from platform_settings where id = 1;
    pct := coalesce(pct, 0);
    commission := round(coalesce(new.subtotal, 0) * pct / 100.0, 2);
    net := coalesce(new.subtotal, 0) - commission;

    insert into wallet_transactions
      (restaurant_id, order_id, type, amount, gross_amount, commission_amount, commission_pct, description)
    values
      (new.restaurant_id, new.id, 'credit', net, new.subtotal, commission, pct,
       'Commande #' || left(new.id::text, 8) || ' — payée par carte')
    on conflict (order_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_order_paid_credit_wallet on orders;
create trigger on_order_paid_credit_wallet
  after update of payment_status on orders
  for each row execute procedure credit_wallet_on_paid_order();

-- ── Trigger : empêche un retrait supérieur au solde disponible ──
create or replace function enforce_withdrawal_balance()
returns trigger language plpgsql security definer set search_path = public as $$
declare avail numeric;
begin
  select available_balance into avail
  from restaurant_wallets
  where restaurant_id = new.restaurant_id;
  avail := coalesce(avail, 0);

  if new.amount > avail then
    raise exception 'Montant demandé (%) supérieur au solde disponible (%)', new.amount, avail
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists on_withdrawal_check_balance on withdrawals;
create trigger on_withdrawal_check_balance
  before insert on withdrawals
  for each row execute procedure enforce_withdrawal_balance();

-- ── Trigger : horodate les transitions de statut d'un retrait ──
create or replace function stamp_withdrawal_status()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if new.status in ('approved','rejected','paid') then
      new.reviewed_at := coalesce(new.reviewed_at, now());
    end if;
    if new.status = 'paid' then
      new.paid_at := coalesce(new.paid_at, now());
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_withdrawal_status_stamp on withdrawals;
create trigger on_withdrawal_status_stamp
  before update on withdrawals
  for each row execute procedure stamp_withdrawal_status();
