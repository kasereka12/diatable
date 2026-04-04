import { createContext, useContext, useState, useCallback } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ restaurantId: null, restaurantName: '', items: [] })
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [deliveryMode, setDeliveryMode] = useState('delivery') // 'delivery' | 'pickup'
  const [deliveryFeeOverride, setDeliveryFeeOverride] = useState(null)
  // Restaurant switch confirmation
  const [pendingSwitch, setPendingSwitch] = useState(null) // { restaurantId, restaurantName, item }

  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0)
  const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0)
  const deliveryFee = deliveryMode === 'pickup' ? 0 : (deliveryFeeOverride !== null ? deliveryFeeOverride : 0)
  const total = subtotal + deliveryFee

  const addItem = useCallback((restaurantId, restaurantName, item) => {
    setCart(prev => {
      if (prev.restaurantId && prev.restaurantId !== restaurantId) {
        // Don't silently replace — ask for confirmation
        setPendingSwitch({ restaurantId, restaurantName, item })
        return prev
      }

      const existing = prev.items.find(i => i.menuItemId === item.menuItemId)
      if (existing) {
        return {
          ...prev,
          restaurantId,
          restaurantName,
          items: prev.items.map(i =>
            i.menuItemId === item.menuItemId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        }
      }

      return {
        ...prev,
        restaurantId,
        restaurantName,
        items: [...prev.items, { ...item, quantity: 1 }],
      }
    })
    setIsCartOpen(true)
  }, [])

  const confirmSwitch = useCallback(() => {
    if (!pendingSwitch) return
    const { restaurantId, restaurantName, item } = pendingSwitch
    setCart({
      restaurantId,
      restaurantName,
      items: [{ ...item, quantity: 1 }],
    })
    setPendingSwitch(null)
    setIsCartOpen(true)
  }, [pendingSwitch])

  const cancelSwitch = useCallback(() => {
    setPendingSwitch(null)
  }, [])

  const removeItem = useCallback((menuItemId) => {
    setCart(prev => {
      const newItems = prev.items.filter(i => i.menuItemId !== menuItemId)
      if (newItems.length === 0) {
        return { restaurantId: null, restaurantName: '', items: [] }
      }
      return { ...prev, items: newItems }
    })
  }, [])

  const updateQuantity = useCallback((menuItemId, quantity) => {
    if (quantity <= 0) {
      removeItem(menuItemId)
      return
    }
    setCart(prev => ({
      ...prev,
      items: prev.items.map(i =>
        i.menuItemId === menuItemId ? { ...i, quantity } : i
      ),
    }))
  }, [removeItem])

  const clearCart = useCallback(() => {
    setCart({ restaurantId: null, restaurantName: '', items: [] })
    setIsCartOpen(false)
    setDeliveryMode('delivery')
    setDeliveryFeeOverride(null)
  }, [])

  return (
    <CartContext.Provider value={{
      cart, itemCount, subtotal, deliveryFee, total,
      deliveryMode, setDeliveryMode,
      deliveryFeeOverride, setDeliveryFeeOverride,
      addItem, removeItem, updateQuantity, clearCart,
      isCartOpen, setIsCartOpen,
      pendingSwitch, confirmSwitch, cancelSwitch,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
