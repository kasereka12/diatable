import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'

export default function CartDrawer() {
  const { cart, itemCount, subtotal, deliveryFee, total, isCartOpen, setIsCartOpen, updateQuantity, removeItem, clearCart } = useCart()

  if (!isCartOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[998] transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[999] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-gold" />
            <h2 className="font-serif font-bold text-dark text-lg">Mon Panier</h2>
            {itemCount > 0 && (
              <span className="bg-gold text-dark text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-lg hover:bg-cream transition-colors"
            aria-label="Fermer le panier"
          >
            <X size={20} className="text-dark" />
          </button>
        </div>

        {/* Content */}
        {itemCount === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <ShoppingBag size={56} className="text-muted/30 mb-4" />
            <p className="font-serif font-bold text-dark text-lg mb-2">Votre panier est vide</p>
            <p className="text-muted text-sm mb-6">Parcourez nos restaurants et ajoutez des plats</p>
            <Link
              to="/restaurants"
              onClick={() => setIsCartOpen(false)}
              className="btn btn-gold text-sm"
            >
              Explorer les restaurants
            </Link>
          </div>
        ) : (
          <>
            {/* Restaurant name */}
            <div className="px-6 py-3 bg-cream/50 border-b border-black/[0.04]">
              <p className="text-xs text-muted font-semibold uppercase tracking-wider">Commande chez</p>
              <p className="text-sm font-bold text-dark mt-0.5">{cart.restaurantName}</p>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cart.items.map(item => (
                <div key={item.menuItemId} className="flex items-start gap-3 pb-4 border-b border-black/[0.04] last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark">{item.name}</p>
                    <p className="text-gold-dark text-sm font-bold mt-1">{item.price} MAD</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-cream flex items-center justify-center hover:bg-gold/20 transition-colors"
                      aria-label="Réduire la quantité"
                    >
                      <Minus size={14} className="text-dark" />
                    </button>
                    <span className="text-sm font-bold text-dark w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-cream flex items-center justify-center hover:bg-gold/20 transition-colors"
                      aria-label="Augmenter la quantité"
                    >
                      <Plus size={14} className="text-dark" />
                    </button>
                    <button
                      onClick={() => removeItem(item.menuItemId)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-muted hover:text-red-500 transition-colors ml-1"
                      aria-label="Supprimer l'article"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer with totals */}
            <div className="px-6 py-5 border-t border-black/[0.06] bg-white">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Sous-total</span>
                  <span className="text-dark font-semibold">{subtotal.toFixed(2)} MAD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Frais de livraison</span>
                  <span className="text-dark font-semibold">{deliveryFee.toFixed(2)} MAD</span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-black/[0.06]">
                  <span className="font-bold text-dark">Total</span>
                  <span className="font-bold text-gold-dark text-lg">{total.toFixed(2)} MAD</span>
                </div>
              </div>

              <Link
                to="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="btn btn-gold w-full justify-center text-sm gap-2"
              >
                Passer la commande <ArrowRight size={16} />
              </Link>

              <button
                onClick={clearCart}
                className="w-full mt-2 text-center text-xs text-muted hover:text-red-500 transition-colors py-2"
              >
                Vider le panier
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
