// Receives YouCan Pay webhook events and confirms card payments.
//
// This is server-to-server (called by YouCan Pay's infrastructure, not the
// browser), so it is NOT gated by validateOrigin()/CORS like our other
// functions — instead it's protected by a shared secret in the registered
// webhook URL (?secret=...), set as the YOUCANPAY_WEBHOOK_SECRET env var and
// configured in the YouCan Pay dashboard's webhook settings.
//
// IMPORTANT — confirm once you have a sandbox account:
// YouCan Pay's public docs did not expose an authenticated "verify this
// transaction" endpoint at the time this was written, nor a webhook
// signature scheme. Until you find/confirm one in your dashboard's API
// reference, this handler trusts the webhook body for the event type and
// amount, protected only by the shared secret above + the amount/order
// cross-check below. Tighten this to re-fetch the transaction status from
// YouCan Pay's API server-side once that endpoint is confirmed — see
// https://developer.youcan.shop/youcan-pay/introduction
//
// https://developer.youcan.shop/youcan-pay/introduction (webhooks section)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 })
  }

  try {
    const url = new URL(req.url)
    const secret = url.searchParams.get('secret')
    const expectedSecret = Deno.env.get('YOUCANPAY_WEBHOOK_SECRET')
    if (!expectedSecret || secret !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const event = await req.json()
    console.log('YouCan Pay webhook received:', JSON.stringify(event))

    // Only the confirmed "transaction.paid" event triggers order fulfilment;
    // anything else is acknowledged (2xx) so YouCan Pay doesn't retry, but
    // otherwise ignored.
    if (event?.event_name !== 'transaction.paid') {
      return new Response(JSON.stringify({ ok: true, ignored: true }), { status: 200 })
    }

    const transaction = event?.payload?.transaction ?? {}
    const orderId       = transaction.order_id
    const transactionId = transaction.id ?? event?.id
    const paidAmount    = transaction.amount

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Missing order_id in payload' }), { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, status, total, payment_status, payment_transaction_id')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      console.error('Webhook: order not found for id', orderId)
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 })
    }

    // Already processed — acknowledge without reapplying (webhooks can be
    // redelivered).
    if (order.payment_status === 'paid') {
      return new Response(JSON.stringify({ ok: true, already_paid: true }), { status: 200 })
    }

    // Cross-check the amount when the payload provides one, to catch a
    // mismatched/tampered notification.
    if (typeof paidAmount === 'number') {
      const expectedAmount = Math.round(Number(order.total) * 100)
      if (paidAmount !== expectedAmount) {
        console.error(`Webhook amount mismatch for order ${orderId}: expected ${expectedAmount}, got ${paidAmount}`)
        return new Response(JSON.stringify({ error: 'Amount mismatch' }), { status: 400 })
      }
    }

    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        payment_transaction_id: transactionId ?? order.payment_transaction_id,
        // Card payment confirmed: move the order out of the customer's
        // control window (see the "Client peut annuler sa commande" RLS
        // policy, which only allows cancelling pending/confirmed orders —
        // this still applies, it just also reflects that payment cleared).
        status: order.status === 'pending' ? 'confirmed' : order.status,
      })
      .eq('id', orderId)

    if (updateErr) throw updateErr

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })
  }
})
