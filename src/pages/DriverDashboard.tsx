import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DashboardTopbar from '../components/DashboardTopbar'
import {
  LayoutDashboard, Package, History, Bike, MapPin, CheckCircle, Clock,
  ChefHat, Truck, LogOut, Phone, Pencil, X as XIcon, AlertCircle, Mail,
  Navigation, Navigation2, Wifi, WifiOff, TrendingUp, Menu, Eye, Power,
  Route, Hand,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { VEHICLE_LABEL } from '../hooks/useDeliveryDrivers'
import { acceptOffer, declineOffer } from '../lib/driverAssignment'

// ─── Palette DiaTable ─────────────────────────────────────────────────────────
const C = {
  terra:      '#c5611a',
  terraLight: '#d9722a',
  bronze:     '#bd9f87',
  cream:      '#eae5d9',
  creamLight: '#f8f8f8',
  dark:       '#1f1f1f',
  dark2:      '#504640',
  muted:      '#80716a',
}

interface DriverProfile {
  id: string
  full_name: string
  phone: string | null
  email: string | null
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
  delivery_lat: number | null
  delivery_lng: number | null
  delivery_phone: string | null
  customer_name: string | null
  restaurant: { name: string; flag: string; location: string | null } | null
  created_at: string
}

const VEHICLE_OPTIONS = [
  { value: 'moto',    label: '🛵 Moto' },
  { value: 'voiture', label: '🚗 Voiture' },
  { value: 'velo',    label: '🚲 Vélo' },
  { value: 'pieton',  label: '🚶 Piéton' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  confirmed: { label: 'Confirmée',      color: '#2563eb', bg: 'rgba(37,99,235,0.10)',  icon: CheckCircle },
  preparing: { label: 'En préparation', color: '#d97706', bg: 'rgba(217,119,6,0.10)',  icon: ChefHat },
  ready:     { label: 'Prête à récup.', color: '#7c3aed', bg: 'rgba(124,58,237,0.10)', icon: Package },
  delivered: { label: 'Livrée',         color: '#16a34a', bg: 'rgba(22,163,74,0.10)',  icon: Truck },
}

interface DeliveryOffer {
  id: string
  order_id: string
  distance_km: number | null
  order: {
    id: string
    total: number
    delivery_address: string | null
    customer_name: string | null
    status: string
    restaurant: { name: string; flag: string } | null
  } | null
}

type Section = 'apercu' | 'encours' | 'historique'
type GeoStatus = 'idle' | 'requesting' | 'active' | 'denied'

// ─── NavItem (reprend le style vendeur) ────────────────────────────────────────
function NavItem({ icon: Icon, label, active, badge, onClick }: {
  icon: React.ElementType; label: string; active: boolean; badge?: number; onClick: () => void
}) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
      style={active ? { backgroundColor: C.terra, color: C.creamLight, fontWeight: 600 } : { color: 'rgba(248,248,248,0.65)' }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = 'rgba(248,248,248,0.08)'; e.currentTarget.style.color = C.creamLight } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(248,248,248,0.65)' } }}>
      <Icon size={18} className="shrink-0" />
      <span className="flex-1 text-left truncate">{label}</span>
      {badge ? (
        <span className="text-white text-xs font-bold min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: C.terra }}>{badge}</span>
      ) : null}
    </button>
  )
}

// ─── StatCard (reprend le style vendeur) ───────────────────────────────────────
function StatCard({ icon: Icon, value, label, accent }: {
  icon: React.ElementType; value: React.ReactNode; label: string; accent?: string
}) {
  const color = accent ?? C.terra
  return (
    <div className="rounded-xl p-5 shadow-sm flex flex-col gap-3"
      style={{ backgroundColor: C.creamLight, border: '1px solid rgba(80,70,64,0.10)' }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}1a` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none" style={{ color: C.dark }}>{value}</p>
        <p className="text-xs font-medium mt-1.5" style={{ color: C.muted }}>{label}</p>
      </div>
    </div>
  )
}

export default function DriverDashboard() {
  const { user, signOut } = useAuth()
  const navigate           = useNavigate()

  const [driver,   setDriver]   = useState<DriverProfile | null>(null)
  const [orders,   setOrders]   = useState<AssignedOrder[]>([])
  const [history,  setHistory]  = useState<AssignedOrder[]>([])
  const [offers,   setOffers]   = useState<DeliveryOffer[]>([])
  const [respondingOffer, setRespondingOffer] = useState<string | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [toggling, setToggling] = useState(false)
  const [section,  setSection]  = useState<Section>('apercu')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')
  const watchRef    = useRef<number | null>(null)
  const driverIdRef = useRef<string | null>(null)

  const [editing,  setEditing]  = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', email: '', vehicle_type: 'moto' })
  const [saving,   setSaving]   = useState(false)
  const [editErr,  setEditErr]  = useState('')

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { navigate('/connexion-livreur', { replace: true }); return }
    load()
    return () => stopGps()
  }, [user])

  async function load() {
    setLoading(true)

    const byId = await supabase
      .from('delivery_drivers')
      .select('*, restaurant:restaurants(name, flag)')
      .eq('profile_id', user!.id)
      .maybeSingle()

    let driverData = byId.data as DriverProfile | null

    if (!driverData && user!.email) {
      const byEmail = await supabase
        .from('delivery_drivers')
        .select('*, restaurant:restaurants(name, flag)')
        .eq('email', user!.email)
        .is('profile_id', null)
        .maybeSingle()
      driverData = byEmail.data as DriverProfile | null
    }

    if (!driverData) { navigate('/devenir-livreur', { replace: true }); return }

    if (!(driverData as any).profile_id) {
      await (supabase.from('delivery_drivers') as any).update({ profile_id: user!.id }).eq('id', driverData.id)
    }

    driverIdRef.current = driverData.id
    setDriver(driverData)
    setEditForm({
      full_name:    driverData.full_name,
      phone:        driverData.phone ?? '',
      email:        driverData.email ?? '',
      vehicle_type: driverData.vehicle_type ?? 'moto',
    })

    const cols = 'id, status, total, delivery_address, delivery_lat, delivery_lng, delivery_phone, customer_name, created_at, restaurant:restaurants(name, flag, location)'
    const [activeRes, historyRes] = await Promise.all([
      supabase.from('orders').select(cols)
        .eq('driver_id', driverData.id)
        .not('status', 'in', '("delivered","cancelled")')
        .order('created_at', { ascending: false }),
      supabase.from('orders').select(cols)
        .eq('driver_id', driverData.id)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false })
        .limit(30),
    ])

    setOrders((activeRes.data || []) as AssignedOrder[])
    setHistory((historyRes.data || []) as AssignedOrder[])
    await loadOffers(driverData.id)
    setLoading(false)
    startGps()
  }

  async function loadOffers(driverId: string) {
    const { data } = await supabase
      .from('delivery_offers')
      .select('id, order_id, distance_km, order:orders(id, total, delivery_address, customer_name, status, restaurant:restaurants(name, flag))')
      .eq('driver_id', driverId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    setOffers((data || []) as DeliveryOffer[])
  }

  // Realtime : nouvelles propositions poussées au livreur
  useEffect(() => {
    if (!driver) return
    const channel = supabase
      .channel(`offers_${driver.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'delivery_offers', filter: `driver_id=eq.${driver.id}` },
        () => loadOffers(driver.id))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [driver?.id])

  // ── Répondre à une proposition ───────────────────────────────────────────────
  async function handleAccept(offer: DeliveryOffer) {
    if (!driver || !offer.order) return
    setRespondingOffer(offer.id)
    const res = await acceptOffer(offer.id, offer.order_id, driver.id, driver.full_name)
    setRespondingOffer(null)
    setOffers(prev => prev.filter(o => o.id !== offer.id))
    if (res.ok) {
      setDriver(prev => prev ? { ...prev, is_available: false } : prev)
      await load()
      setSection('encours')
    } else if (res.reason === 'already_taken') {
      // course déjà prise par un autre livreur
    }
  }

  async function handleDecline(offer: DeliveryOffer) {
    setRespondingOffer(offer.id)
    await declineOffer(offer.id)
    setRespondingOffer(null)
    setOffers(prev => prev.filter(o => o.id !== offer.id))
  }

  // ── GPS ─────────────────────────────────────────────────────────────────────
  const startGps = useCallback(() => {
    if (!navigator.geolocation) return
    setGeoStatus('requesting')
    watchRef.current = navigator.geolocation.watchPosition(
      pos => {
        setGeoStatus('active')
        if (driverIdRef.current) {
          (supabase.from('delivery_drivers') as any).update({
            current_lat: pos.coords.latitude,
            current_lng: pos.coords.longitude,
            location_updated_at: new Date().toISOString(),
          }).eq('id', driverIdRef.current)
        }
      },
      () => setGeoStatus('denied'),
      { enableHighAccuracy: true, maximumAge: 15000 }
    )
  }, [])

  function stopGps() {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
    }
  }

  function openMaps(lat: number | null, lng: number | null, address: string | null) {
    const dest = lat && lng ? `${lat},${lng}` : address ? encodeURIComponent(address) : null
    if (!dest) return
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`, '_blank')
  }

  // ── Actions ───────────────────────────────────────────────────────────────────
  async function toggleAvailability() {
    if (!driver) return
    setToggling(true)
    const next = !driver.is_available
    await (supabase.from('delivery_drivers') as any).update({ is_available: next }).eq('id', driver.id)
    setDriver(prev => prev ? { ...prev, is_available: next } : prev)
    setToggling(false)
  }

  async function markDelivered(orderId: string) {
    await (supabase.from('orders') as any).update({ status: 'delivered' }).eq('id', orderId)
    const done = orders.find(o => o.id === orderId)
    setOrders(prev => prev.filter(o => o.id !== orderId))
    if (done) setHistory(prev => [{ ...done, status: 'delivered' }, ...prev])
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setEditErr('')
    if (!editForm.full_name.trim()) return setEditErr('Le nom est requis.')
    setSaving(true)
    const { error: dbErr } = await (supabase.from('delivery_drivers') as any).update({
      full_name:    editForm.full_name.trim(),
      phone:        editForm.phone.trim() || null,
      email:        editForm.email.trim() || null,
      vehicle_type: editForm.vehicle_type,
    }).eq('id', driver!.id)
    setSaving(false)
    if (dbErr) return setEditErr(dbErr.message)
    setDriver(prev => prev ? { ...prev, ...editForm, phone: editForm.phone || null, email: editForm.email || null } : prev)
    setEditing(false)
  }

  async function handleSignOut() {
    stopGps()
    await signOut()
    navigate('/', { replace: true })
  }

  const firstName    = driver?.full_name.split(' ')[0] ?? ''
  const todayCount   = history.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length
  const today        = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.cream }}>
      <div className="w-10 h-10 rounded-full border-4 animate-spin"
        style={{ borderColor: 'rgba(197,97,26,0.25)', borderTopColor: C.terra }} />
    </div>
  )

  // ── Sidebar ───────────────────────────────────────────────────────────────────
  const sidebarContent = driver && (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 flex items-center" style={{ borderBottom: '1px solid rgba(248,248,248,0.10)' }}>
        <div>
          <span className="font-serif text-2xl font-bold" style={{ color: C.terra }}>DiaTable</span>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(248,248,248,0.35)' }}>Espace livreur</p>
        </div>
      </div>

      {/* Driver identity */}
      <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(248,248,248,0.10)' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ backgroundColor: C.terra, color: C.creamLight }}>
          {driver.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate" style={{ color: C.creamLight }}>{driver.full_name}</p>
          <span className="text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1"
            style={{ backgroundColor: driver.is_available ? 'rgba(34,197,94,0.20)' : 'rgba(248,248,248,0.10)', color: driver.is_available ? '#4ade80' : 'rgba(248,248,248,0.5)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: driver.is_available ? '#22c55e' : '#9ca3af' }} />
            {driver.is_available ? 'Disponible' : 'Occupé'}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem icon={LayoutDashboard} label="Aperçu"       active={section === 'apercu'}       onClick={() => { setSection('apercu'); setSidebarOpen(false) }} badge={offers.length || undefined} />
        <NavItem icon={Package}         label="En cours"     active={section === 'encours'}      onClick={() => { setSection('encours'); setSidebarOpen(false) }} badge={orders.length || undefined} />
        <NavItem icon={History}         label="Historique"   active={section === 'historique'}   onClick={() => { setSection('historique'); setSidebarOpen(false) }} />
      </nav>

      <div className="px-3 py-4 space-y-1" style={{ borderTop: '1px solid rgba(248,248,248,0.10)' }}>
        <Link to="/"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{ color: 'rgba(248,248,248,0.65)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(248,248,248,0.08)'; e.currentTarget.style.color = C.creamLight }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(248,248,248,0.65)' }}>
          <Eye size={18} className="shrink-0" /> <span>Voir le site</span>
        </Link>
        <button onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{ color: 'rgba(248,248,248,0.65)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#fca5a5' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(248,248,248,0.65)' }}>
          <LogOut size={18} className="shrink-0" /> <span>Déconnexion</span>
        </button>
      </div>
    </div>
  )

  // ── Sections ────────────────────────────────────────────────────────────────
  function renderApercu() {
    if (!driver) return null
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold" style={{ color: C.dark }}>Bonjour {firstName} 👋</h1>
          <p className="text-sm mt-1 capitalize" style={{ color: C.muted }}>{today}</p>
        </div>

        {/* Propositions de course en attente */}
        {offers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: C.terra }} />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: C.terra }} />
              </span>
              <h2 className="text-lg font-serif font-bold" style={{ color: C.dark }}>
                Nouvelle{offers.length > 1 ? 's' : ''} proposition{offers.length > 1 ? 's' : ''} de course
              </h2>
            </div>
            <div className="space-y-3">
              {offers.map(offer => (
                <OfferCard key={offer.id} offer={offer}
                  responding={respondingOffer === offer.id}
                  disabled={!!respondingOffer}
                  onAccept={() => handleAccept(offer)}
                  onDecline={() => handleDecline(offer)} />
              ))}
            </div>
          </div>
        )}

        {/* Disponibilité */}
        <div className="rounded-xl p-5 shadow-sm flex items-center justify-between gap-4 flex-wrap"
          style={{ backgroundColor: C.creamLight, border: '1px solid rgba(80,70,64,0.10)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: driver.is_available ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.10)' }}>
              <Power size={20} style={{ color: driver.is_available ? '#16a34a' : '#dc2626' }} />
            </div>
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: C.muted }}>Votre statut</p>
              <p className="text-sm font-bold" style={{ color: driver.is_available ? '#16a34a' : '#dc2626' }}>
                {driver.is_available ? 'Disponible — vous recevez des commandes' : 'Occupé — aucune nouvelle commande'}
              </p>
            </div>
          </div>
          <button onClick={toggleAvailability} disabled={toggling}
            className="relative w-14 h-7 rounded-full transition-all disabled:opacity-50 shrink-0"
            style={{ backgroundColor: driver.is_available ? '#22c55e' : 'rgba(80,70,64,0.25)' }}>
            <span className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all"
              style={{ left: driver.is_available ? 'calc(100% - 1.75rem)' : '0.125rem' }} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon={Truck}      value={history.length} label="Livraisons totales" />
          <StatCard icon={Package}    value={orders.length}  label="En cours" accent="#7c3aed" />
          <StatCard icon={TrendingUp} value={todayCount}     label="Aujourd'hui" accent="#16a34a" />
        </div>

        {/* GPS status */}
        <div className="rounded-xl p-5 shadow-sm flex items-center gap-3"
          style={{ backgroundColor: C.creamLight, border: '1px solid rgba(80,70,64,0.10)' }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: geoStatus === 'active' ? 'rgba(34,197,94,0.12)' : geoStatus === 'denied' ? 'rgba(239,68,68,0.10)' : 'rgba(80,70,64,0.08)' }}>
            {geoStatus === 'active' ? <Wifi size={20} style={{ color: '#16a34a' }} /> : <WifiOff size={20} style={{ color: geoStatus === 'denied' ? '#dc2626' : C.muted }} />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: C.dark }}>
              {geoStatus === 'active' ? 'Localisation active' : geoStatus === 'denied' ? 'Localisation désactivée' : 'Localisation en cours…'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: C.muted }}>
              {geoStatus === 'active'
                ? 'Les clients suivent votre position en temps réel.'
                : geoStatus === 'denied'
                ? 'Activez le GPS dans votre navigateur pour le suivi en direct.'
                : 'Autorisez la localisation pour démarrer le suivi.'}
            </p>
          </div>
        </div>

        {/* Aperçu commandes en cours */}
        {orders.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-serif font-bold" style={{ color: C.dark }}>Commandes en cours</h2>
              <button onClick={() => setSection('encours')} className="text-sm font-medium hover:underline" style={{ color: C.terra }}>
                Tout voir
              </button>
            </div>
            <div className="space-y-3">
              {orders.slice(0, 2).map(order => (
                <ActiveOrderCard key={order.id} order={order}
                  onNavigateRestaurant={() => openMaps(null, null, order.restaurant?.location ?? order.restaurant?.name ?? null)}
                  onNavigateClient={() => openMaps(order.delivery_lat, order.delivery_lng, order.delivery_address)}
                  onDeliver={() => markDelivered(order.id)} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderEnCours() {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-serif font-bold flex items-center gap-2" style={{ color: C.dark }}>
          <Package size={24} style={{ color: C.terra }} /> Commandes en cours
        </h1>
        {orders.length === 0 ? (
          <EmptyState icon={Bike} text="Aucune commande assignée pour le moment" />
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <ActiveOrderCard key={order.id} order={order}
                onNavigateRestaurant={() => openMaps(null, null, order.restaurant?.location ?? order.restaurant?.name ?? null)}
                onNavigateClient={() => openMaps(order.delivery_lat, order.delivery_lng, order.delivery_address)}
                onDeliver={() => markDelivered(order.id)} />
            ))}
          </div>
        )}
      </div>
    )
  }

  function renderHistorique() {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-serif font-bold flex items-center gap-2" style={{ color: C.dark }}>
          <History size={24} style={{ color: C.terra }} /> Historique des livraisons
        </h1>
        {history.length === 0 ? (
          <EmptyState icon={History} text="Aucune livraison terminée" />
        ) : (
          <div className="space-y-2">
            {history.map(order => <HistoryCard key={order.id} order={order} />)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: C.cream }}>
      <DashboardTopbar variant="vendor">
        {/* GPS chip in topbar */}
        <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full border"
          style={{
            backgroundColor: geoStatus === 'active' ? 'rgba(34,197,94,0.12)' : geoStatus === 'denied' ? 'rgba(239,68,68,0.12)' : 'rgba(248,248,248,0.06)',
            borderColor: geoStatus === 'active' ? 'rgba(34,197,94,0.30)' : geoStatus === 'denied' ? 'rgba(239,68,68,0.30)' : 'rgba(248,248,248,0.12)',
            color: geoStatus === 'active' ? '#4ade80' : geoStatus === 'denied' ? '#fca5a5' : 'rgba(248,248,248,0.5)',
          }}>
          {geoStatus === 'active' ? <><Wifi size={11} /> GPS</> : geoStatus === 'denied' ? <><WifiOff size={11} /> GPS</> : <><Navigation size={11} /> GPS</>}
        </div>
      </DashboardTopbar>

      <div className="flex flex-1 overflow-hidden" style={{ marginTop: '56px' }}>
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <aside
          className={`fixed top-0 left-0 h-full w-64 z-30 flex-shrink-0 transform transition-all duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto lg:w-64`}
          style={{ backgroundColor: C.dark }}>
          {sidebarContent}
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile bar */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
            style={{ backgroundColor: C.creamLight, borderColor: 'rgba(80,70,64,0.10)' }}>
            <button onClick={() => setSidebarOpen(true)} style={{ color: C.dark }}><Menu size={22} /></button>
            <span className="font-serif font-bold" style={{ color: C.dark }}>DiaTable</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: C.terra, color: C.creamLight }}>
              {driver?.full_name.charAt(0).toUpperCase()}
            </div>
          </div>

          <main className="flex-1 overflow-y-auto p-5 lg:p-8">
            <div className="max-w-3xl mx-auto">
              {section === 'apercu'     && renderApercu()}
              {section === 'encours'    && renderEnCours()}
              {section === 'historique' && renderHistorique()}
            </div>
          </main>
        </div>
      </div>

      {/* ── Edit profile modal ── */}
      {editing && driver && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditing(false)} />
          <div className="relative rounded-2xl w-full max-w-md p-6 shadow-2xl"
            style={{ backgroundColor: C.creamLight }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-lg font-bold" style={{ color: C.dark }}>Modifier le profil</h2>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg transition-all hover:bg-black/[0.05]" style={{ color: C.muted }}>
                <XIcon size={18} />
              </button>
            </div>
            <form onSubmit={saveProfile} className="space-y-4">
              {[
                { label: 'Nom complet', field: 'full_name', type: 'text',  ph: 'Youssef Benali',   icon: null },
                { label: 'Téléphone',   field: 'phone',     type: 'tel',   ph: '+212 6XX XXX XXX', icon: Phone },
                { label: 'Email',       field: 'email',     type: 'email', ph: 'votre@email.com',  icon: Mail },
              ].map(({ label, field, type, ph, icon: Icon }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: C.muted }}>{label}</label>
                  <div className="relative">
                    {Icon && <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />}
                    <input type={type} value={editForm[field as keyof typeof editForm]}
                      onChange={e => setEditForm(p => ({ ...p, [field]: e.target.value }))}
                      placeholder={ph}
                      className={`w-full border rounded-xl py-3 text-sm focus:outline-none focus:ring-2 ${Icon ? 'pl-10 pr-4' : 'px-4'}`}
                      style={{ borderColor: 'rgba(80,70,64,0.15)', color: C.dark }} />
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: C.muted }}>Véhicule</label>
                <div className="grid grid-cols-2 gap-2">
                  {VEHICLE_OPTIONS.map(v => (
                    <button key={v.value} type="button"
                      onClick={() => setEditForm(p => ({ ...p, vehicle_type: v.value }))}
                      className="py-2.5 px-3 rounded-xl text-sm font-medium border transition-all"
                      style={editForm.vehicle_type === v.value
                        ? { backgroundColor: C.terra, borderColor: C.terra, color: C.creamLight }
                        : { borderColor: 'rgba(80,70,64,0.15)', color: C.muted }}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
              {editErr && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
                  style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#dc2626' }}>
                  <AlertCircle size={14} className="shrink-0" /> {editErr}
                </div>
              )}
              <button type="submit" disabled={saving}
                className="w-full text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-60 text-sm mt-2"
                style={{ backgroundColor: C.terra }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = C.terraLight }}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = C.terra}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating edit button (bottom-right, visible on apercu) */}
      {driver && section === 'apercu' && (
        <button onClick={() => setEditing(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 text-white font-semibold px-4 py-3 rounded-full shadow-lg transition-all"
          style={{ backgroundColor: C.terra }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = C.terraLight}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = C.terra}>
          <Pencil size={16} /> <span className="hidden sm:inline text-sm">Modifier le profil</span>
        </button>
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function OfferCard({ offer, responding, disabled, onAccept, onDecline }: {
  offer: DeliveryOffer
  responding: boolean
  disabled: boolean
  onAccept: () => void
  onDecline: () => void
}) {
  const o = offer.order
  return (
    <div className="rounded-xl overflow-hidden shadow-sm"
      style={{ backgroundColor: C.creamLight, border: `1.5px solid ${C.terra}` }}>
      {/* Bandeau */}
      <div className="px-5 py-2.5 flex items-center gap-2"
        style={{ backgroundColor: 'rgba(197,97,26,0.10)' }}>
        <Hand size={14} style={{ color: C.terra }} />
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: C.terra }}>
          Course proposée
        </span>
        {offer.distance_km != null && (
          <span className="ml-auto flex items-center gap-1 text-xs font-semibold" style={{ color: C.muted }}>
            <Route size={12} /> {offer.distance_km.toFixed(1)} km du resto
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="px-5 py-4">
        {o?.restaurant && (
          <p className="text-xs font-bold mb-1" style={{ color: C.terra }}>{o.restaurant.flag} {o.restaurant.name}</p>
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold" style={{ color: C.dark }}>{o?.customer_name || 'Client'}</p>
            {o?.delivery_address && (
              <p className="text-xs mt-0.5 flex items-start gap-1" style={{ color: C.muted }}>
                <MapPin size={11} className="shrink-0 mt-0.5" style={{ color: C.terra }} /> {o.delivery_address}
              </p>
            )}
          </div>
          {o && (
            <span className="text-base font-bold shrink-0" style={{ color: C.terra }}>
              {Number(o.total).toFixed(2)} MAD
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button onClick={onDecline} disabled={disabled}
            className="flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-xl border transition-all disabled:opacity-50"
            style={{ borderColor: 'rgba(80,70,64,0.20)', color: C.muted, backgroundColor: 'transparent' }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.06)' }}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <XIcon size={15} /> Refuser
          </button>
          <button onClick={onAccept} disabled={disabled}
            className="flex items-center justify-center gap-1.5 text-white text-sm font-bold py-2.5 rounded-xl transition-all disabled:opacity-60"
            style={{ backgroundColor: C.terra }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = C.terraLight }}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = C.terra}>
            {responding ? '…' : <><CheckCircle size={15} /> Accepter</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="rounded-xl p-12 text-center shadow-sm"
      style={{ backgroundColor: C.creamLight, border: '1px solid rgba(80,70,64,0.10)' }}>
      <Icon size={40} className="mx-auto mb-3" style={{ color: 'rgba(80,70,64,0.20)' }} />
      <p className="text-sm font-medium" style={{ color: C.muted }}>{text}</p>
    </div>
  )
}

function ActiveOrderCard({ order, onNavigateRestaurant, onNavigateClient, onDeliver }: {
  order: AssignedOrder
  onNavigateRestaurant: () => void
  onNavigateClient: () => void
  onDeliver: () => void
}) {
  const cfg     = STATUS_CONFIG[order.status]
  const Icon    = cfg?.icon ?? Clock
  const isReady = order.status === 'ready'
  const time    = new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="rounded-xl overflow-hidden shadow-sm"
      style={{ backgroundColor: C.creamLight, border: '1px solid rgba(80,70,64,0.10)' }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3"
        style={{ borderBottom: '1px solid rgba(80,70,64,0.08)' }}>
        <div>
          {order.restaurant && (
            <p className="text-xs font-bold mb-0.5" style={{ color: C.terra }}>{order.restaurant.flag} {order.restaurant.name}</p>
          )}
          <p className="text-sm font-bold" style={{ color: C.dark }}>#{order.id.slice(0, 8)}</p>
          <p className="text-xs mt-0.5" style={{ color: C.muted }}>{order.customer_name || 'Client'} · {time}</p>
        </div>
        {cfg && (
          <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full shrink-0"
            style={{ color: cfg.color, backgroundColor: cfg.bg }}>
            <Icon size={11} /> {cfg.label}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {order.delivery_phone && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs" style={{ color: C.muted }}>
              <Phone size={13} /> {order.delivery_phone}
            </div>
            <a href={`tel:${order.delivery_phone}`}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
              style={{ backgroundColor: 'rgba(22,163,74,0.10)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.25)' }}>
              <Phone size={11} /> Appeler
            </a>
          </div>
        )}

        {order.delivery_address && (
          <div className="flex items-start gap-2 text-xs" style={{ color: C.muted }}>
            <MapPin size={13} className="shrink-0 mt-0.5" style={{ color: C.terra }} />
            <span className="leading-relaxed">{order.delivery_address}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button onClick={onNavigateRestaurant}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl border transition-all"
            style={{ borderColor: 'rgba(80,70,64,0.15)', color: C.dark, backgroundColor: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(80,70,64,0.05)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <ChefHat size={13} style={{ color: C.terra }} /> Au restaurant
          </button>
          <button onClick={onNavigateClient}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl border transition-all"
            style={isReady
              ? { backgroundColor: C.terra, borderColor: C.terra, color: C.creamLight }
              : { borderColor: 'rgba(80,70,64,0.15)', color: C.dark, backgroundColor: 'transparent' }}
            onMouseEnter={e => { if (isReady) e.currentTarget.style.backgroundColor = C.terraLight; else e.currentTarget.style.backgroundColor = 'rgba(80,70,64,0.05)' }}
            onMouseLeave={e => { if (isReady) e.currentTarget.style.backgroundColor = C.terra; else e.currentTarget.style.backgroundColor = 'transparent' }}>
            <Navigation2 size={13} /> Naviguer
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 flex items-center justify-between">
        <span className="text-base font-bold" style={{ color: C.terra }}>{Number(order.total).toFixed(2)} MAD</span>
        {isReady && (
          <button onClick={onDeliver}
            className="flex items-center gap-1.5 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
            style={{ backgroundColor: '#16a34a' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#15803d'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#16a34a'}>
            <CheckCircle size={13} /> Marquer livrée
          </button>
        )}
      </div>
    </div>
  )
}

function HistoryCard({ order }: { order: AssignedOrder }) {
  const date = new Date(order.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
  return (
    <div className="rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm"
      style={{ backgroundColor: C.creamLight, border: '1px solid rgba(80,70,64,0.10)' }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: 'rgba(22,163,74,0.10)' }}>
        <CheckCircle size={16} style={{ color: '#16a34a' }} />
      </div>
      <div className="flex-1 min-w-0">
        {order.restaurant && (
          <p className="text-xs truncate" style={{ color: C.muted }}>{order.restaurant.flag} {order.restaurant.name}</p>
        )}
        <p className="text-sm font-semibold truncate" style={{ color: C.dark }}>{order.customer_name || 'Client'}</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(80,70,64,0.6)' }}>{date}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold" style={{ color: C.terra }}>{Number(order.total).toFixed(2)}</p>
        <p className="text-[0.6rem]" style={{ color: C.muted }}>MAD</p>
      </div>
    </div>
  )
}
