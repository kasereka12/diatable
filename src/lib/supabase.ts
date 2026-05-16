import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

const required = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
}

const missing = Object.entries(required)
  .filter(([, v]) => !v)
  .map(([k]) => k)

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}\n` +
    'Copy .env.example to .env and fill in your Supabase project credentials.'
  )
}

// Adds X-Requested-With to every Supabase JS client request.
// Browsers treat requests with this non-simple header as preflighted, which
// prevents cross-origin simple-request exploits (e.g. form-based CSRF).
const customFetch = (url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(options.headers)
  headers.set('X-Requested-With', 'XMLHttpRequest')
  return fetch(url, { ...options, headers })
}

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  { global: { fetch: customFetch } }
)

/**
 * Call a Supabase Edge Function with the required CSRF-safe headers.
 * Always use this instead of a bare fetch() for Edge Function calls.
 *
 * @example
 * const res = await callEdgeFunction('my-function', { data: 1 })
 */
export function callEdgeFunction(
  functionName: string,
  body?: unknown,
  options: RequestInit = {},
): Promise<Response> {
  const url = `${import.meta.env.VITE_SUPABASE_URL as string}/functions/v1/${functionName}`
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  headers.set('X-Requested-With', 'XMLHttpRequest')
  headers.set('apikey', anonKey)
  // Default to anon key; authenticated callers override with their user JWT
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${anonKey}`)
  }

  return fetch(url, {
    method: body !== undefined ? 'POST' : 'GET',
    ...options,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}
