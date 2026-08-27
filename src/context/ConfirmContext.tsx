import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmOptions {
  title?:        string
  confirmLabel?: string
  cancelLabel?:  string
  /** false for a neutral (non-destructive) confirmation — defaults to true */
  danger?:       boolean
}

type ConfirmFn = (message: string, options?: ConfirmOptions) => Promise<boolean>

interface PendingConfirm {
  message: string
  options: ConfirmOptions
  resolve: (value: boolean) => void
}

const ConfirmContext = createContext<{ confirm: ConfirmFn } | null>(null)

// Promise-based drop-in for window.confirm() — `if (!(await confirm(msg))) return`
// mirrors `if (!window.confirm(msg)) return` at every call site, but renders
// as an in-app modal instead of a native browser popup.
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback<ConfirmFn>((message, options = {}) => {
    return new Promise<boolean>(resolve => {
      setPending({ message, options, resolve })
    })
  }, [])

  function close(result: boolean) {
    pending?.resolve(result)
    setPending(null)
  }

  const danger = pending?.options.danger !== false

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {pending && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => close(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-start gap-3 mb-6">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-50' : 'bg-amber-50'}`}>
                <AlertTriangle size={18} className={danger ? 'text-red-500' : 'text-amber-500'} />
              </div>
              <div className="min-w-0">
                {pending.options.title && (
                  <p className="font-semibold text-dark mb-1">{pending.options.title}</p>
                )}
                <p className="text-sm text-gray-600 leading-relaxed">{pending.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => close(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {pending.options.cancelLabel || 'Annuler'}
              </button>
              <button
                onClick={() => close(true)}
                autoFocus
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                  danger ? 'bg-red-500 hover:bg-red-600' : 'bg-[#c5611a] hover:bg-[#a04d12]'
                }`}
              >
                {pending.options.confirmLabel || 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmProvider')
  return ctx.confirm
}
