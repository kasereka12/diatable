import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, Clock, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

// Landing page YouCan Pay redirects back to after a payment attempt
// (including after a 3D Secure challenge) — usually inside the payment
// popup opened from Checkout.tsx / VendorDashboard.tsx, so this page's own
// window may close itself once the outcome is clear (the opener tab is
// what the customer actually keeps looking at — it independently detects
// success via its own Realtime subscription and closes this popup).
//
// Handles two payment kinds, distinguished by which query param is present:
//   ?order=<id>              — a food order (card payment)
//   ?payment=<id>&type=subscription — a vendor plan upgrade
//
// Success is never taken from the redirect's own query params (is_success/
// success) — those come straight from the browser/gateway and aren't proof
// of anything server-side. This page waits for the row's status to
// actually flip to 'paid' via the youcanpay-webhook Edge Function. Failure,
// on the other hand, IS shown directly from those params — YouCan Pay never
// sends a webhook for a declined transaction, so there is nothing to wait
// for, and leaving the customer on an infinite spinner is worse than
// trusting "this specific attempt didn't go through".
export default function PaymentReturn() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order')
  const isSubscription = searchParams.get('type') === 'subscription'
  const subPaymentId = isSubscription ? searchParams.get('payment') : null
  const failed = searchParams.get('is_success') === '0' || searchParams.get('success') === '0'
  const failureMessage = searchParams.get('message')
  const [status, setStatus] = useState<'checking' | 'paid' | 'pending' | 'failed'>(failed ? 'failed' : 'checking')

  useEffect(() => {
    if (failed) return
    const table = isSubscription ? 'subscription_payments' : 'orders'
    const id = isSubscription ? subPaymentId : orderId
    if (!id) return

    let cancelled = false

    async function check() {
      const { data } = await (supabase.from(table) as any)
        .select(isSubscription ? 'status' : 'payment_status')
        .eq('id', id)
        .maybeSingle()
      if (cancelled) return
      const paid = isSubscription ? data?.status === 'paid' : data?.payment_status === 'paid'
      setStatus(paid ? 'paid' : 'pending')
    }
    check()

    const channel = supabase
      .channel(`payment-return-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table, filter: `id=eq.${id}`,
      }, (payload) => {
        const paid = isSubscription ? payload.new.status === 'paid' : payload.new.payment_status === 'paid'
        if (paid) setStatus('paid')
      })
      .subscribe()

    return () => { cancelled = true; supabase.removeChannel(channel) }
  }, [orderId, subPaymentId, isSubscription, failed])

  const inPopup = typeof window !== 'undefined' && !!window.opener
  const hasId = isSubscription ? !!subPaymentId : !!orderId

  return (
    <div className="min-h-screen bg-cream pt-24 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-black/[0.05] max-w-md w-full text-center">
        {status === 'checking' && (
          <>
            <div className="w-10 h-10 mx-auto mb-4 border-3 border-gold/30 border-t-gold rounded-full animate-spin" />
            <p className="text-dark font-semibold">Vérification du paiement…</p>
          </>
        )}
        {status === 'pending' && (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-amber-500" />
            </div>
            <h1 className="font-serif text-xl font-bold text-dark mb-2">Paiement en attente de confirmation</h1>
            <p className="text-muted text-sm mb-6">
              {isSubscription
                ? 'Ça peut prendre quelques instants. Votre plan passera automatiquement une fois confirmé.'
                : 'Ça peut prendre quelques instants. Vous pouvez suivre votre commande depuis "Mes commandes" — elle passera automatiquement en payée dès confirmation.'}
            </p>
          </>
        )}
        {status === 'paid' && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h1 className="font-serif text-xl font-bold text-dark mb-2">Paiement confirmé !</h1>
            <p className="text-muted text-sm mb-6">
              {isSubscription ? 'Votre abonnement a été mis à jour.' : 'Votre commande a bien été prise en compte.'}
            </p>
          </>
        )}
        {status === 'failed' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-500" />
            </div>
            <h1 className="font-serif text-xl font-bold text-dark mb-2">Paiement refusé</h1>
            <p className="text-muted text-sm mb-6">
              {failureMessage || 'Le paiement n\'a pas pu être traité. Vérifiez vos informations de carte et réessayez.'}
            </p>
          </>
        )}
        {!hasId && !failed && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-500" />
            </div>
            <p className="text-dark font-semibold">Paiement introuvable</p>
          </>
        )}

        {inPopup ? (
          <button
            type="button"
            onClick={() => window.close()}
            className="btn btn-gold text-sm w-full justify-center"
          >
            Fermer cette fenêtre
          </button>
        ) : isSubscription ? (
          <Link to="/tableau-de-bord" className="btn btn-gold text-sm w-full justify-center">
            Retour au tableau de bord
          </Link>
        ) : (
          <Link to="/mes-commandes" className="btn btn-gold text-sm w-full justify-center">
            Voir mes commandes
          </Link>
        )}
      </div>
    </div>
  )
}
