import { useCart } from '../context/CartContext'
import { AlertTriangle, X } from 'lucide-react'

export default function CartSwitchDialog() {
  const { pendingSwitch, confirmSwitch, cancelSwitch, cart } = useCart()

  if (!pendingSwitch) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={cancelSwitch} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
        <button
          onClick={cancelSwitch}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition"
          aria-label="Fermer"
        >
          <X size={18} className="text-gray-400" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>
          <h3 className="font-semibold text-dark text-lg">Changer de restaurant ?</h3>
        </div>

        <p className="text-gray-600 text-sm mb-6">
          Votre panier contient des articles de <strong>{cart.restaurantName}</strong>.
          Ajouter un article de <strong>{pendingSwitch.restaurantName}</strong> videra votre panier actuel.
        </p>

        <div className="flex gap-3">
          <button
            onClick={cancelSwitch}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Annuler
          </button>
          <button
            onClick={confirmSwitch}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gold text-white text-sm font-medium hover:bg-gold/90 transition"
          >
            Vider et ajouter
          </button>
        </div>
      </div>
    </div>
  )
}
