// Creates an order with its items, computing subtotal/delivery_fee/total
// server-side from trusted data (real menu_items prices, restaurant
// coordinates, platform_settings) instead of trusting client-supplied
// amounts. The client only sends menu_item_id + quantity, never a price.
//
// This closes a gap where a client could otherwise insert an order directly
// (via the Supabase client) with an arbitrary total and then pay that
// (much smaller) amount by card while getting the real order fulfilled.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildResponseHeaders, handleCors } from '../_shared/secureHeaders.ts'
import { validateOrigin } from '../_shared/csrf.ts'
import { checkRateLimit } from '../_shared/ratelimit.ts'

const RATE_LIMIT_MAX = 20
const RATE_LIMIT_WINDOW_SEC = 3600

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function estimateTravelMin(distKm: number) {
  return Math.ceil(distKm * 3)
}

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req)
  if (preflight) return preflight

  try {
    validateOrigin(req)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const authedClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: authError } = await authedClient.auth.getUser()
    if (authError || !user) {
      throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await checkRateLimit(user.id, 'create-order', RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SEC)

    const body = await req.json()
    const {
      restaurant_id, items, delivery_mode, payment_method,
      delivery_address, delivery_phone, delivery_notes, customer_name,
      delivery_zone, delivery_lat, delivery_lng,
    } = body

    if (!restaurant_id || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Panier invalide' }), {
        status: 400,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }
    if (!['delivery', 'pickup'].includes(delivery_mode)) {
      return new Response(JSON.stringify({ error: 'Mode de livraison invalide' }), {
        status: 400,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: restaurant, error: restErr } = await supabase
      .from('restaurants')
      .select('id, is_active, latitude, longitude, prep_time_min')
      .eq('id', restaurant_id)
      .maybeSingle()

    if (restErr || !restaurant || !restaurant.is_active) {
      return new Response(JSON.stringify({ error: 'Restaurant introuvable' }), {
        status: 404,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    const menuItemIds = items.map((i: { menu_item_id: string }) => i.menu_item_id)
    const { data: menuItems, error: menuErr } = await supabase
      .from('menu_items')
      .select('id, name, price, is_available, restaurant_id')
      .in('id', menuItemIds)

    if (menuErr) throw menuErr

    const menuById = new Map((menuItems || []).map((m: any) => [m.id, m])) // eslint-disable-line @typescript-eslint/no-explicit-any

    let subtotal = 0
    const orderItemsToInsert: Record<string, unknown>[] = []
    for (const item of items) {
      const menuItem = menuById.get(item.menu_item_id)
      const quantity = Number(item.quantity)
      if (!menuItem || menuItem.restaurant_id !== restaurant_id || !menuItem.is_available) {
        return new Response(JSON.stringify({ error: `Plat indisponible : ${item.menu_item_id}` }), {
          status: 409,
          headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
        })
      }
      if (!Number.isFinite(quantity) || quantity < 1 || quantity > 50) {
        return new Response(JSON.stringify({ error: 'Quantité invalide' }), {
          status: 400,
          headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
        })
      }
      const price = Number(menuItem.price)
      subtotal += price * quantity
      orderItemsToInsert.push({ menu_item_id: menuItem.id, name: menuItem.name, price, quantity })
    }
    subtotal = Math.round(subtotal * 100) / 100

    const isPickup = delivery_mode === 'pickup'
    let deliveryFee = 0
    let travelMin = 0

    if (!isPickup && restaurant.latitude && restaurant.longitude && delivery_lat && delivery_lng) {
      const { data: settings } = await (supabase.from('platform_settings') as any)
        .select('delivery_base_fee, delivery_price_per_km, delivery_max_fee')
        .eq('id', 1)
        .maybeSingle()

      const baseFee    = Number(settings?.delivery_base_fee ?? 8)
      const pricePerKm = Number(settings?.delivery_price_per_km ?? 2.5)
      const maxFee     = Number(settings?.delivery_max_fee ?? 30)

      const distanceKm = haversineKm(
        Number(restaurant.latitude), Number(restaurant.longitude),
        Number(delivery_lat), Number(delivery_lng),
      )
      travelMin = estimateTravelMin(distanceKm)
      const rawFee = baseFee + pricePerKm * distanceKm
      deliveryFee = Math.round(maxFee > 0 ? Math.min(rawFee, maxFee) : rawFee)
    }

    const total = Math.round((subtotal + deliveryFee) * 100) / 100
    const prepTime = Number(restaurant.prep_time_min ?? 15)
    const estimatedTime = !isPickup && travelMin > 0 ? prepTime + travelMin : null

    const { data: order, error: orderErr } = await (supabase.from('orders') as any)
      .insert({
        customer_id: user.id,
        restaurant_id,
        payment_method: ['cash_on_delivery', 'card', 'mobile_payment'].includes(payment_method)
          ? payment_method : 'cash_on_delivery',
        delivery_mode,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        delivery_address: String(delivery_address || '').slice(0, 500),
        delivery_phone: String(delivery_phone || '').slice(0, 50),
        delivery_notes: String(delivery_notes || '').slice(0, 1000),
        customer_name: String(customer_name || '').slice(0, 200),
        delivery_zone: delivery_zone || null,
        delivery_lat: !isPickup ? delivery_lat ?? null : null,
        delivery_lng: !isPickup ? delivery_lng ?? null : null,
        estimated_time: estimatedTime,
      })
      .select()
      .single()

    if (orderErr || !order) {
      console.error('create-order: order insert failed', orderErr)
      throw new Error('order')
    }

    const { error: itemsErr } = await (supabase.from('order_items') as any)
      .insert(orderItemsToInsert.map(item => ({ ...item, order_id: order.id })))

    if (itemsErr) {
      console.error('create-order: order_items insert failed', itemsErr)
      // Best-effort cleanup so a failed items insert doesn't leave a
      // zero-item order behind.
      await supabase.from('orders').delete().eq('id', order.id)
      throw new Error('items')
    }

    return new Response(JSON.stringify(order), {
      status: 201,
      headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
    })
  } catch (err) {
    if (err instanceof Response) {
      const body = await err.text()
      return new Response(body, {
        status: err.status,
        headers: buildResponseHeaders(req, Object.fromEntries(err.headers.entries())),
      })
    }
    const message = err instanceof Error ? err.message : 'unknown'
    if (message === 'items') {
      return new Response(JSON.stringify({ error: 'items' }), {
        status: 500,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }
    console.error(err)
    return new Response(JSON.stringify({ error: 'order' }), {
      status: 500,
      headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
    })
  }
})
