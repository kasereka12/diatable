import { buildResponseHeaders, handleCors } from '../_shared/secureHeaders.ts'
import { validateOrigin } from '../_shared/csrf.ts'
import { checkRateLimit, getClientIP } from '../_shared/ratelimit.ts'

// Rate limit: 5 login attempts per IP per 60 seconds
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_SEC = 60

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req)
  if (preflight) return preflight

  try {
    validateOrigin(req)

    const ip = getClientIP(req)
    await checkRateLimit(ip, 'login', RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SEC)

    const { email, password } = await req.json()

    // Forward to Supabase Auth REST API — SUPABASE_URL and SUPABASE_ANON_KEY
    // are injected automatically by the Supabase Edge Functions runtime
    const authRes = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
        },
        body: JSON.stringify({ email, password }),
      },
    )

    const data = await authRes.json()

    // Credentials valid — but block suspended/banned accounts before handing
    // out a usable session. Checked here (not just client-side) so a
    // suspended/banned user can't just skip the client-side check.
    if (authRes.ok && data.access_token && data.user?.id) {
      const profRes = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/rest/v1/profiles?id=eq.${data.user.id}&select=status`,
        {
          headers: {
            'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
            'Authorization': `Bearer ${data.access_token}`,
          },
        },
      )
      const profRows = await profRes.json()
      const status = profRows?.[0]?.status

      if (status === 'suspended' || status === 'banned') {
        // Invalidate the session we just issued
        await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
            'Authorization': `Bearer ${data.access_token}`,
          },
        })

        const message = status === 'banned'
          ? 'Votre compte a été banni. Contactez le support si vous pensez qu\'il s\'agit d\'une erreur.'
          : 'Votre compte a été suspendu temporairement. Contactez le support pour plus d\'informations.'

        return new Response(JSON.stringify({ error: message, error_description: message }), {
          status: 403,
          headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
        })
      }
    }

    return new Response(JSON.stringify(data), {
      status: authRes.status,
      headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
    })
  } catch (err) {
    if (err instanceof Response) {
      // Re-wrap to attach CORS headers (required for browser fetch to read the status)
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
