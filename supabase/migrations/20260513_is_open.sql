-- Add is_open field to restaurants for manual open/close control by vendors
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_open boolean NOT NULL DEFAULT true;

-- Vendors can update is_open on their own restaurant (covered by existing update policy)
-- No additional policy needed — existing "Vendors can update their restaurant" policy applies
