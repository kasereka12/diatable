import { X } from 'lucide-react'

interface Props {
  paymentUrl: string
  onClose: () => void
}

// Embeds YouCan Pay's Standalone hosted payment page in a modal instead of
// a full-page redirect, so the customer never technically leaves the site.
// Success is detected the same way as everywhere else in the payment flow —
// Checkout.tsx's Realtime subscription on orders.payment_status — not by
// trying to read the iframe's location (which is cross-origin and
// unreadable while on youcanpay.com anyway).
//
// NOTE: this only works if YouCan Pay's payment-form page allows being
// framed (no X-Frame-Options/CSP frame-ancestors restriction on their end).
// Our own CSP already allows framing youcanpay.com — if the iframe stays
// blank or shows a browser "refused to connect" error, that's on their
// side and this approach isn't viable; fall back to the full-page
// Standalone redirect link instead.
export default function PaymentModal({ paymentUrl, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg h-[85vh] max-h-[700px] overflow-hidden relative shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-dark transition-colors"
        >
          <X size={16} />
        </button>
        <iframe
          src={paymentUrl}
          title="Paiement YouCan Pay"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  )
}
