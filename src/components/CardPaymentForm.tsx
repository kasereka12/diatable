import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window { YCPay: any } // eslint-disable-line @typescript-eslint/no-explicit-any
}

const SCRIPT_SRC = 'https://pay.youcan.shop/js/ycpay.js'
const FORM_CONTAINER_ID = 'yc-pay-form-container'
const ERROR_CONTAINER_ID = 'yc-pay-form-error'

interface Props {
  tokenId: string
  publicKey: string
  isSandbox: boolean
  // Called when the customer wants to retry after a failed attempt. The
  // parent requests a brand new token/transaction and re-mounts this
  // component (via a `key` change) rather than us trying to reset the
  // widget in place — ycpay.js appears to only fully (re)initialize its
  // input masking/validation once per page load, so reusing the same
  // widget/token for a retry leaves the fields unmasked (no length limit,
  // no auto-formatting) even though payment still works if you type
  // correct values by hand. A fresh token in a fresh mount avoids that.
  onRetry: () => void
}

// Mounts YouCan Pay's embedded card form ("Default" integration) for a given
// payment token. This never sees or transmits raw card numbers through our
// own server — ycpay.js posts directly to YouCan Pay.
//
// renderCreditCardForm() only renders the input fields — it does not add a
// submit button. Payment is triggered explicitly via ycPay.pay(tokenId),
// which returns a promise (.then success / .catch error). The actual order
// completion still comes from the server-confirmed orders.payment_status
// (set by the youcanpay-webhook function), which Checkout.tsx subscribes to
// via Supabase Realtime — the promise result here is only used for
// immediate UI feedback (loading/error state on the button).
export default function CardPaymentForm({ tokenId, publicKey, isSandbox, onRetry }: Props) {
  const ycPayRef = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [ready, setReady] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const [paySubmitted, setPaySubmitted] = useState(false)

  useEffect(() => {
    let cancelled = false

    function init() {
      if (cancelled || !window.YCPay) return
      const ycPay = new window.YCPay(publicKey, {
        formContainer: `#${FORM_CONTAINER_ID}`,
        errorContainer: `#${ERROR_CONTAINER_ID}`,
        locale: 'fr',
        isSandbox,
      })
      ycPay.renderCreditCardForm()
      ycPayRef.current = ycPay
      setReady(true)
    }

    // Force ycpay.js to re-execute from scratch on every mount (including
    // retries) instead of reusing an already-loaded window.YCPay — its
    // input masking/length limits only seem to bind correctly the first
    // time the script itself runs on the page, not on subsequent
    // new YCPay(...) calls against a script that's already executed.
    document.querySelectorAll<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
      .forEach(el => el.remove())
    delete (window as any).YCPay // eslint-disable-line @typescript-eslint/no-explicit-any

    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.addEventListener('load', init)
    document.body.appendChild(script)

    return () => {
      cancelled = true
      script?.removeEventListener('load', init)
    }
  }, [tokenId, publicKey, isSandbox])

  function handlePay() {
    if (!ycPayRef.current) return
    setPaying(true)
    setPayError('')
    ycPayRef.current.pay(tokenId)
      .then(() => {
        setPaying(false)
        setPaySubmitted(true)
      })
      .catch((err: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        setPaying(false)
        setPayError(err?.message || 'Paiement refusé. Vérifiez vos informations de carte.')
      })
  }

  if (paySubmitted) {
    return (
      <p className="text-xs text-muted text-center">
        Paiement transmis — confirmation en cours…
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div id={FORM_CONTAINER_ID} />
      <div id={ERROR_CONTAINER_ID} className="text-xs text-red-500" />

      {payError ? (
        <div className="space-y-2">
          <p className="text-xs text-red-500">{payError}</p>
          <button
            type="button"
            onClick={onRetry}
            className="btn btn-gold w-full justify-center text-sm"
          >
            Réessayer avec une nouvelle transaction
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handlePay}
          disabled={!ready || paying}
          className="btn btn-gold w-full justify-center text-sm disabled:opacity-50"
        >
          {paying ? 'Traitement en cours…' : 'Payer'}
        </button>
      )}
    </div>
  )
}
