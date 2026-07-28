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
    const rawOrderId    = transaction.order_id
    const transactionId = transaction.id ?? event?.id
    const paidAmount    = transaction.amount

    if (!rawOrderId) {
      return new Response(JSON.stringify({ error: 'Missing order_id in payload' }), { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // create-subscription-payment-token prefixes its order_id with "sub:" so
    // this webhook can tell a plan upgrade apart from a regular order.
    if (typeof rawOrderId === 'string' && rawOrderId.startsWith('sub:')) {
      return await handleSubscriptionPayment(supabase, rawOrderId.slice(4), transactionId, paidAmount)
    }
    return await handleOrderPayment(supabase, rawOrderId, transactionId, paidAmount)
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })
  }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleOrderPayment(supabase: any, orderId: string, transactionId: string | undefined, paidAmount: unknown) {
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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionPayment(supabase: any, paymentId: string, transactionId: string | undefined, paidAmount: unknown) {
  const { data: payment, error: payErr } = await supabase
    .from('subscription_payments')
    .select('id, vendor_id, plan, amount, status')
    .eq('id', paymentId)
    .single()

  if (payErr || !payment) {
    console.error('Webhook: subscription_payment not found for id', paymentId)
    return new Response(JSON.stringify({ error: 'Payment not found' }), { status: 404 })
  }

  if (payment.status === 'paid') {
    return new Response(JSON.stringify({ ok: true, already_paid: true }), { status: 200 })
  }

  if (typeof paidAmount === 'number') {
    const expectedAmount = Math.round(Number(payment.amount) * 100)
    if (paidAmount !== expectedAmount) {
      console.error(`Webhook amount mismatch for subscription_payment ${paymentId}: expected ${expectedAmount}, got ${paidAmount}`)
      return new Response(JSON.stringify({ error: 'Amount mismatch' }), { status: 400 })
    }
  }

  const now = new Date()
  const nowIso = now.toISOString()
  // Monthly plans — one month from confirmation, used to show the vendor
  // their remaining time and (eventually) drive renewal/expiry.
  const expiresAt = new Date(now)
  expiresAt.setMonth(expiresAt.getMonth() + 1)
  const expiresAtIso = expiresAt.toISOString()

  const { error: payUpdateErr } = await supabase
    .from('subscription_payments')
    .update({ status: 'paid', payment_transaction_id: transactionId ?? null, reviewed_at: nowIso })
    .eq('id', paymentId)
  if (payUpdateErr) throw payUpdateErr

  // Upsert-by-hand: subscriptions.vendor_id is unique, so try UPDATE first
  // (existing row from the "free" default created on vendor signup) and
  // INSERT only if that affected no rows.
  const { data: updated, error: subUpdateErr } = await supabase
    .from('subscriptions')
    .update({ plan: payment.plan, status: 'active', started_at: nowIso, expires_at: expiresAtIso })
    .eq('vendor_id', payment.vendor_id)
    .select()
  if (subUpdateErr) throw subUpdateErr

  if (!updated || updated.length === 0) {
    const { error: subInsertErr } = await supabase
      .from('subscriptions')
      .insert({ vendor_id: payment.vendor_id, plan: payment.plan, status: 'active', started_at: nowIso, expires_at: expiresAtIso })
    if (subInsertErr) throw subInsertErr
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}
