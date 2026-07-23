import { useEffect } from 'react'

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
}

// Mounts YouCan Pay's embedded card form ("Default" integration) for a given
// payment token. This never sees or transmits raw card numbers through our
// own server — ycpay.js posts directly to YouCan Pay.
//
// NOTE: the exact option name for attaching the token to the widget, and the
// success/error callback API, weren't available in YouCan Pay's public docs
// at the time this was written (see supabase/functions/create-payment-token
// for the full context). This component only renders the card fields; the
// actual "did it work" signal comes from the server-confirmed
// orders.payment_status (set by the youcanpay-webhook function), which
// Checkout.tsx subscribes to via Supabase Realtime. Verify this wiring
// against the real widget once sandbox keys are available — check the
// browser network tab / YouCan Pay's dashboard docs for the confirmed option
// and callback names, and adjust the `new YCPay(...)` call below.
export default function CardPaymentForm({ tokenId, publicKey, isSandbox }: Props) {
  useEffect(() => {
    let cancelled = false

    function init() {
      if (cancelled || !window.YCPay) return
      const ycPay = new window.YCPay(publicKey, {
        formContainer: `#${FORM_CONTAINER_ID}`,
        errorContainer: `#${ERROR_CONTAINER_ID}`,
        locale: 'fr',
        isSandbox,
        tokenId,
      })
      ycPay.renderCreditCardForm()
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
  }, [tokenId, publicKey, isSandbox])

  return (
    <div className="space-y-2">
      <div id={FORM_CONTAINER_ID} />
      <div id={ERROR_CONTAINER_ID} className="text-xs text-red-500" />
    </div>
  )
}
