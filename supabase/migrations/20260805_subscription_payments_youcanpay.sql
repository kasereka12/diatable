-- Switch vendor plan upgrades from manual bank-transfer + admin review to
-- YouCan Pay, confirmed automatically via the youcanpay-webhook function
-- (same pattern as order card payments). No more admin approval step.

-- ── subscriptions: lock down direct client writes ──────────────────────
-- Previously "Vendeur peut modifier son abonnement" allowed a vendor to
-- set ANY plan value on their own row via the client SDK — i.e. self-grant
-- Premium for free. Now: the client may only ever set plan back to 'free'
-- (a self-serve downgrade, no payment involved); upgrades to pro/premium
-- are only written by the webhook (service role, bypasses RLS) once a real
-- payment clears.
drop policy if exists "Vendeur peut modifier son abonnement" on subscriptions;
create policy "Vendeur peut se rétrograder en gratuit"
  on subscriptions for update
  using (auth.uid() = vendor_id)
  with check (auth.uid() = vendor_id and plan = 'free');

drop policy if exists "Vendeur peut créer son abonnement" on subscriptions;
create policy "Vendeur peut créer son abonnement en gratuit"
  on subscriptions for insert
  with check (auth.uid() = vendor_id and plan = 'free');

-- ── subscription_payments: bank-transfer fields optional, add payment
--    tracking columns, lock down direct client writes ────────────────────
alter table subscription_payments
  alter column bank drop not null,
  alter column reference drop not null,
  alter column sender_name drop not null;

alter table subscription_payments
  add column if not exists payment_transaction_id text,
  add column if not exists amount numeric(10,2);

alter table subscription_payments drop constraint if exists subscription_payments_status_check;
alter table subscription_payments
  add constraint subscription_payments_status_check check (status in ('pending','approved','rejected','paid'));

-- Rows are now created by create-subscription-payment-token and updated by
-- youcanpay-webhook (both service role) — the client can only read its own
-- payment history, not insert/update it directly.
drop policy if exists "Vendor can manage own payments" on subscription_payments;
create policy "Vendor can read own payments"
  on subscription_payments for select using (auth.uid() = vendor_id);
