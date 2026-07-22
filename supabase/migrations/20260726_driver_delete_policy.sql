-- delivery_drivers has RLS enabled but never had a DELETE policy, so the
-- vendor "Supprimer" action added for internal drivers was silently a no-op
-- (RLS blocks it, 0 rows affected, no error surfaced). Let a vendor delete
-- their own restaurant's drivers, and let admin delete any.

create policy "drivers_delete" on delivery_drivers
  for delete using (
    (
      restaurant_id is not null
      and exists (
        select 1 from restaurants
        where restaurants.id = restaurant_id
          and restaurants.owner_id = auth.uid()
      )
    )
    or is_admin()
  );
