-- Card payment integration (YouCan Pay). Stores the gateway's transaction id
-- on the order so the webhook handler can look the order back up and the
-- customer-facing payment token creation can be re-requested idempotently.

alter table orders
  add column if not exists payment_transaction_id text;

create index if not exists idx_orders_payment_transaction_id
  on orders (payment_transaction_id) where payment_transaction_id is not null;
