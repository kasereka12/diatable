-- ─── 1. Colonnes manquantes sur orders ───────────────────────────────────────

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_lat          numeric(10,7),
  ADD COLUMN IF NOT EXISTS delivery_lng          numeric(10,7),
  ADD COLUMN IF NOT EXISTS estimated_delivery_at timestamptz,
  ADD COLUMN IF NOT EXISTS estimated_prep_min    integer,        -- temps de prépa estimé (minutes)
  ADD COLUMN IF NOT EXISTS driver_id             uuid;           -- FK ajoutée après création de la table

-- ─── 2. Table des livreurs ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS delivery_drivers (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  type            text NOT NULL CHECK (type IN ('external', 'restaurant')),
  restaurant_id   uuid REFERENCES restaurants(id) ON DELETE SET NULL, -- NULL pour external
  full_name       text NOT NULL,
  phone           text,
  vehicle_type    text CHECK (vehicle_type IN ('moto', 'voiture', 'velo', 'pieton')),
  is_active       boolean NOT NULL DEFAULT true,
  is_available    boolean NOT NULL DEFAULT true,
  current_lat     numeric(10,7),
  current_lng     numeric(10,7),
  location_updated_at timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- FK orders → delivery_drivers
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_driver
  FOREIGN KEY (driver_id) REFERENCES delivery_drivers(id) ON DELETE SET NULL;

-- ─── 3. Index ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_drivers_restaurant  ON delivery_drivers (restaurant_id) WHERE restaurant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_drivers_available   ON delivery_drivers (is_available, is_active) WHERE is_available = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_orders_driver       ON orders (driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders (status, restaurant_id);

-- ─── 4. RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour les vendeurs/admin
CREATE POLICY "drivers_read" ON delivery_drivers
  FOR SELECT USING (true);

-- Écriture réservée au propriétaire du profil ou admin
CREATE POLICY "drivers_insert" ON delivery_drivers
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "drivers_update" ON delivery_drivers
  FOR UPDATE USING (auth.uid() = profile_id);
