-- ─────────────────────────────────────────────────────────────────────────────
-- 006 — Performance indexes
-- Eliminates seq-scans on the most frequent filter/join paths.
-- ─────────────────────────────────────────────────────────────────────────────

-- restaurants: city filter (used by location dropdown on /restaurants)
CREATE INDEX IF NOT EXISTS idx_restaurants_location
  ON restaurants (location);

-- restaurants: cuisine filter
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine
  ON restaurants (cuisine);

-- restaurants: compound city + cuisine (used together when both filters active)
CREATE INDEX IF NOT EXISTS idx_restaurants_location_cuisine
  ON restaurants (location, cuisine);

-- restaurants: partial index — only active rows (all public queries filter is_active = true)
CREATE INDEX IF NOT EXISTS idx_restaurants_is_active
  ON restaurants (is_active)
  WHERE is_active = true;

-- restaurants: owner lookup (subscriptions join in fetchVendeurs)
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id
  ON restaurants (owner_id);

-- reviews: FK join (used in fetchVendeurDetail embedded select + useAvis)
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id
  ON reviews (restaurant_id);

-- reviews: user lookup (userReview query in RestaurantDetail)
CREATE INDEX IF NOT EXISTS idx_reviews_user_id
  ON reviews (user_id);

-- reviews: most-recent-first ordering per restaurant
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_created
  ON reviews (restaurant_id, created_at DESC);

-- menu_items: FK join (used in fetchVendeurDetail embedded select + usePlats)
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id
  ON menu_items (restaurant_id);

-- menu_items: compound — available items per restaurant (most common read pattern)
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_available
  ON menu_items (restaurant_id, is_available)
  WHERE is_available = true;

-- subscriptions: vendor lookup (parallel fetch in fetchVendeurs)
CREATE INDEX IF NOT EXISTS idx_subscriptions_vendor_id
  ON subscriptions (vendor_id);

-- subscriptions: partial — only active subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_vendor_active
  ON subscriptions (vendor_id, plan)
  WHERE status = 'active';

-- restaurant_likes: count + user-liked queries in RestaurantDetail
CREATE INDEX IF NOT EXISTS idx_restaurant_likes_restaurant_id
  ON restaurant_likes (restaurant_id);

CREATE INDEX IF NOT EXISTS idx_restaurant_likes_user_restaurant
  ON restaurant_likes (user_id, restaurant_id);

-- orders: profile orders query (Profile.jsx)
CREATE INDEX IF NOT EXISTS idx_orders_customer_id
  ON orders (customer_id, created_at DESC);

-- delivery_zones: checkout query
CREATE INDEX IF NOT EXISTS idx_delivery_zones_restaurant_id
  ON delivery_zones (restaurant_id);
