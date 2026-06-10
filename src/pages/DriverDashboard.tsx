import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Globe, Bike, MapPin, Package, CheckCircle, Clock, ChefHat, Truck, LogOut, Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { VEHICLE_LABEL } from '../hooks/useDeliveryDrivers'

interface DriverProfile {
  id: string
  full_name: string
  phone: string | null
  vehicle_type: string | null
  type: string
  is_available: boolean
  restaurant?: { name: string; flag: string } | null
}

interface AssignedOrder {
  id: string
  status: string
  total: number
  delivery_address: string | null
  delivery_phone: string | null
  customer_name: string | null
  restaurant: { name: string; flag: string } | null
  created_at: string
}

const STATUS_LABEL: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  confirmed:  { label: 'Confirmée',      color: 'text-blue-400',   icon: CheckCircle },
  preparing:  { label: 'En préparation', color: 'text-orange-400', icon: ChefHat },
  ready:      { label: 'Prête',          color: 'text-purple-400', icon: Package },
  delivered:  { label: 'Livrée',         color: 'text-green-400',  icon: Truck },
}

export default function DriverDashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [driver, setDriver]   = useState<DriverProfile | null>(null)
  const [orders, setOrders]   = useState<AssignedOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/connexion-livreur', { replace: true }); return }
    load()
  }, [user])

  async function load() {
    setLoading(true)
    const { data: driverData } = await supabase
      .from('delivery_drivers')
      .select('*, restaurant:restaurants(name, flag)')
      .eq('profile_id', user!.id)
      .maybeSingle()

    if (!driverData) { navigate('/devenir-livreur', { replace: true }); return }
    setDriver(driverData as DriverProfile)

    const { data: ordersData } = await supabase
      .from('orders')
      .select('id, status, total, delivery_address, delivery_phone, customer_name, created_at, restaurant:restaurants(name, flag)')
      .eq('driver_id', driverData.id)
      .not('status', 'in', '("delivered","cancelled")')
      .order('created_at', { ascending: false })

    setOrders((ordersData || []) as AssignedOrder[])
    setLoading(false)
  }

  async function toggleAvailability() {
    if (!driver) return
    setToggling(true)
    const next = !driver.is_available
    await supabase.from('delivery_drivers').update({ is_available: next }).eq('id', driver.id)
    setDriver(prev => prev ? { ...prev, is_available: next } : prev)
    setToggling(false)
  }

  async function markDelivered(orderId: string) {
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', orderId)
    setOrders(prev => prev.filter(o => o.id !== orderId))
  }

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  const inputCls = `bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm`

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#c5611a]/30 border-t-[#c5611a] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <div className="absolute inset-0 zellige-pattern opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark to-dark2 pointer-events-none" />

      <div className="relative flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="font-serif text-xl font-bold text-white flex items-center gap-1.5">
            Dia<span className="text-[#f4a828]">Table</span>
            <Globe size={18} className="text-[#f4a828]" />
          </Link>
          <button onClick={handleSignOut} className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors">
            <LogOut size={15} /> Déconnexion
          </button>
        </div>

        {driver && (
          <>
            {/* Profile card */}
            <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#c5611a]/20 flex items-center justify-center text-xl font-bold text-[#f4a828]">
                  {driver.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-white truncate">{driver.full_name}</h1>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {driver.vehicle_type && (
                      <span className="text-sm text-white/50">{VEHICLE_LABEL[driver.vehicle_type] ?? driver.vehicle_type}</span>
                    )}
                    {driver.phone && (
                      <span className="text-sm text-white/40 flex items-center gap-0.5">
                        <Phone size={11} /> {driver.phone}
                      </span>
                    )}
                    {driver.type === 'restaurant' && driver.restaurant && (
                      <span className="text-xs bg-white/[0.08] text-white/60 px-2 py-0.5 rounded-full">
                        {driver.restaurant.flag} {driver.restaurant.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Availability toggle */}
                <div className="text-center shrink-0">
                  <p className="text-[0.6rem] font-semibold text-white/40 mb-1.5 uppercase tracking-wide">
                    {driver.is_available ? 'Disponible' : 'Occupé'}
                  </p>
                  <button
                    onClick={toggleAvailability}
                    disabled={toggling}
                    className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
                      driver.is_available ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                      driver.is_available ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Assigned orders */}
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">
              Commandes assignées ({orders.length})
            </h2>

            {orders.length === 0 ? (
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-10 text-center">
                <Bike size={36} className="text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">Aucune commande assignée pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => {
                  const st = STATUS_LABEL[order.status]
                  const Icon = st?.icon ?? Clock
                  return (
                    <div key={order.id} className="bg-white/[0.06] border border-white/10 rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          {order.restaurant && (
                            <p className="text-xs text-white/50 mb-0.5">{order.restaurant.flag} {order.restaurant.name}</p>
                          )}
                          <p className="text-sm font-bold text-white">Commande #{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-white/40 mt-0.5">{order.customer_name || 'Client'}</p>
                        </div>
                        {st && (
                          <span className={`flex items-center gap-1 text-xs font-bold ${st.color}`}>
                            <Icon size={12} /> {st.label}
                          </span>
                        )}
                      </div>

                      {order.delivery_address && (
                        <div className="flex items-start gap-1.5 text-xs text-white/50 mb-3">
                          <MapPin size={12} className="text-[#f4a828] shrink-0 mt-0.5" />
                          <span>{order.delivery_address}</span>
                        </div>
                      )}

                      {order.delivery_phone && (
                        <div className="flex items-center gap-1.5 text-xs text-white/50 mb-4">
                          <Phone size={12} className="text-[#f4a828]" />
                          <a href={`tel:${order.delivery_phone}`} className="hover:text-white/80 transition-colors">
                            {order.delivery_phone}
                          </a>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#f4a828]">{Number(order.total).toFixed(2)} MAD</span>
                        {order.status === 'ready' && (
                          <button
                            onClick={() => markDelivered(order.id)}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle size={13} /> Marquer livrée
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
