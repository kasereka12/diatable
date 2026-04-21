import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Package, Clock, CheckCircle, Utensils, Truck, XCircle,
  ArrowLeft, MessageCircle, ChefHat
} from 'lucide-react'

const STATUS_CONFIG = {
  pending:    { label: 'En attente',      color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200',  icon: Clock,        step: 0 },
  confirmed:  { label: 'Confirmée',       color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200',   icon: CheckCircle,  step: 1 },
  preparing:  { label: 'En préparation',  color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-200', icon: ChefHat,      step: 2 },
  ready:      { label: 'Prête',           color: 'text-purple-600', bg: 'bg-purple-50',  border: 'border-purple-200', icon: Utensils,     step: 3 },
  delivered:  { label: 'Livrée',          color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-200',  icon: Truck,        step: 4 },
  cancelled:  { label: 'Annulée',         color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',    icon: XCircle,      step: -1 },
}

const STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']

function OrderCard({ order, onSelect }) {
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const StatusIcon = status.icon

  return (
    <button
      onClick={() => onSelect(order)}
      className="w-full rounded-2xl p-5 shadow-sm hover:-translate-y-0.5 transition-all text-left"
      style={{ backgroundColor: '#f8f8f8', border: '1px solid rgba(80,70,64,0.07)' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(80,70,64,0.12)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(80,70,64,0.06)'}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-serif font-bold text-base" style={{ color: '#1f1f1f' }}>
            {order.restaurant?.name || 'Restaurant'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#80716a' }}>
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
        <p className="text-sm" style={{ color: '#80716a' }}>
          {order.order_items?.length || 0} article{(order.order_items?.length || 0) !== 1 ? 's' : ''}
        </p>
        <p className="font-bold" style={{ color: '#1f1f1f' }}>{Number(order.total).toFixed(2)} MAD</p>
      </div>
    </button>
  )
}

function OrderDetail({ order, onBack }) {
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const currentStep = status.step

  return (
    <div className="space-y-6">
      <button onClick={onBack}
        className="text-sm flex items-center gap-1 transition-colors"
        style={{ color: '#80716a' }}
        onMouseEnter={e => e.currentTarget.style.color = '#1f1f1f'}
        onMouseLeave={e => e.currentTarget.style.color = '#80716a'}>
        <ArrowLeft size={16} /> Toutes les commandes
      </button>

      {/* Header */}
      <div className="rounded-2xl p-6 shadow-sm"
        style={{ backgroundColor: '#f8f8f8', border: '1px solid rgba(80,70,64,0.07)' }}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="font-serif text-xl font-bold" style={{ color: '#1f1f1f' }}>{order.restaurant?.name}</h2>
            <p className="text-sm mt-0.5" style={{ color: '#80716a' }}>Commande #{order.id.slice(0, 8)}</p>
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
                  <div className="h-1.5 w-full rounded-full transition-all"
                    style={{ backgroundColor: done ? '#c5611a' : 'rgba(80,70,64,0.12)' }} />
                </div>
              )
            })}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            { label: 'Date', value: new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) },
            { label: 'Paiement', value: 'À la livraison' },
            { label: 'Adresse', value: order.delivery_address || '—', truncate: true },
            { label: 'Téléphone', value: order.delivery_phone || '—' },
          ].map(({ label, value, truncate }) => (
            <div key={label}>
              <p className="text-xs mb-0.5" style={{ color: '#80716a' }}>{label}</p>
              <p className={`font-semibold ${truncate ? 'truncate' : ''}`} style={{ color: '#1f1f1f' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="rounded-2xl p-6 shadow-sm"
        style={{ backgroundColor: '#f8f8f8', border: '1px solid rgba(80,70,64,0.07)' }}>
        <h3 className="font-serif font-bold mb-4" style={{ color: '#1f1f1f' }}>Articles commandés</h3>
        <div className="space-y-3">
          {(order.order_items || []).map(item => (
            <div key={item.id} className="flex justify-between items-center py-2 last:border-0"
              style={{ borderBottom: '1px solid rgba(80,70,64,0.06)' }}>
              <p className="text-sm font-semibold" style={{ color: '#1f1f1f' }}>
                <span className="font-bold mr-1" style={{ color: '#c5611a' }}>{item.quantity}x</span>
                {item.name}
              </p>
              <p className="text-sm font-bold" style={{ color: '#1f1f1f' }}>
                {(Number(item.price) * item.quantity).toFixed(2)} MAD
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 space-y-1.5" style={{ borderTop: '1px solid rgba(80,70,64,0.08)' }}>
          {[
            { label: 'Sous-total', value: `${Number(order.subtotal).toFixed(2)} MAD` },
            { label: 'Livraison',  value: `${Number(order.delivery_fee).toFixed(2)} MAD` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span style={{ color: '#80716a' }}>{label}</span>
              <span style={{ color: '#1f1f1f' }}>{value}</span>
            </div>
          ))}
          <div className="flex justify-between text-base font-bold pt-2"
            style={{ borderTop: '1px solid rgba(80,70,64,0.08)' }}>
            <span style={{ color: '#1f1f1f' }}>Total</span>
            <span style={{ color: '#c5611a' }}>{Number(order.total).toFixed(2)} MAD</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link to="/messages" className="btn btn-gold text-sm flex items-center gap-2">
          <MessageCircle size={16} /> Contacter le vendeur
        </Link>
      </div>
    </div>
  )
}

export default function OrderTracking() {
  const { user } = useAuth()
  const [orders, setOrders]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [activeTab, setActiveTab]     = useState('active')

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

    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders',
        filter: `customer_id=eq.${user.id}`,
      }, (payload) => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
        if (selectedOrder?.id === payload.new.id) {
          setSelectedOrder(prev => ({ ...prev, ...payload.new }))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const activeOrders   = orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
  const pastOrders     = orders.filter(o => ['delivered', 'cancelled'].includes(o.status))
  const displayedOrders = activeTab === 'active' ? activeOrders : pastOrders

  if (selectedOrder) {
    return (
      <div className="min-h-screen pt-24 pb-12" style={{ backgroundColor: '#eae5d9' }}>
        <div className="max-w-3xl mx-auto px-6">
          <OrderDetail order={selectedOrder} onBack={() => setSelectedOrder(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12" style={{ backgroundColor: '#eae5d9' }}>
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-8">
          <Link to="/profil"
            className="text-sm flex items-center gap-1 mb-3 transition-colors"
            style={{ color: '#80716a' }}
            onMouseEnter={e => e.currentTarget.style.color = '#1f1f1f'}
            onMouseLeave={e => e.currentTarget.style.color = '#80716a'}>
            <ArrowLeft size={16} /> Mon profil
          </Link>
          <h1 className="font-serif text-3xl font-bold flex items-center gap-3" style={{ color: '#1f1f1f' }}>
            <Package size={28} style={{ color: '#c5611a' }} />
            Mes commandes
          </h1>
        </div>

        {/* Tabs */}
        <div className="rounded-xl p-1.5 flex gap-1 mb-8"
          style={{ backgroundColor: '#f8f8f8', border: '1px solid rgba(80,70,64,0.07)', boxShadow: '0 2px 8px rgba(80,70,64,0.06)' }}>
          {[
            { id: 'active', label: `En cours (${activeOrders.length})` },
            { id: 'past',   label: `Historique (${pastOrders.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={activeTab === tab.id ? {
                backgroundColor: '#c5611a',
                color: '#f8f8f8',
                boxShadow: '0 2px 8px rgba(197,97,26,0.25)',
              } : { color: '#80716a' }}
              onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = '#1f1f1f' }}
              onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = '#80716a' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12" style={{ color: '#80716a' }}>Chargement...</div>
        ) : displayedOrders.length === 0 ? (
          <div className="rounded-2xl p-12 text-center shadow-sm"
            style={{ backgroundColor: '#f8f8f8', border: '1px solid rgba(80,70,64,0.07)' }}>
            <Package size={48} className="mx-auto mb-4" style={{ color: 'rgba(80,70,64,0.20)' }} />
            <p className="font-serif font-bold text-lg mb-2" style={{ color: '#1f1f1f' }}>
              {activeTab === 'active' ? 'Aucune commande en cours' : 'Aucune commande passée'}
            </p>
            <p className="text-sm mb-6" style={{ color: '#80716a' }}>
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