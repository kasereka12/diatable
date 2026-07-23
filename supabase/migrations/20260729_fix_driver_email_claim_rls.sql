-- "permission denied for table users" when a driver's profile gets touched
-- (e.g. completing their profile in DriverDocsForm). The "drivers_update"
-- policy (20260630_fix_driver_rls.sql) reads `auth.users` directly to let an
-- unauthenticated-onboarded driver claim their row by email — but the
-- `authenticated` role has no SELECT grant on auth.users, so evaluating that
-- policy branch throws, even when a different OR-branch was the one meant
-- to actually apply. auth.jwt() ->> 'email' reads the same value straight
-- out of the current session's JWT, with no table access needed.

drop policy if exists "drivers_update" on delivery_drivers;

create policy "drivers_update" on delivery_drivers
  for update using (
    auth.uid() = profile_id
    or (
      profile_id is null
      and email = (auth.jwt() ->> 'email')
    )
    or (
      restaurant_id is not null
      and exists (
        select 1 from restaurants
        where restaurants.id = restaurant_id
          and restaurants.owner_id = auth.uid()
      )
    )
  );
