import { buildResponseHeaders, handleCors } from '../_shared/secureHeaders.ts'
import { validateOrigin } from '../_shared/csrf.ts'
import { checkRateLimit, getClientIP } from '../_shared/ratelimit.ts'

// Rate limit: 3 password-reset requests per email per hour.
// Also apply a secondary IP-level limit to block credential stuffing from one IP.
const EMAIL_LIMIT_MAX = 3
const EMAIL_LIMIT_WINDOW_SEC = 3600
const IP_LIMIT_MAX = 10
const IP_LIMIT_WINDOW_SEC = 3600

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req)
  if (preflight) return preflight

  try {
    validateOrigin(req)

    const { email, redirectTo } = await req.json()

    // Primary: per-email limit (the constraint the task specifies)
    await checkRateLimit(email.toLowerCase(), 'reset-password', EMAIL_LIMIT_MAX, EMAIL_LIMIT_WINDOW_SEC)
    // Secondary: per-IP limit to prevent enumeration from one IP
    const ip = getClientIP(req)
    await checkRateLimit(ip, 'reset-password-ip', IP_LIMIT_MAX, IP_LIMIT_WINDOW_SEC)

    const recoverUrl = new URL(`${Deno.env.get('SUPABASE_URL')}/auth/v1/recover`)
    if (redirectTo) recoverUrl.searchParams.set('redirect_to', redirectTo)

    await fetch(recoverUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
      },
      body: JSON.stringify({ email }),
    })

    // Return 200 regardless of whether the email exists (prevents enumeration)
    return new Response(JSON.stringify({ message: 'If this email is registered, a reset link has been sent.' }), {
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
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
    })
  }
})
