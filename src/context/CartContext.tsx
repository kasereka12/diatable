import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { CartItem } from '../types/supabase'

type DeliveryMode = 'delivery' | 'pickup'

interface CartState {
  restaurantId:   string | null
  restaurantName: string
  items:          CartItem[]
}

interface PendingSwitch {
  restaurantId:   string
  restaurantName: string
  item:           CartItem
}

interface CartContextValue {
  cart:                  CartState
  itemCount:             number
  subtotal:              number
  deliveryFee:           number
  total:                 number
  deliveryMode:          DeliveryMode
  setDeliveryMode:       (mode: DeliveryMode) => void
  deliveryFeeOverride:   number | null
  setDeliveryFeeOverride:(fee: number | null) => void
  addItem:               (restaurantId: string, restaurantName: string, item: Omit<CartItem, 'quantity'>) => void
  removeItem:            (menuItemId: string) => void
  updateQuantity:        (menuItemId: string, quantity: number) => void
  clearCart:             () => void
  isCartOpen:            boolean
  setIsCartOpen:         (open: boolean) => void
  pendingSwitch:         PendingSwitch | null
  confirmSwitch:         () => void
  cancelSwitch:          () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const EMPTY_CART: CartState = { restaurantId: null, restaurantName: '', items: [] }

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart,                setCart]                = useState<CartState>(EMPTY_CART)
  const [isCartOpen,          setIsCartOpen]          = useState(false)
  const [deliveryMode,        setDeliveryMode]        = useState<DeliveryMode>('delivery')
  const [deliveryFeeOverride, setDeliveryFeeOverride] = useState<number | null>(null)
  const [pendingSwitch,       setPendingSwitch]       = useState<PendingSwitch | null>(null)

  const itemCount  = cart.items.reduce((s, i) => s + i.quantity, 0)
  const subtotal   = cart.items.reduce((s, i) => s + i.price * i.quantity, 0)
  const deliveryFee = deliveryMode === 'pickup' ? 0 : (deliveryFeeOverride !== null ? deliveryFeeOverride : 0)
  const total      = subtotal + deliveryFee

  const addItem = useCallback((restaurantId: string, restaurantName: string, item: Omit<CartItem, 'quantity'>) => {
    setCart(prev => {
      if (prev.restaurantId && prev.restaurantId !== restaurantId) {
        setPendingSwitch({ restaurantId, restaurantName, item: { ...item, quantity: 1 } })
        return prev
      }
      const existing = prev.items.find(i => i.menuItemId === item.menuItemId)
      if (existing) {
        return {
          ...prev,
          restaurantId,
          restaurantName,
          items: prev.items.map(i =>
            i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i
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
    setCart({ restaurantId, restaurantName, items: [{ ...item, quantity: 1 }] })
    setPendingSwitch(null)
    setIsCartOpen(true)
  }, [pendingSwitch])

  const cancelSwitch = useCallback(() => { setPendingSwitch(null) }, [])

  const removeItem = useCallback((menuItemId: string) => {
    setCart(prev => {
      const newItems = prev.items.filter(i => i.menuItemId !== menuItemId)
      return newItems.length === 0 ? EMPTY_CART : { ...prev, items: newItems }
    })
  }, [])

  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    if (quantity <= 0) { removeItem(menuItemId); return }
    setCart(prev => ({
      ...prev,
      items: prev.items.map(i => i.menuItemId === menuItemId ? { ...i, quantity } : i),
    }))
  }, [removeItem])

  const clearCart = useCallback(() => {
    setCart(EMPTY_CART)
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

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
