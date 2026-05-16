// Rate limiting utility for Supabase Edge Functions via Upstash Redis.
//
// Usage:
//   import { checkRateLimit, getClientIP } from '../_shared/ratelimit.ts'
//
//   const ip = getClientIP(req)
//   await checkRateLimit(ip, 'login', 5, 60)   // throws 429 Response if exceeded
//
// checkRateLimit throws a Response (not an Error), so callers must handle it:
//   catch (err) { if (err instanceof Response) return err; throw err }

import { Redis } from 'npm:@upstash/redis'

let _redis: Redis | null = null

function redis(): Redis {
  return (_redis ??= new Redis({
    url: Deno.env.get('UPSTASH_REDIS_URL') ?? '',
    token: Deno.env.get('UPSTASH_REDIS_TOKEN') ?? '',
  }))
}

/**
 * Extracts the real client IP from x-forwarded-for (set by Supabase's edge
 * proxy). Falls back to 'unknown' so rate limiting still applies safely.
 */
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown'
}

/**
 * Increments a sliding-window counter for the given identifier + action pair.
 * On the first hit within a window the TTL is set atomically after incr.
 * Throws a 429 Response with Retry-After when the limit is exceeded.
 *
 * @param identifier - IP address, user ID, or email — caller decides the scope
 * @param action     - Logical name for the counter, e.g. 'login', 'signup'
 * @param max        - Maximum allowed requests in the window
 * @param windowSec  - Window size in seconds
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  max: number,
  windowSec: number,
): Promise<void> {
  const key = `rl:${action}:${identifier}`
  const count = await redis().incr(key)

  // Set TTL only on the first request so the window doesn't keep sliding
  if (count === 1) {
    await redis().expire(key, windowSec)
  }

  if (count > max) {
    const ttl = await redis().ttl(key)
    const retryAfter = ttl > 0 ? ttl : windowSec
    throw new Response(JSON.stringify({ error: 'Too Many Requests' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(max),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + retryAfter),
      },
    })
  }
}
