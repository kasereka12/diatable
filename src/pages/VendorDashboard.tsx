import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DashboardTopbar from '../components/DashboardTopbar'
import {
  LayoutDashboard, Store, Utensils, Star, BarChart2, Bell,
  Eye, LogOut, TrendingUp, TrendingDown, Minus, Phone,
  Instagram, Menu, ChevronRight, ChevronLeft, Edit2, Trash2, Plus,
  CheckCircle, AlertCircle, MessageSquare, Lock, ImageIcon, X as XIcon,
  Heart, Package, MessageCircle, Crown, Sparkles, Zap, MapPin, Power, Clock, Bike
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import VendorOrders from '../components/vendor/VendorOrders'
import VendorDrivers from '../components/vendor/VendorDrivers'
import { getEffectivelyOpen, getClosedReason, parseSchedule } from '../lib/scheduleParser'

// ─── Palette DiaTable ─────────────────────────────────────────────────────────
const C = {
  terra:      '#c5611a',
  terraLight: '#d9722a',
  terraDark:  '#a04d12',
  bronze:     '#bd9f87',
  cream:      '#eae5d9',
  creamLight: '#f8f8f8',
  dark:       '#1f1f1f',
  dark2:      '#504640',
  muted:      '#80716a',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const JOURS_OPTIONS = [
  'Lundi – Vendredi',
  'Lundi – Samedi',
  'Lundi – Dimanche',
  'Mardi – Dimanche',
  'Mercredi – Dimanche',
  'Weekends uniquement',
  'Sur commande uniquement',
]
const HEURE_OPTIONS = [
  '07h00','08h00','09h00','10h00','11h00','11h30',
  '12h00','12h30','13h00','14h00','15h00','16h00',
  '17h00','18h00','18h30','19h00','19h30','20h00',
  '20h30','21h00','21h30','22h00','22h30','23h00','23h30',
]

function parseHoursForm(str: string | null | undefined) {
  if (!str) return { jours: 'Lundi – Samedi', open: '11h00', close: '22h00' }
  if (str === 'Sur commande uniquement') return { jours: 'Sur commande uniquement', open: '11h00', close: '22h00' }
  const sep = str.includes('·') ? '·' : ':'
  const [jourPart, timePart] = str.split(sep).map(s => s.trim())
  if (timePart) {
    const [o, c] = timePart.replace(/\s/g, '').split('–')
    return {
      jours: JOURS_OPTIONS.includes(jourPart) ? jourPart : 'Lundi – Samedi',
      open:  HEURE_OPTIONS.includes(o) ? o : '11h00',
      close: HEURE_OPTIONS.includes(c) ? c : '22h00',
    }
  }
  return { jours: 'Lundi – Samedi', open: '11h00', close: '22h00' }
}

function timeAgo(iso: string | null | undefined, t?: (key: string, opts?: Record<string, unknown>) => string): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return t ? t('vd.time_now') : "À l'instant"
  if (m < 60) return t ? t('vd.time_min', { m }) : `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return t ? t('vd.time_h', { h }) : `Il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return t ? t('vd.time_yesterday') : 'Hier'
  if (d < 7) return t ? t('vd.time_days', { d }) : `Il y a ${d} jours`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function svgPolyline(data: number[], w = 560, h = 120, pad = 20): string {
  const maxV = Math.max(...data, 1)
  const step = (w - pad * 2) / Math.max(data.length - 1, 1)
  return data.map((v, i) => {
    const x = pad + i * step
    const y = pad + (1 - v / maxV) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stars({ count, size = 16 }: { count: number; size?: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} className={i <= count ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
      ))}
    </span>
  )
}

function StatCard({ icon: Icon, value, label, trend, up }: { icon: React.ElementType; value: React.ReactNode; label: string; trend?: string; up?: boolean | null }) {
  return (
    <div className="rounded-xl p-5 shadow-sm flex flex-col gap-3"
      style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `rgba(197,97,26,0.10)` }}>
          <Icon size={20} style={{ color: C.terra }} />
        </div>
        {up === true && (
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <TrendingUp size={12} />{trend}
          </span>
        )}
        {up === false && (
          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <TrendingDown size={12} />{trend}
          </span>
        )}
        {up === null && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{ backgroundColor: 'rgba(80,70,64,0.08)', color: C.muted }}>
            <Minus size={12} />stable
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold font-serif" style={{ color: C.dark }}>{value}</p>
        <p className="text-sm mt-0.5" style={{ color: C.muted }}>{label}</p>
      </div>
    </div>
  )
}

function NavItem({ icon: Icon, label, active, badge, onClick, collapsed }: { icon: React.ElementType; label: string; active: boolean; badge?: number; onClick: () => void; collapsed: boolean }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
        ${collapsed ? 'justify-center px-0' : ''}`}
      style={active ? {
        backgroundColor: C.terra,
        color: C.creamLight,
        fontWeight: 600,
      } : { color: 'rgba(248,248,248,0.65)' }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = 'rgba(248,248,248,0.08)'; e.currentTarget.style.color = C.creamLight } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(248,248,248,0.65)' } }}
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
      {!collapsed && badge && (
        <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
          {badge}
        </span>
      )}
    </button>
  )
}

// ─── Input style helpers ──────────────────────────────────────────────────────
const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
const inputStyle = { color: C.dark }

// ─── Main component ───────────────────────────────────────────────────────────

export default function VendorDashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const vendorName = profile?.full_name || user?.user_metadata?.full_name || t('vd.rest_name')
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const [activeSection, setActiveSection] = useState('apercu')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [menuCategory, setMenuCategory] = useState("Plats Principaux")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingDish, setEditingDish] = useState<any | null>(null)
  const [newDish, setNewDish] = useState({ nom: '', prix: '', description: '', categorie: 'Plats Principaux', populaire: false, prepTime: '15' })
  const [vendorNotifs, setVendorNotifs] = useState<any[]>([])
  const [notifsLoading, setNotifsLoading] = useState(true)
  const [restaurantForm, setRestaurantForm] = useState({ nom: '', cuisine: '', ville: '', adresse: '', telephone: '', whatsapp: '', instagram: '', description: '', horaires: '' })
  const [bankForm, setBankForm] = useState({ rib: '', bank_name: '', account_name: '' })
  const [savingBank, setSavingBank] = useState(false)
  const [bankMsg, setBankMsg] = useState('')
  const [subscription, setSubscription] = useState<any | null>(null)
  const [deliveryZones, setDeliveryZones] = useState<any[]>([])
  const [newZone, setNewZone] = useState({ quartier: '', price: '' })
  const [savingZone, setSavingZone] = useState(false)
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null)
  const [paymentForm, setPaymentForm] = useState({ bank: '', reference: '', sender_name: '' })
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [paymentMsg, setPaymentMsg] = useState('')

  const [restaurant, setRestaurant] = useState<any | null>(null)
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [dbLoading, setDbLoading] = useState(true)
  const [savingRest, setSavingRest] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [editingRestInfo, setEditingRestInfo] = useState(false)
  const [hoursForm, setHoursForm] = useState({ jours: 'Lundi – Samedi', open: '11h00', close: '22h00' })
  const [creatingRest, setCreatingRest] = useState(false)
  const [createForm, setCreateForm] = useState({ nom: '', cuisine: '', cuisine_label: '', flag: '🍽️', ville: '', description: '' })
  const [dishImageFile, setDishImageFile] = useState<File | null>(null)
  const [dishImagePreview, setDishImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [restImageFile, setRestImageFile] = useState<File | null>(null)
  const [restImagePreview, setRestImagePreview] = useState<string | null>(null)
  const [uploadingRestImage, setUploadingRestImage] = useState(false)
  const [viewsThisMonth, setViewsThisMonth] = useState(0)
  const [viewsLastMonth, setViewsLastMonth] = useState(0)
  const [viewsAllTime, setViewsAllTime] = useState(0)
  const [viewsMonthlyRaw, setViewsMonthlyRaw] = useState<any[]>([])
  const [ordersCount, setOrdersCount] = useState(0)
  const [likesCount, setLikesCount] = useState(0)

  const avgRating = useMemo(() =>
    reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null
  , [reviews])

  const starDist = useMemo(() =>
    [5, 4, 3, 2, 1].map(n => ({
      stars: n,
      count: reviews.filter(r => r.rating === n).length,
      pct: reviews.length > 0 ? Math.round(reviews.filter(r => r.rating === n).length / reviews.length * 100) : 0,
    }))
  , [reviews])

  const reviewsByDay = useMemo(() => {
    const counts = Array(7).fill(0)
    const cutoff = Date.now() - 30 * 86400000
    reviews.filter(r => new Date(r.created_at).getTime() > cutoff)
      .forEach(r => { counts[(new Date(r.created_at).getDay() + 6) % 7]++ })
    return counts
  }, [reviews])

  const unreadCount = vendorNotifs.filter(n => !n.is_read).length

  useEffect(() => {
    if (!supabase || !user) { setDbLoading(false); return }
    async function load() {
      setDbLoading(true)

      // 1re requête : restaurant (son id est requis pour les suivantes)
      const { data: rest } = await (supabase.from('restaurants') as any).select('*').eq('owner_id', user!.id).maybeSingle()

      if (rest) {
        setRestaurant(rest)
        if (rest.image_url) setRestImagePreview(rest.image_url)
        setRestaurantForm({ nom: rest.name || '', cuisine: rest.cuisine_label || '', ville: rest.location || '', adresse: rest.address || '', telephone: rest.phone || '', whatsapp: rest.whatsapp || '', instagram: rest.instagram || '', description: rest.description || '', horaires: rest.hours || '' })
        setHoursForm(parseHoursForm(rest.hours))

        const now           = new Date()
        const monthStart    = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
        const sixMonthsAgo  = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()

        // Toutes les requêtes en parallèle
        const [
          { data: menu },
          { data: revs },
          { count: vCount },
          { count: vLastMonth },
          { count: vAllTime },
          { data: vMonthlyRaw },
          { count: lCount },
          { count: oCount },
          { data: zones },
          { data: prof },
          { data: sub },
        ] = await Promise.all([
          (supabase.from('menu_items') as any).select('*').eq('restaurant_id', rest.id).order('category'),
          (supabase.from('reviews') as any).select('*, profiles(full_name)').eq('restaurant_id', rest.id).order('created_at', { ascending: false }).limit(100),
          (supabase.from('restaurant_views') as any).select('*', { count: 'exact', head: true }).eq('restaurant_id', rest.id).gte('created_at', monthStart),
          (supabase.from('restaurant_views') as any).select('*', { count: 'exact', head: true }).eq('restaurant_id', rest.id).gte('created_at', lastMonthStart).lt('created_at', monthStart),
          (supabase.from('restaurant_views') as any).select('*', { count: 'exact', head: true }).eq('restaurant_id', rest.id),
          (supabase.from('restaurant_views') as any).select('created_at').eq('restaurant_id', rest.id).gte('created_at', sixMonthsAgo),
          (supabase.from('restaurant_likes') as any).select('*', { count: 'exact', head: true }).eq('restaurant_id', rest.id),
          (supabase.from('orders') as any).select('*', { count: 'exact', head: true }).eq('restaurant_id', rest.id),
          (supabase.from('delivery_zones') as any).select('*').eq('restaurant_id', rest.id).order('quartier'),
          (supabase.from('profiles') as any).select('rib, bank_name, account_name').eq('id', user!.id).maybeSingle(),
          (supabase.from('subscriptions') as any).select('*').eq('vendor_id', user!.id).maybeSingle(),
        ])

        setMenuItems(menu || [])
        if (menu && menu.length > 0) { setMenuCategory(menu[0].category || 'Plats Principaux'); setNewDish(prev => ({ ...prev, categorie: menu[0].category || 'Plats Principaux' })) }
        setReviews((revs as any[] || []).map((r: any) => ({ ...r, initials: (r.profiles?.full_name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2), name: r.profiles?.full_name || 'Utilisateur', stars: r.rating, date: new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }), comment: r.text || '' })))
        setViewsThisMonth(vCount || 0)
        setViewsLastMonth(vLastMonth || 0)
        setViewsAllTime(vAllTime || 0)
        setViewsMonthlyRaw(vMonthlyRaw || [])
        setOrdersCount(oCount || 0)
        setLikesCount(lCount || 0)
        setDeliveryZones(zones || [])
        if (prof) setBankForm({ rib: prof.rib || '', bank_name: prof.bank_name || '', account_name: prof.account_name || '' })
        if (sub) setSubscription(sub)
      } else {
        // Pas de restaurant — profile et subscription en parallèle quand même
        const [{ data: prof }, { data: sub }] = await Promise.all([
          (supabase.from('profiles') as any).select('rib, bank_name, account_name').eq('id', user!.id).maybeSingle(),
          (supabase.from('subscriptions') as any).select('*').eq('vendor_id', user!.id).maybeSingle(),
        ])
        if (prof) setBankForm({ rib: prof.rib || '', bank_name: prof.bank_name || '', account_name: prof.account_name || '' })
        if (sub) setSubscription(sub)
      }

      setDbLoading(false)
    }
    load()
  }, [user])

  // Fetch notifications from Supabase
  useEffect(() => {
    if (!supabase || !user) { setNotifsLoading(false); return }
    async function loadNotifs() {
      setNotifsLoading(true)
      const { data } = await (supabase.from('notifications') as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50)
      setVendorNotifs(data || [])
      setNotifsLoading(false)
    }
    loadNotifs()

    // Realtime subscription for new notifications
    const channel = supabase
      .channel('vendor-notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user!.id}` },
        (payload) => { setVendorNotifs(prev => [payload.new, ...prev]) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const menuByCategory = menuItems.reduce((acc, item) => {
    const cat = item.category || 'Plats Principaux'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})
  const menuCategories = Object.keys(menuByCategory)

  function handleSignOut() { signOut(); navigate('/') }

  async function markRead(id: any) {
    if (!supabase) return
    await (supabase.from('notifications') as any).update({ is_read: true }).eq('id', id)
    setVendorNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllNotifsRead() {
    if (!supabase || !user) return
    await (supabase.from('notifications') as any).update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    setVendorNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function toggleActive() {
    if (!supabase || !restaurant) return
    const next = !restaurant.is_active
    const { error } = await (supabase.from('restaurants') as any).update({ is_active: next }).eq('id', restaurant.id)
    if (!error) setRestaurant((prev: any) => ({ ...prev, is_active: next }))
  }

  async function toggleOpen() {
    if (!supabase || !restaurant) return
    const next = !(restaurant.is_open !== false)
    const { error } = await (supabase.from('restaurants') as any).update({ is_open: next }).eq('id', restaurant.id)
    if (!error) setRestaurant((prev: any) => ({ ...prev, is_open: next }))
  }

  async function createRestaurant() {
    if (!supabase || !createForm.nom.trim() || !createForm.cuisine.trim() || !createForm.ville.trim()) return
    setCreatingRest(true)
    const { data, error } = await (supabase.from('restaurants') as any).insert({ owner_id: user!.id, name: createForm.nom, cuisine: createForm.cuisine.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ''), cuisine_label: createForm.cuisine, flag: createForm.flag, emoji: createForm.flag, gradient: 'linear-gradient(135deg,#c5611a,#a04d12)', location: createForm.ville, description: createForm.description, is_active: false }).select().single()
    setCreatingRest(false)
    if (!error && data) { setRestaurant(data); setRestaurantForm({ nom: data.name || '', cuisine: data.cuisine_label || '', ville: data.location || '', adresse: data.address || '', telephone: data.phone || '', whatsapp: data.whatsapp || '', instagram: data.instagram || '', description: data.description || '', horaires: data.hours || '' }); setActiveSection('restaurant') }
  }

  async function uploadRestaurantImage() {
    if (!restImageFile || !supabase || !restaurant) return
    setUploadingRestImage(true)
    const ext = restImageFile.name.split('.').pop()
    const path = `${restaurant.id}/cover.${ext}`
    const { error } = await supabase.storage.from('restaurant-images').upload(path, restImageFile, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('restaurant-images').getPublicUrl(path)
      const url = data?.publicUrl
      if (url) { await (supabase.from('restaurants') as any).update({ image_url: url }).eq('id', restaurant.id); setRestaurant((prev: any) => ({ ...prev, image_url: url })); setRestImagePreview(url); setRestImageFile(null) }
    }
    setUploadingRestImage(false)
  }

  async function saveRestaurant() {
    if (!supabase || !restaurant) return
    setSavingRest(true); setSaveMsg('')
    const hoursString = hoursForm.jours === 'Sur commande uniquement'
      ? 'Sur commande uniquement'
      : `${hoursForm.jours} · ${hoursForm.open}–${hoursForm.close}`
    const { error } = await (supabase.from('restaurants') as any).update({ name: restaurantForm.nom, cuisine_label: restaurantForm.cuisine, location: restaurantForm.ville, address: restaurantForm.adresse, phone: restaurantForm.telephone, whatsapp: restaurantForm.whatsapp, instagram: restaurantForm.instagram, description: restaurantForm.description, hours: hoursString }).eq('id', restaurant.id)
    setSavingRest(false)
    if (!error) setRestaurant((prev: any) => ({ ...prev, hours: hoursString }))
    setSaveMsg(error ? t('vd.save_error') : t('vd.save_success'))
    setTimeout(() => setSaveMsg(''), 3000)
  }

  async function saveBank() {
    if (!supabase || !user) return
    setSavingBank(true); setBankMsg('')
    const { error } = await (supabase.from('profiles') as any).update({ rib: bankForm.rib, bank_name: bankForm.bank_name, account_name: bankForm.account_name }).eq('id', user.id)
    setSavingBank(false)
    setBankMsg(error ? t('vd.save_error') : t('vd.bank_save_success'))
    setTimeout(() => setBankMsg(''), 3000)
  }

  function startUpgrade(plan: any) {
    if (plan === 'free') {
      if (!supabase || !user) return
      ;(supabase.from('subscriptions') as any).update({ plan: 'free' }).eq('vendor_id', user.id).then(() => setSubscription((prev: any) => prev ? { ...prev, plan: 'free' } : null))
      return
    }
    setUpgradingPlan(plan); setPaymentForm({ bank: '', reference: '', sender_name: '' }); setReceiptFile(null); setReceiptPreview(null); setPaymentMsg('')
  }

  async function submitPayment() {
    if (!supabase || !user || !upgradingPlan) return
    if (!paymentForm.bank || !paymentForm.reference.trim() || !paymentForm.sender_name.trim()) { setPaymentMsg(t('vd.payment_err')); return }
    setSubmittingPayment(true); setPaymentMsg('')
    let receiptUrl = null
    if (receiptFile) {
      const ext = receiptFile.name.split('.').pop()
      const path = `${user.id}/receipt_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('subscription-receipts').upload(path, receiptFile, { upsert: true })
      if (!upErr) { const { data } = supabase.storage.from('subscription-receipts').getPublicUrl(path); receiptUrl = data?.publicUrl || null }
    }
    const { error } = await (supabase.from('subscription_payments') as any).insert({ vendor_id: user.id, plan: upgradingPlan, bank: paymentForm.bank, reference: paymentForm.reference.trim(), sender_name: paymentForm.sender_name.trim(), receipt_url: receiptUrl, status: 'pending' })
    setSubmittingPayment(false)
    if (error) { setPaymentMsg('Erreur : ' + error.message); return }
    setPaymentMsg(t('vd.payment_sent'))
    setUpgradingPlan(null)
  }

  async function addDeliveryZone() {
    if (!supabase || !restaurant || !newZone.quartier.trim() || !newZone.price) return
    setSavingZone(true)
    const { data, error } = await (supabase.from('delivery_zones') as any).insert({ restaurant_id: restaurant.id, quartier: newZone.quartier.trim(), price: parseFloat(newZone.price) }).select().single()
    setSavingZone(false)
    if (!error && data) { setDeliveryZones(prev => [...prev, data].sort((a, b) => a.quartier.localeCompare(b.quartier))); setNewZone({ quartier: '', price: '' }) }
  }

  async function removeDeliveryZone(zoneId: any) {
    if (!supabase) return
    await supabase.from('delivery_zones').delete().eq('id', zoneId)
    setDeliveryZones(prev => prev.filter(z => z.id !== zoneId))
  }

  function handleDishImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setDishImageFile(file); setDishImagePreview(URL.createObjectURL(file))
  }

  function clearDishImage() { setDishImageFile(null); setDishImagePreview(null) }

  async function uploadDishImage(dishId: any) {
    if (!dishImageFile || !supabase) return null
    setUploadingImage(true)
    const ext = dishImageFile.name.split('.').pop()
    const path = `${restaurant.id}/${dishId}.${ext}`
    const { error } = await supabase.storage.from('menuimages').upload(path, dishImageFile, { upsert: true })
    setUploadingImage(false)
    if (error) { setSaveMsg(`Erreur upload : ${error.message}`); setTimeout(() => setSaveMsg(''), 4000); return null }
    const { data } = supabase.storage.from('menuimages').getPublicUrl(path)
    return data?.publicUrl || null
  }

  async function saveDish() {
    if (!newDish.nom.trim() || !restaurant) return
    const cat = newDish.categorie || menuCategory
    if (!editingDish && (subscription?.plan || 'free') === 'free' && menuItems.length >= 3) return
    if (editingDish) {
      if (supabase) {
        let imageUrl = null
        if (dishImageFile) imageUrl = await uploadDishImage(editingDish)
        await (supabase.from('menu_items') as any).update({ name: newDish.nom, price: parseFloat(newDish.prix) || 0, description: newDish.description, category: cat, is_popular: newDish.populaire, prep_time_min: parseInt(newDish.prepTime) || 15, ...(imageUrl ? { image_url: imageUrl } : {}) }).eq('id', editingDish)
      }
      setMenuItems(prev => prev.map(d => d.id === editingDish ? { ...d, name: newDish.nom, price: newDish.prix, description: newDish.description, category: cat, is_popular: newDish.populaire, ...(dishImageFile && dishImagePreview ? { image_url: dishImagePreview } : {}) } : d))
      setEditingDish(null)
    } else {
      if (supabase) {
        const { data } = await (supabase.from('menu_items') as any).insert({ restaurant_id: restaurant.id, name: newDish.nom, price: parseFloat(newDish.prix) || 0, description: newDish.description, category: cat, is_popular: newDish.populaire, is_available: true, prep_time_min: parseInt(newDish.prepTime) || 15 }).select().single()
        if (data) {
          if (dishImageFile) { const imageUrl = await uploadDishImage(data.id); if (imageUrl) { await (supabase.from('menu_items') as any).update({ image_url: imageUrl }).eq('id', data.id); data.image_url = imageUrl } }
          setMenuItems(prev => [...prev, data]); setNewDish({ nom: '', prix: '', description: '', categorie: menuCategory, populaire: false, prepTime: '' }); clearDishImage(); setShowAddForm(false); return
        }
      }
      setMenuItems(prev => [...prev, { id: Date.now(), name: newDish.nom, price: newDish.prix, description: newDish.description, category: cat, is_popular: newDish.populaire }])
    }
    setNewDish({ nom: '', prix: '', description: '', categorie: menuCategory, populaire: false, prepTime: '' }); clearDishImage(); setShowAddForm(false)
  }

  async function deleteDish(id: any) {
    if (supabase) await supabase.from('menu_items').delete().eq('id', id)
    setMenuItems(prev => prev.filter(d => d.id !== id))
  }

  function startEdit(dish: any) {
    setEditingDish(dish.id); setNewDish({ nom: dish.name, prix: String(dish.price), description: dish.description, categorie: dish.category || menuCategory, populaire: dish.is_popular, prepTime: String(dish.prep_time_min || 15) }); clearDishImage(); setDishImagePreview(dish.image_url || null); setShowAddForm(true)
  }

  function navigate_to(section: string) { setActiveSection(section); setSidebarOpen(false) }

  // ── Sidebar ───────────────────────────────────────────────────────────────

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className={`${collapsed ? 'px-2 py-5 justify-center' : 'px-6 py-5'} flex items-center`}
        style={{ borderBottom: '1px solid rgba(248,248,248,0.10)' }}>
        {!collapsed ? (
          <div>
            <span className="font-serif text-2xl font-bold" style={{ color: C.terra }}>DiaTable</span>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(248,248,248,0.35)' }}>{t('vd.vendor_space')}</p>
          </div>
        ) : (
          <span className="font-serif text-xl font-bold" style={{ color: C.terra }}>D</span>
        )}
      </div>

      <div className={`${collapsed ? 'px-2 py-4 justify-center' : 'px-6 py-4'} flex items-center gap-3`}
        style={{ borderBottom: '1px solid rgba(248,248,248,0.10)' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ backgroundColor: C.terra, color: C.creamLight }}>
          {vendorName.charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: C.creamLight }}>{vendorName}</p>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `rgba(197,97,26,0.25)`, color: C.terra }}>{t('vd.vendor_badge')}</span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem icon={LayoutDashboard} label={t('vd.overview')}        active={activeSection === 'apercu'}      onClick={() => navigate_to('apercu')}      collapsed={collapsed} />
        <NavItem icon={Package}         label={t('vd.orders')}          active={activeSection === 'commandes'}   onClick={() => navigate_to('commandes')}   collapsed={collapsed} />
        <NavItem icon={MessageCircle}   label={t('vd.messages')}        active={activeSection === 'messages'}    onClick={() => navigate_to('messages')}    collapsed={collapsed} />
        <NavItem icon={Store}           label={t('vd.my_restaurant')}   active={activeSection === 'restaurant'}  onClick={() => navigate_to('restaurant')}  collapsed={collapsed} />
        <NavItem icon={Utensils}        label={t('vd.menu')}            active={activeSection === 'menu'}        onClick={() => navigate_to('menu')}        collapsed={collapsed} />
        <NavItem icon={Star}            label={t('vd.reviews')}         active={activeSection === 'avis'}        onClick={() => navigate_to('avis')}        collapsed={collapsed} />
        <NavItem icon={BarChart2}       label={t('vd.stats')}           active={activeSection === 'stats'}       onClick={() => navigate_to('stats')}       collapsed={collapsed} />
        <NavItem icon={Crown}           label={t('vd.subscription')}    active={activeSection === 'abonnement'}  onClick={() => navigate_to('abonnement')}  collapsed={collapsed} />
        <NavItem icon={Bell}            label={t('vd.notifications')}   active={activeSection === 'notifs'}      onClick={() => navigate_to('notifs')}      badge={unreadCount > 0 ? unreadCount : undefined} collapsed={collapsed} />
        <NavItem icon={Bike}            label="Livreurs"                active={activeSection === 'livreurs'}    onClick={() => navigate_to('livreurs')}    collapsed={collapsed} />
      </nav>

      <div className="px-3 py-4 space-y-1" style={{ borderTop: '1px solid rgba(248,248,248,0.10)' }}>
        <Link to="/restaurants/1" title={collapsed ? t('vd.view_page') : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${collapsed ? 'justify-center px-0' : ''}`}
          style={{ color: 'rgba(248,248,248,0.65)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(248,248,248,0.08)'; e.currentTarget.style.color = C.creamLight }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(248,248,248,0.65)' }}>
          <Eye size={18} className="shrink-0" />
          {!collapsed && <span>{t('vd.view_page')}</span>}
        </Link>
        <button onClick={handleSignOut} title={collapsed ? t('vd.sign_out') : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${collapsed ? 'justify-center px-0' : ''}`}
          style={{ color: 'rgba(248,248,248,0.65)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#fca5a5' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(248,248,248,0.65)' }}>
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>{t('vd.sign_out')}</span>}
        </button>
      </div>

      <button onClick={() => setCollapsed(v => !v)}
        className="hidden lg:flex w-full items-center justify-center py-3 transition-colors"
        style={{ borderTop: '1px solid rgba(248,248,248,0.10)', color: 'rgba(248,248,248,0.35)' }}
        onMouseEnter={e => e.currentTarget.style.color = C.creamLight}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(248,248,248,0.35)'}
        title={collapsed ? t('vd.expand') : t('vd.collapse')}>
        <ChevronLeft size={18} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
      </button>
    </div>
  )

  // ── Sections ──────────────────────────────────────────────────────────────

  function renderApercu() {
    const maxBar = Math.max(...reviewsByDay, 1)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold" style={{ color: C.dark }}>{t('vd.hello', { name: vendorName.split(' ')[0] })}</h1>
          <p className="text-sm mt-1 capitalize" style={{ color: C.muted }}>{today}</p>
        </div>

        {/* ── Statut ouvert / fermé ─────────────────────────────── */}
        {restaurant && (() => {
          const effectivelyOpen = getEffectivelyOpen(restaurant)
          const manuallyOpen = restaurant.is_open !== false
          const scheduleResult = parseSchedule(restaurant.hours)
          const autoClosedBySchedule = manuallyOpen && scheduleResult === false
          return (
            <div className="rounded-xl p-5 shadow-sm"
              style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: effectivelyOpen ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.10)' }}>
                    <Power size={20} style={{ color: effectivelyOpen ? '#16a34a' : '#dc2626' }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: C.muted }}>{t('vd.status_visible')}</p>
                    <p className="text-sm font-bold" style={{ color: effectivelyOpen ? '#16a34a' : '#dc2626' }}>
                      {effectivelyOpen ? t('vd.open_status') : t('vd.closed_status')}
                    </p>
                    {autoClosedBySchedule && (
                      <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                        {t('vd.auto_closed')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <button
                    onClick={toggleOpen}
                    className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={manuallyOpen ? {
                      backgroundColor: 'rgba(239,68,68,0.10)',
                      color: '#dc2626',
                      border: '1px solid rgba(239,68,68,0.25)',
                    } : {
                      backgroundColor: 'rgba(34,197,94,0.12)',
                      color: '#16a34a',
                      border: '1px solid rgba(34,197,94,0.30)',
                    }}
                  >
                    {manuallyOpen ? t('vd.close_manually') : t('vd.reopen_manually')}
                  </button>
                  <p className="text-[0.68rem]" style={{ color: C.muted }}>
                    {manuallyOpen ? t('vd.manual_close_off') : t('vd.manual_close_on')}
                  </p>
                </div>
              </div>
            </div>
          )
        })()}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Eye}          value={viewsThisMonth} label={t('vd.views_this_month')}   trend={viewsThisMonth > 0 ? 'profil consulté' : 'aucune vue'} up={viewsThisMonth > 0 ? true : null} />
          <StatCard icon={Star}         value={avgRating ?? '—'} label={t('vd.avg_rating')} trend={avgRating ? 'réel' : 'aucun avis'} up={null} />
          <StatCard icon={MessageSquare} value={reviews.length} label={t('vd.reviews_published')}  trend={reviews.length > 0 ? `+${reviews.filter(r => Date.now() - new Date(r.created_at).getTime() < 30 * 86400000).length} ce mois` : 'aucun'} up={reviews.length > 0 ? true : null} />
          <StatCard icon={Heart}        value={likesCount}     label={t('vd.likes')}         trend={likesCount > 0 ? 'favoris' : 'aucun like'} up={likesCount > 0 ? true : null} />
        </div>

        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
          <h3 className="text-sm font-semibold mb-1" style={{ color: C.dark }}>{t('vd.reviews_by_day')}</h3>
          <p className="text-xs mb-4" style={{ color: C.muted }}>{t('vd.last_30_days')}</p>
          {reviews.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-sm" style={{ color: 'rgba(80,70,64,0.30)' }}>{t('vd.no_reviews_yet')}</div>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {reviewsByDay.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  {v > 0 && <span className="text-xs" style={{ color: C.muted }}>{v}</span>}
                  <div className="w-full rounded-t-md transition-all"
                    style={{ height: `${(v / maxBar) * 96}px`, minHeight: v > 0 ? '4px' : '0', backgroundColor: C.terra }} />
                  <span className="text-xs" style={{ color: C.muted }}>{WEEK_DAYS[i]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: C.dark }}>{t('vd.recent_activity')}</h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: C.muted }}>{t('vd.no_activity')}</p>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 5).map((r, i) => (
                <div key={r.id || i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `rgba(197,97,26,0.10)` }}>
                    <Star size={15} style={{ color: C.terra }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: C.dark }}>{r.name} {t('vd.left_review')} <span className="font-semibold" style={{ color: C.terra }}>{r.rating}★</span></p>
                    {r.comment && <p className="text-xs mt-0.5 line-clamp-1" style={{ color: C.muted }}>"{r.comment}"</p>}
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(80,70,64,0.40)' }}>{timeAgo(r.created_at, t)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderRestaurant() {
    const effectivelyOpen = getEffectivelyOpen(restaurant)
    const manuallyOpen = restaurant?.is_open !== false

    const fi = (Icon: any, label: any, field: any, type = 'text', placeholder = '') => (
      <div key={field}>
        <label className="block text-[0.68rem] font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>{label}</label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.terra }}>
            <Icon size={14} />
          </div>
          <input
            type={type}
            value={(restaurantForm as Record<string, string>)[field]}
            onChange={e => setRestaurantForm(prev => ({ ...prev, [field]: e.target.value }))}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm border transition-all"
            style={{ backgroundColor: '#fff', borderColor: 'rgba(80,70,64,0.15)', color: C.dark, outline: 'none' }}
            onFocus={e => e.target.style.borderColor = C.terra}
            onBlur={e => e.target.style.borderColor = 'rgba(80,70,64,0.15)'}
          />
        </div>
      </div>
    )

    return (
      <div className="space-y-6">

        {/* ── En-tête ──────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-serif font-bold" style={{ color: C.dark }}>{t('vd.rest_title')}</h1>
            <p className="text-sm mt-0.5" style={{ color: C.muted }}>{t('vd.rest_subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {restaurant?.is_verified && (
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border"
                style={{ color: '#16a34a', backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <CheckCircle size={12} /> {t('vd.verified')}
              </span>
            )}
            <button onClick={toggleOpen}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all"
              style={manuallyOpen
                ? { color: '#16a34a', backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }
                : { color: '#dc2626', backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
              <Power size={12} />
              {manuallyOpen ? t('vd.open') : t('vd.closed')}
            </button>
          </div>
        </div>

        {/* ── Carte preview (style fiche publique) ─────────────── */}
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(80,70,64,0.10)' }}>

          {/* Hero image */}
          <div className="relative h-52"
            style={!restImagePreview ? { background: 'linear-gradient(135deg,#1f1f1f 0%,#2a2520 55%,rgba(197,97,26,0.55) 100%)' } : {}}>
            {restImagePreview
              ? <img src={restImagePreview} alt={restaurant?.name} className="w-full h-full object-cover" />
              : <div className="absolute inset-0 flex items-center justify-center"><Store size={56} style={{ color: 'rgba(197,97,26,0.30)' }} /></div>
            }
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)' }} />

            {/* Statut badge */}
            <div className="absolute top-3 left-3">
              <span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${effectivelyOpen ? 'bg-green-500/85 text-white' : 'bg-black/55 text-white/70'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${effectivelyOpen ? 'bg-white' : 'bg-white/40'}`} />
                {effectivelyOpen ? t('vd.open') : t('vd.closed')}
              </span>
            </div>

            {/* Bouton photo */}
            <div className="absolute top-3 right-3">
              <label className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer transition-all"
                style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', color: '#f8f8f8', border: '1px solid rgba(255,255,255,0.18)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.65)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.45)'}>
                <ImageIcon size={12} />
                {restImagePreview ? t('vd.change_photo') : t('vd.add_photo')}
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setRestImageFile(f); setRestImagePreview(URL.createObjectURL(f)) } }} />
              </label>
            </div>

            {/* Infos overlay */}
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
              <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: C.terra }}>
                {restaurant?.flag} {restaurant?.cuisine_label || 'Cuisine non définie'}
              </p>
              <h2 className="font-serif text-xl font-black text-white leading-tight">
                {restaurant?.name || 'Nom du restaurant'}
              </h2>
              {restaurant?.location && (
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'rgba(248,248,248,0.55)' }}>
                  <MapPin size={11} /> {restaurant.location}
                </p>
              )}
            </div>
          </div>

          {/* Barre upload photo */}
          {restImageFile && (
            <div className="px-5 py-3 flex items-center justify-between"
              style={{ backgroundColor: 'rgba(197,97,26,0.07)', borderBottom: '1px solid rgba(197,97,26,0.15)' }}>
              <p className="text-xs font-medium" style={{ color: C.terra }}>{t('vd.new_photo_selected')}</p>
              <button onClick={uploadRestaurantImage} disabled={uploadingRestImage}
                className="text-xs font-bold px-4 py-1.5 rounded-lg transition-all disabled:opacity-50"
                style={{ backgroundColor: C.terra, color: '#fff' }}
                onMouseEnter={e => { if (!uploadingRestImage) e.currentTarget.style.backgroundColor = C.terraLight }}
                onMouseLeave={e => { if (!uploadingRestImage) e.currentTarget.style.backgroundColor = C.terra }}>
                {uploadingRestImage ? t('vd.uploading') : t('vd.save_photo')}
              </button>
            </div>
          )}

          {/* Lignes d'info */}
          <div className="bg-white px-5 pt-5 pb-4 space-y-4">
            {[
              { icon: MapPin,        label: 'Adresse',   value: restaurant?.address || restaurant?.location },
              { icon: Clock,         label: 'Horaires',  value: restaurant?.hours },
              { icon: Phone,         label: 'Téléphone', value: restaurant?.phone },
              { icon: MessageSquare, label: 'WhatsApp',  value: restaurant?.whatsapp },
              { icon: Instagram,     label: 'Instagram', value: restaurant?.instagram },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(197,97,26,0.09)' }}>
                  <Icon size={14} style={{ color: C.terra }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: C.muted }}>{label}</p>
                  <p className="text-sm truncate"
                    style={{ color: value ? C.dark : 'rgba(80,70,64,0.28)', fontStyle: value ? 'normal' : 'italic' }}>
                    {value || t('vd.not_set')}
                  </p>
                </div>
              </div>
            ))}
            {restaurant?.description && (
              <div className="pt-3.5" style={{ borderTop: '1px solid rgba(80,70,64,0.07)' }}>
                <p className="text-[0.65rem] font-bold uppercase tracking-widest mb-1.5" style={{ color: C.muted }}>Description</p>
                <p className="text-sm leading-relaxed" style={{ color: C.dark }}>{restaurant.description}</p>
              </div>
            )}
          </div>

          {/* Bouton Modifier */}
          <div className="bg-white px-5 pb-5 pt-2">
            <button
              onClick={() => setEditingRestInfo(v => !v)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border transition-all"
              style={editingRestInfo
                ? { backgroundColor: C.terra, color: '#fff', borderColor: C.terra }
                : { backgroundColor: 'transparent', color: C.terra, borderColor: 'rgba(197,97,26,0.30)' }}
              onMouseEnter={e => { if (!editingRestInfo) e.currentTarget.style.backgroundColor = 'rgba(197,97,26,0.05)' }}
              onMouseLeave={e => { if (!editingRestInfo) e.currentTarget.style.backgroundColor = 'transparent' }}>
              <Edit2 size={14} />
              {editingRestInfo ? t('vd.hide_form') : t('vd.edit_info')}
            </button>
          </div>
        </div>

        {/* ── Formulaire d'édition ─────────────────────────────── */}
        {editingRestInfo && (
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: `1.5px solid ${C.terra}` }}>
            <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg,#1f1f1f 0%,#2a2520 100%)' }}>
              <h2 className="font-serif text-base font-bold" style={{ color: '#f8f8f8' }}>{t('vd.edit_info_title')}</h2>
              <p className="text-xs mt-1" style={{ color: 'rgba(248,248,248,0.38)' }}>
                {t('vd.edit_info_subtitle')}
              </p>
            </div>
            <div className="p-6 space-y-5" style={{ backgroundColor: C.creamLight }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fi(Store,         t('vd.rest_name'),  'nom',      'text', 'Ex : Chez Mama Fatou')}
                {fi(MapPin,        t('vd.city'),        'ville',    'text', 'Ex : Casablanca')}
                {fi(Phone,         t('vd.phone'),       'telephone','tel',  '+212 6 XX XX XX')}
                {fi(MessageSquare, t('vd.whatsapp'),    'whatsapp', 'tel',  '+212 6 XX XX XX')}
                {fi(Instagram,     t('vd.instagram'),   'instagram','text', '@votre.compte')}

                {/* Horaires structurés */}
                <div className="md:col-span-2 space-y-3">
                  <label className="block text-[0.68rem] font-bold uppercase tracking-widest" style={{ color: C.muted }}>{t('vd.opening_hours')}</label>
                  {/* Jours */}
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.terra }}>
                      <Clock size={14} />
                    </div>
                    <select value={hoursForm.jours} onChange={e => setHoursForm(p => ({ ...p, jours: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm border appearance-none"
                      style={{ backgroundColor: '#fff', borderColor: 'rgba(80,70,64,0.15)', color: C.dark, outline: 'none' }}>
                      {JOURS_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
                    </select>
                  </div>
                  {/* Heures ouverture / fermeture */}
                  {hoursForm.jours !== 'Sur commande uniquement' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: C.muted }}>{t('vd.open_time')}</label>
                        <select value={hoursForm.open} onChange={e => setHoursForm(p => ({ ...p, open: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl text-sm border appearance-none text-center font-semibold"
                          style={{ backgroundColor: '#fff', borderColor: 'rgba(80,70,64,0.15)', color: C.dark, outline: 'none' }}>
                          {HEURE_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: C.muted }}>{t('vd.close_time')}</label>
                        <select value={hoursForm.close} onChange={e => setHoursForm(p => ({ ...p, close: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl text-sm border appearance-none text-center font-semibold"
                          style={{ backgroundColor: '#fff', borderColor: 'rgba(80,70,64,0.15)', color: C.dark, outline: 'none' }}>
                          {HEURE_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                  {/* Aperçu */}
                  <div className="flex items-center gap-2 rounded-xl px-4 py-2.5"
                    style={{ backgroundColor: 'rgba(197,97,26,0.08)', border: '1px solid rgba(197,97,26,0.18)' }}>
                    <Clock size={13} style={{ color: C.terra }} />
                    <span className="text-sm font-medium" style={{ color: C.terra }}>
                      {hoursForm.jours === 'Sur commande uniquement'
                        ? 'Sur commande uniquement'
                        : `${hoursForm.jours} · ${hoursForm.open} – ${hoursForm.close}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cuisine */}
              <div>
                <label className="block text-[0.68rem] font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>{t('vd.cuisine_type')}</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.terra }}>
                    <Utensils size={14} />
                  </div>
                  <select value={restaurantForm.cuisine}
                    onChange={e => setRestaurantForm(prev => ({ ...prev, cuisine: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm border appearance-none"
                    style={{ backgroundColor: '#fff', borderColor: 'rgba(80,70,64,0.15)', color: C.dark, outline: 'none' }}>
                    <option value="">{t('vd.choose_cuisine')}</option>
                    {['🇸🇳 Sénégalaise','🇨🇳 Chinoise','🇱🇧 Libanaise','🇸🇾 Syrienne','🇫🇷 Française','🇮🇹 Italienne','🇳🇬 Nigériane','🇮🇳 Indienne','🇧🇷 Brésilienne','🌍 Internationale / Fusion','🍽️ Autre'].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Adresse */}
              {restaurant?.type === 'homecook' ? (
                <div className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <Lock size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    {t('vd.home_cook_address')}
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-[0.68rem] font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>{t('vd.full_address')}</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.terra }}>
                      <MapPin size={14} />
                    </div>
                    <input type="text" value={restaurantForm.adresse}
                      onChange={e => setRestaurantForm(prev => ({ ...prev, adresse: e.target.value }))}
                      placeholder={t('vd.address_visible')}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm border"
                      style={{ backgroundColor: '#fff', borderColor: 'rgba(80,70,64,0.15)', color: C.dark, outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = C.terra}
                      onBlur={e => e.target.style.borderColor = 'rgba(80,70,64,0.15)'} />
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-[0.68rem] font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>{t('vd.description')}</label>
                <textarea rows={4} value={restaurantForm.description}
                  onChange={e => setRestaurantForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez votre cuisine, votre histoire, ce qui vous rend unique…"
                  className="w-full px-4 py-3 rounded-xl text-sm border resize-none"
                  style={{ backgroundColor: '#fff', borderColor: 'rgba(80,70,64,0.15)', color: C.dark, outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = C.terra}
                  onBlur={e => e.target.style.borderColor = 'rgba(80,70,64,0.15)'} />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 flex-wrap pt-1">
                <button onClick={saveRestaurant} disabled={savingRest}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                  style={{ backgroundColor: C.terra, color: '#fff' }}
                  onMouseEnter={e => { if (!savingRest) e.currentTarget.style.backgroundColor = C.terraLight }}
                  onMouseLeave={e => { if (!savingRest) e.currentTarget.style.backgroundColor = C.terra }}>
                  <CheckCircle size={14} />
                  {savingRest ? t('vd.saving') : t('vd.save')}
                </button>
                <button onClick={() => setEditingRestInfo(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border transition-all"
                  style={{ color: C.muted, borderColor: 'rgba(80,70,64,0.18)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.muted}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(80,70,64,0.18)'}>
                  {t('vd.cancel')}
                </button>
                {saveMsg && (
                  <p className={`text-sm font-medium ${saveMsg.includes('Erreur') ? 'text-red-500' : 'text-green-600'}`}>{saveMsg}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Zones de livraison ──────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(80,70,64,0.10)' }}>
          <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg,#1f1f1f 0%,#2a2520 100%)' }}>
            <h2 className="font-serif text-base font-bold" style={{ color: '#f8f8f8' }}>{t('vd.delivery_zones_title')}</h2>
            <p className="text-xs mt-1" style={{ color: 'rgba(248,248,248,0.38)' }}>
              {t('vd.delivery_zones_subtitle')}
            </p>
          </div>
          <div className="p-6 space-y-4" style={{ backgroundColor: C.creamLight }}>
            {deliveryZones.length > 0 ? (
              <div className="space-y-2">
                {deliveryZones.map(zone => (
                  <div key={zone.id} className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{ backgroundColor: '#fff', border: '1px solid rgba(80,70,64,0.08)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(197,97,26,0.09)' }}>
                        <MapPin size={13} style={{ color: C.terra }} />
                      </div>
                      <span className="text-sm font-medium" style={{ color: C.dark }}>{zone.quartier}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold" style={{ color: C.terraDark }}>{Number(zone.price).toFixed(0)} MAD</span>
                      <button onClick={() => removeDeliveryZone(zone.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                        style={{ color: '#ef4444' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={{ backgroundColor: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)' }}>
                <AlertCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  {t('vd.no_zones')}
                </p>
              </div>
            )}

            <div className="flex gap-3 items-end flex-wrap pt-2" style={{ borderTop: '1px solid rgba(80,70,64,0.08)' }}>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[0.68rem] font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>{t('vd.quartier_label')}</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.terra }}>
                    <MapPin size={14} />
                  </div>
                  <select value={newZone.quartier} onChange={e => setNewZone(p => ({ ...p, quartier: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm border appearance-none"
                    style={{ backgroundColor: '#fff', borderColor: 'rgba(80,70,64,0.15)', color: C.dark, outline: 'none' }}>
                    <option value="">{t('vd.choose_quartier')}</option>
                    {['Maârif','Bourgogne','Gauthier','Racine','Anfa','Aïn Diab','Aïn Sebaâ','Sidi Bernoussi','Hay Hassani','Hay Mohammadi','Sbata','Sidi Moumen',"Ben M'Sick",'Mers Sultan','Derb Sultan','Habous','Oasis','Palmier','Belvédère','C.I.L.','2 Mars',"Triangle d'Or",'Casa Port','Bouskoura','Dar Bouazza','Sidi Belyout','Hay El Qods','Hay Oulfa','Al Fida','Roches Noires','Bernoussi','Maârif Extension','Val Fleuri','Californie','Beauséjour']
                      .filter(q => !deliveryZones.some(z => z.quartier === q))
                      .map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>
              </div>
              <div className="w-36">
                <label className="block text-[0.68rem] font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>{t('vd.price_label')}</label>
                <input type="number" min="0" step="1" value={newZone.price}
                  onChange={e => setNewZone(p => ({ ...p, price: e.target.value }))} placeholder="15"
                  className="w-full px-4 py-3 rounded-xl text-sm border text-center font-semibold"
                  style={{ backgroundColor: '#fff', borderColor: 'rgba(80,70,64,0.15)', color: C.dark, outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = C.terra}
                  onBlur={e => e.target.style.borderColor = 'rgba(80,70,64,0.15)'} />
              </div>
              <button onClick={addDeliveryZone} disabled={savingZone || !newZone.quartier || !newZone.price}
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                style={{ backgroundColor: C.terra, color: '#fff' }}
                onMouseEnter={e => { if (!savingZone && newZone.quartier && newZone.price) e.currentTarget.style.backgroundColor = C.terraLight }}
                onMouseLeave={e => { if (!savingZone && newZone.quartier && newZone.price) e.currentTarget.style.backgroundColor = C.terra }}>
                <Plus size={14} /> {savingZone ? t('vd.adding') : t('vd.add')}
              </button>
            </div>
          </div>
        </div>

        {/* ── Informations bancaires ──────────────────────────── */}
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(80,70,64,0.10)' }}>
          <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg,#1f1f1f 0%,#2a2520 100%)' }}>
            <h2 className="font-serif text-base font-bold" style={{ color: '#f8f8f8' }}>{t('vd.bank_title')}</h2>
            <p className="text-xs mt-1" style={{ color: 'rgba(248,248,248,0.38)' }}>{t('vd.bank_subtitle')}</p>
          </div>
          <div className="p-6 space-y-4" style={{ backgroundColor: C.creamLight }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.68rem] font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>{t('vd.bank_name')}</label>
                <input type="text" value={bankForm.bank_name} onChange={e => setBankForm(p => ({ ...p, bank_name: e.target.value }))}
                  placeholder="Ex : Attijariwafa Bank"
                  className="w-full px-4 py-3 rounded-xl text-sm border"
                  style={{ backgroundColor: '#fff', borderColor: 'rgba(80,70,64,0.15)', color: C.dark, outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = C.terra}
                  onBlur={e => e.target.style.borderColor = 'rgba(80,70,64,0.15)'} />
              </div>
              <div>
                <label className="block text-[0.68rem] font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>{t('vd.account_holder')}</label>
                <input type="text" value={bankForm.account_name} onChange={e => setBankForm(p => ({ ...p, account_name: e.target.value }))}
                  placeholder="Nom complet du titulaire"
                  className="w-full px-4 py-3 rounded-xl text-sm border"
                  style={{ backgroundColor: '#fff', borderColor: 'rgba(80,70,64,0.15)', color: C.dark, outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = C.terra}
                  onBlur={e => e.target.style.borderColor = 'rgba(80,70,64,0.15)'} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[0.68rem] font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>{t('vd.rib_label')}</label>
                <input type="text" value={bankForm.rib} onChange={e => setBankForm(p => ({ ...p, rib: e.target.value }))}
                  placeholder="MA00 0000 0000 0000 0000 0000 000"
                  className="w-full px-4 py-3 rounded-xl text-sm border font-mono tracking-wide"
                  style={{ backgroundColor: '#fff', borderColor: 'rgba(80,70,64,0.15)', color: C.dark, outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = C.terra}
                  onBlur={e => e.target.style.borderColor = 'rgba(80,70,64,0.15)'} />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button onClick={saveBank} disabled={savingBank}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                style={{ backgroundColor: C.terra, color: '#fff' }}
                onMouseEnter={e => { if (!savingBank) e.currentTarget.style.backgroundColor = C.terraLight }}
                onMouseLeave={e => { if (!savingBank) e.currentTarget.style.backgroundColor = C.terra }}>
                <CheckCircle size={14} />
                {savingBank ? t('vd.saving') : t('vd.save')}
              </button>
              {bankMsg && (
                <p className={`text-sm font-medium ${bankMsg.includes('Erreur') ? 'text-red-500' : 'text-green-600'}`}>{bankMsg}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Zone de danger ────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(239,68,68,0.18)' }}>
          <div className="px-6 py-5" style={{ backgroundColor: 'rgba(239,68,68,0.04)' }}>
            <h2 className="font-serif text-base font-bold text-red-600">{t('vd.danger_zone')}</h2>
            <p className="text-xs mt-1" style={{ color: C.muted }}>
              {t('vd.danger_subtitle')}
            </p>
          </div>
          <div className="px-6 py-5" style={{ backgroundColor: C.creamLight }}>
            <button onClick={toggleActive}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all"
              style={{ color: '#dc2626', borderColor: 'rgba(239,68,68,0.35)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.06)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              {restaurant?.is_active ? t('vd.deactivate') : t('vd.reactivate')}
            </button>
          </div>
        </div>

      </div>
    )
  }

  function renderMenu() {
    const currentPlanMenu = subscription?.plan || 'free'
    const isFreeMenu      = currentPlanMenu === 'free'
    const atMenuLimit     = isFreeMenu && menuItems.length >= 3
    const currentDishes   = menuByCategory[menuCategory] || []
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-serif font-bold" style={{ color: C.dark }}>{t('vd.menu_title')}</h1>
          {atMenuLimit ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-3 py-1.5 rounded-full font-semibold"
                style={{ backgroundColor: 'rgba(197,97,26,0.10)', color: C.terra, border: '1px solid rgba(197,97,26,0.25)' }}>
                {t('vd.plan_limit')}
              </span>
              <button onClick={() => setActiveSection('abonnement')}
                className="font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                style={{ backgroundColor: '#7c3aed', color: '#fff' }}>
                <Sparkles size={14} /> {t('vd.upgrade_pro')}
              </button>
            </div>
          ) : (
            <button onClick={() => { setShowAddForm(v => !v); setEditingDish(null); setNewDish({ nom: '', prix: '', description: '', categorie: menuCategory, populaire: false, prepTime: '' }) }}
              className="font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
              style={{ backgroundColor: C.terra, color: C.creamLight }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = C.terraLight}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = C.terra}>
              <Plus size={16} /> {t('vd.add_dish')}
            </button>
          )}
        </div>

        {/* Bandeau de limite plan Gratuit */}
        {isFreeMenu && menuItems.length > 0 && (
          <div className="rounded-lg px-4 py-3 flex items-center gap-3 flex-wrap"
            style={{ backgroundColor: 'rgba(197,97,26,0.07)', border: '1px solid rgba(197,97,26,0.18)' }}>
            <Zap size={14} style={{ color: C.terra }} />
            <p className="text-sm flex-1" style={{ color: C.terra }}>
              {t('vd.plan_free_label')} : <strong>{menuItems.length}/3 {t('vd.dishes_count').toLowerCase()}</strong>.{' '}
              {atMenuLimit
                ? t('vd.free_plan_full')
                : t('vd.free_plan_slots', { n: 3 - menuItems.length, s: 3 - menuItems.length > 1 ? 's' : '' })}
            </p>
            {atMenuLimit && (
              <button onClick={() => setActiveSection('abonnement')}
                className="text-xs font-semibold underline flex-shrink-0" style={{ color: C.terra }}>
                {t('vd.see_offers')}
              </button>
            )}
          </div>
        )}

        {menuCategories.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-2xl"
            style={{ backgroundColor: `rgba(197,97,26,0.04)`, borderColor: `rgba(197,97,26,0.25)` }}>
            <Utensils size={40} className="mx-auto mb-3" style={{ color: C.terra }} />
            <h3 className="font-serif font-bold mb-2" style={{ color: C.dark }}>{t('vd.empty_menu_title')}</h3>
            <p className="text-sm mb-4" style={{ color: C.muted }}>{t('vd.empty_menu_sub')}</p>
            <button onClick={() => setShowAddForm(true)} className="btn btn-gold text-sm flex items-center gap-1 mx-auto"><Plus size={16} /> {t('vd.add_first_dish')}</button>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {menuCategories.map(cat => (
              <button key={cat} onClick={() => { setMenuCategory(cat); setShowAddForm(false) }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all border"
                style={menuCategory === cat ? { backgroundColor: C.dark, color: C.terra, borderColor: C.dark } : { backgroundColor: C.creamLight, color: C.muted, borderColor: 'rgba(80,70,64,0.15)' }}
                onMouseEnter={e => { if (menuCategory !== cat) { e.currentTarget.style.borderColor = C.terra; e.currentTarget.style.color = C.dark } }}
                onMouseLeave={e => { if (menuCategory !== cat) { e.currentTarget.style.borderColor = 'rgba(80,70,64,0.15)'; e.currentTarget.style.color = C.muted } }}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {showAddForm && (
          <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `2px solid ${C.terra}` }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: C.dark }}>{editingDish ? t('vd.edit_dish') : t('vd.new_dish')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: t('vd.dish_name'), key: 'nom', type: 'text', placeholder: 'Ex : Thiéboudiène royal' },
                { label: t('vd.dish_price'), key: 'prix', type: 'text', placeholder: 'Ex : 85' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>{label}</label>
                  <input type={type} value={(newDish as Record<string, string | boolean>)[key] as string} onChange={e => setNewDish(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5611a]/40" style={{ color: C.dark }} />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>{t('vd.dish_description')}</label>
                <input value={newDish.description} onChange={e => setNewDish(p => ({ ...p, description: e.target.value }))} placeholder="Courte description du plat"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5611a]/40" style={{ color: C.dark }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>{t('vd.dish_category')}</label>
                <select value={newDish.categorie} onChange={e => setNewDish(p => ({ ...p, categorie: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5611a]/40" style={{ color: C.dark }}>
                  {menuCategories.length > 0 ? menuCategories.map(c => <option key={c}>{c}</option>) : <option>Plats Principaux</option>}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>{t('vd.prep_time')}</label>
                <input type="number" min="1" max="180" value={newDish.prepTime} onChange={e => setNewDish(p => ({ ...p, prepTime: e.target.value }))} placeholder="15"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5611a]/40" style={{ color: C.dark }} />
                <p className="text-xs mt-1" style={{ color: C.muted }}>{t('vd.prep_time_hint')}</p>
              </div>
              <div className="flex items-center gap-2 mt-5">
                <input type="checkbox" id="populaire" checked={newDish.populaire} onChange={e => setNewDish(p => ({ ...p, populaire: e.target.checked }))} className="w-4 h-4 accent-[#c5611a]" />
                <label htmlFor="populaire" className="text-sm" style={{ color: C.dark }}>{t('vd.popular_label')}</label>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium mb-2" style={{ color: C.muted }}>{t('vd.dish_photo')}</label>
              {dishImagePreview ? (
                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={dishImagePreview} alt="aperçu" className="w-full h-full object-cover" />
                  <button onClick={clearDishImage} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><XIcon size={14} /></button>
                  <label className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg cursor-pointer hover:bg-black/80 transition-colors">Changer<input type="file" accept="image/*" className="hidden" onChange={handleDishImageSelect} /></label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all group"
                  style={{ borderColor: 'rgba(197,97,26,0.25)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.terra}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(197,97,26,0.25)'}>
                  <ImageIcon size={24} className="mb-1 transition-colors" style={{ color: 'rgba(197,97,26,0.40)' }} />
                  <span className="text-xs" style={{ color: C.muted }}>{t('vd.click_add_photo')}</span>
                  <span className="text-xs mt-0.5" style={{ color: 'rgba(80,70,64,0.40)' }}>{t('vd.photo_formats')}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleDishImageSelect} />
                </label>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={saveDish} disabled={uploadingImage}
                className="font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
                style={{ backgroundColor: C.terra, color: C.creamLight }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = C.terraLight}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = C.terra}>
                {uploadingImage ? t('vd.uploading_image') : t('vd.save')}
              </button>
              <button onClick={() => { setShowAddForm(false); setEditingDish(null); clearDishImage() }}
                className="border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors" style={{ color: C.muted }}>
                {t('vd.cancel')}
              </button>
            </div>
            {saveMsg && <p className={`text-sm mt-2 ${saveMsg.includes('Erreur') ? 'text-red-500' : 'text-green-600'}`}>{saveMsg}</p>}
          </div>
        )}

        {menuCategories.length > 0 && (
          <div className="space-y-3">
            {currentDishes.map((dish: any) => (
              <div key={dish.id} className="rounded-xl p-4 shadow-sm flex items-start gap-4"
                style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100"
                  style={{ backgroundColor: `rgba(197,97,26,0.08)` }}>
                  {dish.image_url
                    ? <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" loading="lazy" />
                    : <Utensils size={20} style={{ color: C.terra }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: C.dark }}>{dish.name}</p>
                    {dish.is_popular && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: `rgba(197,97,26,0.12)`, color: C.terraDark }}>{t('vd.popular_badge')}</span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>{dish.description}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-bold" style={{ color: C.dark }}>{dish.price} MAD</span>
                  <button onClick={() => startEdit(dish)} className="transition-colors" style={{ color: C.muted }}
                    onMouseEnter={e => e.currentTarget.style.color = C.dark} onMouseLeave={e => e.currentTarget.style.color = C.muted}><Edit2 size={15} /></button>
                  <button onClick={() => deleteDish(dish.id)} className="transition-colors text-red-300 hover:text-red-500"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
            {currentDishes.length === 0 && <div className="text-center py-10 text-sm" style={{ color: C.muted }}>{t('vd.no_dishes_category')}</div>}
          </div>
        )}
      </div>
    )
  }

  function renderAvis() {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-serif font-bold" style={{ color: C.dark }}>{t('vd.reviews_title')}</h1>
        <div className="rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-8 items-start md:items-center"
          style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
          <div className="text-center">
            <p className="text-6xl font-serif font-bold" style={{ color: C.dark }}>{avgRating ?? '—'}</p>
            <Stars count={5} size={20} />
            <p className="text-sm mt-1" style={{ color: C.muted }}>{t('vd.reviews_count', { count: reviews.length })}</p>
          </div>
          <div className="flex-1 space-y-2 w-full">
            {starDist.map(({ stars, pct }) => (
              <div key={stars} className="flex items-center gap-3">
                <span className="text-xs w-4 text-right" style={{ color: C.muted }}>{stars}</span>
                <Star size={12} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
                <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'rgba(80,70,64,0.12)' }}>
                  <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: C.terra }} />
                </div>
                <span className="text-xs w-8" style={{ color: C.muted }}>{pct}%</span>
              </div>
            ))}
          </div>
        </div>
        {reviews.length === 0 ? (
          <div className="text-center py-12 rounded-xl shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
            <Star size={36} className="mx-auto mb-3" style={{ color: 'rgba(80,70,64,0.20)' }} />
            <p className="text-sm font-semibold mb-1" style={{ color: C.dark }}>{t('vd.no_reviews_title')}</p>
            <p className="text-xs" style={{ color: C.muted }}>{t('vd.no_reviews_sub')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r, i) => (
              <div key={r.id || i} className="rounded-xl p-5 shadow-sm"
                style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: C.dark, color: C.terra }}>
                    {r.initials}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-sm font-semibold" style={{ color: C.dark }}>{r.name}</p>
                      <p className="text-xs" style={{ color: C.muted }}>{r.date}</p>
                    </div>
                    <Stars count={r.stars} size={13} />
                    <p className="text-sm mt-2 leading-relaxed" style={{ color: 'rgba(31,31,31,0.75)' }}>{r.comment}</p>
                    <button className="mt-3 text-xs font-medium flex items-center gap-1 hover:underline" style={{ color: C.terra }}>
                      <MessageSquare size={12} /> {t('vd.reply')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  function renderStats() {
    const currentPlan = subscription?.plan || 'free'
    const isPro     = currentPlan === 'pro' || currentPlan === 'premium'
    const isPremium = currentPlan === 'premium'

    // ── Computed values ──────────────────────────────────────────────────────────
    const popularDishes  = menuItems.filter(d => d.is_popular)
    const topDishes      = popularDishes.length > 0 ? popularDishes : menuItems.slice(0, 5)
    const avgMenuPrice   = menuItems.length > 0 ? Math.round(menuItems.reduce((s, m) => s + Number(m.price || 0), 0) / menuItems.length) : null
    const priceMin       = menuItems.length > 0 ? Math.min(...menuItems.map(m => Number(m.price || 0))) : null
    const priceMax       = menuItems.length > 0 ? Math.max(...menuItems.map(m => Number(m.price || 0))) : null
    const menuWithImage  = menuItems.filter(m => m.image_url).length
    const menuWithDesc   = menuItems.filter(m => m.description && m.description.trim().length > 5).length
    const menuImgPct     = menuItems.length > 0 ? Math.round(menuWithImage / menuItems.length * 100) : 0
    const menuDescPct    = menuItems.length > 0 ? Math.round(menuWithDesc / menuItems.length * 100) : 0
    const prepItems      = menuItems.filter(m => Number(m.prep_time) > 0)
    const prepTimeAvg    = prepItems.length > 0 ? Math.round(prepItems.reduce((s, m) => s + Number(m.prep_time), 0) / prepItems.length) : null

    const nowD            = new Date()
    const thisMonthStart  = new Date(nowD.getFullYear(), nowD.getMonth(), 1).getTime()
    const lastMonthStartT = new Date(nowD.getFullYear(), nowD.getMonth() - 1, 1).getTime()
    const reviewsThisMonthCount = reviews.filter(r => new Date(r.created_at).getTime() >= thisMonthStart).length
    const reviewsLastMonthCount = reviews.filter(r => { const t = new Date(r.created_at).getTime(); return t >= lastMonthStartT && t < thisMonthStart }).length
    const recentAvg      = reviews.length >= 5 ? (reviews.slice(0, 5).reduce((s, r) => s + r.rating, 0) / 5).toFixed(1) : null
    const recentVsGlobal = recentAvg && avgRating ? Number((Number(recentAvg) - Number(avgRating)).toFixed(1)) : null
    const pctPositive    = reviews.length > 0 ? Math.round(reviews.filter(r => r.rating >= 4).length / reviews.length * 100) : 0
    const pctNeutral     = reviews.length > 0 ? Math.round(reviews.filter(r => r.rating === 3).length / reviews.length * 100) : 0
    const pctNegative    = reviews.length > 0 ? Math.round(reviews.filter(r => r.rating <= 2).length / reviews.length * 100) : 0
    const reviewsWithCommentCount = reviews.filter(r => r.comment && r.comment.trim().length > 0).length

    const satisfactionRate = reviews.length > 0 ? Math.round(reviews.filter(r => r.rating >= 4).length / reviews.length * 100) : null
    const engagementRate   = viewsThisMonth > 0 ? ((likesCount / viewsThisMonth) * 100).toFixed(1) : null
    const topDayIdx        = reviewsByDay.indexOf(Math.max(...reviewsByDay))
    const viewsMoMPct      = viewsLastMonth > 0 ? Math.round((viewsThisMonth - viewsLastMonth) / viewsLastMonth * 100) : null
    const loyaltyRate      = viewsAllTime > 0 ? ((likesCount / viewsAllTime) * 100).toFixed(1) : null

    const categorySummary = menuCategories.map(cat => {
      const items = menuItems.filter(m => m.category === cat)
      return { cat, count: items.length, avg: items.length > 0 ? Math.round(items.reduce((s, m) => s + Number(m.price || 0), 0) / items.length) : 0 }
    })
    const priceBrackets = [
      { label: '< 50 MAD',    count: menuItems.filter(m => Number(m.price) < 50).length },
      { label: '50–100 MAD',  count: menuItems.filter(m => Number(m.price) >= 50  && Number(m.price) < 100).length },
      { label: '100–200 MAD', count: menuItems.filter(m => Number(m.price) >= 100 && Number(m.price) < 200).length },
      { label: '> 200 MAD',   count: menuItems.filter(m => Number(m.price) >= 200).length },
    ].filter(b => b.count > 0)
    const maxBracket = Math.max(...priceBrackets.map(b => b.count), 1)

    const sixMonthsLabels = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(nowD.getFullYear(), nowD.getMonth() - 5 + i, 1)
      return { label: d.toLocaleDateString('fr-FR', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() }
    })
    const viewsByMonth    = sixMonthsLabels.map(({ month, year }) =>
      viewsMonthlyRaw.filter(v => { const d = new Date(v.created_at); return d.getMonth() === month && d.getFullYear() === year }).length
    )
    const maxMonthViews   = Math.max(...viewsByMonth, 1)

    const revenueEstimate = avgMenuPrice && (ordersCount > 0 || reviews.length > 0)
      ? (avgMenuPrice * (ordersCount || reviews.length)).toLocaleString('fr-FR')
      : null

    const DAY_LABELS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']

    // ── Helpers locaux ───────────────────────────────────────────────────────────
    const kpiCard = (title: any, value: any, sub: any, accent = false) => (
      <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
        <p className="text-2xl font-serif font-bold" style={{ color: accent ? C.terra : C.dark }}>{value}</p>
        <p className="text-xs font-medium mt-0.5" style={{ color: C.dark }}>{title}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: C.muted }}>{sub}</p>}
      </div>
    )

    // Overlay de verrouillage : floute le contenu + affiche un CTA upgrade
    function locked(plan: any, children: any) {
      const isLocked = plan === 'pro' ? !isPro : !isPremium
      if (!isLocked) return children
      const planName = plan === 'pro' ? 'Pro' : 'Premium'
      const PlanIcon = plan === 'pro' ? Sparkles : Crown
      const iconBg   = plan === 'pro' ? 'rgba(139,92,246,0.12)' : `rgba(197,97,26,0.12)`
      const iconCol  = plan === 'pro' ? '#7c3aed' : C.terra
      const btnStyle = plan === 'pro'
        ? { backgroundColor: '#7c3aed', color: '#fff' }
        : { backgroundColor: C.terra, color: C.creamLight }
      return (
        <div className="relative rounded-2xl overflow-hidden">
          <div className="blur-sm pointer-events-none select-none opacity-50">{children}</div>
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl px-6 text-center"
            style={{ background: 'rgba(234,229,217,0.88)', backdropFilter: 'blur(3px)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: iconBg }}>
              <PlanIcon size={22} style={{ color: iconCol }} />
            </div>
            <p className="font-serif font-bold text-base mb-1" style={{ color: C.dark }}>
              {t('vd.stats_locked_title', { plan: planName })}
            </p>
            <p className="text-xs max-w-xs mb-4" style={{ color: C.muted }}>
              {t('vd.stats_locked_sub', { plan: planName })}
            </p>
            <button onClick={() => setActiveSection('abonnement')}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={btnStyle}>
              {t('vd.see_offers_btn')}
            </button>
          </div>
        </div>
      )
    }

    // Séparateur de section
    function tier(label: any, icon: any, color: any, isUnlocked: any) {
      return (
        <div className="flex items-center gap-2 pt-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest flex-shrink-0"
            style={{ color: isUnlocked ? color : C.muted }}>
            {icon} {label}
          </div>
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(80,70,64,0.12)' }} />
          {!isUnlocked && (
            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: `${color}18`, color }}>
              {t('vd.locked')}
            </span>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-6">

        {/* Header + badge plan */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-serif font-bold" style={{ color: C.dark }}>{t('vd.stats_title')}</h1>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={isPremium
              ? { backgroundColor: 'rgba(197,97,26,0.12)', color: C.terra,  border: `1px solid rgba(197,97,26,0.25)` }
              : isPro
              ? { backgroundColor: 'rgba(139,92,246,0.10)', color: '#7c3aed', border: '1px solid rgba(139,92,246,0.20)' }
              : { backgroundColor: 'rgba(80,70,64,0.08)',   color: C.muted,  border: '1px solid rgba(80,70,64,0.15)' }}>
            {isPremium ? <Crown size={12} /> : isPro ? <Sparkles size={12} /> : <Zap size={12} />}
            {isPremium ? 'Premium' : isPro ? 'Pro' : t('vd.plan_free_label')}
          </div>
        </div>

        {/* ─── TIER 1 : Gratuit ────────────────────────────── */}
        {tier(t('vd.all_plans'), <Zap size={11} />, C.muted, true)}

        {/* KPIs principaux — ligne 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCard(t('vd.avg_rating_stat'),    avgRating ?? '—',       `sur ${reviews.length} avis`)}
          {kpiCard(t('vd.reviews_this_month'),    reviewsThisMonthCount,  reviewsLastMonthCount > 0 ? `${reviewsLastMonthCount} le mois dernier` : 'premier mois')}
          {kpiCard(t('vd.dishes_count'),   menuItems.length,       `${menuCategories.length} catégorie${menuCategories.length !== 1 ? 's' : ''}`)}
          {kpiCard(t('vd.popular_dishes'), popularDishes.length,  'marqués ⭐')}
        </div>

        {/* KPIs menu — ligne 2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCard(t('vd.price_min'),   priceMin != null ? `${priceMin} MAD` : '—', 'plat le moins cher')}
          {kpiCard(t('vd.price_max'),   priceMax != null ? `${priceMax} MAD` : '—', 'plat le plus cher')}
          {kpiCard(t('vd.photos_pct'),   menuItems.length > 0 ? `${menuImgPct}%` : '—', `${menuWithImage}/${menuItems.length} plats avec image`)}
          {kpiCard(t('vd.prep_time_avg'), prepTimeAvg ? `${prepTimeAvg} min` : '—', prepTimeAvg ? 'moyenne estimée' : 'non renseigné')}</div>

        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
          <h3 className="text-sm font-semibold mb-1" style={{ color: C.dark }}>{t('vd.reviews_by_day_stat')}</h3>
          <p className="text-xs mb-4" style={{ color: C.muted }}>{t('vd.last_30_days')}</p>
          {reviews.length === 0 ? (
            <div className="h-28 flex items-center justify-center text-sm" style={{ color: 'rgba(80,70,64,0.30)' }}>{t('vd.no_reviews_received')}</div>
          ) : (
            <>
              <svg viewBox="0 0 560 120" className="w-full" style={{ height: 120 }}>
                <defs>
                  <linearGradient id="vendorLineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.terra} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={C.terra} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={`20,100 ${svgPolyline(reviewsByDay)} 540,100`} fill="url(#vendorLineGrad)" />
                <polyline points={svgPolyline(reviewsByDay)} fill="none" stroke={C.terra} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {reviewsByDay.map((v, i) => {
                  const maxV = Math.max(...reviewsByDay, 1)
                  const x = 20 + i * ((560 - 40) / 6)
                  const y = 20 + (1 - v / maxV) * 80
                  return <circle key={i} cx={x} cy={y} r="4" fill={C.terra} />
                })}
              </svg>
              <div className="flex justify-between mt-1">
                {WEEK_DAYS.map(d => <span key={d} className="text-xs" style={{ color: C.muted }}>{d}</span>)}
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: C.dark }}>{t('vd.notes_distribution')}</h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: C.muted }}>{t('vd.no_reviews_yet')}</p>
          ) : (
            <div className="space-y-2">
              {starDist.map(({ stars, count, pct }) => (
                <div key={stars} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-8 text-right flex-shrink-0" style={{ color: C.dark }}>{stars}★</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(80,70,64,0.12)' }}>
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: C.terra }} />
                  </div>
                  <span className="text-xs w-12 flex-shrink-0" style={{ color: C.muted }}>{count} avis</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sentiment breakdown */}
        {reviews.length > 0 && (
          <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: C.dark }}>{t('vd.sentiment')}</h3>
            <div className="flex gap-2 mb-3">
              {[
                { label: t('vd.positive'), pct: pctPositive, color: '#16a34a', bg: 'rgba(34,197,94,0.10)' },
                { label: t('vd.neutral'),  pct: pctNeutral,  color: C.terra,   bg: 'rgba(197,97,26,0.10)' },
                { label: t('vd.negative'), pct: pctNegative, color: '#dc2626', bg: 'rgba(239,68,68,0.10)' },
              ].map(({ label, pct, color, bg }) => (
                <div key={label} className="flex-1 rounded-xl p-3 text-center" style={{ backgroundColor: bg }}>
                  <p className="text-xl font-serif font-bold" style={{ color }}>{pct}%</p>
                  <p className="text-xs mt-0.5" style={{ color }}>{label}</p>
                </div>
              ))}
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
              {pctPositive > 0 && <div style={{ width: `${pctPositive}%`, backgroundColor: '#16a34a' }} />}
              {pctNeutral  > 0 && <div style={{ width: `${pctNeutral}%`,  backgroundColor: C.terra }} />}
              {pctNegative > 0 && <div style={{ width: `${pctNegative}%`, backgroundColor: '#dc2626' }} />}
            </div>
            <p className="text-xs mt-2 text-right" style={{ color: C.muted }}>
              {t('vd.with_comment', { count: `${reviewsWithCommentCount}/${reviews.length}` })}
            </p>
          </div>
        )}

        {/* Tendance récente */}
        {recentAvg && (
          <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: C.dark }}>{t('vd.recent_trend')}</h3>
            <div className="flex items-center gap-5">
              <div className="text-center">
                <p className="text-2xl font-serif font-bold" style={{ color: C.dark }}>{recentAvg}★</p>
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>{t('vd.last_5_reviews')}</p>
              </div>
              <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(80,70,64,0.12)' }} />
              <div className="text-center">
                <p className="text-2xl font-serif font-bold" style={{ color: C.muted }}>{avgRating}★</p>
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>{t('vd.global_avg')}</p>
              </div>
              {recentVsGlobal !== null && (
                <>
                  <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(80,70,64,0.12)' }} />
                  <div className="text-center">
                    <p className="text-xl font-serif font-bold" style={{ color: recentVsGlobal >= 0 ? '#16a34a' : '#dc2626' }}>
                      {recentVsGlobal >= 0 ? '+' : ''}{recentVsGlobal}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>{t('vd.evolution')}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── TIER 2 : Pro ────────────────────────────────── */}
        {tier(t('vd.advanced_stats'), <Sparkles size={11} />, '#7c3aed', isPro)}

        {locked('pro', (
          <div className="space-y-4">
            {/* Vues — 4 KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
                <p className="text-2xl font-serif font-bold" style={{ color: C.dark }}>{viewsThisMonth}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: C.dark }}>{t('vd.views_this_month_stat')}</p>
                {viewsMoMPct !== null && (
                  <p className="text-xs mt-0.5 font-semibold" style={{ color: viewsMoMPct >= 0 ? '#16a34a' : '#dc2626' }}>
                    {viewsMoMPct >= 0 ? '▲' : '▼'} {Math.abs(viewsMoMPct)}% vs mois dernier
                  </p>
                )}
              </div>
              <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
                <p className="text-2xl font-serif font-bold" style={{ color: C.dark }}>{viewsLastMonth}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: C.dark }}>{t('vd.views_last_month')}</p>
              </div>
              <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
                <p className="text-2xl font-serif font-bold" style={{ color: C.dark }}>{viewsAllTime}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: C.dark }}>{t('vd.views_all_time')}</p>
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>{t('vd.since_start')}</p>
              </div>
              <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
                <p className="text-2xl font-serif font-bold" style={{ color: C.dark }}>{likesCount}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: C.dark }}>{t('vd.favorites')}</p>
                {loyaltyRate && <p className="text-xs mt-0.5" style={{ color: C.muted }}>{loyaltyRate}% des visiteurs</p>}
              </div>
            </div>

            {/* Engagement + Satisfaction */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: C.dark }}>
                  <Eye size={14} style={{ color: C.terra }} /> {t('vd.engagement')}
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Taux d'engagement (ce mois)", value: engagementRate ? `${engagementRate}%` : '—', sub: 'favoris ÷ vues × 100' },
                    { label: 'Taux de fidélisation (all-time)', value: loyaltyRate ? `${loyaltyRate}%` : '—', sub: 'favoris ÷ vues totales × 100' },
                    { label: 'Avis avec commentaire', value: `${reviewsWithCommentCount}/${reviews.length}`, sub: reviews.length > 0 ? `${Math.round(reviewsWithCommentCount / reviews.length * 100)}% de retour écrit` : '' },
                  ].map(({ label, value, sub }) => (
                    <div key={label} className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-medium" style={{ color: C.dark }}>{label}</p>
                        {sub && <p className="text-xs" style={{ color: C.muted }}>{sub}</p>}
                      </div>
                      <p className="text-sm font-bold flex-shrink-0 ml-3" style={{ color: C.terra }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: C.dark }}>
                  <Star size={14} style={{ color: C.terra }} /> {t('vd.satisfaction')}
                </h3>
                {reviews.length === 0 ? (
                  <p className="text-sm" style={{ color: C.muted }}>{t('vd.no_reviews_yet_short')}</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 font-serif font-bold text-lg"
                        style={{
                          backgroundColor: (satisfactionRate ?? 0) >= 80 ? 'rgba(34,197,94,0.12)' : 'rgba(197,97,26,0.12)',
                          color: (satisfactionRate ?? 0) >= 80 ? '#16a34a' : C.terra,
                          border: `2px solid ${(satisfactionRate ?? 0) >= 80 ? 'rgba(34,197,94,0.30)' : 'rgba(197,97,26,0.30)'}`,
                        }}>
                        {satisfactionRate ?? 0}%
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: C.dark }}>{t('vd.satisfaction_rate')}</p>
                        <p className="text-xs mt-1 font-semibold"
                          style={{ color: (satisfactionRate ?? 0) >= 80 ? '#16a34a' : (satisfactionRate ?? 0) >= 60 ? C.terra : '#dc2626' }}>
                          {(satisfactionRate ?? 0) >= 80 ? t('vd.excellent') : (satisfactionRate ?? 0) >= 60 ? t('vd.correct') : t('vd.to_improve')}
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 border-t space-y-1.5" style={{ borderColor: 'rgba(80,70,64,0.10)' }}>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: C.muted }}>{t('vd.best_day')}</span>
                        <span className="font-semibold" style={{ color: C.dark }}>
                          {reviewsByDay.every(v => v === 0) ? '—' : `${DAY_LABELS[topDayIdx]} (${reviewsByDay[topDayIdx]} avis)`}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
<span style={{ color: C.muted }}>{t('vd.reviews_this_month_short')}</span>
                        <span className="font-semibold" style={{ color: C.dark }}>
                          {reviewsThisMonthCount}
                          {reviewsLastMonthCount > 0 && (
                            <span style={{ color: reviewsThisMonthCount >= reviewsLastMonthCount ? '#16a34a' : '#dc2626' }}>
                              {' '}({reviewsThisMonthCount >= reviewsLastMonthCount ? '+' : ''}{reviewsThisMonthCount - reviewsLastMonthCount} vs M-1)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top plats */}
            <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: C.dark }}>
                <Utensils size={14} style={{ color: C.terra }} />
                {popularDishes.length > 0 ? t('vd.popular_dishes_title') : t('vd.top5_title')}
              </h3>
              {topDishes.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: C.muted }}>{t('vd.no_dishes_added')}</p>
              ) : (
                <div className="space-y-3">
                  {topDishes.slice(0, 5).map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: i === 0 ? C.terra : 'rgba(80,70,64,0.10)', color: i === 0 ? C.creamLight : C.muted }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm mb-0.5">
                          <span className="font-medium truncate" style={{ color: C.dark }}>{p.name}</span>
                          <span className="font-semibold ml-2 flex-shrink-0" style={{ color: C.terraDark }}>{Number(p.price).toFixed(0)} MAD</span>
                        </div>
                        <p className="text-xs" style={{ color: C.muted }}>{p.category}{p.prep_time ? ` · ${p.prep_time} min` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* ─── TIER 3 : Premium ────────────────────────────── */}
        {tier(t('vd.premium_analytics'), <Crown size={11} />, C.terra, isPremium)}

        {locked('premium', (
          <div className="space-y-4">

            {/* Revenus + Commandes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: C.dark }}>
                  <TrendingUp size={14} style={{ color: C.terra }} /> {t('vd.revenue_orders')}
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-2xl font-serif font-bold" style={{ color: C.dark }}>
                      {revenueEstimate ? `${revenueEstimate} MAD` : '—'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>{t('vd.total_revenue_est')}</p>
                  </div>
                  <div className="pt-3 border-t space-y-2" style={{ borderColor: 'rgba(80,70,64,0.10)' }}>
                    {[
                      { label: 'Commandes enregistrées', value: ordersCount },
                      { label: 'Prix moyen du menu',     value: avgMenuPrice ? `${avgMenuPrice} MAD` : '—' },
                      { label: 'Prix min / max',          value: priceMin != null ? `${priceMin} – ${priceMax} MAD` : '—' },
                      { label: 'Avis reçus (proxy)',      value: reviews.length },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span style={{ color: C.muted }}>{label}</span>
                        <span className="font-semibold" style={{ color: C.dark }}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs italic" style={{ color: C.muted }}>
                    {t('vd.revenue_note')}
                  </p>
                </div>
              </div>

              {/* Répartition catégories */}
              <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: C.dark }}>
                  <BarChart2 size={14} style={{ color: C.terra }} /> {t('vd.category_breakdown')}
                </h3>
                {categorySummary.length === 0 ? (
                  <p className="text-sm" style={{ color: C.muted }}>{t('vd.no_dishes_menu')}</p>
                ) : (
                  <div className="space-y-2.5">
                    {categorySummary.map(({ cat, count, avg }) => (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium truncate" style={{ color: C.dark }}>{cat}</span>
                          <span style={{ color: C.muted }}>{count} plat{count !== 1 ? 's' : ''} · {avg} MAD moy.</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(80,70,64,0.12)' }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${Math.round((count / menuItems.length) * 100)}%`, backgroundColor: C.terra }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Graphe vues 6 mois */}
            <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
              <h3 className="text-sm font-semibold mb-1" style={{ color: C.dark }}>{t('vd.views_6months')}</h3>
              <p className="text-xs mb-4" style={{ color: C.muted }}>{t('vd.views_by_month')}</p>
              {viewsAllTime === 0 ? (
                <div className="h-24 flex items-center justify-center text-sm" style={{ color: 'rgba(80,70,64,0.30)' }}>{t('vd.no_views')}</div>
              ) : (
                <div className="flex items-end gap-2 h-28">
                  {viewsByMonth.map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      {v > 0 && <span className="text-xs" style={{ color: C.muted }}>{v}</span>}
                      <div className="w-full rounded-t-md transition-all"
                        style={{ height: `${Math.max((v / maxMonthViews) * 84, v > 0 ? 4 : 0)}px`, backgroundColor: i === viewsByMonth.length - 1 ? C.terra : C.bronze, opacity: 0.75 + (i / viewsByMonth.length) * 0.25 }} />
                      <span className="text-xs" style={{ color: C.muted }}>{sixMonthsLabels[i].label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Distribution prix + Tunnel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {priceBrackets.length > 0 && (
                <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: C.dark }}>
                    <BarChart2 size={14} style={{ color: C.terra }} /> {t('vd.price_dist')}
                  </h3>
                  <div className="space-y-2.5">
                    {priceBrackets.map(({ label, count }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: C.dark }}>{label}</span>
                          <span style={{ color: C.muted }}>{count} plat{count !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(80,70,64,0.12)' }}>
                          <div className="h-2 rounded-full" style={{ width: `${Math.round((count / maxBracket) * 100)}%`, backgroundColor: C.terra }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: C.dark }}>
                  <TrendingUp size={14} style={{ color: C.terra }} /> {t('vd.conversion')}
                </h3>
                <div className="flex items-end gap-3">
                  {[
                    { label: 'Vues',    value: viewsAllTime,    pct: 100,                                                                           color: C.terra },
                    { label: 'Ce mois', value: viewsThisMonth,  pct: viewsAllTime > 0 ? Math.round(viewsThisMonth / viewsAllTime * 100) : 0,        color: C.bronze },
                    { label: 'Favoris', value: likesCount,      pct: viewsAllTime > 0 ? Math.round(likesCount / viewsAllTime * 100) : 0,            color: '#7c3aed' },
                    { label: 'Avis',    value: reviews.length,  pct: viewsAllTime > 0 ? Math.round(reviews.length / viewsAllTime * 100) : 0,        color: C.muted },
                  ].map(({ label, value, pct, color }, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <p className="text-xs font-medium text-center" style={{ color: C.muted }}>{label}</p>
                      <div className="w-full flex items-end justify-center" style={{ height: 64 }}>
                        <div className="w-full rounded-t-lg" style={{ height: `${Math.max(pct, 4)}%`, backgroundColor: color, opacity: 0.85 }} />
                      </div>
                      <p className="text-base font-serif font-bold leading-none" style={{ color: C.dark }}>{value}</p>
                      <p className="text-xs" style={{ color: C.muted }}>{pct}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        ))}

      </div>
    )
  }

  function getNotifIcon(type: any) {
    switch (type) {
      case 'order': return { icon: Package, color: 'text-blue-500' }
      case 'message': return { icon: MessageCircle, color: 'text-green-500' }
      case 'review': return { icon: Star, color: 'text-yellow-500' }
      case 'order_status': return { icon: CheckCircle, color: 'text-purple-500' }
      default: return { icon: Bell, color: 'text-[#c5611a]' }
    }
  }

  function renderNotifs() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-serif font-bold" style={{ color: C.dark }}>{t('vd.notifs_title')}</h1>
          {unreadCount > 0 && (
            <button onClick={markAllNotifsRead}
              className="text-xs font-medium hover:underline" style={{ color: C.terra }}>
              {t('vd.mark_all_read')}
            </button>
          )}
        </div>

        {notifsLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-xl p-4 flex items-start gap-3 shadow-sm animate-pulse" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
                <div className="w-9 h-9 rounded-full flex-shrink-0" style={{ backgroundColor: 'rgba(80,70,64,0.09)' }} />
                <div className="flex-1 space-y-2">
                  <div className="w-2/3 h-4 rounded" style={{ backgroundColor: 'rgba(80,70,64,0.09)' }} />
                  <div className="w-1/3 h-3 rounded" style={{ backgroundColor: 'rgba(80,70,64,0.09)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : vendorNotifs.length === 0 ? (
          <div className="rounded-xl p-8 shadow-sm text-center" style={{ backgroundColor: C.creamLight, border: '1px solid rgba(80,70,64,0.10)' }}>
            <Bell size={40} className="mx-auto mb-3" style={{ color: 'rgba(80,70,64,0.20)' }} />
            <p className="text-sm" style={{ color: C.muted }}>{t('vd.no_notifs')}</p>
            <p className="text-xs mt-1" style={{ color: C.muted }}>{t('vd.no_notifs_sub')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vendorNotifs.map(n => {
              const { icon: NIcon, color } = getNotifIcon(n.type)
              return (
                <div key={n.id} className="rounded-xl p-4 shadow-sm flex items-start gap-3 transition-all"
                  style={{
                    backgroundColor: C.creamLight,
                    border: `1px solid ${n.is_read ? 'rgba(80,70,64,0.10)' : 'rgba(197,97,26,0.30)'}`,
                    opacity: n.is_read ? 0.7 : 1,
                  }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: n.is_read ? 'rgba(80,70,64,0.08)' : 'rgba(197,97,26,0.10)' }}>
                    <NIcon size={16} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {n.title && <p className="text-sm font-semibold" style={{ color: C.dark }}>{n.title}</p>}
                    <p className="text-sm" style={{ color: n.is_read ? C.muted : C.dark, fontWeight: n.is_read ? 400 : 500 }}>{n.body || n.message || '—'}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>{timeAgo(n.created_at, t)}</p>
                  </div>
                  {!n.is_read && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: C.terra }} />
                      <button onClick={() => markRead(n.id)} className="text-xs hover:underline whitespace-nowrap" style={{ color: C.muted }}>{t('vd.mark_read')}</button>
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

  function renderMessages() {
    const isFreeMsg = (subscription?.plan || 'free') === 'free'
    if (isFreeMsg) {
      return (
        <div className="space-y-6">
          <h1 className="text-2xl font-serif font-bold flex items-center gap-2" style={{ color: C.dark }}>
            <MessageCircle size={24} style={{ color: C.terra }} /> {t('vd.messages_title')}
          </h1>
          <div className="rounded-2xl p-10 shadow-sm text-center"
            style={{ backgroundColor: C.creamLight, border: '2px solid rgba(124,58,237,0.18)' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(124,58,237,0.10)' }}>
              <Lock size={24} style={{ color: '#7c3aed' }} />
            </div>
            <p className="font-serif font-bold text-lg mb-2" style={{ color: C.dark }}>{t('vd.messages_pro')}</p>
            <p className="text-sm max-w-sm mx-auto mb-6" style={{ color: C.muted }}>
              {t('vd.messages_pro_desc')}
            </p>
            <button onClick={() => setActiveSection('abonnement')}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
              style={{ backgroundColor: '#7c3aed', color: '#fff' }}>
              <Sparkles size={14} /> {t('vd.discover_pro')}
            </button>
          </div>
        </div>
      )
    }
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-serif font-bold flex items-center gap-2" style={{ color: C.dark }}>
            <MessageCircle size={24} style={{ color: C.terra }} /> {t('vd.messages_title')}
          </h1>
          <Link to="/messages" className="text-sm font-medium hover:underline" style={{ color: C.terra }}>
            {t('vd.open_full_messages')}
          </Link>
        </div>
        <div className="rounded-xl p-8 shadow-sm text-center" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
          <MessageCircle size={40} className="mx-auto mb-3" style={{ color: 'rgba(80,70,64,0.20)' }} />
          <p className="font-semibold mb-2" style={{ color: C.dark }}>{t('vd.messaging_integrated')}</p>
          <p className="text-sm mb-5 max-w-md mx-auto" style={{ color: C.muted }}>
            {t('vd.messaging_desc')}
          </p>
          <Link to="/messages" className="btn btn-gold text-sm inline-flex items-center gap-2">
            <MessageCircle size={16} /> {t('vd.go_to_messages')}
          </Link>
        </div>
      </div>
    )
  }

  function renderSubscription() {
    const currentPlan = subscription?.plan || 'free'

    const plans = [
      {
        id: 'free',
        name: t('vd.plan_free'),
        price: '0',
        period: '/mois',
        icon: Zap,
        accentColor: '#6b7280',
        accentBg: 'rgba(107,114,128,0.10)',
        tagline: t('vd.plan_free_tagline'),
        features: [
          t('vd.free_feat_1'),
          t('vd.free_feat_2'),
          t('vd.free_feat_3'),
          t('vd.free_feat_4'),
          t('vd.free_feat_5'),
          t('vd.free_feat_6'),
        ],
        limits: [
          t('vd.free_limit_1'),
          t('vd.free_limit_2'),
          t('vd.free_limit_3'),
        ],
      },
      {
        id: 'pro',
        name: 'Pro',
        price: '299',
        period: 'MAD/mois',
        icon: Sparkles,
        popular: true,
        accentColor: '#7c3aed',
        accentBg: 'rgba(124,58,237,0.10)',
        tagline: t('vd.plan_pro_tagline'),
        features: [
          t('vd.pro_feat_1'),
          t('vd.pro_feat_2'),
          t('vd.pro_feat_3'),
          t('vd.pro_feat_4'),
          t('vd.pro_feat_5'),
          t('vd.pro_feat_6'),
          t('vd.pro_feat_7'),
          t('vd.pro_feat_8'),
          t('vd.pro_feat_9'),
          t('vd.pro_feat_10'),
        ],
        limits: [],
      },
      {
        id: 'premium',
        name: 'Premium',
        price: '499',
        period: 'MAD/mois',
        icon: Crown,
        accentColor: C.terra,
        accentBg: `rgba(197,97,26,0.10)`,
        tagline: t('vd.plan_premium_tagline'),
        features: [
          t('vd.premium_feat_1'),
          t('vd.premium_feat_2'),
          t('vd.premium_feat_3'),
          t('vd.premium_feat_4'),
          t('vd.premium_feat_5'),
          t('vd.premium_feat_6'),
          t('vd.premium_feat_7'),
          t('vd.premium_feat_8'),
          t('vd.premium_feat_9'),
          t('vd.premium_feat_10'),
        ],
        limits: [],
      },
    ]

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold flex items-center gap-2" style={{ color: C.dark }}>
            <Crown size={24} style={{ color: C.terra }} /> {t('vd.sub_title')}
          </h1>
          <p className="text-sm mt-1" style={{ color: C.muted }}>{t('vd.sub_subtitle')}</p>
        </div>

        {/* Plan actuel */}
        <div className="rounded-xl p-5 shadow-sm flex items-center justify-between flex-wrap gap-3"
          style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
          <div>
            <p className="text-sm" style={{ color: C.muted }}>{t('vd.current_plan')}</p>
            <p className="text-lg font-bold" style={{ color: C.dark }}>
              {currentPlan === 'free' ? t('vd.plan_free') : currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${subscription?.status === 'active' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
            {subscription?.status === 'active' ? t('vd.active') : subscription?.status === 'expired' ? t('vd.expired') : t('vd.active')}
          </span>
        </div>

        {/* Cartes des plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {plans.map(plan => {
            const PlanIcon = plan.icon
            const isCurrent = currentPlan === plan.id
            return (
              <div key={plan.id} className="relative rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all"
                style={{
                  backgroundColor: C.creamLight,
                  border: isCurrent
                    ? `2px solid ${plan.accentColor}`
                    : plan.popular
                    ? `2px solid ${plan.accentColor}`
                    : '2px solid rgba(80,70,64,0.12)',
                  boxShadow: isCurrent ? `0 0 0 3px ${plan.accentColor}22` : plan.popular ? `0 4px 20px ${plan.accentColor}18` : undefined,
                }}>

                {/* Bandeau populaire */}
                {plan.popular && (
                  <div className="text-xs font-bold text-center py-1.5 tracking-wide"
                    style={{ backgroundColor: plan.accentColor, color: '#fff' }}>
                    {t('vd.most_popular')}
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Icône + nom */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: plan.accentBg }}>
                      <PlanIcon size={20} style={{ color: plan.accentColor }} />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base leading-tight" style={{ color: C.dark }}>{plan.name}</h3>
                      <p className="text-xs" style={{ color: C.muted }}>{plan.tagline}</p>
                    </div>
                  </div>

                  {/* Prix */}
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-3xl font-black" style={{ color: plan.accentColor }}>{plan.price}</span>
                    <span className="text-sm" style={{ color: C.muted }}>{plan.period}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-5 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm" style={{ color: C.dark }}>
                        <CheckCircle size={13} className="mt-0.5 flex-shrink-0" style={{ color: plan.accentColor }} />
                        <span>{f}</span>
                      </li>
                    ))}
                    {plan.limits.map(l => (
                      <li key={l} className="flex items-start gap-2 text-sm" style={{ color: C.muted }}>
                        <XIcon size={13} className="mt-0.5 flex-shrink-0" style={{ color: 'rgba(80,70,64,0.30)' }} />
                        <span>{l}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isCurrent ? (
                    <div className="w-full text-center py-2.5 rounded-xl text-sm font-semibold"
                      style={{ backgroundColor: `${plan.accentColor}15`, color: plan.accentColor, border: `1px solid ${plan.accentColor}30` }}>
                      {t('vd.current_plan_badge')}
                    </div>
                  ) : (
                    <button onClick={() => startUpgrade(plan.id)}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all border"
                      style={plan.popular
                        ? { backgroundColor: plan.accentColor, color: '#fff', borderColor: plan.accentColor }
                        : { backgroundColor: 'transparent', color: C.dark, borderColor: 'rgba(80,70,64,0.20)' }}
                      onMouseEnter={e => {
                        if (plan.popular) e.currentTarget.style.opacity = '0.88'
                        else { e.currentTarget.style.borderColor = plan.accentColor; e.currentTarget.style.color = plan.accentColor }
                      }}
                      onMouseLeave={e => {
                        if (plan.popular) e.currentTarget.style.opacity = '1'
                        else { e.currentTarget.style.borderColor = 'rgba(80,70,64,0.20)'; e.currentTarget.style.color = C.dark }
                      }}>
                      {plan.id === 'free' ? t('vd.downgrade') : t('vd.upgrade_to', { name: plan.name })}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {paymentMsg && !upgradingPlan && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-800 font-medium">{paymentMsg}</p>
          </div>
        )}

        {upgradingPlan && (
          <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: C.creamLight, border: `2px solid ${C.terra}` }}>
            <h3 className="font-serif font-bold text-lg mb-1" style={{ color: C.dark }}>
              {t('vd.upgrade_form_title', { name: upgradingPlan.charAt(0).toUpperCase() + upgradingPlan.slice(1) })}
            </h3>
            <p className="text-sm mb-6" style={{ color: C.muted }}>{t('vd.upgrade_form_sub')}</p>
            <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: C.cream }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: C.dark }}>{t('vd.bank_accounts')}</p>
              <div className="space-y-2 text-sm">
                {[
                  { bank: 'CIH Bank', rib: '230 780 0123456789012345 67' },
                  { bank: 'Attijariwafa Bank', rib: '007 780 0123456789012345 89' },
                  { bank: 'Bank of Africa', rib: '011 780 0123456789012345 23' },
                  { bank: 'Wafacash', rib: 'Point de vente — référence DiaTable' },
                ].map(b => (
                  <div key={b.bank} className="flex justify-between items-center rounded-lg px-3 py-2"
                    style={{ backgroundColor: C.creamLight }}>
                    <span className="font-semibold" style={{ color: C.dark }}>{b.bank}</span>
                    <span className="font-mono text-xs" style={{ color: C.muted }}>{b.rib}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>{t('vd.bank_used')} <span className="text-red-400">*</span></label>
                <select value={paymentForm.bank} onChange={e => setPaymentForm(p => ({ ...p, bank: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5611a]/40 bg-white" style={{ color: C.dark }}>
                  <option value="">— {t('vd.choose_bank')} —</option>
                  {['CIH Bank','Attijariwafa Bank','Bank of Africa','Wafacash'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>{t('vd.sender_name')} <span className="text-red-400">*</span></label>
                <input type="text" value={paymentForm.sender_name} onChange={e => setPaymentForm(p => ({ ...p, sender_name: e.target.value }))} placeholder={t('vd.sender_name_placeholder')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5611a]/40" style={{ color: C.dark }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>{t('vd.transfer_ref')} <span className="text-red-400">*</span></label>
                <input type="text" value={paymentForm.reference} onChange={e => setPaymentForm(p => ({ ...p, reference: e.target.value }))} placeholder={t('vd.transfer_ref_placeholder')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5611a]/40" style={{ color: C.dark }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>{t('vd.receipt_label')}</label>
                {receiptPreview ? (
                  <div className="relative">
                    <img src={receiptPreview} alt="Reçu" className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                    <button onClick={() => { setReceiptFile(null); setReceiptPreview(null) }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"><XIcon size={10} /></button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center h-[42px] border-2 border-dashed rounded-lg cursor-pointer transition-colors"
                    style={{ borderColor: 'rgba(197,97,26,0.25)' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.terra}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(197,97,26,0.25)'}>
                    <span className="text-xs" style={{ color: C.muted }}>{t('vd.upload_receipt')}</span>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setReceiptFile(f); setReceiptPreview(URL.createObjectURL(f)) } }} />
                  </label>
                )}
              </div>
            </div>
            {paymentMsg && <p className="text-sm text-red-500 mb-3">{paymentMsg}</p>}
            <div className="flex gap-3">
              <button onClick={submitPayment} disabled={submittingPayment}
                className="font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                style={{ backgroundColor: C.terra, color: C.creamLight }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = C.terraLight}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = C.terra}>
                <CheckCircle size={14} />
                {submittingPayment ? t('vd.sending') : t('vd.send_request')}
              </button>
              <button onClick={() => { setUpgradingPlan(null); setPaymentMsg('') }}
                className="border border-gray-200 px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors" style={{ color: C.muted }}>
                {t('vd.cancel')}
              </button>
            </div>
          </div>
        )}

        {!upgradingPlan && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">{t('vd.how_to_upgrade')}</p>
              <p>{t('vd.how_to_upgrade_desc')}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderSkeletonForSection() {
    const bg = { backgroundColor: 'rgba(80,70,64,0.09)' }
    const sk = (cls: string) => <div className={`${cls} animate-pulse`} style={bg} />
    const card = (children: React.ReactNode) => (
      <div className="rounded-xl p-5 shadow-sm space-y-3" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
        {children}
      </div>
    )

    switch (activeSection) {
      case 'restaurant':
        return (
          <div className="space-y-6">
            {sk('w-52 h-7 rounded-lg')}
            <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: `1px solid rgba(80,70,64,0.10)` }}>
              {sk('w-full h-52 rounded-none')}
              <div className="p-5 space-y-4" style={{ backgroundColor: C.creamLight }}>
                {['w-2/3', 'w-1/2', 'w-3/4', 'w-2/5'].map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {sk('w-5 h-5 rounded-full')}
                    {sk(`${w} h-4 rounded`)}
                  </div>
                ))}
              </div>
            </div>
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-xl overflow-hidden shadow-sm" style={{ border: `1px solid rgba(80,70,64,0.10)` }}>
                {sk('w-full h-11 rounded-none')}
                <div className="p-5 space-y-3" style={{ backgroundColor: C.creamLight }}>
                  {sk('w-3/4 h-4 rounded')}
                  {sk('w-1/2 h-4 rounded')}
                </div>
              </div>
            ))}
          </div>
        )

      case 'menu':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              {sk('w-40 h-7 rounded-lg')}
              {sk('w-36 h-9 rounded-xl')}
            </div>
            <div className="flex gap-2 flex-wrap">
              {['w-28', 'w-24', 'w-32', 'w-20'].map((w, i) => sk(`${w} h-9 rounded-lg`))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div key={i} className="rounded-xl overflow-hidden flex shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
                  {sk('w-24 h-24 rounded-none flex-shrink-0')}
                  <div className="flex-1 p-4 space-y-2">
                    {sk('w-3/4 h-4 rounded')}
                    {sk('w-1/2 h-3 rounded')}
                    {sk('w-1/4 h-4 rounded')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'avis':
        return (
          <div className="space-y-5">
            {sk('w-32 h-7 rounded-lg')}
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-xl p-5 space-y-3 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
                <div className="flex items-center gap-3">
                  {sk('w-10 h-10 rounded-full')}
                  <div className="flex-1 space-y-1.5">
                    {sk('w-28 h-4 rounded')}
                    {sk('w-20 h-3 rounded')}
                  </div>
                  {sk('w-16 h-5 rounded-full')}
                </div>
                {sk('w-full h-3 rounded')}
                {sk('w-5/6 h-3 rounded')}
              </div>
            ))}
          </div>
        )

      case 'stats':
        return (
          <div className="space-y-6">
            {sk('w-36 h-7 rounded-lg')}
            {card(<>
              {sk('w-40 h-4 rounded')}
              {sk('w-28 h-3 rounded')}
              {sk('w-full h-28 rounded-xl')}
            </>)}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="rounded-xl p-5 space-y-4" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
                  {sk('w-10 h-10 rounded-lg')}
                  <div className="space-y-1.5">
                    {sk('w-16 h-6 rounded')}
                    {sk('w-24 h-3 rounded')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'notifs':
        return (
          <div className="space-y-4">
            {sk('w-36 h-7 rounded-lg')}
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-xl p-4 flex items-start gap-3 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
                {sk('w-9 h-9 rounded-full')}
                <div className="flex-1 space-y-1.5">
                  {sk('w-2/3 h-4 rounded')}
                  {sk('w-1/3 h-3 rounded')}
                </div>
              </div>
            ))}
          </div>
        )

      case 'abonnement':
        return (
          <div className="space-y-6">
            {sk('w-40 h-7 rounded-lg')}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[0, 1, 2].map(i => (
                <div key={i} className="rounded-2xl p-6 space-y-4 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
                  {sk('w-24 h-5 rounded')}
                  {sk('w-16 h-8 rounded')}
                  {[0, 1, 2, 3].map(j => (
                    <div key={j} className="flex items-center gap-2">
                      {sk('w-4 h-4 rounded-full')}
                      {sk('w-3/4 h-3.5 rounded')}
                    </div>
                  ))}
                  {sk('w-full h-10 rounded-xl')}
                </div>
              ))}
            </div>
          </div>
        )

      case 'commandes':
      case 'messages':
        return (
          <div className="space-y-4">
            {sk('w-40 h-7 rounded-lg')}
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="rounded-xl p-4 space-y-3 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
                <div className="flex items-center justify-between">
                  {sk('w-1/3 h-4 rounded')}
                  {sk('w-20 h-6 rounded-full')}
                </div>
                {sk('w-2/3 h-3 rounded')}
              </div>
            ))}
          </div>
        )

      default: // apercu
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              {sk('w-56 h-7 rounded-lg')}
              {sk('w-40 h-4 rounded')}
            </div>
            {card(
              <div className="flex items-center gap-4 flex-wrap">
                {sk('w-10 h-10 rounded-lg')}
                <div className="flex-1 space-y-2">
                  {sk('w-36 h-3 rounded')}
                  {sk('w-56 h-4 rounded')}
                </div>
                {sk('w-40 h-9 rounded-xl')}
              </div>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="rounded-xl p-5 space-y-4" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
                  {sk('w-10 h-10 rounded-lg')}
                  <div className="space-y-1.5">
                    {sk('w-16 h-6 rounded')}
                    {sk('w-24 h-3 rounded')}
                  </div>
                </div>
              ))}
            </div>
            {card(<>
              {sk('w-40 h-4 rounded')}
              {sk('w-28 h-3 rounded')}
              <div className="flex items-end gap-2 h-32 pt-2">
                {[60, 30, 80, 45, 70, 90, 40].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-md animate-pulse" style={{ height: `${h}%`, ...bg }} />
                    {sk('w-5 h-2.5 rounded')}
                  </div>
                ))}
              </div>
            </>)}
            {card(<>
              {sk('w-32 h-4 rounded')}
              {['w-3/4', 'w-1/2', 'w-2/3', 'w-3/5'].map((w, i) => (
                <div key={i} className="flex items-start gap-3">
                  {sk('w-8 h-8 rounded-full')}
                  <div className="flex-1 space-y-1.5">
                    {sk(`${w} h-3.5 rounded`)}
                    {sk('w-1/3 h-2.5 rounded')}
                  </div>
                </div>
              ))}
            </>)}
          </div>
        )
    }
  }

  function renderDrivers() {
    if (!restaurant) return null
    return <VendorDrivers restaurantId={restaurant.id} />
  }

  function renderSection() {
    if (dbLoading) return renderSkeletonForSection()

    if (!restaurant) {
      return (
        <div className="max-w-xl mx-auto text-center py-16 px-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `rgba(197,97,26,0.10)` }}>
            <Store size={40} style={{ color: C.terra }} />
          </div>
          <h2 className="font-serif text-2xl font-bold mb-3" style={{ color: C.dark }}>{t('vd.no_restaurant_title')}</h2>
          <p className="mb-8 leading-relaxed" style={{ color: C.muted }}>
            {t('vd.no_restaurant_sub')}
          </p>
          <div className="space-y-3">
            <Link to="/devenir-vendeur" className="btn btn-gold w-full justify-center py-3 text-base">
              {t('vd.create_restaurant')}
            </Link>
            <p className="text-xs" style={{ color: C.muted }}>{t('vd.create_time')}</p>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { icon: Store, label: t('vd.step_restaurant'), done: false, idx: 0 },
              { icon: Utensils, label: t('vd.step_menu'), done: false, idx: 1 },
              { icon: Star, label: t('vd.step_reviews'), done: false, idx: 2 },
            ].map(({ icon: Icon, label, done, idx }) => (
              <div key={label} className="rounded-xl p-4"
                style={{ backgroundColor: done ? '#f0fdf4' : idx === 0 ? '#fffbeb' : C.cream }}>
                <Icon size={24} className="mx-auto mb-2" style={{ color: done ? '#22c55e' : idx === 0 ? '#f59e0b' : C.muted }} />
                <p className="text-xs font-medium" style={{ color: C.muted }}>{label}</p>
                <p className="text-xs font-bold mt-1" style={{ color: done ? '#22c55e' : idx === 0 ? '#d97706' : '#ef4444' }}>
                  {done ? t('vd.step_done') : idx === 0 ? t('vd.step_pending') : t('vd.step_todo')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )
    }

    switch (activeSection) {
      case 'apercu':      return renderApercu()
      case 'commandes':   return <VendorOrders restaurantId={restaurant.id} />
      case 'messages':    return renderMessages()
      case 'restaurant':  return renderRestaurant()
      case 'menu':        return renderMenu()
      case 'avis':        return renderAvis()
      case 'stats':       return renderStats()
      case 'abonnement':  return renderSubscription()
      case 'notifs':      return renderNotifs()
      case 'livreurs':    return renderDrivers()
      default:            return renderApercu()
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: C.cream }}>
      <DashboardTopbar variant="vendor" />
      <div className="flex flex-1 overflow-hidden" style={{ marginTop: '56px' }}>
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <aside
          className={`fixed top-0 left-0 h-full w-64 z-30 flex-shrink-0 transform transition-all duration-300
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 lg:static lg:z-auto ${collapsed ? 'lg:w-16' : 'lg:w-64'}`}
          style={{ backgroundColor: C.dark }}
        >
          {sidebarContent}
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
            style={{ backgroundColor: C.creamLight, borderColor: 'rgba(80,70,64,0.10)' }}>
            <button onClick={() => setSidebarOpen(true)} style={{ color: C.dark }}><Menu size={22} /></button>
            <span className="font-serif font-bold" style={{ color: C.dark }}>DiaTable</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: C.terra, color: C.creamLight }}>
              {vendorName.charAt(0).toUpperCase()}
            </div>
          </div>

          <main className={`flex-1 overflow-y-auto transition-all duration-300 ${collapsed ? 'lg:pl-16' : 'lg:pl-8'}`}>
            {!dbLoading && restaurant && !restaurant.is_verified && (
              <div className="flex items-center gap-3 bg-amber-50 border-b border-amber-200 px-5 py-3 lg:px-8">
                <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-800 font-medium">{t('vd.pending_verification')}</p>
              </div>
            )}
            {!dbLoading && restaurant && menuItems.length === 0 && (
              <div className="flex items-center gap-3 bg-red-50 border-b border-red-200 px-5 py-3 lg:px-8">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-800 font-medium">
                  {t('vd.empty_card')}{' '}
                  <button onClick={() => setActiveSection('menu')} className="underline font-bold hover:text-red-900">{t('vd.add_dishes_cta')}</button>
                </p>
              </div>
            )}
            <div className="p-5 lg:p-8">
              <div className="max-w-5xl mx-auto">{renderSection()}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}