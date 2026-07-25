// Creates a YouCan Pay payment for a vendor subscription upgrade (pro/
// premium). Mirrors create-payment-token's tokenize call, but for a
// subscription_payments row instead of an order — the youcanpay-webhook
// function tells the two apart by an "sub:" prefix on the order_id it sends
// to YouCan Pay (see that function for the matching logic).
//
// Price is looked up server-side from PLAN_PRICES, never trusted from the
// client, so a vendor can't request a token for an arbitrary amount.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildResponseHeaders, handleCors } from '../_shared/secureHeaders.ts'
import { validateOrigin } from '../_shared/csrf.ts'
import { checkRateLimit } from '../_shared/ratelimit.ts'

const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_SEC = 3600

const SITE_ORIGIN = Deno.env.get('SITE_ORIGIN') ?? 'https://diatable.vercel.app'

// MAD/month — keep in sync with the plan cards in VendorDashboard.tsx.
const PLAN_PRICES: Record<string, number> = {
  pro: 299,
  premium: 499,
}

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req)
  if (preflight) return preflight

  try {
    validateOrigin(req)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const authedClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: authError } = await authedClient.auth.getUser()
    if (authError || !user) {
      throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await checkRateLimit(user.id, 'create-subscription-payment-token', RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SEC)

    const { plan } = await req.json()
    const price = PLAN_PRICES[plan]
    if (!price) {
      return new Response(JSON.stringify({ error: 'Plan invalide' }), {
        status: 400,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: payment, error: insertErr } = await (supabase.from('subscription_payments') as any)
      .insert({ vendor_id: user.id, plan, amount: price, status: 'pending' })
      .select()
      .single()

    if (insertErr || !payment) {
      console.error('create-subscription-payment-token: insert failed', insertErr)
      return new Response(JSON.stringify({ error: 'order' }), {
        status: 500,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    const privateKey = Deno.env.get('YOUCANPAY_PRIVATE_KEY')
    if (!privateKey) {
      console.error('YOUCANPAY_PRIVATE_KEY is not configured')
      return new Response(JSON.stringify({ error: 'Paiement indisponible pour le moment' }), {
        status: 503,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    const amount = Math.round(price * 100) // centimes
    const returnUrl = `${SITE_ORIGIN}/tableau-de-bord?section=abonnement`

    const isSandboxKey = privateKey.startsWith('pri_sandbox_')
    const tokenizeUrl = isSandboxKey
      ? 'https://youcanpay.com/sandbox/api/tokenize'
      : 'https://youcanpay.com/api/tokenize'

    const ycRes = await fetch(tokenizeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pri_key: privateKey,
        amount,
        currency: 'MAD',
        order_id: `sub:${payment.id}`,
        success_url: returnUrl,
        error_url: returnUrl,
        customer: { email: user.email || undefined },
      }),
    })

    const ycData = await ycRes.json()
    if (!ycRes.ok || !ycData?.token?.id) {
      console.error('YouCan Pay tokenize failed:', ycData)
      return new Response(JSON.stringify({ error: 'Impossible de préparer le paiement' }), {
        status: 502,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    await supabase
      .from('subscription_payments')
      .update({ payment_transaction_id: ycData.transaction_id ?? null })
      .eq('id', payment.id)

    const paymentUrl = `https://youcanpay.com/${isSandboxKey ? 'sandbox/' : ''}payment-form/${ycData.token.id}?lang=fr`

    return new Response(
      JSON.stringify({ payment_url: paymentUrl, subscription_payment_id: payment.id }),
      {
        status: 200,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      },
    )
  } catch (err) {
    if (err instanceof Response) {
      const body = await err.text()
      return new Response(body, {
        status: err.status,
        headers: buildResponseHeaders(req, Object.fromEntries(err.headers.entries())),
      })
    }
    console.error(err)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
    })
  }
})
