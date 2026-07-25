import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window { YCPay: any } // eslint-disable-line @typescript-eslint/no-explicit-any
}

const SCRIPT_SRC = 'https://pay.youcan.shop/js/ycpay.js'
const FORM_CONTAINER_ID = 'yc-pay-form-container'
const ERROR_CONTAINER_ID = 'yc-pay-form-error'

interface WidgetProps {
  tokenId: string
  publicKey: string
  isSandbox: boolean
  onSuccess: () => void
  onError: (message: string) => void
}

// Owns the actual ycpay.js instance and its DOM. Rendered with a `key` from
// the parent so a retry fully unmounts/remounts this component — ycpay.js
// leaves its own input-masking listeners (card number spacing, expiry
// auto-format) in a broken state if you just call renderCreditCardForm()
// again on the same containers after a failed attempt (it appears to append
// rather than replace), so we let React tear down and recreate the real DOM
// nodes instead of trying to reset the widget in place.
function CardWidget({ tokenId, publicKey, isSandbox, onSuccess, onError }: WidgetProps) {
  const ycPayRef = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [ready, setReady] = useState(false)
  const [paying, setPaying] = useState(false)

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
        onSuccess()
      })
      .catch((err: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        setPaying(false)
        onError(err?.message || 'Paiement refusé. Vérifiez vos informations de carte.')
      })
  }

  return (
    <div className="space-y-2">
      <div id={FORM_CONTAINER_ID} />
      <div id={ERROR_CONTAINER_ID} className="text-xs text-red-500" />
      <button
        type="button"
        onClick={handlePay}
        disabled={!ready || paying}
        className="btn btn-gold w-full justify-center text-sm disabled:opacity-50"
      >
        {paying ? 'Traitement en cours…' : 'Payer'}
      </button>
    </div>
  )
}

interface Props {
  tokenId: string
  publicKey: string
  isSandbox: boolean
}

export default function CardPaymentForm({ tokenId, publicKey, isSandbox }: Props) {
  const [payError, setPayError] = useState('')
  const [paySubmitted, setPaySubmitted] = useState(false)
  const [widgetKey, setWidgetKey] = useState(0)

  if (paySubmitted) {
    return (
      <p className="text-xs text-muted text-center">
        Paiement transmis — confirmation en cours…
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <CardWidget
        key={widgetKey}
        tokenId={tokenId}
        publicKey={publicKey}
        isSandbox={isSandbox}
        onSuccess={() => setPaySubmitted(true)}
        onError={setPayError}
      />
      {payError && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-red-500">{payError}</p>
          <button
            type="button"
            onClick={() => { setPayError(''); setWidgetKey(k => k + 1) }}
            className="text-xs font-semibold text-gold underline flex-shrink-0"
          >
            Réessayer
          </button>
        </div>
      )}
    </div>
  )
}
