import { createClient } from 'npm:@supabase/supabase-js'
import { buildResponseHeaders, handleCors } from '../_shared/secureHeaders.ts'
import { validateOrigin } from '../_shared/csrf.ts'

const PREP_BY_STATUS: Record<string, number> = {
  pending:    0,   // pas encore confirmé, on ne compte pas encore
  confirmed:  0,   // vient d'être confirmé, toute la prépa reste
  preparing: -1,   // en cours — on lira estimated_prep_min de l'order
  ready:      0,   // prêt, plus de prépa
  delivered:  0,
  cancelled:  0,
}

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req)
  if (preflight) return preflight

  try {
    validateOrigin(req)

    const { order_id } = await req.json()
    if (!order_id) {
      return new Response(JSON.stringify({ error: 'order_id requis' }), {
        status: 400,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 1. Récupérer la commande + le restaurant
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select(`
        id, status, created_at, estimated_prep_min,
        delivery_lat, delivery_lng,
        restaurant:restaurants(latitude, longitude, prep_time_min)
      `)
      .eq('id', order_id)
      .single()

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Commande introuvable' }), {
        status: 404,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    const restaurant = order.restaurant as {
      latitude: number | null
      longitude: number | null
      prep_time_min?: number | null
    }

    if (!restaurant?.latitude || !restaurant?.longitude) {
      return new Response(JSON.stringify({ error: 'Coordonnées restaurant manquantes' }), {
        status: 422,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    if (!order.delivery_lat || !order.delivery_lng) {
      return new Response(JSON.stringify({ error: 'Coordonnées livraison manquantes' }), {
        status: 422,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    // 2. Calcul du temps de préparation restant
    const prepTotal  = order.estimated_prep_min ?? restaurant.prep_time_min ?? 20
    const elapsedMin = (Date.now() - new Date(order.created_at).getTime()) / 60_000
    const prepLeft   = Math.max(0, Math.round(prepTotal - elapsedMin))

    // 3. Google Distance Matrix — trafic temps réel
    const googleKey  = Deno.env.get('GOOGLE_MAPS_API_KEY')!
    const origin     = `${restaurant.latitude},${restaurant.longitude}`
    const destination = `${order.delivery_lat},${order.delivery_lng}`
    const now        = Math.floor(Date.now() / 1000)

    const gmUrl = new URL('https://maps.googleapis.com/maps/api/distancematrix/json')
    gmUrl.searchParams.set('origins', origin)
    gmUrl.searchParams.set('destinations', destination)
    gmUrl.searchParams.set('mode', 'driving')
    gmUrl.searchParams.set('departure_time', String(now))   // trafic temps réel
    gmUrl.searchParams.set('traffic_model', 'best_guess')
    gmUrl.searchParams.set('language', 'fr')
    gmUrl.searchParams.set('key', googleKey)

    const gmRes  = await fetch(gmUrl.toString())
    const gmData = await gmRes.json()

    const element = gmData.rows?.[0]?.elements?.[0]
    if (!element || element.status !== 'OK') {
      return new Response(JSON.stringify({ error: 'Impossible de calculer l\'itinéraire' }), {
        status: 502,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    // duration_in_traffic = avec trafic, duration = sans trafic
    const travelSec    = (element.duration_in_traffic ?? element.duration).value as number
    const travelMin    = Math.ceil(travelSec / 60)
    const distanceText = element.distance.text as string   // ex: "3,2 km"
    const distanceM    = element.distance.value as number  // mètres

    // 4. ETA final selon statut
    let etaMin: number
    if (['ready', 'picked_up'].includes(order.status)) {
      // Livreur en route — uniquement le trajet
      etaMin = travelMin
    } else {
      // Toujours en prépa
      etaMin = prepLeft + travelMin
    }

    const estimatedAt = new Date(Date.now() + etaMin * 60_000).toISOString()

    // 5. Persister l'ETA sur la commande
    await supabase
      .from('orders')
      .update({ estimated_delivery_at: estimatedAt })
      .eq('id', order_id)

    return new Response(
      JSON.stringify({
        eta_min:        etaMin,
        prep_left_min:  prepLeft,
        travel_min:     travelMin,
        distance_text:  distanceText,
        distance_m:     distanceM,
        estimated_at:   estimatedAt,
        status:         order.status,
        has_traffic:    !!element.duration_in_traffic,
      }),
      {
        status: 200,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      },
    )
  } catch (err) {
    if (err instanceof Response) {
      const body = await err.text()
      return new Response(body, {
        status: err.status,
        headers: buildResponseHeaders(req, Object.fromEntries(err.headers.entries())),
      })
    }
    console.error(err)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
    })
  }
})
