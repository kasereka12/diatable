import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Package, Clock, CheckCircle, Utensils, Truck, XCircle,
  ArrowLeft, MessageCircle, MapPin, Phone, ChefHat
} from 'lucide-react'

const STATUS_CONFIG = {
  pending:    { label: 'En attente',     color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200', icon: Clock,       step: 0 },
  confirmed:  { label: 'Confirmée',     color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',  icon: CheckCircle, step: 1 },
  preparing:  { label: 'En préparation', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: ChefHat,    step: 2 },
  ready:      { label: 'Prête',          color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', icon: Utensils,   step: 3 },
  delivered:  { label: 'Livrée',         color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  icon: Truck,      step: 4 },
  cancelled:  { label: 'Annulée',        color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    icon: XCircle,    step: -1 },
}

const STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']

function OrderCard({ order, onSelect }) {
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const StatusIcon = status.icon

  return (
    <button
      onClick={() => onSelect(order)}
      className="w-full bg-white rounded-2xl p-5 shadow-sm border border-black/[0.05] hover:-translate-y-0.5 hover:shadow-md transition-all text-left"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-serif font-bold text-dark text-base">{order.restaurant?.name || 'Restaurant'}</p>
          <p className="text-muted text-xs mt-0.5">
            #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${status.bg} ${status.color} ${status.border} border`}>
          <StatusIcon size={12} /> {status.label}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {order.order_items?.length || 0} article{(order.order_items?.length || 0) !== 1 ? 's' : ''}
        </p>
        <p className="font-bold text-dark">{Number(order.total).toFixed(2)} MAD</p>
      </div>
    </button>
  )
}

function OrderDetail({ order, onBack }) {
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const currentStep = status.step

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-muted text-sm hover:text-dark transition-colors flex items-center gap-1">
        <ArrowLeft size={16} /> Toutes les commandes
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/[0.05]">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-dark">{order.restaurant?.name}</h2>
            <p className="text-muted text-sm mt-0.5">Commande #{order.id.slice(0, 8)}</p>
          </div>
          <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full ${status.bg} ${status.color} ${status.border} border`}>
            <status.icon size={14} /> {status.label}
          </span>
        </div>

        {/* Progress tracker */}
        {order.status !== 'cancelled' && (
          <div className="flex items-center gap-1 mb-4">
            {STEPS.map((step, i) => {
              const done = i <= currentStep
              return (
                <div key={step} className="flex-1 flex items-center">
                  <div className={`h-1.5 w-full rounded-full transition-all ${done ? 'bg-gold' : 'bg-gray-100'}`} />
                </div>
              )
            })}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-muted text-xs mb-0.5">Date</p>
            <p className="text-dark font-semibold">
              {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div>
            <p className="text-muted text-xs mb-0.5">Paiement</p>
            <p className="text-dark font-semibold">À la livraison</p>
          </div>
          <div>
            <p className="text-muted text-xs mb-0.5">Adresse</p>
            <p className="text-dark font-semibold truncate">{order.delivery_address || '—'}</p>
          </div>
          <div>
            <p className="text-muted text-xs mb-0.5">Téléphone</p>
            <p className="text-dark font-semibold">{order.delivery_phone || '—'}</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/[0.05]">
        <h3 className="font-serif font-bold text-dark mb-4">Articles commandés</h3>
        <div className="space-y-3">
          {(order.order_items || []).map(item => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b border-black/[0.04] last:border-0">
              <div>
                <p className="text-sm font-semibold text-dark">
                  <span className="text-gold font-bold mr-1">{item.quantity}x</span>
                  {item.name}
                </p>
              </div>
              <p className="text-sm font-bold text-dark">{(Number(item.price) * item.quantity).toFixed(2)} MAD</p>
            </div>
          ))}
        </div>

        <div className="border-t border-black/[0.06] mt-4 pt-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Sous-total</span>
            <span className="text-dark">{Number(order.subtotal).toFixed(2)} MAD</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Livraison</span>
            <span className="text-dark">{Number(order.delivery_fee).toFixed(2)} MAD</span>
          </div>
          <div className="flex justify-between text-base font-bold pt-2 border-t border-black/[0.06]">
            <span className="text-dark">Total</span>
            <span className="text-gold-dark">{Number(order.total).toFixed(2)} MAD</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          to="/messages"
          className="btn btn-gold text-sm flex items-center gap-2"
        >
          <MessageCircle size={16} /> Contacter le vendeur
        </Link>
      </div>
    </div>
  )
}

export default function OrderTracking() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [activeTab, setActiveTab] = useState('active')

  useEffect(() => {
    if (!supabase || !user) { setLoading(false); return }

    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*), restaurant:restaurants(name, cuisine_label, flag)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      setOrders(data || [])
      setLoading(false)
    }
    load()

    // Realtime for order status updates
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user.id}`,
        },
        (payload) => {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
          if (selectedOrder?.id === payload.new.id) {
            setSelectedOrder(prev => ({ ...prev, ...payload.new }))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
  const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status))
  const displayedOrders = activeTab === 'active' ? activeOrders : pastOrders

  if (selectedOrder) {
    return (
      <div className="bg-cream min-h-screen pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-6">
          <OrderDetail order={selectedOrder} onBack={() => setSelectedOrder(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-cream min-h-screen pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-8">
          <Link to="/profil" className="text-muted text-sm hover:text-dark transition-colors flex items-center gap-1 mb-3">
            <ArrowLeft size={16} /> Mon profil
          </Link>
          <h1 className="font-serif text-3xl font-bold text-dark flex items-center gap-3">
            <Package size={28} className="text-gold" />
            Mes commandes
          </h1>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-black/[0.05] p-1.5 flex gap-1 mb-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'active' ? 'bg-gold text-dark shadow-sm' : 'text-muted hover:text-dark'
            }`}
          >
            En cours ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'past' ? 'bg-gold text-dark shadow-sm' : 'text-muted hover:text-dark'
            }`}
          >
            Historique ({pastOrders.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted">Chargement...</div>
        ) : displayedOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-black/[0.05]">
            <Package size={48} className="text-muted/20 mx-auto mb-4" />
            <p className="font-serif font-bold text-dark text-lg mb-2">
              {activeTab === 'active' ? 'Aucune commande en cours' : 'Aucune commande passée'}
            </p>
            <p className="text-muted text-sm mb-6">
              {activeTab === 'active' ? 'Commandez votre prochain repas !' : 'Votre historique apparaîtra ici'}
            </p>
            <Link to="/restaurants" className="btn btn-gold text-sm">
              Explorer les restaurants
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedOrders.map(order => (
              <OrderCard key={order.id} order={order} onSelect={setSelectedOrder} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
