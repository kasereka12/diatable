import { createClient } from 'npm:@supabase/supabase-js'
import { buildResponseHeaders, handleCors } from '../_shared/secureHeaders.ts'
import { validateOrigin } from '../_shared/csrf.ts'

// Deleting the delivery_drivers row alone leaves the driver's login account
// (created by create-internal-driver) intact — they could still sign in and
// just get funneled back through onboarding. This also removes the actual
// auth.users account so deletion really means "can no longer connect".
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

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user: vendor }, error: authError } = await callerClient.auth.getUser()
    if (authError || !vendor) {
      throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { driver_id } = await req.json()
    if (!driver_id) {
      return new Response(JSON.stringify({ error: 'driver_id requis' }), {
        status: 400,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: driver, error: driverErr } = await admin
      .from('delivery_drivers')
      .select('id, profile_id, restaurant_id')
      .eq('id', driver_id)
      .single()

    if (driverErr || !driver) {
      return new Response(JSON.stringify({ error: 'Livreur introuvable' }), {
        status: 404,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    // Confirm this vendor owns the restaurant this driver is attached to
    // (RLS-backed — the JWT-scoped client only sees the vendor's own restaurant).
    const { data: restaurant, error: restErr } = await callerClient
      .from('restaurants')
      .select('id')
      .eq('id', driver.restaurant_id)
      .eq('owner_id', vendor.id)
      .single()

    if (restErr || !restaurant) {
      return new Response(JSON.stringify({ error: "Ce livreur ne vous appartient pas." }), {
        status: 403,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    const { error: deleteErr } = await admin.from('delivery_drivers').delete().eq('id', driver_id)
    if (deleteErr) throw deleteErr

    if (driver.profile_id) {
      await admin.auth.admin.deleteUser(driver.profile_id)
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
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
    console.error(err)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
    })
  }
})
