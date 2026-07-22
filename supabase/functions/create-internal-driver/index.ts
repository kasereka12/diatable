import { createClient } from 'npm:@supabase/supabase-js'
import { buildResponseHeaders, handleCors } from '../_shared/secureHeaders.ts'
import { validateOrigin } from '../_shared/csrf.ts'
import { checkRateLimit } from '../_shared/ratelimit.ts'

// Rate limit: 20 internal drivers created per vendor per day
const RATE_LIMIT_MAX = 20
const RATE_LIMIT_WINDOW_SEC = 86400

// Creates a real login account (email + password) for a driver a vendor adds
// to their own restaurant. Must run with the service-role key: creating an
// auth user via the client SDK would replace the *vendor's* current session
// with the new driver's, which is not what we want here.
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

    // Scoped to the caller's own JWT — used only to verify identity + that
    // they actually own the restaurant they're adding a driver to (RLS-backed).
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

    await checkRateLimit(vendor.id, 'create-internal-driver', RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SEC)

    const body = await req.json()
    const {
      restaurant_id, full_name, phone, email, password, vehicle_type,
      vehicle_brand, vehicle_plate, license_number,
      license_photo_url, photo_front, photo_back, photo_left, photo_right,
    } = body

    if (!restaurant_id || !full_name || !email || !password) {
      return new Response(JSON.stringify({ error: 'Champs requis manquants.' }), {
        status: 400,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    // Confirm this vendor actually owns the restaurant (RLS on `restaurants`
    // only lets a vendor see their own row via this JWT-scoped client).
    const { data: restaurant, error: restErr } = await callerClient
      .from('restaurants')
      .select('id')
      .eq('id', restaurant_id)
      .eq('owner_id', vendor.id)
      .single()

    if (restErr || !restaurant) {
      return new Response(JSON.stringify({ error: "Ce restaurant ne vous appartient pas." }), {
        status: 403,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    // Service-role client: creates the auth user and inserts the driver row,
    // bypassing RLS (ownership was already verified above).
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: 'driver' },
    })

    if (createErr || !created?.user) {
      const msg = (createErr?.message || '').toLowerCase()
      const message = msg.includes('already registered') || msg.includes('already been registered')
        ? 'Cette adresse email est déjà utilisée.'
        : (createErr?.message || 'Erreur lors de la création du compte.')
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    const { data: driver, error: dbErr } = await admin
      .from('delivery_drivers')
      .insert({
        profile_id: created.user.id,
        type: 'restaurant',
        restaurant_id,
        full_name,
        phone: phone || null,
        email,
        vehicle_type: vehicle_type || null,
        vehicle_brand: vehicle_brand || null,
        vehicle_plate: vehicle_plate || null,
        license_number: license_number || null,
        license_photo_url: license_photo_url || null,
        photo_front: photo_front || null,
        photo_back: photo_back || null,
        photo_left: photo_left || null,
        photo_right: photo_right || null,
        is_active: false,
        is_available: true,
      })
      .select()
      .single()

    if (dbErr) throw dbErr

    return new Response(JSON.stringify(driver), {
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
    console.error(err)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
    })
  }
})
