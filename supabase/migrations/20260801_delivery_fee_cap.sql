-- Cap on the dynamic delivery fee: without one, a linear base+per-km formula
-- can produce unrealistically high fees for far-away addresses (e.g. 46 MAD),
-- unlike real delivery platforms which cap fees regardless of distance.

alter table platform_settings
  add column if not exists delivery_max_fee numeric(10,2) not null default 30;
