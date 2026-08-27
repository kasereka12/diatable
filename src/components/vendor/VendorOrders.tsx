import { useState, useEffect, useCallback } from 'react'
import type { LucideIcon } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import {
  Package, Clock, CheckCircle, ChefHat, Utensils, Truck, XCircle,
  Phone, MapPin, MessageCircle, Bike
} from 'lucide-react'
import { Link } from 'react-router-dom'
import AssignDriverModal from '../AssignDriverModal'
import PaginationControls from '../ui/PaginationControls'

interface OrderItem { id: string; quantity: number; name: string; price: number }
interface OrderCustomer { full_name: string | null; email: string | null }
interface Order {
  id: string
  status: string
  total: number | string
  delivery_mode: string | null
  delivery_address: string | null
  delivery_phone: string | null
  delivery_notes: string | null
  customer_name: string | null
  created_at: string
  driver_id: string | null
  driver_name: string | null
  order_items: OrderItem[]
  customer: OrderCustomer | null
}

interface StatusConfig { label: string; color: string; bg: string; border: string; icon: LucideIcon }

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending:    { label: 'En attente',      color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200', icon: Clock },
  confirmed:  { label: 'Confirmée',      color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200',  icon: CheckCircle },
  preparing:  { label: 'En préparation',  color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-200', icon: ChefHat },
  ready:      { label: 'Prête',           color: 'text-purple-600', bg: 'bg-purple-50',  border: 'border-purple-200', icon: Utensils },
  delivered:  { label: 'Livrée',          color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-200',  icon: Truck },
  cancelled:  { label: 'Annulée',         color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',    icon: XCircle },
}

const NEXT_STATUS: Record<string, string> = {
  pending:   'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready:     'delivered',
}

const NEXT_LABEL: Record<string, string> = {
  pending:   'Confirmer',
  confirmed: 'Commencer la préparation',
  preparing: 'Marquer comme prête',
  ready:     'Marquer comme livrée',
}

const ORDERS_PAGE_SIZE = 15
const ORDER_SELECT = '*, order_items(*), customer:profiles!orders_customer_id_fkey(full_name, email)'

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready']
const PAST_STATUSES = ['delivered', 'cancelled']

const ACTIVE_STATUS_FILTERS = ['all', ...ACTIVE_STATUSES]
const PAST_STATUS_FILTERS = ['all', ...PAST_STATUSES]

export default function VendorOrders({ restaurantId }: { restaurantId: string }) {
  // Both tabs are now paginated and filterable server-side — a busy
  // restaurant can easily have dozens of orders sitting "en cours" at once,
  // not just a handful.
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [pastOrders, setPastOrders] = useState<Order[]>([])
  const [activeTotal, setActiveTotal] = useState(0)
  const [pastTotal, setPastTotal] = useState(0)
  const [activePage, setActivePage] = useState(0)
  const [pastPage, setPastPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pastLoading, setPastLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('active')
  const [activeStatusFilter, setActiveStatusFilter] = useState('all')
  const [pastStatusFilter, setPastStatusFilter] = useState('all')
  const [modeFilter, setModeFilter] = useState('all') // 'all' | 'delivery' | 'pickup'
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [assignModal, setAssignModal] = useState<string | null>(null) // order id

  const loadActive = useCallback(async () => {
    if (!restaurantId) return
    setLoading(true)
    const from = activePage * ORDERS_PAGE_SIZE
    const to = from + ORDERS_PAGE_SIZE - 1
    let query = supabase
      .from('orders')
      .select(ORDER_SELECT, { count: 'exact' })
      .eq('restaurant_id', restaurantId)
    query = activeStatusFilter === 'all' ? query.in('status', ACTIVE_STATUSES) : query.eq('status', activeStatusFilter)
    if (modeFilter !== 'all') query = query.eq('delivery_mode', modeFilter)
    const { data, count } = await query.order('created_at', { ascending: false }).range(from, to)
    setActiveOrders((data || []) as unknown as Order[])
    setActiveTotal(count ?? 0)
    setLoading(false)
  }, [restaurantId, activePage, activeStatusFilter, modeFilter])

  const loadPast = useCallback(async () => {
    if (!restaurantId) return
    setPastLoading(true)
    const from = pastPage * ORDERS_PAGE_SIZE
    const to = from + ORDERS_PAGE_SIZE - 1
    let query = supabase
      .from('orders')
      .select(ORDER_SELECT, { count: 'exact' })
      .eq('restaurant_id', restaurantId)
    query = pastStatusFilter === 'all' ? query.in('status', PAST_STATUSES) : query.eq('status', pastStatusFilter)
    if (modeFilter !== 'all') query = query.eq('delivery_mode', modeFilter)
    const { data, count } = await query.order('created_at', { ascending: false }).range(from, to)
    setPastOrders((data || []) as unknown as Order[])
    setPastTotal(count ?? 0)
    setPastLoading(false)
  }, [restaurantId, pastPage, pastStatusFilter, modeFilter])

  useEffect(() => {
    if (!restaurantId) { setLoading(false); return }
    loadActive()

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
        () => { loadActive(); loadPast() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [restaurantId, loadActive, loadPast])

  useEffect(() => {
    if (activeTab === 'past') loadPast()
  }, [activeTab, loadPast])

  // Any filter change restarts pagination from page 1 on the relevant tab.
  useEffect(() => { setActivePage(0) }, [activeStatusFilter, modeFilter])
  useEffect(() => { setPastPage(0) }, [pastStatusFilter, modeFilter])

  const activeTotalPages = Math.max(1, Math.ceil(activeTotal / ORDERS_PAGE_SIZE))
  const pastTotalPages   = Math.max(1, Math.ceil(pastTotal / ORDERS_PAGE_SIZE))

  async function updateStatus(orderId: string, newStatus: string) {
    await (supabase.from('orders') as any).update({ status: newStatus }).eq('id', orderId)
    if (['delivered', 'cancelled'].includes(newStatus)) {
      setActiveOrders(prev => prev.filter(o => o.id !== orderId))
      if (activeTab === 'past') loadPast()
    } else {
      setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    }
  }

  function handleDriverAssigned(orderId: string, driverId: string, driverName: string) {
    setActiveOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, driver_id: driverId || null, driver_name: driverName || null } : o
    ))
  }

  async function cancelOrder(orderId: string) {
    await updateStatus(orderId, 'cancelled')
  }

  const displayedOrders = activeTab === 'active' ? activeOrders : pastOrders
  const displayedLoading = activeTab === 'active' ? loading : pastLoading

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-serif font-bold text-dark flex items-center gap-2">
          <Package size={24} className="text-gold" /> Commandes
        </h1>
        <div className="flex items-center gap-2">
          {activeTotal > 0 && (
            <span className="bg-gold text-dark text-xs font-bold px-3 py-1 rounded-full">
              {activeTotal} en cours
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
          En cours ({activeTotal})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'past' ? 'bg-yellow-400 text-gray-900' : 'text-gray-500 hover:text-dark'
          }`}
        >
          Historique ({pastTotal})
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(activeTab === 'active' ? ACTIVE_STATUS_FILTERS : PAST_STATUS_FILTERS).map(s => (
            <button
              key={s}
              onClick={() => activeTab === 'active' ? setActiveStatusFilter(s) : setPastStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                (activeTab === 'active' ? activeStatusFilter : pastStatusFilter) === s
                  ? 'bg-dark text-white border-dark'
                  : 'bg-white text-gray-500 border-light hover:text-dark'
              }`}
            >
              {s === 'all' ? 'Tous les statuts' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { val: 'all', label: 'Tous les modes' },
            { val: 'delivery', label: '🛵 Livraison' },
            { val: 'pickup', label: '🏪 Retrait' },
          ].map(m => (
            <button
              key={m.val}
              onClick={() => setModeFilter(m.val)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                modeFilter === m.val
                  ? 'bg-dark text-white border-dark'
                  : 'bg-white text-gray-500 border-light hover:text-dark'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {displayedLoading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : displayedOrders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-light">
          <Package size={40} className="text-gray-200 mx-auto mb-3" />
          {(activeTab === 'active' ? activeStatusFilter : pastStatusFilter) !== 'all' || modeFilter !== 'all' ? (
            <>
              <p className="font-semibold text-dark mb-1">Aucune commande ne correspond à ces filtres</p>
              <p className="text-sm text-gray-400">Essayez de modifier ou réinitialiser les filtres ci-dessus</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-dark mb-1">
                {activeTab === 'active' ? 'Aucune commande en cours' : 'Aucune commande passée'}
              </p>
              <p className="text-sm text-gray-400">
                {activeTab === 'active' ? 'Les nouvelles commandes apparaîtront ici en temps réel' : 'L\'historique de vos commandes apparaîtra ici'}
              </p>
            </>
          )}
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

                    {/* Livreur assigné */}
                    {order.driver_name && (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700 mb-3">
                        <Bike size={14} />
                        <span>Livreur : <strong>{order.driver_name}</strong></span>
                      </div>
                    )}

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
                      {/* Assigner un livreur — visible dès que la commande est en prépa et mode livraison */}
                      {['preparing', 'ready'].includes(order.status) && order.delivery_mode !== 'pickup' && (
                        <button
                          onClick={() => setAssignModal(order.id)}
                          className="border border-[#c5611a]/40 text-[#c5611a] px-4 py-2 rounded-lg text-sm hover:bg-[#c5611a]/[0.06] transition-colors flex items-center gap-1.5 font-semibold"
                        >
                          <Bike size={14} />
                          {order.driver_id ? 'Changer livreur' : 'Assigner livreur'}
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

      {activeTab === 'active' && !loading && (
        <PaginationControls page={activePage} totalPages={activeTotalPages} onPageChange={setActivePage} />
      )}
      {activeTab === 'past' && !pastLoading && (
        <PaginationControls page={pastPage} totalPages={pastTotalPages} onPageChange={setPastPage} />
      )}

      {/* Modal assignation livreur */}
      {assignModal && (
        <AssignDriverModal
          orderId={assignModal}
          restaurantId={restaurantId}
          currentDriverId={activeOrders.find(o => o.id === assignModal)?.driver_id}
          onClose={() => setAssignModal(null)}
          onAssigned={(driverId, driverName) => handleDriverAssigned(assignModal, driverId, driverName)}
        />
      )}
    </div>
  )
}
