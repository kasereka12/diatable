import { supabase, callEdgeFunction } from './supabase'

/**
 * Algorithme d'attribution d'un livreur à une commande.
 *
 * 1. On cherche d'abord les livreurs RATTACHÉS au restaurant qui sont disponibles.
 *    → le plus proche du restaurant (GPS) est assigné directement.
 * 2. Si aucun rattaché n'est disponible, on cherche les livreurs EXTERNES disponibles
 *    et on leur PROPOSE la course (offres). Le premier qui accepte remporte la course.
 * 3. À l'acceptation, on (re)calcule la durée de livraison selon l'état de la commande.
 */

interface DriverRow {
  id: string
  full_name: string
  type: 'restaurant' | 'external'
  restaurant_id: string | null
  is_available: boolean
  is_active: boolean
  current_lat: number | null
  current_lng: number | null
}

interface RestaurantCoords {
  latitude: number | null
  longitude: number | null
}

export type AssignResult =
  | { method: 'restaurant'; driver: { id: string; full_name: string }; distanceKm: number | null }
  | { method: 'external_offer'; offered: { id: string; full_name: string; distanceKm: number | null }[] }
  | { method: 'none' }

/** Distance à vol d'oiseau (km) entre deux points GPS — formule de haversine. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Distance livreur → restaurant (null si coordonnées manquantes). */
function distanceToRestaurant(driver: DriverRow, resto: RestaurantCoords): number | null {
  if (driver.current_lat == null || driver.current_lng == null) return null
  if (resto.latitude == null || resto.longitude == null) return null
  return haversineKm(driver.current_lat, driver.current_lng, resto.latitude, resto.longitude)
}

/** Trie une liste de livreurs par proximité du restaurant (les sans-GPS en dernier). */
function sortByProximity(drivers: DriverRow[], resto: RestaurantCoords): { driver: DriverRow; distanceKm: number | null }[] {
  return drivers
    .map(driver => ({ driver, distanceKm: distanceToRestaurant(driver, resto) }))
    .sort((a, b) => {
      if (a.distanceKm == null) return 1
      if (b.distanceKm == null) return -1
      return a.distanceKm - b.distanceKm
    })
}

/**
 * Lance l'attribution automatique pour une commande.
 * `maxOffers` limite le nombre de livreurs externes sollicités (les plus proches).
 */
export async function autoAssignDriver(
  orderId: string,
  restaurantId: string,
  maxOffers = 5,
): Promise<AssignResult> {
  // Coordonnées du restaurant (pour classer par proximité)
  const { data: resto } = await supabase
    .from('restaurants')
    .select('latitude, longitude')
    .eq('id', restaurantId)
    .single()
  const restoCoords = (resto ?? { latitude: null, longitude: null }) as RestaurantCoords

  // Tous les livreurs actifs & disponibles, rattachés OU externes
  const { data: rows } = await supabase
    .from('delivery_drivers')
    .select('id, full_name, type, restaurant_id, is_available, is_active, current_lat, current_lng')
    .eq('is_active', true)
    .eq('is_available', true)
    .or(`restaurant_id.eq.${restaurantId},type.eq.external`)
  const drivers = (rows ?? []) as DriverRow[]

  // ── Étape 1 : livreurs rattachés au restaurant ──────────────────────────────
  const restaurantDrivers = drivers.filter(d => d.type === 'restaurant' && d.restaurant_id === restaurantId)
  if (restaurantDrivers.length > 0) {
    const [best] = sortByProximity(restaurantDrivers, restoCoords)
    // ETA calculé AVANT l'assignation pour que la notif client affiche l'heure estimée
    await computeDeliveryDuration(orderId)
    await assignDirect(orderId, best.driver.id, best.driver.full_name)
    return { method: 'restaurant', driver: { id: best.driver.id, full_name: best.driver.full_name }, distanceKm: best.distanceKm }
  }

  // ── Étape 2 : proposer aux livreurs externes disponibles ────────────────────
  const externalDrivers = drivers.filter(d => d.type === 'external')
  if (externalDrivers.length > 0) {
    const ranked = sortByProximity(externalDrivers, restoCoords).slice(0, maxOffers)

    // Nettoie les anciennes offres en attente pour cette commande, puis crée les nouvelles
    await (supabase.from('delivery_offers') as any)
      .update({ status: 'expired' })
      .eq('order_id', orderId)
      .eq('status', 'pending')

    const offers = ranked.map(({ driver, distanceKm }) => ({
      order_id:    orderId,
      driver_id:   driver.id,
      status:      'pending',
      distance_km: distanceKm != null ? Number(distanceKm.toFixed(2)) : null,
    }))
    await (supabase.from('delivery_offers') as any).upsert(offers, { onConflict: 'order_id,driver_id' })

    return {
      method: 'external_offer',
      offered: ranked.map(({ driver, distanceKm }) => ({ id: driver.id, full_name: driver.full_name, distanceKm })),
    }
  }

  // ── Étape 3 : aucun livreur disponible ──────────────────────────────────────
  return { method: 'none' }
}

/** Assigne directement un livreur à la commande et le marque occupé. */
async function assignDirect(orderId: string, driverId: string, driverName: string) {
  await (supabase.from('orders') as any)
    .update({ driver_id: driverId, driver_name: driverName })
    .eq('id', orderId)
  await (supabase.from('delivery_drivers') as any)
    .update({ is_available: false })
    .eq('id', driverId)
}

/**
 * Un livreur externe accepte une proposition.
 * Vérifie que la commande n'a pas déjà été prise, assigne, expire les autres offres,
 * puis calcule la durée de livraison.
 */
export async function acceptOffer(offerId: string, orderId: string, driverId: string, driverName: string): Promise<
  | { ok: true }
  | { ok: false; reason: 'already_taken' | 'error' }
> {
  // La commande est-elle déjà attribuée ?
  const { data: order } = await supabase
    .from('orders')
    .select('driver_id')
    .eq('id', orderId)
    .single()

  if (order && (order as { driver_id: string | null }).driver_id) {
    await (supabase.from('delivery_offers') as any)
      .update({ status: 'expired', responded_at: new Date().toISOString() })
      .eq('id', offerId)
    return { ok: false, reason: 'already_taken' }
  }

  // Étape 3 : durée selon l'état de la commande — AVANT l'assignation pour que la
  // notification envoyée au client (trigger sur driver_id) affiche l'heure estimée.
  await computeDeliveryDuration(orderId)

  // Attribution
  await assignDirect(orderId, driverId, driverName)

  // Marque cette offre acceptée, les autres expirées
  await (supabase.from('delivery_offers') as any)
    .update({ status: 'accepted', responded_at: new Date().toISOString() })
    .eq('id', offerId)
  await (supabase.from('delivery_offers') as any)
    .update({ status: 'expired' })
    .eq('order_id', orderId)
    .eq('status', 'pending')

  return { ok: true }
}

/** Un livreur externe refuse une proposition. */
export async function declineOffer(offerId: string): Promise<void> {
  await (supabase.from('delivery_offers') as any)
    .update({ status: 'declined', responded_at: new Date().toISOString() })
    .eq('id', offerId)
}

/**
 * (Re)calcule la durée estimée de livraison via la fonction edge `estimate-delivery`,
 * qui tient compte de l'état de la commande (prépa restante + trajet avec trafic).
 * Échoue silencieusement si les coordonnées manquent — l'attribution reste valide.
 */
export async function computeDeliveryDuration(orderId: string): Promise<void> {
  try {
    await callEdgeFunction('estimate-delivery', { order_id: orderId })
  } catch {
    /* estimation best-effort */
  }
}
