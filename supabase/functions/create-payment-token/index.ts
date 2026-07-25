// Creates a YouCan Pay payment token for an existing order ("Default"
// integration — the card form is rendered client-side via ycpay.js using the
// returned token id; card details never transit through our server).
//
// https://developer.youcan.shop/youcan-pay/introduction

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildResponseHeaders, handleCors } from '../_shared/secureHeaders.ts'
import { validateOrigin } from '../_shared/csrf.ts'
import { checkRateLimit } from '../_shared/ratelimit.ts'

const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_SEC = 3600

const SITE_ORIGIN = Deno.env.get('SITE_ORIGIN') ?? 'https://diatable.vercel.app'

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

    await checkRateLimit(user.id, 'create-payment-token', RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SEC)

    const { order_id } = await req.json()
    if (!order_id) {
      return new Response(JSON.stringify({ error: 'order_id requis' }), {
        status: 400,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    // Service-role client: reads/writes the order regardless of RLS, but we
    // enforce ownership explicitly below since RLS is bypassed here.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, customer_id, total, payment_status, payment_method, customer_name, delivery_phone')
      .eq('id', order_id)
      .single()

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Commande introuvable' }), {
        status: 404,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    if (order.customer_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    if (order.payment_status === 'paid') {
      return new Response(JSON.stringify({ error: 'Commande déjà payée' }), {
        status: 409,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    const privateKey = Deno.env.get('YOUCANPAY_PRIVATE_KEY')
    if (!privateKey) {
      console.error('YOUCANPAY_PRIVATE_KEY is not configured')
      return new Response(JSON.stringify({ error: 'Paiement par carte indisponible pour le moment' }), {
        status: 503,
        headers: buildResponseHeaders(req, { 'Content-Type': 'application/json' }),
      })
    }

    // Amount in the smallest MAD unit (centimes), per YouCan Pay's docs.
    const amount = Math.round(Number(order.total) * 100)
    const returnUrl = `${SITE_ORIGIN}/paiement/retour?order=${order.id}`

    // Sandbox and live keys hit different base URLs — mixing them causes
    // YouCan Pay to reject the call with "Sandbox key used on live mode".
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
        order_id: order.id,
        success_url: returnUrl,
        error_url: returnUrl,
        customer: {
          full_name: order.customer_name || undefined,
          phone: order.delivery_phone || undefined,
          email: user.email || undefined,
        },
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
      .from('orders')
      .update({ payment_transaction_id: ycData.transaction_id ?? null })
      .eq('id', order.id)

    // Standalone integration URL — exact formula from YouCan Pay's official
    // PHP SDK (Token::getPaymentURL): https://youcanpay.com/[sandbox/]payment-form/{token_id}?lang=fr
    const paymentUrl = `https://youcanpay.com/${isSandboxKey ? 'sandbox/' : ''}payment-form/${ycData.token.id}?lang=fr`

    return new Response(
      JSON.stringify({ token_id: ycData.token.id, transaction_id: ycData.transaction_id, payment_url: paymentUrl }),
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
