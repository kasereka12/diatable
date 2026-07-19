const ALLOWED_ORIGINS = [
  'https://diatable.vercel.app',
  'http://localhost:5173',
]

/**
 * Validates the request origin against the allowlist and, for POST requests,
 * ensures the Content-Type is application/json.
 *
 * Throws a 403 Response (not an Error) so callers can re-throw it directly:
 *   try { validateOrigin(req) } catch (e) { if (e instanceof Response) return e; throw e }
 */
export function validateOrigin(req: Request): void {
  const origin = req.headers.get('origin') ?? ''

  if (!ALLOWED_ORIGINS.includes(origin)) {
    throw new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (req.method === 'POST') {
    const contentType = req.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      throw new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }
}
