-- Fix RLS policies for delivery_drivers
--
-- INSERT: allow profile_id IS NULL (unauthenticated onboarding, or vendor-added driver)
-- UPDATE: allow driver to claim their record by email on first magic-link login,
--         or vendor to manage their restaurant's drivers

DROP POLICY IF EXISTS "drivers_insert" ON delivery_drivers;
DROP POLICY IF EXISTS "drivers_update" ON delivery_drivers;

CREATE POLICY "drivers_insert" ON delivery_drivers
  FOR INSERT WITH CHECK (
    profile_id IS NULL          -- unauthenticated self-registration or vendor-added
    OR auth.uid() = profile_id  -- authenticated self-registration
  );

CREATE POLICY "drivers_update" ON delivery_drivers
  FOR UPDATE USING (
    auth.uid() = profile_id
    OR (
      profile_id IS NULL
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    OR (
      restaurant_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM restaurants
        WHERE restaurants.id = restaurant_id
          AND restaurants.owner_id = auth.uid()
      )
    )
  );
