-- ─── Propositions de livraison aux livreurs externes ─────────────────────────
-- Quand aucun livreur rattaché au restaurant n'est disponible, on propose la
-- course aux livreurs externes disponibles. Chacun peut accepter ou refuser.
-- Le premier qui accepte remporte la course ; les autres offres expirent.

CREATE TABLE IF NOT EXISTS delivery_offers (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id     uuid NOT NULL REFERENCES delivery_drivers(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  distance_km   numeric(6,2),          -- distance livreur → restaurant au moment de l'offre
  created_at    timestamptz DEFAULT now(),
  expires_at    timestamptz DEFAULT now() + interval '5 minutes',
  responded_at  timestamptz,
  UNIQUE (order_id, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_offers_driver_pending
  ON delivery_offers (driver_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_offers_order
  ON delivery_offers (order_id, status);

ALTER TABLE delivery_offers ENABLE ROW LEVEL SECURITY;

-- Le livreur voit ses propres offres ; le vendeur voit les offres de ses commandes
CREATE POLICY "offers_select" ON delivery_offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM delivery_drivers d
      WHERE d.id = driver_id AND d.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM orders o
      JOIN restaurants r ON r.id = o.restaurant_id
      WHERE o.id = order_id AND r.owner_id = auth.uid()
    )
  );

-- Le vendeur (propriétaire de la commande) crée les offres
CREATE POLICY "offers_insert" ON delivery_offers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN restaurants r ON r.id = o.restaurant_id
      WHERE o.id = order_id AND r.owner_id = auth.uid()
    )
  );

-- Le livreur répond à ses offres ; le vendeur peut aussi les mettre à jour (expiration)
CREATE POLICY "offers_update" ON delivery_offers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM delivery_drivers d
      WHERE d.id = driver_id AND d.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM orders o
      JOIN restaurants r ON r.id = o.restaurant_id
      WHERE o.id = order_id AND r.owner_id = auth.uid()
    )
  );
