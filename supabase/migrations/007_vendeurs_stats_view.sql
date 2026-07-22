-- ─────────────────────────────────────────────────────────────────────────────
-- 007 — vendeurs_stats materialized view
-- Pre-computes review_count and avg_rating per restaurant so fetchVendeurs
-- never needs an in-query GROUP BY or JS-side averaging.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS vendeurs_stats AS
SELECT
  r.id                          AS restaurant_id,
  COUNT(rv.id)::int             AS review_count,
  ROUND(AVG(rv.rating)::numeric, 1) AS avg_rating
FROM   restaurants r
LEFT   JOIN reviews rv ON rv.restaurant_id = r.id
GROUP  BY r.id;

-- 2. Unique index — required for CONCURRENTLY refresh and fast restaurant_id lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendeurs_stats_restaurant_id
  ON vendeurs_stats (restaurant_id);

-- 3. Grant read access to the anonymous / authenticated roles Supabase uses
GRANT SELECT ON vendeurs_stats TO anon, authenticated;

-- ── Auto-refresh trigger ──────────────────────────────────────────────────────
-- Refreshes the view after any INSERT / UPDATE / DELETE on reviews.
-- CONCURRENTLY means readers are never blocked during the refresh.

CREATE OR REPLACE FUNCTION refresh_vendeurs_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.vendeurs_stats;
  RETURN NULL;
END;
$$;

-- Statement-level trigger (one refresh per statement, not one per row)
DROP TRIGGER IF EXISTS trg_vendeurs_stats_on_review ON reviews;
CREATE TRIGGER trg_vendeurs_stats_on_review
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_vendeurs_stats();

-- ── Initial population ────────────────────────────────────────────────────────
-- Run once at migration time so the view is immediately usable.
REFRESH MATERIALIZED VIEW vendeurs_stats;
