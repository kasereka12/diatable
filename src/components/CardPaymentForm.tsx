import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window { YCPay: any } // eslint-disable-line @typescript-eslint/no-explicit-any
}

const SCRIPT_SRC = 'https://pay.youcan.shop/js/ycpay.js'
const FORM_CONTAINER_ID = 'yc-pay-form-container'
const ERROR_CONTAINER_ID = 'yc-pay-form-error'

const LOADING_MESSAGES = [
  'Vérification de votre carte…',
  'Connexion sécurisée à votre banque…',
  'Traitement du paiement…',
  'Presque terminé…',
]

function PayingOverlay() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => Math.min(s + 1, LOADING_MESSAGES.length - 1))
    }, 1400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4">
      <div className="w-10 h-10 border-3 border-gold/30 border-t-gold rounded-full animate-spin" />
      <p className="text-sm font-medium text-dark text-center transition-all">
        {LOADING_MESSAGES[step]}
      </p>
    </div>
  )
}

interface Props {
  tokenId: string
  publicKey: string
  isSandbox: boolean
  // Called when the payment attempt fails — the parent shows the error and
  // sends the customer back to the checkout form rather than us trying to
  // reset/retry the widget in place (see prior attempts at that in git
  // history — ycpay.js doesn't support being re-initialized cleanly within
  // the same page load, so a full return to checkout is the reliable path).
  onError: (message: string) => void
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
// via Supabase Realtime — the promise result here only drives the
// loading/error UI, never the actual order fulfilment.
export default function CardPaymentForm({ tokenId, publicKey, isSandbox, onError }: Props) {
  const ycPayRef = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [ready, setReady] = useState(false)
  const [paying, setPaying] = useState(false)
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

    if (window.YCPay) {
      init()
      return
    }

    let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (!script) {
      script = document.createElement('script')
      script.src = SCRIPT_SRC
      script.async = true
      document.body.appendChild(script)
    }
    script.addEventListener('load', init)

    return () => {
      cancelled = true
      script?.removeEventListener('load', init)
    }
  }, [publicKey, isSandbox])

  function handlePay() {
    if (!ycPayRef.current) return
    setPaying(true)
    ycPayRef.current.pay(tokenId)
      .then(() => {
        setPaying(false)
        setPaySubmitted(true)
      })
      .catch((err: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        setPaying(false)
        onError(err?.message || 'Paiement refusé. Vérifiez vos informations de carte.')
      })
  }

  // The widget's containers stay mounted at all times (never removed from
  // the DOM) — ycpay.js holds references to them for the whole pay() call
  // (including any 3DS challenge), so pulling them out from under it mid-
  // flight would break that. Only visibility toggles; the overlay/messages
  // are layered on top instead.
  return (
    <div className="space-y-3">
      <div className={paying || paySubmitted ? 'hidden' : ''}>
        <div id={FORM_CONTAINER_ID} />
        <div id={ERROR_CONTAINER_ID} className="text-xs text-red-500" />
      </div>

      {paySubmitted ? (
        <p className="text-xs text-muted text-center">
          Paiement transmis — confirmation en cours…
        </p>
      ) : paying ? (
        <PayingOverlay />
      ) : (
        <button
          type="button"
          onClick={handlePay}
          disabled={!ready}
          className="btn btn-gold w-full justify-center text-sm disabled:opacity-50"
        >
          Payer
        </button>
      )}
    </div>
  )
}
