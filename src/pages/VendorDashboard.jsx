import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DashboardTopbar from '../components/DashboardTopbar'
import {
  LayoutDashboard, Store, Utensils, Star, BarChart2, Bell,
  Eye, LogOut, TrendingUp, TrendingDown, Minus, Phone,
  Instagram, Menu, ChevronRight, ChevronLeft, Edit2, Trash2, Plus,
  CheckCircle, AlertCircle, MessageSquare, Lock, ImageIcon, X as XIcon,
  Heart, Package, MessageCircle, Crown, Sparkles, Zap, MapPin
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import VendorOrders from '../components/vendor/VendorOrders'

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

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "À l'instant"
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Hier'
  if (d < 7) return `Il y a ${d} jours`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function svgPolyline(data, w = 560, h = 120, pad = 20) {
  const maxV = Math.max(...data, 1)
  const step = (w - pad * 2) / Math.max(data.length - 1, 1)
  return data.map((v, i) => {
    const x = pad + i * step
    const y = pad + (1 - v / maxV) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stars({ count, size = 16 }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} className={i <= count ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
      ))}
    </span>
  )
}

function StatCard({ icon: Icon, value, label, trend, up }) {
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

function NavItem({ icon: Icon, label, active, badge, onClick, collapsed }) {
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

  const vendorName = profile?.full_name || user?.user_metadata?.full_name || "Votre restaurant"
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const [activeSection, setActiveSection] = useState('apercu')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [menuCategory, setMenuCategory] = useState("Plats Principaux")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingDish, setEditingDish] = useState(null)
  const [newDish, setNewDish] = useState({ nom: '', prix: '', description: '', categorie: 'Plats Principaux', populaire: false, prepTime: '15' })
  const [vendorNotifs, setVendorNotifs] = useState([])
  const [notifsLoading, setNotifsLoading] = useState(true)
  const [restaurantForm, setRestaurantForm] = useState({ nom: '', cuisine: '', ville: '', adresse: '', telephone: '', whatsapp: '', instagram: '', description: '', horaires: '' })
  const [bankForm, setBankForm] = useState({ rib: '', bank_name: '', account_name: '' })
  const [savingBank, setSavingBank] = useState(false)
  const [bankMsg, setBankMsg] = useState('')
  const [subscription, setSubscription] = useState(null)
  const [deliveryZones, setDeliveryZones] = useState([])
  const [newZone, setNewZone] = useState({ quartier: '', price: '' })
  const [savingZone, setSavingZone] = useState(false)
  const [upgradingPlan, setUpgradingPlan] = useState(null)
  const [paymentForm, setPaymentForm] = useState({ bank: '', reference: '', sender_name: '' })
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [paymentMsg, setPaymentMsg] = useState('')

  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [reviews, setReviews] = useState([])
  const [dbLoading, setDbLoading] = useState(true)
  const [savingRest, setSavingRest] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [creatingRest, setCreatingRest] = useState(false)
  const [createForm, setCreateForm] = useState({ nom: '', cuisine: '', cuisine_label: '', flag: '🍽️', ville: '', description: '' })
  const [dishImageFile, setDishImageFile] = useState(null)
  const [dishImagePreview, setDishImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [restImageFile, setRestImageFile] = useState(null)
  const [restImagePreview, setRestImagePreview] = useState(null)
  const [uploadingRestImage, setUploadingRestImage] = useState(false)
  const [viewsThisMonth, setViewsThisMonth] = useState(0)
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
      const { data: rest } = await supabase.from('restaurants').select('*').eq('owner_id', user.id).maybeSingle()
      if (rest) {
        setRestaurant(rest)
        if (rest.image_url) setRestImagePreview(rest.image_url)
        setRestaurantForm({ nom: rest.name || '', cuisine: rest.cuisine_label || '', ville: rest.location || '', adresse: rest.address || '', telephone: rest.phone || '', whatsapp: rest.whatsapp || '', instagram: rest.instagram || '', description: rest.description || '', horaires: rest.hours || '' })
        const { data: menu } = await supabase.from('menu_items').select('*').eq('restaurant_id', rest.id).order('category')
        setMenuItems(menu || [])
        if (menu && menu.length > 0) { setMenuCategory(menu[0].category || 'Plats Principaux'); setNewDish(prev => ({ ...prev, categorie: menu[0].category || 'Plats Principaux' })) }
        const { data: revs } = await supabase.from('reviews').select('*, profiles(full_name)').eq('restaurant_id', rest.id).order('created_at', { ascending: false }).limit(20)
        setReviews((revs || []).map(r => ({ ...r, initials: (r.profiles?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2), name: r.profiles?.full_name || 'Utilisateur', stars: r.rating, date: new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }), comment: r.text || '' })))
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        const { count: vCount } = await supabase.from('restaurant_views').select('*', { count: 'exact', head: true }).eq('restaurant_id', rest.id).gte('created_at', monthStart)
        setViewsThisMonth(vCount || 0)
        const { count: lCount } = await supabase.from('restaurant_likes').select('*', { count: 'exact', head: true }).eq('restaurant_id', rest.id)
        setLikesCount(lCount || 0)
        const { data: zones } = await supabase.from('delivery_zones').select('*').eq('restaurant_id', rest.id).order('quartier')
        setDeliveryZones(zones || [])
      }
      const { data: prof } = await supabase.from('profiles').select('rib, bank_name, account_name').eq('id', user.id).maybeSingle()
      if (prof) setBankForm({ rib: prof.rib || '', bank_name: prof.bank_name || '', account_name: prof.account_name || '' })
      const { data: sub } = await supabase.from('subscriptions').select('*').eq('vendor_id', user.id).maybeSingle()
      if (sub) setSubscription(sub)
      setDbLoading(false)
    }
    load()
  }, [user])

  // Fetch notifications from Supabase
  useEffect(() => {
    if (!supabase || !user) { setNotifsLoading(false); return }
    async function loadNotifs() {
      setNotifsLoading(true)
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      setVendorNotifs(data || [])
      setNotifsLoading(false)
    }
    loadNotifs()

    // Realtime subscription for new notifications
    const channel = supabase
      .channel('vendor-notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
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

  async function markRead(id) {
    if (!supabase) return
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setVendorNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllNotifsRead() {
    if (!supabase || !user) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    setVendorNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function toggleActive() {
    if (!supabase || !restaurant) return
    const next = !restaurant.is_active
    const { error } = await supabase.from('restaurants').update({ is_active: next }).eq('id', restaurant.id)
    if (!error) setRestaurant(prev => ({ ...prev, is_active: next }))
  }

  async function createRestaurant() {
    if (!supabase || !createForm.nom.trim() || !createForm.cuisine.trim() || !createForm.ville.trim()) return
    setCreatingRest(true)
    const { data, error } = await supabase.from('restaurants').insert({ owner_id: user.id, name: createForm.nom, cuisine: createForm.cuisine.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ''), cuisine_label: createForm.cuisine, flag: createForm.flag, emoji: createForm.flag, gradient: 'linear-gradient(135deg,#c5611a,#a04d12)', location: createForm.ville, description: createForm.description, is_active: false }).select().single()
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
      if (url) { await supabase.from('restaurants').update({ image_url: url }).eq('id', restaurant.id); setRestaurant(prev => ({ ...prev, image_url: url })); setRestImagePreview(url); setRestImageFile(null) }
    }
    setUploadingRestImage(false)
  }

  async function saveRestaurant() {
    if (!supabase || !restaurant) return
    setSavingRest(true); setSaveMsg('')
    const { error } = await supabase.from('restaurants').update({ name: restaurantForm.nom, cuisine_label: restaurantForm.cuisine, location: restaurantForm.ville, address: restaurantForm.adresse, phone: restaurantForm.telephone, whatsapp: restaurantForm.whatsapp, instagram: restaurantForm.instagram, description: restaurantForm.description, hours: restaurantForm.horaires }).eq('id', restaurant.id)
    setSavingRest(false)
    setSaveMsg(error ? 'Erreur lors de la sauvegarde.' : 'Modifications enregistrées !')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  async function saveBank() {
    if (!supabase || !user) return
    setSavingBank(true); setBankMsg('')
    const { error } = await supabase.from('profiles').update({ rib: bankForm.rib, bank_name: bankForm.bank_name, account_name: bankForm.account_name }).eq('id', user.id)
    setSavingBank(false)
    setBankMsg(error ? 'Erreur lors de la sauvegarde.' : 'Informations bancaires enregistrées !')
    setTimeout(() => setBankMsg(''), 3000)
  }

  function startUpgrade(plan) {
    if (plan === 'free') {
      if (!supabase || !user) return
      supabase.from('subscriptions').update({ plan: 'free' }).eq('vendor_id', user.id).then(() => setSubscription(prev => prev ? { ...prev, plan: 'free' } : null))
      return
    }
    setUpgradingPlan(plan); setPaymentForm({ bank: '', reference: '', sender_name: '' }); setReceiptFile(null); setReceiptPreview(null); setPaymentMsg('')
  }

  async function submitPayment() {
    if (!supabase || !user || !upgradingPlan) return
    if (!paymentForm.bank || !paymentForm.reference.trim() || !paymentForm.sender_name.trim()) { setPaymentMsg('Veuillez remplir tous les champs.'); return }
    setSubmittingPayment(true); setPaymentMsg('')
    let receiptUrl = null
    if (receiptFile) {
      const ext = receiptFile.name.split('.').pop()
      const path = `${user.id}/receipt_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('subscription-receipts').upload(path, receiptFile, { upsert: true })
      if (!upErr) { const { data } = supabase.storage.from('subscription-receipts').getPublicUrl(path); receiptUrl = data?.publicUrl || null }
    }
    const { error } = await supabase.from('subscription_payments').insert({ vendor_id: user.id, plan: upgradingPlan, bank: paymentForm.bank, reference: paymentForm.reference.trim(), sender_name: paymentForm.sender_name.trim(), receipt_url: receiptUrl, status: 'pending' })
    setSubmittingPayment(false)
    if (error) { setPaymentMsg('Erreur : ' + error.message); return }
    setPaymentMsg('Demande envoyée ! Votre abonnement sera activé après vérification du paiement.')
    setUpgradingPlan(null)
  }

  async function addDeliveryZone() {
    if (!supabase || !restaurant || !newZone.quartier.trim() || !newZone.price) return
    setSavingZone(true)
    const { data, error } = await supabase.from('delivery_zones').insert({ restaurant_id: restaurant.id, quartier: newZone.quartier.trim(), price: parseFloat(newZone.price) }).select().single()
    setSavingZone(false)
    if (!error && data) { setDeliveryZones(prev => [...prev, data].sort((a, b) => a.quartier.localeCompare(b.quartier))); setNewZone({ quartier: '', price: '' }) }
  }

  async function removeDeliveryZone(zoneId) {
    if (!supabase) return
    await supabase.from('delivery_zones').delete().eq('id', zoneId)
    setDeliveryZones(prev => prev.filter(z => z.id !== zoneId))
  }

  function handleDishImageSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setDishImageFile(file); setDishImagePreview(URL.createObjectURL(file))
  }

  function clearDishImage() { setDishImageFile(null); setDishImagePreview(null) }

  async function uploadDishImage(dishId) {
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
    if (editingDish) {
      if (supabase) {
        let imageUrl = null
        if (dishImageFile) imageUrl = await uploadDishImage(editingDish)
        await supabase.from('menu_items').update({ name: newDish.nom, price: parseFloat(newDish.prix) || 0, description: newDish.description, category: cat, is_popular: newDish.populaire, prep_time_min: parseInt(newDish.prepTime) || 15, ...(imageUrl ? { image_url: imageUrl } : {}) }).eq('id', editingDish)
      }
      setMenuItems(prev => prev.map(d => d.id === editingDish ? { ...d, name: newDish.nom, price: newDish.prix, description: newDish.description, category: cat, is_popular: newDish.populaire, ...(dishImageFile && dishImagePreview ? { image_url: dishImagePreview } : {}) } : d))
      setEditingDish(null)
    } else {
      if (supabase) {
        const { data } = await supabase.from('menu_items').insert({ restaurant_id: restaurant.id, name: newDish.nom, price: parseFloat(newDish.prix) || 0, description: newDish.description, category: cat, is_popular: newDish.populaire, is_available: true, prep_time_min: parseInt(newDish.prepTime) || 15 }).select().single()
        if (data) {
          if (dishImageFile) { const imageUrl = await uploadDishImage(data.id); if (imageUrl) { await supabase.from('menu_items').update({ image_url: imageUrl }).eq('id', data.id); data.image_url = imageUrl } }
          setMenuItems(prev => [...prev, data]); setNewDish({ nom: '', prix: '', description: '', categorie: menuCategory, populaire: false }); clearDishImage(); setShowAddForm(false); return
        }
      }
      setMenuItems(prev => [...prev, { id: Date.now(), name: newDish.nom, price: newDish.prix, description: newDish.description, category: cat, is_popular: newDish.populaire }])
    }
    setNewDish({ nom: '', prix: '', description: '', categorie: menuCategory, populaire: false }); clearDishImage(); setShowAddForm(false)
  }

  async function deleteDish(id) {
    if (supabase) await supabase.from('menu_items').delete().eq('id', id)
    setMenuItems(prev => prev.filter(d => d.id !== id))
  }

  function startEdit(dish) {
    setEditingDish(dish.id); setNewDish({ nom: dish.name, prix: String(dish.price), description: dish.description, categorie: dish.category || menuCategory, populaire: dish.is_popular, prepTime: String(dish.prep_time_min || 15) }); clearDishImage(); setDishImagePreview(dish.image_url || null); setShowAddForm(true)
  }

  function navigate_to(section) { setActiveSection(section); setSidebarOpen(false) }

  // ── Sidebar ───────────────────────────────────────────────────────────────

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className={`${collapsed ? 'px-2 py-5 justify-center' : 'px-6 py-5'} flex items-center`}
        style={{ borderBottom: '1px solid rgba(248,248,248,0.10)' }}>
        {!collapsed ? (
          <div>
            <span className="font-serif text-2xl font-bold" style={{ color: C.terra }}>DiaTable</span>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(248,248,248,0.35)' }}>Espace vendeur</p>
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
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `rgba(197,97,26,0.25)`, color: C.terra }}>Vendeur</span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem icon={LayoutDashboard} label="Aperçu"           active={activeSection === 'apercu'}      onClick={() => navigate_to('apercu')}      collapsed={collapsed} />
        <NavItem icon={Package}         label="Commandes"         active={activeSection === 'commandes'}   onClick={() => navigate_to('commandes')}   collapsed={collapsed} />
        <NavItem icon={MessageCircle}   label="Messages"          active={activeSection === 'messages'}    onClick={() => navigate_to('messages')}    collapsed={collapsed} />
        <NavItem icon={Store}           label="Mon Restaurant"    active={activeSection === 'restaurant'}  onClick={() => navigate_to('restaurant')}  collapsed={collapsed} />
        <NavItem icon={Utensils}        label="Carte & Menu"      active={activeSection === 'menu'}        onClick={() => navigate_to('menu')}        collapsed={collapsed} />
        <NavItem icon={Star}            label="Avis clients"      active={activeSection === 'avis'}        onClick={() => navigate_to('avis')}        collapsed={collapsed} />
        <NavItem icon={BarChart2}       label="Statistiques"      active={activeSection === 'stats'}       onClick={() => navigate_to('stats')}       collapsed={collapsed} />
        <NavItem icon={Crown}           label="Abonnement"        active={activeSection === 'abonnement'}  onClick={() => navigate_to('abonnement')}  collapsed={collapsed} />
        <NavItem icon={Bell}            label="Notifications"     active={activeSection === 'notifs'}      onClick={() => navigate_to('notifs')}      badge={unreadCount > 0 ? unreadCount : null} collapsed={collapsed} />
      </nav>

      <div className="px-3 py-4 space-y-1" style={{ borderTop: '1px solid rgba(248,248,248,0.10)' }}>
        <Link to="/restaurants/1" title={collapsed ? "Voir ma page" : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${collapsed ? 'justify-center px-0' : ''}`}
          style={{ color: 'rgba(248,248,248,0.65)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(248,248,248,0.08)'; e.currentTarget.style.color = C.creamLight }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(248,248,248,0.65)' }}>
          <Eye size={18} className="shrink-0" />
          {!collapsed && <span>Voir ma page</span>}
        </Link>
        <button onClick={handleSignOut} title={collapsed ? "Déconnexion" : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${collapsed ? 'justify-center px-0' : ''}`}
          style={{ color: 'rgba(248,248,248,0.65)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#fca5a5' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(248,248,248,0.65)' }}>
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>

      <button onClick={() => setCollapsed(v => !v)}
        className="hidden lg:flex w-full items-center justify-center py-3 transition-colors"
        style={{ borderTop: '1px solid rgba(248,248,248,0.10)', color: 'rgba(248,248,248,0.35)' }}
        onMouseEnter={e => e.currentTarget.style.color = C.creamLight}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(248,248,248,0.35)'}
        title={collapsed ? "Agrandir" : "Réduire"}>
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
          <h1 className="text-2xl font-serif font-bold" style={{ color: C.dark }}>Bonjour {vendorName.split(' ')[0]} 👋</h1>
          <p className="text-sm mt-1 capitalize" style={{ color: C.muted }}>{today}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Eye}          value={viewsThisMonth} label="Vues ce mois"   trend={viewsThisMonth > 0 ? 'profil consulté' : 'aucune vue'} up={viewsThisMonth > 0 ? true : null} />
          <StatCard icon={Star}         value={avgRating ?? '—'} label="Note moyenne" trend={avgRating ? 'réel' : 'aucun avis'} up={null} />
          <StatCard icon={MessageSquare} value={reviews.length} label="Avis publiés"  trend={reviews.length > 0 ? `+${reviews.filter(r => Date.now() - new Date(r.created_at).getTime() < 30 * 86400000).length} ce mois` : 'aucun'} up={reviews.length > 0 ? true : null} />
          <StatCard icon={Heart}        value={likesCount}     label="J'aime"         trend={likesCount > 0 ? 'favoris' : 'aucun like'} up={likesCount > 0 ? true : null} />
        </div>

        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
          <h3 className="text-sm font-semibold mb-1" style={{ color: C.dark }}>Avis reçus par jour de la semaine</h3>
          <p className="text-xs mb-4" style={{ color: C.muted }}>30 derniers jours</p>
          {reviews.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-sm" style={{ color: 'rgba(80,70,64,0.30)' }}>Aucun avis pour le moment</div>
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
          <h3 className="text-sm font-semibold mb-4" style={{ color: C.dark }}>Activité récente</h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: C.muted }}>Aucune activité pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 5).map((r, i) => (
                <div key={r.id || i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `rgba(197,97,26,0.10)` }}>
                    <Star size={15} style={{ color: C.terra }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: C.dark }}>{r.name} a laissé un avis <span className="font-semibold" style={{ color: C.terra }}>{r.rating}★</span></p>
                    {r.comment && <p className="text-xs mt-0.5 line-clamp-1" style={{ color: C.muted }}>"{r.comment}"</p>}
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(80,70,64,0.40)' }}>{timeAgo(r.created_at)}</p>
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
    const inputFocusCls = "focus:ring-[#c5611a]/40"
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-serif font-bold" style={{ color: C.dark }}>Mon Restaurant</h1>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
            <CheckCircle size={14} /> Vérifié
          </span>
        </div>

        <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
          <h2 className="text-base font-semibold mb-5" style={{ color: C.dark }}>Informations générales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Nom du restaurant", key: "nom", type: "text" },
              { label: "Ville", key: "ville", type: "text" },
              { label: "Téléphone", key: "telephone", type: "tel" },
              { label: "WhatsApp", key: "whatsapp", type: "tel" },
              { label: "Instagram", key: "instagram", type: "text" },
              { label: "Horaires", key: "horaires", type: "text" },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>{label}</label>
                <input type={type} value={restaurantForm[key]} onChange={e => setRestaurantForm(prev => ({ ...prev, [key]: e.target.value }))}
                  className={`${inputCls} ${inputFocusCls}`} style={inputStyle} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Type de cuisine</label>
              <select value={restaurantForm.cuisine} onChange={e => setRestaurantForm(prev => ({ ...prev, cuisine: e.target.value }))}
                className={`${inputCls} ${inputFocusCls} bg-white`} style={inputStyle}>
                <option value="">— Choisir —</option>
                {['🇸🇳 Sénégalaise','🇨🇳 Chinoise','🇱🇧 Libanaise','🇸🇾 Syrienne','🇫🇷 Française','🇮🇹 Italienne','🇳🇬 Nigériane','🇮🇳 Indienne','🇧🇷 Brésilienne','🌍 Internationale / Fusion','🍽️ Autre'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            {restaurant?.type === 'homecook' ? (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <Lock size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">En tant que cuisine à domicile, votre adresse exacte n'est pas publiée — seule votre ville est visible par les clients.</p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Adresse complète</label>
                <input type="text" value={restaurantForm.adresse} onChange={e => setRestaurantForm(prev => ({ ...prev, adresse: e.target.value }))}
                  className={`${inputCls} ${inputFocusCls}`} style={inputStyle} />
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Description</label>
              <textarea rows={3} value={restaurantForm.description} onChange={e => setRestaurantForm(prev => ({ ...prev, description: e.target.value }))}
                className={`${inputCls} ${inputFocusCls} resize-none`} style={inputStyle} />
            </div>
          </div>
          <button onClick={saveRestaurant} disabled={savingRest} className="mt-6 btn btn-gold text-sm disabled:opacity-50">
            {savingRest ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
          {saveMsg && <p className={`text-sm mt-2 ${saveMsg.includes('Erreur') ? 'text-red-500' : 'text-green-600'}`}>{saveMsg}</p>}
        </div>

        {/* Photo */}
        <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: C.dark }}>Photo du restaurant</h2>
          {restImagePreview ? (
            <div className="relative w-full h-52 rounded-xl overflow-hidden border border-gray-200 group mb-4">
              <img src={restImagePreview} alt="photo restaurant" className="w-full h-full object-cover" />
              <label className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-black/80 transition-colors">
                Changer la photo
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setRestImageFile(f); setRestImagePreview(URL.createObjectURL(f)) } }} />
              </label>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all group mb-4"
              style={{ borderColor: 'rgba(197,97,26,0.30)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.terra}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(197,97,26,0.30)'}>
              <ImageIcon size={32} className="mb-2 transition-colors" style={{ color: 'rgba(197,97,26,0.40)' }} />
              <span className="text-sm font-medium" style={{ color: C.muted }}>Ajouter une photo de votre restaurant</span>
              <span className="text-xs mt-1" style={{ color: 'rgba(80,70,64,0.40)' }}>JPG, PNG, WEBP — max 10 Mo</span>
              <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setRestImageFile(f); setRestImagePreview(URL.createObjectURL(f)) } }} />
            </label>
          )}
          {restImageFile && (
            <button onClick={uploadRestaurantImage} disabled={uploadingRestImage} className="btn btn-gold text-sm disabled:opacity-50">
              {uploadingRestImage ? 'Upload en cours…' : 'Enregistrer la photo'}
            </button>
          )}
          {!restImageFile && restImagePreview && <p className="text-xs" style={{ color: C.muted }}>Photo actuelle enregistrée.</p>}
        </div>

        {/* Zones de livraison */}
        <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
          <h2 className="text-base font-semibold mb-2" style={{ color: C.dark }}>Zones de livraison & Tarifs</h2>
          <p className="text-sm mb-5" style={{ color: C.muted }}>Configurez les prix de livraison par quartier. Ces prix seront affichés au client lors du checkout.</p>
          {deliveryZones.length > 0 && (
            <div className="space-y-2 mb-5">
              {deliveryZones.map(zone => (
                <div key={zone.id} className="flex items-center justify-between rounded-lg px-4 py-3"
                  style={{ backgroundColor: C.cream }}>
                  <div className="flex items-center gap-3">
                    <MapPin size={14} style={{ color: C.terra }} className="flex-shrink-0" />
                    <span className="text-sm font-medium" style={{ color: C.dark }}>{zone.quartier}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold" style={{ color: C.terraDark }}>{Number(zone.price).toFixed(2)} MAD</span>
                    <button onClick={() => removeDeliveryZone(zone.id)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Quartier</label>
              <select value={newZone.quartier} onChange={e => setNewZone(p => ({ ...p, quartier: e.target.value }))}
                className={`${inputCls} focus:ring-[#c5611a]/40 bg-white`} style={inputStyle}>
                <option value="">— Choisir un quartier —</option>
                {['Maârif','Bourgogne','Gauthier','Racine','Anfa','Aïn Diab','Aïn Sebaâ','Sidi Bernoussi','Hay Hassani','Hay Mohammadi','Sbata','Sidi Moumen',"Ben M'Sick",'Mers Sultan','Derb Sultan','Habous','Oasis','Palmier','Belvédère','C.I.L.','2 Mars',"Triangle d'Or",'Casa Port','Bouskoura','Dar Bouazza','Sidi Belyout','Hay El Qods','Hay Oulfa','Al Fida','Roches Noires','Bernoussi','Maârif Extension','Val Fleuri','Californie','Beauséjour']
                  .filter(q => !deliveryZones.some(z => z.quartier === q))
                  .map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Prix (MAD)</label>
              <input type="number" min="0" step="1" value={newZone.price} onChange={e => setNewZone(p => ({ ...p, price: e.target.value }))} placeholder="15"
                className={`${inputCls} focus:ring-[#c5611a]/40`} style={inputStyle} />
            </div>
            <button onClick={addDeliveryZone} disabled={savingZone || !newZone.quartier || !newZone.price}
              className="font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
              style={{ backgroundColor: C.terra, color: C.creamLight }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = C.terraLight}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = C.terra}>
              <Plus size={14} /> Ajouter
            </button>
          </div>
          {deliveryZones.length === 0 && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 flex items-start gap-2">
              <AlertCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">Ajoutez au moins une zone de livraison pour que vos clients puissent choisir la livraison.</p>
            </div>
          )}
        </div>

        {/* RIB */}
        <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
          <h2 className="text-base font-semibold mb-2" style={{ color: C.dark }}>Informations bancaires (RIB)</h2>
          <p className="text-sm mb-5" style={{ color: C.muted }}>Pour recevoir vos paiements par virement bancaire après livraison.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Nom de la banque</label>
              <input type="text" value={bankForm.bank_name} onChange={e => setBankForm(p => ({ ...p, bank_name: e.target.value }))} placeholder="Ex: Attijariwafa Bank"
                className={`${inputCls} focus:ring-[#c5611a]/40`} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Titulaire du compte</label>
              <input type="text" value={bankForm.account_name} onChange={e => setBankForm(p => ({ ...p, account_name: e.target.value }))} placeholder="Nom complet du titulaire"
                className={`${inputCls} focus:ring-[#c5611a]/40`} style={inputStyle} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>RIB / IBAN</label>
              <input type="text" value={bankForm.rib} onChange={e => setBankForm(p => ({ ...p, rib: e.target.value }))} placeholder="Ex: MA00 0000 0000 0000 0000 0000 000"
                className={`${inputCls} focus:ring-[#c5611a]/40 font-mono tracking-wide`} style={inputStyle} />
            </div>
          </div>
          <button onClick={saveBank} disabled={savingBank} className="mt-5 btn btn-gold text-sm disabled:opacity-50">
            {savingBank ? 'Enregistrement…' : 'Enregistrer les informations bancaires'}
          </button>
          {bankMsg && <p className={`text-sm mt-2 ${bankMsg.includes('Erreur') ? 'text-red-500' : 'text-green-600'}`}>{bankMsg}</p>}
        </div>

        {/* Danger zone */}
        <div className="rounded-xl p-6 shadow-sm border border-red-100" style={{ backgroundColor: C.creamLight }}>
          <h2 className="text-base font-semibold text-red-600 mb-2">Zone de danger</h2>
          <p className="text-sm mb-4" style={{ color: C.muted }}>La désactivation rendra votre fiche invisible pour les utilisateurs.</p>
          <button className="border border-red-400 text-red-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">Désactiver mon restaurant</button>
        </div>
      </div>
    )
  }

  function renderMenu() {
    const currentDishes = menuByCategory[menuCategory] || []
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-serif font-bold" style={{ color: C.dark }}>Carte & Menu</h1>
          <button onClick={() => { setShowAddForm(v => !v); setEditingDish(null); setNewDish({ nom: '', prix: '', description: '', categorie: menuCategory, populaire: false }) }}
            className="font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
            style={{ backgroundColor: C.terra, color: C.creamLight }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = C.terraLight}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = C.terra}>
            <Plus size={16} /> Ajouter un plat
          </button>
        </div>

        {menuCategories.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-2xl"
            style={{ backgroundColor: `rgba(197,97,26,0.04)`, borderColor: `rgba(197,97,26,0.25)` }}>
            <Utensils size={40} className="mx-auto mb-3" style={{ color: C.terra }} />
            <h3 className="font-serif font-bold mb-2" style={{ color: C.dark }}>Votre carte est vide</h3>
            <p className="text-sm mb-4" style={{ color: C.muted }}>Ajoutez vos plats pour que vos clients puissent découvrir votre menu.</p>
            <button onClick={() => setShowAddForm(true)} className="btn btn-gold text-sm flex items-center gap-1 mx-auto"><Plus size={16} /> Ajouter mon premier plat</button>
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
            <h3 className="text-sm font-semibold mb-4" style={{ color: C.dark }}>{editingDish ? "Modifier le plat" : "Nouveau plat"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Nom du plat', key: 'nom', type: 'text', placeholder: 'Ex : Thiéboudiène royal' },
                { label: 'Prix (MAD)', key: 'prix', type: 'text', placeholder: 'Ex : 85' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>{label}</label>
                  <input type={type} value={newDish[key]} onChange={e => setNewDish(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5611a]/40" style={{ color: C.dark }} />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Description</label>
                <input value={newDish.description} onChange={e => setNewDish(p => ({ ...p, description: e.target.value }))} placeholder="Courte description du plat"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5611a]/40" style={{ color: C.dark }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Catégorie</label>
                <select value={newDish.categorie} onChange={e => setNewDish(p => ({ ...p, categorie: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5611a]/40" style={{ color: C.dark }}>
                  {menuCategories.length > 0 ? menuCategories.map(c => <option key={c}>{c}</option>) : <option>Plats Principaux</option>}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Temps de préparation (min)</label>
                <input type="number" min="1" max="180" value={newDish.prepTime} onChange={e => setNewDish(p => ({ ...p, prepTime: e.target.value }))} placeholder="15"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5611a]/40" style={{ color: C.dark }} />
                <p className="text-xs mt-1" style={{ color: C.muted }}>Utilisé pour estimer le temps de livraison total</p>
              </div>
              <div className="flex items-center gap-2 mt-5">
                <input type="checkbox" id="populaire" checked={newDish.populaire} onChange={e => setNewDish(p => ({ ...p, populaire: e.target.checked }))} className="w-4 h-4 accent-[#c5611a]" />
                <label htmlFor="populaire" className="text-sm" style={{ color: C.dark }}>Marquer comme populaire</label>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium mb-2" style={{ color: C.muted }}>Photo du plat (optionnel)</label>
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
                  <span className="text-xs" style={{ color: C.muted }}>Cliquer pour ajouter une photo</span>
                  <span className="text-xs mt-0.5" style={{ color: 'rgba(80,70,64,0.40)' }}>JPG, PNG, WEBP — max 5 Mo</span>
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
                {uploadingImage ? 'Upload en cours…' : 'Enregistrer'}
              </button>
              <button onClick={() => { setShowAddForm(false); setEditingDish(null); clearDishImage() }}
                className="border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors" style={{ color: C.muted }}>
                Annuler
              </button>
            </div>
            {saveMsg && <p className={`text-sm mt-2 ${saveMsg.includes('Erreur') ? 'text-red-500' : 'text-green-600'}`}>{saveMsg}</p>}
          </div>
        )}

        {menuCategories.length > 0 && (
          <div className="space-y-3">
            {currentDishes.map(dish => (
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
                        style={{ backgroundColor: `rgba(197,97,26,0.12)`, color: C.terraDark }}>Populaire</span>
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
            {currentDishes.length === 0 && <div className="text-center py-10 text-sm" style={{ color: C.muted }}>Aucun plat dans cette catégorie.</div>}
          </div>
        )}
      </div>
    )
  }

  function renderAvis() {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-serif font-bold" style={{ color: C.dark }}>Avis clients</h1>
        <div className="rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-8 items-start md:items-center"
          style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
          <div className="text-center">
            <p className="text-6xl font-serif font-bold" style={{ color: C.dark }}>{avgRating ?? '—'}</p>
            <Stars count={5} size={20} />
            <p className="text-sm mt-1" style={{ color: C.muted }}>{reviews.length} avis</p>
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
            <p className="text-sm font-semibold mb-1" style={{ color: C.dark }}>Aucun avis pour l'instant</p>
            <p className="text-xs" style={{ color: C.muted }}>Les avis de vos clients apparaîtront ici.</p>
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
                      <MessageSquare size={12} /> Répondre
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
    const points = svgPolyline(reviewsByDay)
    const popularDishes = menuItems.filter(d => d.is_popular)
    const topDishes = popularDishes.length > 0 ? popularDishes : menuItems.slice(0, 5)
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-serif font-bold" style={{ color: C.dark }}>Statistiques</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Note moyenne', value: avgRating ?? '—' },
            { label: 'Total avis', value: reviews.length },
            { label: 'Plats au menu', value: menuItems.length },
            { label: 'Catégories menu', value: menuCategories.length },
          ].map((s, i) => (
            <div key={i} className="rounded-xl p-5 shadow-sm"
              style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
              <p className="text-2xl font-serif font-bold" style={{ color: C.dark }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: C.muted }}>{s.label}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
          <h3 className="text-sm font-semibold mb-1" style={{ color: C.dark }}>Avis par jour de la semaine</h3>
          <p className="text-xs mb-4" style={{ color: C.muted }}>30 derniers jours</p>
          {reviews.length === 0 ? (
            <div className="h-28 flex items-center justify-center text-sm" style={{ color: 'rgba(80,70,64,0.30)' }}>Aucun avis reçu</div>
          ) : (
            <>
              <svg viewBox="0 0 560 120" className="w-full" style={{ height: 120 }}>
                <defs>
                  <linearGradient id="vendorLineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.terra} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={C.terra} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={`20,100 ${points} 540,100`} fill="url(#vendorLineGrad)" />
                <polyline points={points} fill="none" stroke={C.terra} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
          <h3 className="text-sm font-semibold mb-4" style={{ color: C.dark }}>Distribution des notes</h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: C.muted }}>Aucun avis pour le moment</p>
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
        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: C.dark }}>
            {popularDishes.length > 0 ? 'Plats marqués populaires' : 'Plats au menu'}
          </h3>
          {topDishes.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: C.muted }}>Aucun plat ajouté</p>
          ) : (
            <div className="space-y-3">
              {topDishes.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: C.terra, color: C.creamLight }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate" style={{ color: C.dark }}>{p.name}</span>
                      <span className="font-semibold ml-2 flex-shrink-0" style={{ color: C.terraDark }}>{Number(p.price).toFixed(0)} MAD</span>
                    </div>
                    <p className="text-xs truncate" style={{ color: C.muted }}>{p.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  function getNotifIcon(type) {
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
          <h1 className="text-2xl font-serif font-bold" style={{ color: C.dark }}>Notifications</h1>
          {unreadCount > 0 && (
            <button onClick={markAllNotifsRead}
              className="text-xs font-medium hover:underline" style={{ color: C.terra }}>
              Tout marquer comme lu
            </button>
          )}
        </div>

        {notifsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-[#c5611a]/30 border-t-[#c5611a] animate-spin" />
          </div>
        ) : vendorNotifs.length === 0 ? (
          <div className="rounded-xl p-8 shadow-sm text-center" style={{ backgroundColor: C.creamLight, border: '1px solid rgba(80,70,64,0.10)' }}>
            <Bell size={40} className="mx-auto mb-3" style={{ color: 'rgba(80,70,64,0.20)' }} />
            <p className="text-sm" style={{ color: C.muted }}>Aucune notification pour le moment</p>
            <p className="text-xs mt-1" style={{ color: C.muted }}>Vous serez notifié lors de nouvelles commandes, messages ou avis.</p>
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
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: C.terra }} />
                      <button onClick={() => markRead(n.id)} className="text-xs hover:underline whitespace-nowrap" style={{ color: C.muted }}>Marquer comme lu</button>
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
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-serif font-bold flex items-center gap-2" style={{ color: C.dark }}>
            <MessageCircle size={24} style={{ color: C.terra }} /> Messages
          </h1>
          <Link to="/messages" className="text-sm font-medium hover:underline" style={{ color: C.terra }}>
            Ouvrir la messagerie complète →
          </Link>
        </div>
        <div className="rounded-xl p-8 shadow-sm text-center" style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
          <MessageCircle size={40} className="mx-auto mb-3" style={{ color: 'rgba(80,70,64,0.20)' }} />
          <p className="font-semibold mb-2" style={{ color: C.dark }}>Messagerie intégrée</p>
          <p className="text-sm mb-5 max-w-md mx-auto" style={{ color: C.muted }}>
            Communiquez directement avec vos clients sans quitter la plateforme.
          </p>
          <Link to="/messages" className="btn btn-gold text-sm inline-flex items-center gap-2">
            <MessageCircle size={16} /> Accéder aux messages
          </Link>
        </div>
      </div>
    )
  }

  function renderSubscription() {
    const currentPlan = subscription?.plan || 'free'
    const plans = [
      { id: 'free', name: 'Gratuit', price: '0', period: '/mois', icon: Zap, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', features: ["Fiche restaurant visible","Jusqu'à 10 plats au menu","Messagerie avec clients","Commandes illimitées"], limits: ["Pas de mise en avant","Commission 5% par commande"] },
      { id: 'pro', name: 'Pro', price: '299', period: 'MAD/mois', icon: Sparkles, popular: true, features: ["Tout du plan Gratuit","Plats illimités au menu","Badge \"Pro\" sur votre fiche","Mise en avant dans les recherches","Commission réduite à 2%","Statistiques avancées"], limits: [] },
      { id: 'premium', name: 'Premium', price: '499', period: 'MAD/mois', icon: Crown, features: ["Tout du plan Pro","Badge \"Premium\" doré","Position prioritaire en page d'accueil","0% commission","Support prioritaire 24/7","Promotions & codes promo","Analytique détaillée"], limits: [] },
    ]
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold flex items-center gap-2" style={{ color: C.dark }}>
            <Crown size={24} style={{ color: C.terra }} /> Abonnement
          </h1>
          <p className="text-sm mt-1" style={{ color: C.muted }}>Choisissez le plan adapté à votre activité</p>
        </div>
        <div className="rounded-xl p-5 shadow-sm flex items-center justify-between flex-wrap gap-3"
          style={{ backgroundColor: C.creamLight, border: `1px solid rgba(80,70,64,0.10)` }}>
          <div>
            <p className="text-sm" style={{ color: C.muted }}>Plan actuel</p>
            <p className="text-lg font-bold" style={{ color: C.dark }}>{currentPlan === 'free' ? 'Gratuit' : currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${subscription?.status === 'active' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
            {subscription?.status === 'active' ? 'Actif' : subscription?.status === 'expired' ? 'Expiré' : 'Actif'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map(plan => {
            const PlanIcon = plan.icon
            const isCurrent = currentPlan === plan.id
            return (
              <div key={plan.id} className="relative rounded-xl shadow-sm overflow-hidden transition-all"
                style={{
                  backgroundColor: C.creamLight,
                  border: isCurrent ? `2px solid ${C.terra}` : '2px solid rgba(80,70,64,0.12)',
                  boxShadow: isCurrent ? `0 0 0 3px rgba(197,97,26,0.15)` : undefined,
                }}>
                {plan.popular && (
                  <div className="text-xs font-bold text-center py-1" style={{ backgroundColor: C.terra, color: C.creamLight }}>
                    Le plus populaire
                  </div>
                )}
                <div className="p-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `rgba(197,97,26,0.10)` }}>
                    <PlanIcon size={24} style={{ color: C.terra }} />
                  </div>
                  <h3 className="font-serif font-bold text-lg" style={{ color: C.dark }}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2 mb-5">
                    <span className="text-3xl font-black" style={{ color: C.dark }}>{plan.price}</span>
                    <span className="text-sm" style={{ color: C.muted }}>{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm" style={{ color: C.dark }}>
                        <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" /><span>{f}</span>
                      </li>
                    ))}
                    {plan.limits.map(l => (
                      <li key={l} className="flex items-start gap-2 text-sm" style={{ color: C.muted }}>
                        <XIcon size={14} className="text-gray-300 mt-0.5 flex-shrink-0" /><span>{l}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <div className="w-full text-center py-2.5 rounded-lg text-sm font-semibold"
                      style={{ backgroundColor: 'rgba(80,70,64,0.08)', color: C.muted }}>Plan actuel</div>
                  ) : (
                    <button onClick={() => startUpgrade(plan.id)}
                      className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all border"
                      style={plan.popular ? { backgroundColor: C.terra, color: C.creamLight, borderColor: C.terra } : { backgroundColor: 'transparent', color: C.dark, borderColor: 'rgba(80,70,64,0.20)' }}
                      onMouseEnter={e => { if (plan.popular) e.currentTarget.style.backgroundColor = C.terraLight; else { e.currentTarget.style.borderColor = C.terra; e.currentTarget.style.color = C.terra } }}
                      onMouseLeave={e => { if (plan.popular) e.currentTarget.style.backgroundColor = C.terra; else { e.currentTarget.style.borderColor = 'rgba(80,70,64,0.20)'; e.currentTarget.style.color = C.dark } }}>
                      {plan.id === 'free' ? 'Rétrograder' : 'Passer au ' + plan.name}
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
              Passer au plan {upgradingPlan.charAt(0).toUpperCase() + upgradingPlan.slice(1)}
            </h3>
            <p className="text-sm mb-6" style={{ color: C.muted }}>Effectuez un virement bancaire puis remplissez les informations ci-dessous</p>
            <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: C.cream }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: C.dark }}>Comptes bancaires DiaTable</p>
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
                <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Banque utilisée <span className="text-red-400">*</span></label>
                <select value={paymentForm.bank} onChange={e => setPaymentForm(p => ({ ...p, bank: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5611a]/40 bg-white" style={{ color: C.dark }}>
                  <option value="">— Choisir la banque —</option>
                  {['CIH Bank','Attijariwafa Bank','Bank of Africa','Wafacash'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Nom de l'expéditeur <span className="text-red-400">*</span></label>
                <input type="text" value={paymentForm.sender_name} onChange={e => setPaymentForm(p => ({ ...p, sender_name: e.target.value }))} placeholder="Nom complet sur le virement"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5611a]/40" style={{ color: C.dark }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Référence du virement <span className="text-red-400">*</span></label>
                <input type="text" value={paymentForm.reference} onChange={e => setPaymentForm(p => ({ ...p, reference: e.target.value }))} placeholder="Numéro de référence / transaction"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5611a]/40" style={{ color: C.dark }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Reçu de virement (photo/PDF)</label>
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
                    <span className="text-xs" style={{ color: C.muted }}>Téléverser le reçu</span>
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
                {submittingPayment ? 'Envoi en cours…' : 'Envoyer la demande'}
              </button>
              <button onClick={() => { setUpgradingPlan(null); setPaymentMsg('') }}
                className="border border-gray-200 px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors" style={{ color: C.muted }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {!upgradingPlan && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Comment passer au Pro ou Premium ?</p>
              <p>Cliquez sur le plan souhaité, effectuez un virement bancaire vers l'un de nos comptes, puis téléversez le reçu. Votre abonnement sera activé sous 24h après vérification.</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderSection() {
    if (dbLoading) {
      return (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 rounded-full animate-spin"
            style={{ border: `4px solid rgba(197,97,26,0.25)`, borderTopColor: C.terra }} />
        </div>
      )
    }

    if (!restaurant) {
      return (
        <div className="max-w-xl mx-auto text-center py-16 px-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `rgba(197,97,26,0.10)` }}>
            <Store size={40} style={{ color: C.terra }} />
          </div>
          <h2 className="font-serif text-2xl font-bold mb-3" style={{ color: C.dark }}>Complétez votre profil vendeur</h2>
          <p className="mb-8 leading-relaxed" style={{ color: C.muted }}>
            Vous n'avez pas encore créé votre fiche restaurant. Commencez dès maintenant pour apparaître dans les résultats de recherche et attirer vos premiers clients.
          </p>
          <div className="space-y-3">
            <Link to="/devenir-vendeur" className="btn btn-gold w-full justify-center py-3 text-base">
              Créer ma fiche restaurant →
            </Link>
            <p className="text-xs" style={{ color: C.muted }}>Moins de 5 minutes • Gratuit</p>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { icon: Store, label: 'Fiche restaurant', done: false, idx: 0 },
              { icon: Utensils, label: 'Carte & Menu', done: false, idx: 1 },
              { icon: Star, label: 'Premiers avis', done: false, idx: 2 },
            ].map(({ icon: Icon, label, done, idx }) => (
              <div key={label} className="rounded-xl p-4"
                style={{ backgroundColor: done ? '#f0fdf4' : idx === 0 ? '#fffbeb' : C.cream }}>
                <Icon size={24} className="mx-auto mb-2" style={{ color: done ? '#22c55e' : idx === 0 ? '#f59e0b' : C.muted }} />
                <p className="text-xs font-medium" style={{ color: C.muted }}>{label}</p>
                <p className="text-xs font-bold mt-1" style={{ color: done ? '#22c55e' : idx === 0 ? '#d97706' : '#ef4444' }}>
                  {done ? 'Fait' : idx === 0 ? 'En attente' : 'À compléter'}
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
                <p className="text-sm text-amber-800 font-medium">Votre fiche est <strong>en attente de vérification</strong> par notre équipe.</p>
              </div>
            )}
            {!dbLoading && restaurant && menuItems.length === 0 && (
              <div className="flex items-center gap-3 bg-red-50 border-b border-red-200 px-5 py-3 lg:px-8">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-800 font-medium">
                  Votre carte est vide — les clients ne peuvent pas voir ce que vous proposez.{' '}
                  <button onClick={() => setActiveSection('menu')} className="underline font-bold hover:text-red-900">Ajouter des plats →</button>
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