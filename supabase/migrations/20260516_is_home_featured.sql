-- Add is_home_featured flag to restaurants
-- Restaurants with this flag appear in the Hero carousel on the home page.
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS is_home_featured boolean NOT NULL DEFAULT false;

-- Index so the Hero query (WHERE is_home_featured = true AND is_active = true) is fast.
CREATE INDEX IF NOT EXISTS idx_restaurants_home_featured
  ON restaurants (is_home_featured)
  WHERE is_home_featured = true;
