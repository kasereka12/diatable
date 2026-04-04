import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Package, Clock, CheckCircle, ChefHat, Utensils, Truck, XCircle,
  Eye, Phone, MapPin, MessageCircle
} from 'lucide-react'
import { Link } from 'react-router-dom'

const STATUS_CONFIG = {
  pending:    { label: 'En attente',      color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200', icon: Clock },
  confirmed:  { label: 'Confirmée',      color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200',  icon: CheckCircle },
  preparing:  { label: 'En préparation',  color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-200', icon: ChefHat },
  ready:      { label: 'Prête',           color: 'text-purple-600', bg: 'bg-purple-50',  border: 'border-purple-200', icon: Utensils },
  delivered:  { label: 'Livrée',          color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-200',  icon: Truck },
  cancelled:  { label: 'Annulée',         color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',    icon: XCircle },
}

const NEXT_STATUS = {
  pending:   'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready:     'delivered',
}

const NEXT_LABEL = {
  pending:   'Confirmer',
  confirmed: 'Commencer la préparation',
  preparing: 'Marquer comme prête',
  ready:     'Marquer comme livrée',
}

export default function VendorOrders({ restaurantId }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')
  const [expandedOrder, setExpandedOrder] = useState(null)

  useEffect(() => {
    if (!supabase || !restaurantId) { setLoading(false); return }

    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*), customer:profiles!orders_customer_id_fkey(full_name, email)')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })

      setOrders(data || [])
      setLoading(false)
    }
    load()

    // Realtime for new orders
    const channel = supabase
      .channel('vendor-orders-' + restaurantId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => load()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [restaurantId])

  async function updateStatus(orderId, newStatus) {
    if (!supabase) return
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
  }

  async function cancelOrder(orderId) {
    await updateStatus(orderId, 'cancelled')
  }

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
  const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status))
  const displayedOrders = activeTab === 'active' ? activeOrders : pastOrders

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-serif font-bold text-dark flex items-center gap-2">
          <Package size={24} className="text-gold" /> Commandes
        </h1>
        <div className="flex items-center gap-2">
          {activeOrders.length > 0 && (
            <span className="bg-gold text-dark text-xs font-bold px-3 py-1 rounded-full">
              {activeOrders.length} en cours
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-light p-1 flex gap-1">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'active' ? 'bg-yellow-400 text-gray-900' : 'text-gray-500 hover:text-dark'
          }`}
        >
          En cours ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'past' ? 'bg-yellow-400 text-gray-900' : 'text-gray-500 hover:text-dark'
          }`}
        >
          Historique ({pastOrders.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : displayedOrders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-light">
          <Package size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-dark mb-1">
            {activeTab === 'active' ? 'Aucune commande en cours' : 'Aucune commande passée'}
          </p>
          <p className="text-sm text-gray-400">
            {activeTab === 'active' ? 'Les nouvelles commandes apparaîtront ici en temps réel' : 'L\'historique de vos commandes apparaîtra ici'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map(order => {
            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
            const StatusIcon = status.icon
            const isExpanded = expandedOrder === order.id
            const nextStatus = NEXT_STATUS[order.status]
            const nextLabel = NEXT_LABEL[order.status]

            return (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-light overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-cream/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status.bg}`}>
                      <StatusIcon size={18} className={status.color} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-dark">
                        Commande #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {order.customer?.full_name || order.customer_name || 'Client'} · {new Date(order.created_at).toLocaleString('fr-FR', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      order.delivery_mode === 'pickup'
                        ? 'bg-violet-50 text-violet-600 border-violet-200'
                        : 'bg-sky-50 text-sky-600 border-sky-200'
                    } border`}>
                      {order.delivery_mode === 'pickup' ? '🏪 Retrait' : '🛵 Livraison'}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${status.bg} ${status.color} ${status.border} border`}>
                      {status.label}
                    </span>
                    <span className="text-sm font-bold text-dark">{Number(order.total).toFixed(2)} MAD</span>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-light">
                    {/* Customer info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={14} className="text-gold" />
                        <span className="text-dark">{order.delivery_phone || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={14} className="text-gold" />
                        <span className="text-dark truncate">{order.delivery_address || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Package size={14} className="text-gold" />
                        <span className="text-dark">
                          {order.delivery_mode === 'pickup' ? 'Retrait sur place' : 'Livraison à domicile'} · Paiement à la livraison
                        </span>
                      </div>
                    </div>

                    {order.delivery_notes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800 mb-4">
                        <strong>Note :</strong> {order.delivery_notes}
                      </div>
                    )}

                    {/* Items */}
                    <div className="space-y-2 mb-4">
                      {(order.order_items || []).map(item => (
                        <div key={item.id} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                          <span className="text-dark">
                            <span className="font-bold text-gold mr-1">{item.quantity}x</span>
                            {item.name}
                          </span>
                          <span className="text-dark font-semibold">{(Number(item.price) * item.quantity).toFixed(2)} MAD</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold pt-2 border-t border-light">
                        <span className="text-dark">Total</span>
                        <span className="text-gold-dark">{Number(order.total).toFixed(2)} MAD</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      {nextStatus && (
                        <button
                          onClick={() => updateStatus(order.id, nextStatus)}
                          className="bg-yellow-400 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-yellow-500 transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle size={14} /> {nextLabel}
                        </button>
                      )}
                      {order.status === 'pending' && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="border border-red-200 text-red-500 px-4 py-2 rounded-lg text-sm hover:bg-red-50 transition-colors flex items-center gap-1.5"
                        >
                          <XCircle size={14} /> Refuser
                        </button>
                      )}
                      <Link
                        to="/messages"
                        className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                      >
                        <MessageCircle size={14} /> Message
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
