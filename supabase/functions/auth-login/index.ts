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
