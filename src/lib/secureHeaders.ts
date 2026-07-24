// Canonical header values — kept in sync with vercel.json.
// Import this in Supabase Edge Functions via the _shared copy:
//   supabase/functions/_shared/secureHeaders.ts

const PROD_ORIGIN = 'https://diatable.vercel.app'
const DEV_ORIGIN  = 'http://localhost:5173'

export const ALLOWED_ORIGINS = new Set<string>([PROD_ORIGIN, DEV_ORIGIN])

export const SECURITY_HEADER_VALUES: Record<string, string> = {
  'Content-Security-Policy':
    "default-src 'self'; " +
    "script-src 'self' https://maps.googleapis.com https://pay.youcan.shop https://youcanpay.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://ui-assets.ycdn.store; " +
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com https://pay.youcan.shop https://youcanpay.com; " +
    "img-src 'self' data: blob: https:; " +
    "font-src 'self' data: https://fonts.gstatic.com https://ui-assets.ycdn.store; " +
    "frame-src https://pay.youcan.shop https://youcanpay.com; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'",
  'X-Frame-Options':           'DENY',
  'X-Content-Type-Options':    'nosniff',
  'Referrer-Policy':           'strict-origin-when-cross-origin',
  'Permissions-Policy':        'camera=(), microphone=(), geolocation=(self)',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
}

export function corsHeaders(requestOrigin: string): Record<string, string> {
  const origin = ALLOWED_ORIGINS.has(requestOrigin) ? requestOrigin : PROD_ORIGIN
  return {
    'Access-Control-Allow-Origin':  origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, ApiKey',
    'Vary': 'Origin',
  }
}

export function buildResponseHeaders(
  requestOrigin: string,
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    ...SECURITY_HEADER_VALUES,
    ...corsHeaders(requestOrigin),
    ...extra,
  }
}
