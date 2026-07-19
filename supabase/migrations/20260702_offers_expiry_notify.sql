  -- ─── Expiration automatique des offres + notification client ──────────────────

  -- ── 1. Notifier le client quand un livreur prend sa commande ──────────────────
  -- Se déclenche dès que `driver_id` passe de NULL à une valeur (attribution directe
  -- d'un livreur rattaché OU acceptation d'une offre par un livreur externe).

  CREATE OR REPLACE FUNCTION notify_driver_assigned()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
  DECLARE
    driver_name text;
    eta_txt     text := '';
  BEGIN
    IF new.driver_id IS NOT NULL AND (old.driver_id IS NULL OR old.driver_id IS DISTINCT FROM new.driver_id) THEN

      SELECT full_name INTO driver_name
      FROM delivery_drivers WHERE id = new.driver_id;

      -- Heure estimée si déjà calculée
      IF new.estimated_delivery_at IS NOT NULL THEN
        eta_txt := ' — livraison estimée à ' ||
                  to_char(new.estimated_delivery_at AT TIME ZONE 'Africa/Casablanca', 'HH24:MI');
      END IF;

      IF new.customer_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, body, link)
        VALUES (
          new.customer_id,
          'order',
          'Un livreur a pris votre commande',
          coalesce(driver_name, 'Votre livreur') || ' est en route' || eta_txt || '.',
          '/mes-commandes'
        );
      END IF;
    END IF;

    RETURN new;
  END;
  $$;

  DROP TRIGGER IF EXISTS on_driver_assigned ON orders;
  CREATE TRIGGER on_driver_assigned
    AFTER UPDATE OF driver_id ON orders
    FOR EACH ROW EXECUTE PROCEDURE notify_driver_assigned();


  -- ── 2. Notifier le livreur quand il reçoit une nouvelle proposition ───────────
  CREATE OR REPLACE FUNCTION notify_offer_created()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
  DECLARE
    driver_profile uuid;
    rest_name      text;
  BEGIN
    SELECT profile_id INTO driver_profile FROM delivery_drivers WHERE id = new.driver_id;

    SELECT r.name INTO rest_name
    FROM orders o JOIN restaurants r ON r.id = o.restaurant_id
    WHERE o.id = new.order_id;

    IF driver_profile IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, body, link)
      VALUES (
        driver_profile,
        'order',
        'Nouvelle course proposée',
        'Une livraison' || coalesce(' pour ' || rest_name, '') ||
          coalesce(' à ' || new.distance_km || ' km', '') || ' vous attend.',
        '/livreur'
      );
    END IF;

    RETURN new;
  END;
  $$;

  DROP TRIGGER IF EXISTS on_offer_created ON delivery_offers;
  CREATE TRIGGER on_offer_created
    AFTER INSERT ON delivery_offers
    FOR EACH ROW EXECUTE PROCEDURE notify_offer_created();


  -- ── 3. Expiration automatique des offres périmées ─────────────────────────────
  CREATE OR REPLACE FUNCTION expire_stale_offers()
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
  BEGIN
    UPDATE delivery_offers
    SET status = 'expired'
    WHERE status = 'pending'
      AND expires_at < now();
  END;
  $$;

  -- Planification via pg_cron (toutes les minutes).
  -- Nécessite l'extension pg_cron (activée par défaut sur Supabase).
  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
      -- Supprime l'ancienne planification si elle existe, puis (re)crée
      PERFORM cron.unschedule('expire-stale-offers')
        WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-stale-offers');
      PERFORM cron.schedule('expire-stale-offers', '* * * * *', 'SELECT expire_stale_offers();');
    END IF;
  END;
  $$;
