-- src/lib/driverAssignment.ts writes { driver_id, driver_name } to orders when
-- a driver is assigned (direct assignment or offer acceptance), but no prior
-- migration ever created this column — the update silently fails against any
-- database provisioned from the migrations history alone. Add it now.

alter table orders
  add column if not exists driver_name text;
