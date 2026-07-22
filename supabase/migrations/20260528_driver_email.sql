ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS email text;
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_email ON delivery_drivers (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_phone ON delivery_drivers (phone) WHERE phone IS NOT NULL;
