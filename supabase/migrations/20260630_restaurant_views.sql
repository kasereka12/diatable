-- Create restaurant_views table (was in schema.sql but never migrated)

CREATE TABLE IF NOT EXISTS restaurant_views (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_views_restaurant
  ON restaurant_views (restaurant_id, created_at DESC);

ALTER TABLE restaurant_views ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can log a view
CREATE POLICY "views_insert"
  ON restaurant_views FOR INSERT WITH CHECK (true);

-- Vendor reads only their own restaurant's views
CREATE POLICY "views_select_vendor"
  ON restaurant_views FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = restaurant_id AND r.owner_id = auth.uid()
  ));

-- Admin reads all
CREATE POLICY "views_select_admin"
  ON restaurant_views FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
