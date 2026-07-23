-- Allow a customer to cancel their own order, but only while the restaurant
-- hasn't started preparing it yet (status still 'pending' or 'confirmed').

drop policy if exists "Client peut annuler sa commande" on orders;

create policy "Client peut annuler sa commande"
  on orders for update
  using (
    auth.uid() = customer_id
    and status in ('pending', 'confirmed')
  )
  with check (
    auth.uid() = customer_id
    and status = 'cancelled'
  );
