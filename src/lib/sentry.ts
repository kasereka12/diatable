import * as Sentry from '@sentry/react'

// Error monitoring — only active when VITE_SENTRY_DSN is set. Safe no-op
// otherwise (local dev, or until a Sentry project is provisioned for v1).
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
  })
}

export { Sentry }
