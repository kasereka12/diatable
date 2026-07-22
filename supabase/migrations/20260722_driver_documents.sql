-- Driver validation documents: vehicle details, driving license, and photos
-- of the vehicle from all four angles. Drivers (external self-signup and
-- internal ones added by a vendor) are now created inactive by default and
-- must submit these before an admin can activate them — same pattern as
-- restaurant is_verified.

alter table delivery_drivers
  add column if not exists license_number    text,
  add column if not exists license_photo_url text,
  add column if not exists vehicle_brand     text,
  add column if not exists vehicle_plate     text,
  add column if not exists photo_front       text,
  add column if not exists photo_back        text,
  add column if not exists photo_left        text,
  add column if not exists photo_right       text;

alter table delivery_drivers alter column is_active set default false;
