import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildResponseHeaders, handleCors } from '../_shared/secureHeaders.ts'
import { validateOrigin } from '../_shared/csrf.ts'
import { checkRateLimit } from '../_shared/ratelimit.ts'

// Rate limit: 10 avis submissions per user per hour
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_SEC = 3600

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req)
  if (preflight) return preflight

  try {
    validateOrigin(req)

    // Verify JWT and extract authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Rate limit by verified user ID
    await checkRateLimit(user.id, 'submit-avis', RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SEC)

    const { vendeur_id, note, commentaire } = await req.json()

    const { data, error } = await supabase
      .from('avis')
      .insert({ vendeur_id, note, commentaire, user_id: user.id })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify(data), {
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
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
    })
  }
})
