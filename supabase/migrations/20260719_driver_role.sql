-- Allow 'driver' as a valid profiles.role value, and backfill existing drivers.

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('client', 'vendor', 'admin', 'driver'));

UPDATE profiles
SET role = 'driver'
WHERE id IN (SELECT profile_id FROM delivery_drivers WHERE profile_id IS NOT NULL)
  AND role = 'client';
