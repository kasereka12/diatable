// Template for every new Edge Function — copy this, rename the directory.
// All security + CORS headers are injected via buildResponseHeaders / handleCors.

import { buildResponseHeaders, handleCors } from '../_shared/secureHeaders.ts'
import { validateOrigin } from '../_shared/csrf.ts'

Deno.serve(async (req: Request) => {
  // 1. Return 204 for CORS preflight immediately (no origin check needed)
  const preflight = handleCors(req)
  if (preflight) return preflight

  try {
    // 2. CSRF: reject requests from disallowed origins or wrong content-type
    validateOrigin(req)

    // 3. Your function logic here
    const data = { ok: true }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
    })
  } catch (err) {
    if (err instanceof Response) return err
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
    })
  }
})
