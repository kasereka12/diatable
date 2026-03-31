import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle, AlertTriangle, X, Info } from 'lucide-react'

const ToastContext = createContext(null)

let toastId = 0

const ICONS = {
  success: CheckCircle,
  error: AlertTriangle,
  info: Info,
}

const COLORS = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const ICON_COLORS = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-blue-500',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  const removeToast = useCallback((id) => {
    clearTimeout(timersRef.current[id])
    delete timersRef.current[id]
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    timersRef.current[id] = setTimeout(() => removeToast(id), duration)
    return id
  }, [removeToast])

  const toast = useCallback({
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  }, [addToast])

  // Fix: toast needs to be a plain object, not useCallback result
  return (
    <ToastContext.Provider value={{ toast: { success: (msg, dur) => addToast(msg, 'success', dur), error: (msg, dur) => addToast(msg, 'error', dur), info: (msg, dur) => addToast(msg, 'info', dur) } }}>
      {children}

      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[300] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map(t => {
            const Icon = ICONS[t.type] || Info
            return (
              <div
                key={t.id}
                className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-in slide-in-from-right duration-300 ${COLORS[t.type]}`}
              >
                <Icon size={18} className={`flex-shrink-0 ${ICON_COLORS[t.type]}`} />
                <p className="text-sm font-medium flex-1">{t.message}</p>
                <button
                  onClick={() => removeToast(t.id)}
                  className="flex-shrink-0 p-0.5 rounded hover:bg-black/5 transition"
                  aria-label="Fermer"
                >
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx.toast
}
