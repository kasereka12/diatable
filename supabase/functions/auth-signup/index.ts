import { buildResponseHeaders, handleCors } from '../_shared/secureHeaders.ts'
import { validateOrigin } from '../_shared/csrf.ts'
import { checkRateLimit, getClientIP } from '../_shared/ratelimit.ts'

// Rate limit: 3 signup attempts per IP per 300 seconds (5 minutes)
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_SEC = 300

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req)
  if (preflight) return preflight

  try {
    validateOrigin(req)

    const ip = getClientIP(req)
    await checkRateLimit(ip, 'signup', RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SEC)

    const body = await req.json()

    const authRes = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/auth/v1/signup`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
        },
        body: JSON.stringify(body),
      },
    )

    const data = await authRes.json()
    return new Response(JSON.stringify(data), {
      status: authRes.status,
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
