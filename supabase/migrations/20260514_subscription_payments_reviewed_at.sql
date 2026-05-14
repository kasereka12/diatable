-- Ajoute la colonne reviewed_at sur subscription_payments
alter table subscription_payments
  add column if not exists reviewed_at timestamptz;

-- Permet à l'admin d'insérer un abonnement (nécessaire pour upsert)
create policy if not exists "Admin peut insérer des abonnements"
  on subscriptions for insert with check (is_admin());
