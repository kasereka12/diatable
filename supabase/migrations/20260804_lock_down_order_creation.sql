-- Orders are now created exclusively through the create-order Edge Function
-- (service role, bypasses RLS), which recomputes subtotal/delivery_fee/total
-- server-side from real menu_items prices instead of trusting client input.
-- Drop the direct-insert policies so a client can no longer bypass that
-- function and insert an order/order_items with an arbitrary total.

drop policy if exists "Client peut créer une commande" on orders;
drop policy if exists "Client peut créer des order_items" on order_items;
