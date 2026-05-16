// Shared security header utilities for Supabase Edge Functions (Deno runtime).
// Usage in any Edge Function:
//
//   import { buildResponseHeaders, handleCors } from '../_shared/secureHeaders.ts'
//
//   Deno.serve(async (req) => {
//     const cors = handleCors(req)
//     if (cors) return cors                          // preflight
//
//     const data = { hello: 'world' }
//     return new Response(JSON.stringify(data), {
//       headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
//     })
//   })

const PROD_ORIGIN = 'https://REPLACE_WITH_PROD_DOMAIN.vercel.app'
const DEV_ORIGIN  = 'http://localhost:5173'

const ALLOWED_ORIGINS = new Set<string>([PROD_ORIGIN, DEV_ORIGIN])

const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy':
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com; " +
    "img-src 'self' data: blob: https:; " +
    "font-src 'self' data:; " +
    "frame-src 'none'; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'",
  'X-Frame-Options':           'DENY',
  'X-Content-Type-Options':    'nosniff',
  'Referrer-Policy':           'strict-origin-when-cross-origin',
  'Permissions-Policy':        'camera=(), microphone=(), geolocation=(self)',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
}

function corsHeaders(requestOrigin: string): Record<string, string> {
  const origin = ALLOWED_ORIGINS.has(requestOrigin) ? requestOrigin : PROD_ORIGIN
  return {
    'Access-Control-Allow-Origin':       origin,
    'Access-Control-Allow-Methods':      'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':      'Content-Type, Authorization, X-Client-Info, ApiKey, X-Requested-With',
    'Access-Control-Allow-Credentials':  'true',
    // Expose rate-limit headers so browser fetch() callers can read them
    'Access-Control-Expose-Headers':     'Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset',
    'Vary': 'Origin',
  }
}

/**
 * Returns a complete headers object for a Response.
 * Merges security headers + CORS headers matched to the request origin.
 * Pass extra headers (e.g. Content-Type) as the second argument.
 */
export function buildResponseHeaders(
  req: Request,
  extra: Record<string, string> = {},
): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  return {
    ...SECURITY_HEADERS,
    ...corsHeaders(origin),
    ...extra,
  }
}

/**
 * Handles CORS preflight (OPTIONS) requests.
 * Call at the top of every Edge Function handler:
 *
 *   const cors = handleCors(req)
 *   if (cors) return cors
 */
export function handleCors(req: Request): Response | null {
  if (req.method !== 'OPTIONS') return null
  const origin = req.headers.get('Origin') ?? ''
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  })
}
