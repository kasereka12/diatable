import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DashboardTopbar from '../components/DashboardTopbar'
import {
  LayoutDashboard, Store, Utensils, Star, BarChart2, Bell,
  Eye, LogOut, TrendingUp, TrendingDown, Minus, Phone,
  Instagram, Menu, ChevronRight, ChevronLeft, Edit2, Trash2, Plus,
  CheckCircle, AlertCircle, MessageSquare, Lock, ImageIcon, X as XIcon,
  Heart
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return "À l'instant"
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Hier'
  if (d < 7)  return `Il y a ${d} jours`
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
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} className={i <= count ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
      ))}
    </span>
  )
}

function StatCard({ icon: Icon, value, label, trend, up }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-light flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-lg bg-dark/5 flex items-center justify-center">
          <Icon size={20} className="text-dark" />
        </div>
        {up === true  && (
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <TrendingUp size={12}/>{trend}
          </span>
        )}
        {up === false && (
          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <TrendingDown size={12}/>{trend}
          </span>
        )}
        {up === null && (
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Minus size={12}/>stable
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold font-serif text-dark">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
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
        ${collapsed ? 'justify-center px-0' : ''}
        ${active ? "bg-yellow-400 text-gray-900 font-semibold" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function VendorDashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const vendorName = profile?.full_name || user?.user_metadata?.full_name || "Votre restaurant"
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const [activeSection, setActiveSection]   = useState('apercu')
  const [sidebarOpen, setSidebarOpen]       = useState(false)
  const [collapsed, setCollapsed]           = useState(false)
  const [menuCategory, setMenuCategory]     = useState("Plats Principaux")
  const [showAddForm, setShowAddForm]       = useState(false)
  const [editingDish, setEditingDish]       = useState(null)
  const [newDish, setNewDish]               = useState({ nom: '', prix: '', description: '', categorie: 'Plats Principaux', populaire: false })
  const [readIds, setReadIds] = useState(new Set())
  const [restaurantForm, setRestaurantForm] = useState({
    nom: '',
    cuisine: '',
    ville: '',
    adresse: '',
    telephone: '',
    whatsapp: '',
    instagram: '',
    description: '',
    horaires: '',
  })

  // ── Supabase state ──────────────────────────────────────────────────────────
  const [restaurant, setRestaurant] = useState(null)
  const [menuItems,  setMenuItems]  = useState([])
  const [reviews,    setReviews]    = useState([])
  const [dbLoading,  setDbLoading]  = useState(true)
  const [savingRest,    setSavingRest]    = useState(false)
  const [saveMsg,       setSaveMsg]       = useState('')
  const [creatingRest,  setCreatingRest]  = useState(false)
  const [createForm,    setCreateForm]    = useState({ nom: '', cuisine: '', cuisine_label: '', flag: '🍽️', ville: '', description: '' })
  const [dishImageFile, setDishImageFile] = useState(null)
  const [dishImagePreview, setDishImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [restImageFile, setRestImageFile] = useState(null)
  const [restImagePreview, setRestImagePreview] = useState(null)
  const [uploadingRestImage, setUploadingRestImage] = useState(false)
  const [viewsThisMonth, setViewsThisMonth] = useState(0)
  const [likesCount, setLikesCount] = useState(0)

  // ── Computed metrics ──────────────────────────────────────────────────────────
  const avgRating = useMemo(() =>
    reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null
  , [reviews])

  const starDist = useMemo(() =>
    [5,4,3,2,1].map(n => ({
      stars: n,
      count: reviews.filter(r => r.rating === n).length,
      pct: reviews.length > 0 ? Math.round(reviews.filter(r => r.rating === n).length / reviews.length * 100) : 0,
    }))
  , [reviews])

  // Reviews per day of week (last 30 days)
  const reviewsByDay = useMemo(() => {
    const counts = Array(7).fill(0)
    const cutoff = Date.now() - 30 * 86400000
    reviews.filter(r => new Date(r.created_at).getTime() > cutoff)
      .forEach(r => { counts[(new Date(r.created_at).getDay() + 6) % 7]++ })
    return counts
  }, [reviews])

  // Notifications built from real events
  const notifications = useMemo(() => {
    const list = []
    let id = 0
    if (restaurant && !restaurant.is_verified)
      list.push({ id: id++, icon: AlertCircle, color: 'text-amber-500', text: 'Votre restaurant est en attente de vérification par notre équipe.', time: '' })
    if (restaurant?.is_verified)
      list.push({ id: id++, icon: CheckCircle, color: 'text-green-500', text: 'Votre restaurant a été vérifié et publié sur DiaTable.', time: '' })
    if (menuItems.length === 0 && restaurant)
      list.push({ id: id++, icon: Utensils, color: 'text-red-400', text: 'Votre carte est vide — ajoutez des plats pour attirer plus de clients.', time: '' })
    reviews.slice(0, 8).forEach(r => {
      list.push({ id: id++, icon: Star, color: 'text-yellow-400', text: `${r.name} a laissé un avis ${r.rating} étoile${r.rating > 1 ? 's' : ''}`, time: timeAgo(r.created_at) })
    })
    return list
  }, [reviews, restaurant, menuItems])

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  // ── Fetch data on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase || !user) { setDbLoading(false); return }

    async function load() {
      setDbLoading(true)
      // Fetch vendor's restaurant
      const { data: rest } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (rest) {
        setRestaurant(rest)
        if (rest.image_url) setRestImagePreview(rest.image_url)
        // Pre-fill restaurant form with real data
        setRestaurantForm({
          nom:         rest.name          || '',
          cuisine:     rest.cuisine_label || '',
          ville:       rest.location      || '',
          adresse:     rest.address       || '',
          telephone:   rest.phone         || '',
          whatsapp:    rest.whatsapp      || '',
          instagram:   rest.instagram     || '',
          description: rest.description   || '',
          horaires:    rest.hours         || '',
        })

        // Fetch menu items
        const { data: menu } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', rest.id)
          .order('category')
        setMenuItems(menu || [])

        // Set initial menu category to first real category
        if (menu && menu.length > 0) {
          const firstCat = menu[0].category || 'Plats Principaux'
          setMenuCategory(firstCat)
          setNewDish(prev => ({ ...prev, categorie: firstCat }))
        }

        // Fetch reviews (with author profile)
        const { data: revs } = await supabase
          .from('reviews')
          .select('*, profiles(full_name)')
          .eq('restaurant_id', rest.id)
          .order('created_at', { ascending: false })
          .limit(20)

        setReviews((revs || []).map(r => ({
          ...r,
          initials: (r.profiles?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
          name:     r.profiles?.full_name || 'Utilisateur',
          stars:    r.rating,
          date:     new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
          comment:  r.text || '',
        })))

        // Fetch views this month
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        const { count: vCount } = await supabase
          .from('restaurant_views')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', rest.id)
          .gte('created_at', monthStart)
        setViewsThisMonth(vCount || 0)

        // Fetch likes count
        const { count: lCount } = await supabase
          .from('restaurant_likes')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', rest.id)
        setLikesCount(lCount || 0)
      }
      setDbLoading(false)
    }
    load()
  }, [user])

  // ── Derive menu categories from DB items ────────────────────────────────────
  const menuByCategory = menuItems.reduce((acc, item) => {
    const cat = item.category || 'Plats Principaux'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})
  const menuCategories = Object.keys(menuByCategory)

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleSignOut() {
    signOut()
    navigate('/')
  }

  function markRead(id) {
    setReadIds(prev => new Set([...prev, id]))
  }

  async function toggleActive() {
    if (!supabase || !restaurant) return
    const next = !restaurant.is_active
    const { error } = await supabase
      .from('restaurants')
      .update({ is_active: next })
      .eq('id', restaurant.id)
    if (!error) setRestaurant(prev => ({ ...prev, is_active: next }))
  }

  async function createRestaurant() {
    if (!supabase || !createForm.nom.trim() || !createForm.cuisine.trim() || !createForm.ville.trim()) return
    setCreatingRest(true)
    const { data, error } = await supabase
      .from('restaurants')
      .insert({
        owner_id:      user.id,
        name:          createForm.nom,
        cuisine:       createForm.cuisine.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ''),
        cuisine_label: createForm.cuisine,
        flag:          createForm.flag,
        emoji:         createForm.flag,
        gradient:      'linear-gradient(135deg,#f4a828,#c8841a)',
        location:      createForm.ville,
        description:   createForm.description,
        is_active:     false,
      })
      .select()
      .single()
    setCreatingRest(false)
    if (!error && data) {
      setRestaurant(data)
      setRestaurantForm({
        nom:         data.name          || '',
        cuisine:     data.cuisine_label || '',
        ville:       data.location      || '',
        adresse:     data.address       || '',
        telephone:   data.phone         || '',
        whatsapp:    data.whatsapp      || '',
        instagram:   data.instagram     || '',
        description: data.description   || '',
        horaires:    data.hours         || '',
      })
      setActiveSection('restaurant')
    }
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
      if (url) {
        await supabase.from('restaurants').update({ image_url: url }).eq('id', restaurant.id)
        setRestaurant(prev => ({ ...prev, image_url: url }))
        setRestImagePreview(url)
        setRestImageFile(null)
      }
    }
    setUploadingRestImage(false)
  }

  async function saveRestaurant() {
    if (!supabase || !restaurant) return
    setSavingRest(true)
    setSaveMsg('')
    const { error } = await supabase
      .from('restaurants')
      .update({
        name:          restaurantForm.nom,
        cuisine_label: restaurantForm.cuisine,
        location:      restaurantForm.ville,
        address:       restaurantForm.adresse,
        phone:         restaurantForm.telephone,
        whatsapp:      restaurantForm.whatsapp,
        instagram:     restaurantForm.instagram,
        description:   restaurantForm.description,
        hours:         restaurantForm.horaires,
      })
      .eq('id', restaurant.id)
    setSavingRest(false)
    setSaveMsg(error ? 'Erreur lors de la sauvegarde.' : 'Modifications enregistrées !')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  function handleDishImageSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setDishImageFile(file)
    setDishImagePreview(URL.createObjectURL(file))
  }

  function clearDishImage() {
    setDishImageFile(null)
    setDishImagePreview(null)
  }

  async function uploadDishImage(dishId) {
    if (!dishImageFile || !supabase) return null
    setUploadingImage(true)
    const ext = dishImageFile.name.split('.').pop()
    const path = `${restaurant.id}/${dishId}.${ext}`
    const { error } = await supabase.storage.from('menuimages').upload(path, dishImageFile, { upsert: true })
    setUploadingImage(false)
    if (error) {
      console.error('Upload error:', error)
      setSaveMsg(`Erreur upload : ${error.message}`)
      setTimeout(() => setSaveMsg(''), 4000)
      return null
    }
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
        await supabase.from('menu_items').update({
          name:        newDish.nom,
          price:       parseFloat(newDish.prix) || 0,
          description: newDish.description,
          category:    cat,
          is_popular:  newDish.populaire,
          ...(imageUrl ? { image_url: imageUrl } : {}),
        }).eq('id', editingDish)
      }
      setMenuItems(prev => prev.map(d => d.id === editingDish
        ? { ...d, name: newDish.nom, price: newDish.prix, description: newDish.description, category: cat, is_popular: newDish.populaire, ...(dishImageFile && dishImagePreview ? { image_url: dishImagePreview } : {}) }
        : d))
      setEditingDish(null)
    } else {
      if (supabase) {
        const { data } = await supabase.from('menu_items').insert({
          restaurant_id: restaurant.id,
          name:          newDish.nom,
          price:         parseFloat(newDish.prix) || 0,
          description:   newDish.description,
          category:      cat,
          is_popular:    newDish.populaire,
          is_available:  true,
        }).select().single()
        if (data) {
          // Upload image if selected
          if (dishImageFile) {
            const imageUrl = await uploadDishImage(data.id)
            if (imageUrl) {
              await supabase.from('menu_items').update({ image_url: imageUrl }).eq('id', data.id)
              data.image_url = imageUrl
            }
          }
          setMenuItems(prev => [...prev, data])
          setNewDish({ nom: '', prix: '', description: '', categorie: menuCategory, populaire: false })
          clearDishImage()
          setShowAddForm(false)
          return
        }
      }
      setMenuItems(prev => [...prev, { id: Date.now(), name: newDish.nom, price: newDish.prix, description: newDish.description, category: cat, is_popular: newDish.populaire }])
    }
    setNewDish({ nom: '', prix: '', description: '', categorie: menuCategory, populaire: false })
    clearDishImage()
    setShowAddForm(false)
  }

  async function deleteDish(id) {
    if (supabase) await supabase.from('menu_items').delete().eq('id', id)
    setMenuItems(prev => prev.filter(d => d.id !== id))
  }

  function startEdit(dish) {
    setEditingDish(dish.id)
    setNewDish({ nom: dish.name, prix: String(dish.price), description: dish.description, categorie: dish.category || menuCategory, populaire: dish.is_popular })
    clearDishImage()
    setDishImagePreview(dish.image_url || null)
    setShowAddForm(true)
  }

  function navigate_to(section) {
    setActiveSection(section)
    setSidebarOpen(false)
  }

  // ── Sidebar content ───────────────────────────────────────────────────────

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className={`${collapsed ? 'px-2 py-5 justify-center' : 'px-6 py-5'} border-b border-white/10 flex items-center`}>
        {!collapsed && (
          <>
            <div>
              <span className="font-serif text-2xl font-bold text-yellow-400">DiaTable</span>
              <p className="text-white/40 text-xs mt-0.5">Espace vendeur</p>
            </div>
          </>
        )}
        {collapsed && (
          <span className="font-serif text-xl font-bold text-yellow-400">D</span>
        )}
      </div>

      <div className={`${collapsed ? 'px-2 py-4 justify-center' : 'px-6 py-4'} border-b border-white/10 flex items-center gap-3`}>
        <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 font-bold text-sm flex-shrink-0">
          {vendorName.charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{vendorName}</p>
            <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full">Vendeur</span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem icon={LayoutDashboard} label="Aperçu"        active={activeSection === 'apercu'}     onClick={() => navigate_to('apercu')}     collapsed={collapsed} />
        <NavItem icon={Store}          label="Mon Restaurant" active={activeSection === 'restaurant'} onClick={() => navigate_to('restaurant')} collapsed={collapsed} />
        <NavItem icon={Utensils}       label="Carte & Menu"   active={activeSection === 'menu'}       onClick={() => navigate_to('menu')}       collapsed={collapsed} />
        <NavItem icon={Star}           label="Avis clients"   active={activeSection === 'avis'}       onClick={() => navigate_to('avis')}       collapsed={collapsed} />
        <NavItem icon={BarChart2}      label="Statistiques"   active={activeSection === 'stats'}      onClick={() => navigate_to('stats')}      collapsed={collapsed} />
        <NavItem icon={Bell}           label="Notifications"  active={activeSection === 'notifs'}     onClick={() => navigate_to('notifs')}     badge={unreadCount > 0 ? unreadCount : null} collapsed={collapsed} />
      </nav>

      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <Link
          to="/restaurants/1"
          title={collapsed ? "Voir ma page" : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <Eye size={18} className="shrink-0" />
          {!collapsed && <span>Voir ma page</span>}
        </Link>
        <button
          onClick={handleSignOut}
          title={collapsed ? "Déconnexion" : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>

      <button
        onClick={() => setCollapsed(v => !v)}
        className="hidden lg:flex w-full items-center justify-center py-3 text-white/40 hover:text-white transition-colors border-t border-white/10 mt-auto"
        title={collapsed ? "Agrandir" : "Réduire"}
      >
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
          <h1 className="text-2xl font-serif font-bold text-dark">
            Bonjour {vendorName.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1 capitalize">{today}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Eye}           value={viewsThisMonth}   label="Vues ce mois"  trend={viewsThisMonth > 0 ? 'profil consulté' : 'aucune vue'} up={viewsThisMonth > 0 ? true : null} />
          <StatCard icon={Star}          value={avgRating ?? '—'} label="Note moyenne"  trend={avgRating ? 'réel' : 'aucun avis'} up={null} />
          <StatCard icon={MessageSquare} value={reviews.length}   label="Avis publiés"  trend={reviews.length > 0 ? `+${reviews.filter(r => Date.now() - new Date(r.created_at).getTime() < 30*86400000).length} ce mois` : 'aucun'} up={reviews.length > 0 ? true : null} />
          <StatCard icon={Heart}         value={likesCount}       label="J'aime"        trend={likesCount > 0 ? 'favoris' : 'aucun like'} up={likesCount > 0 ? true : null} />
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-light">
          <h3 className="text-sm font-semibold text-dark mb-1">Avis reçus par jour de la semaine</h3>
          <p className="text-xs text-gray-400 mb-4">30 derniers jours</p>
          {reviews.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-gray-300 text-sm">Aucun avis pour le moment</div>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {reviewsByDay.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  {v > 0 && <span className="text-xs text-gray-400">{v}</span>}
                  <div
                    className="w-full bg-yellow-400 rounded-t-md transition-all"
                    style={{ height: `${(v / maxBar) * 96}px`, minHeight: v > 0 ? '4px' : '0' }}
                  />
                  <span className="text-xs text-gray-400">{WEEK_DAYS[i]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-light">
          <h3 className="text-sm font-semibold text-dark mb-4">Activité récente</h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucune activité pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 5).map((r, i) => (
                <div key={r.id || i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center flex-shrink-0">
                    <Star size={15} className="text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-dark">{r.name} a laissé un avis <span className="font-semibold text-yellow-600">{r.rating}★</span></p>
                    {r.comment && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">"{r.comment}"</p>}
                    <p className="text-xs text-gray-300 mt-0.5">{timeAgo(r.created_at)}</p>
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
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-serif font-bold text-dark">Mon Restaurant</h1>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
            <CheckCircle size={14} /> Vérifié
          </span>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-light">
          <h2 className="text-base font-semibold text-dark mb-5">Informations générales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Nom du restaurant", key: "nom",       type: "text" },
              { label: "Ville",             key: "ville",     type: "text" },
              { label: "Téléphone",         key: "telephone", type: "tel"  },
              { label: "WhatsApp",          key: "whatsapp",  type: "tel"  },
              { label: "Instagram",         key: "instagram", type: "text" },
              { label: "Horaires",          key: "horaires",  type: "text" },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                <input
                  type={type}
                  value={restaurantForm[key]}
                  onChange={e => setRestaurantForm(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type de cuisine</label>
              <select
                value={restaurantForm.cuisine}
                onChange={e => setRestaurantForm(prev => ({ ...prev, cuisine: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-yellow-400/50 bg-white"
              >
                <option value="">— Choisir —</option>
                <option value="🇸🇳 Sénégalaise">🇸🇳 Sénégalaise</option>
                <option value="🇨🇳 Chinoise">🇨🇳 Chinoise</option>
                <option value="🇱🇧 Libanaise">🇱🇧 Libanaise</option>
                <option value="🇸🇾 Syrienne">🇸🇾 Syrienne</option>
                <option value="🇫🇷 Française">🇫🇷 Française</option>
                <option value="🇮🇹 Italienne">🇮🇹 Italienne</option>
                <option value="🇳🇬 Nigériane">🇳🇬 Nigériane</option>
                <option value="🇮🇳 Indienne">🇮🇳 Indienne</option>
                <option value="🇧🇷 Brésilienne">🇧🇷 Brésilienne</option>
                <option value="🌍 Internationale">🌍 Internationale / Fusion</option>
                <option value="🍽️ Autre">🍽️ Autre</option>
              </select>
            </div>
            {restaurant?.type === 'homecook' ? (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <Lock size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  En tant que cuisine à domicile, votre adresse exacte n'est pas publiée — seule votre ville est visible par les clients.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Adresse complète</label>
                <input
                  type="text"
                  value={restaurantForm.adresse}
                  onChange={e => setRestaurantForm(prev => ({ ...prev, adresse: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                />
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <textarea
                rows={3}
                value={restaurantForm.description}
                onChange={e => setRestaurantForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-yellow-400/50 resize-none"
              />
            </div>
          </div>
          <button
            onClick={saveRestaurant}
            disabled={savingRest}
            className="mt-6 btn btn-gold text-sm disabled:opacity-50"
          >
            {savingRest ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
          {saveMsg && (
            <p className={`text-sm mt-2 ${saveMsg.includes('Erreur') ? 'text-red-500' : 'text-green-600'}`}>
              {saveMsg}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-light">
          <h2 className="text-base font-semibold text-dark mb-4">Photo du restaurant</h2>
          {restImagePreview ? (
            <div className="relative w-full h-52 rounded-xl overflow-hidden border border-gray-200 group mb-4">
              <img src={restImagePreview} alt="photo restaurant" className="w-full h-full object-cover" />
              <label className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-black/80 transition-colors">
                Changer la photo
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) { setRestImageFile(f); setRestImagePreview(URL.createObjectURL(f)) }
                }} />
              </label>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-yellow-400 hover:bg-yellow-50/50 transition-all group mb-4">
              <ImageIcon size={32} className="text-gray-300 group-hover:text-yellow-400 mb-2 transition-colors" />
              <span className="text-sm text-gray-400 group-hover:text-yellow-600 font-medium">Ajouter une photo de votre restaurant</span>
              <span className="text-xs text-gray-300 mt-1">JPG, PNG, WEBP — max 10 Mo</span>
              <input type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0]
                if (f) { setRestImageFile(f); setRestImagePreview(URL.createObjectURL(f)) }
              }} />
            </label>
          )}
          {restImageFile && (
            <button
              onClick={uploadRestaurantImage}
              disabled={uploadingRestImage}
              className="btn btn-gold text-sm disabled:opacity-50"
            >
              {uploadingRestImage ? 'Upload en cours…' : 'Enregistrer la photo'}
            </button>
          )}
          {!restImageFile && restImagePreview && (
            <p className="text-xs text-muted">Photo actuelle enregistrée. Cliquez sur "Changer la photo" pour la remplacer.</p>
          )}
        </div>

        <div className={`bg-white rounded-xl p-6 shadow-sm border ${restaurant?.is_active ? 'border-red-100' : 'border-green-100'}`}>
          <h2 className={`text-base font-semibold mb-2 ${restaurant?.is_active ? 'text-red-600' : 'text-green-600'}`}>
            Zone de danger
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {restaurant?.is_active
              ? 'La désactivation rendra votre fiche invisible pour les clients. Vous pourrez la réactiver à tout moment.'
              : 'Votre fiche est actuellement désactivée et invisible pour les clients. Réactivez-la pour réapparaître.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleActive}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${restaurant?.is_active
                  ? 'border border-red-400 text-red-500 hover:bg-red-50'
                  : 'border border-green-500 text-green-600 hover:bg-green-50'
                }`}
            >
              {restaurant?.is_active ? 'Désactiver mon restaurant' : 'Réactiver mon restaurant'}
            </button>
            {!restaurant?.is_active && (
              <span className="text-xs text-red-400 font-medium bg-red-50 px-3 py-1 rounded-full">
                Fiche désactivée
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  function renderMenu() {
    const currentDishes = menuByCategory[menuCategory] || []
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-serif font-bold text-dark">Carte & Menu</h1>
          <button
            onClick={() => {
              setShowAddForm(v => !v)
              setEditingDish(null)
              setNewDish({ nom: '', prix: '', description: '', categorie: menuCategory, populaire: false })
            }}
            className="bg-yellow-400 text-gray-900 font-semibold px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors text-sm flex items-center gap-2"
          >
            <Plus size={16} /> Ajouter un plat
          </button>
        </div>

        {menuCategories.length === 0 ? (
          <div className="text-center py-12 bg-gold/5 border-2 border-dashed border-gold/30 rounded-2xl">
            <Utensils size={40} className="text-gold mx-auto mb-3" />
            <h3 className="font-serif font-bold text-dark mb-2">Votre carte est vide</h3>
            <p className="text-muted text-sm mb-4">Ajoutez vos plats pour que vos clients puissent découvrir votre menu.</p>
            <button onClick={() => setShowAddForm(true)} className="btn btn-gold text-sm flex items-center gap-1 mx-auto">
              <Plus size={16} /> Ajouter mon premier plat
            </button>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {menuCategories.map(cat => (
              <button
                key={cat}
                onClick={() => { setMenuCategory(cat); setShowAddForm(false) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  menuCategory === cat
                    ? "bg-dark text-yellow-400"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-yellow-400 hover:text-dark"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {showAddForm && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-yellow-300">
            <h3 className="text-sm font-semibold text-dark mb-4">
              {editingDish ? "Modifier le plat" : "Nouveau plat"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nom du plat</label>
                <input
                  value={newDish.nom}
                  onChange={e => setNewDish(p => ({ ...p, nom: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  placeholder="Ex : Thiéboudiène royal"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Prix (MAD)</label>
                <input
                  value={newDish.prix}
                  onChange={e => setNewDish(p => ({ ...p, prix: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  placeholder="Ex : 85"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <input
                  value={newDish.description}
                  onChange={e => setNewDish(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  placeholder="Courte description du plat"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Catégorie</label>
                <select
                  value={newDish.categorie}
                  onChange={e => setNewDish(p => ({ ...p, categorie: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                >
                  {menuCategories.length > 0
                    ? menuCategories.map(c => <option key={c}>{c}</option>)
                    : <option>Plats Principaux</option>
                  }
                </select>
              </div>
              <div className="flex items-center gap-2 mt-5">
                <input
                  type="checkbox"
                  id="populaire"
                  checked={newDish.populaire}
                  onChange={e => setNewDish(p => ({ ...p, populaire: e.target.checked }))}
                  className="w-4 h-4 accent-yellow-400"
                />
                <label htmlFor="populaire" className="text-sm text-dark">Marquer comme populaire</label>
              </div>
            </div>

            {/* Photo upload */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-500 mb-2">Photo du plat (optionnel)</label>
              {dishImagePreview ? (
                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={dishImagePreview} alt="aperçu" className="w-full h-full object-cover" />
                  <button
                    onClick={clearDishImage}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XIcon size={14} />
                  </button>
                  <label className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg cursor-pointer hover:bg-black/80 transition-colors">
                    Changer
                    <input type="file" accept="image/*" className="hidden" onChange={handleDishImageSelect} />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-yellow-400 hover:bg-yellow-50/50 transition-all group">
                  <ImageIcon size={24} className="text-gray-300 group-hover:text-yellow-400 mb-1 transition-colors" />
                  <span className="text-xs text-gray-400 group-hover:text-yellow-600">Cliquer pour ajouter une photo</span>
                  <span className="text-xs text-gray-300 mt-0.5">JPG, PNG, WEBP — max 5 Mo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleDishImageSelect} />
                </label>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={saveDish} disabled={uploadingImage} className="bg-yellow-400 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-yellow-500 transition-colors disabled:opacity-60">
                {uploadingImage ? 'Upload en cours…' : 'Enregistrer'}
              </button>
              <button onClick={() => { setShowAddForm(false); setEditingDish(null); clearDishImage() }} className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                Annuler
              </button>
            </div>
            {saveMsg && (
              <p className={`text-sm mt-2 ${saveMsg.includes('Erreur') ? 'text-red-500' : 'text-green-600'}`}>{saveMsg}</p>
            )}
          </div>
        )}

        {menuCategories.length > 0 && (
          <div className="space-y-3">
            {currentDishes.map(dish => (
              <div key={dish.id} className="bg-white rounded-xl p-4 shadow-sm border border-light flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-yellow-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                  {dish.image_url
                    ? <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
                    : <Utensils size={20} className="text-yellow-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-dark">{dish.name}</p>
                    {dish.is_popular && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Populaire</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{dish.description}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-bold text-dark">{dish.price} MAD</span>
                  <button onClick={() => startEdit(dish)} className="text-gray-400 hover:text-dark transition-colors">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => deleteDish(dish.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
            {currentDishes.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">Aucun plat dans cette catégorie.</div>
            )}
          </div>
        )}
      </div>
    )
  }

  function renderAvis() {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-serif font-bold text-dark">Avis clients</h1>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-light flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="text-center">
            <p className="text-6xl font-serif font-bold text-dark">{avgRating ?? '—'}</p>
            <Stars count={5} size={20} />
            <p className="text-gray-400 text-sm mt-1">{reviews.length} avis</p>
          </div>
          <div className="flex-1 space-y-2 w-full">
            {starDist.map(({ stars, pct }) => (
              <div key={stars} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-4 text-right">{stars}</span>
                <Star size={12} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-8">{pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-light">
            <Star size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-dark mb-1">Aucun avis pour l'instant</p>
            <p className="text-xs text-gray-400">Les avis de vos clients apparaîtront ici.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r, i) => (
              <div key={r.id || i} className="bg-white rounded-xl p-5 shadow-sm border border-light">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-dark flex items-center justify-center text-yellow-400 font-bold text-sm flex-shrink-0">
                    {r.initials}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-sm font-semibold text-dark">{r.name}</p>
                      <p className="text-xs text-gray-400">{r.date}</p>
                    </div>
                    <Stars count={r.stars} size={13} />
                    <p className="text-sm text-dark/80 mt-2 leading-relaxed">{r.comment}</p>
                    <button className="mt-3 text-xs font-medium text-yellow-600 hover:underline flex items-center gap-1">
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
    const allDishes = menuItems.slice(0, 5)
    const topDishes = popularDishes.length > 0 ? popularDishes : allDishes

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-serif font-bold text-dark">Statistiques</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Note moyenne',      value: avgRating ?? '—' },
            { label: 'Total avis',        value: reviews.length },
            { label: 'Plats au menu',     value: menuItems.length },
            { label: 'Catégories menu',   value: menuCategories.length },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-light">
              <p className="text-2xl font-serif font-bold text-dark">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Avis par jour de la semaine */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-light">
          <h3 className="text-sm font-semibold text-dark mb-1">Avis par jour de la semaine</h3>
          <p className="text-xs text-gray-400 mb-4">30 derniers jours</p>
          {reviews.length === 0 ? (
            <div className="h-28 flex items-center justify-center text-gray-300 text-sm">Aucun avis reçu</div>
          ) : (
            <>
              <svg viewBox="0 0 560 120" className="w-full" style={{ height: 120 }}>
                <defs>
                  <linearGradient id="vendorLineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f4a828" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f4a828" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={`20,100 ${points} 540,100`} fill="url(#vendorLineGrad)" />
                <polyline points={points} fill="none" stroke="#f4a828" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {reviewsByDay.map((v, i) => {
                  const maxV = Math.max(...reviewsByDay, 1)
                  const x = 20 + i * ((560 - 40) / 6)
                  const y = 20 + (1 - v / maxV) * 80
                  return <circle key={i} cx={x} cy={y} r="4" fill="#f4a828" />
                })}
              </svg>
              <div className="flex justify-between mt-1">
                {WEEK_DAYS.map(d => <span key={d} className="text-xs text-gray-400">{d}</span>)}
              </div>
            </>
          )}
        </div>

        {/* Distribution des étoiles */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-light">
          <h3 className="text-sm font-semibold text-dark mb-4">Distribution des notes</h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucun avis pour le moment</p>
          ) : (
            <div className="space-y-2">
              {starDist.map(({ stars, count, pct }) => (
                <div key={stars} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-dark w-8 text-right flex-shrink-0">{stars}★</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-2 bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-12 flex-shrink-0">{count} avis</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plats populaires */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-light">
          <h3 className="text-sm font-semibold text-dark mb-4">
            {popularDishes.length > 0 ? 'Plats marqués populaires' : 'Plats au menu'}
          </h3>
          {topDishes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucun plat ajouté</p>
          ) : (
            <div className="space-y-3">
              {topDishes.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-yellow-400 text-gray-900 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-dark truncate">{p.name}</span>
                      <span className="text-yellow-600 font-semibold ml-2 flex-shrink-0">{Number(p.price).toFixed(0)} MAD</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{p.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderNotifs() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-serif font-bold text-dark">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={() => setReadIds(new Set(notifications.map(n => n.id)))}
              className="text-xs text-yellow-600 hover:underline font-medium"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} className={`bg-white rounded-xl p-4 shadow-sm border flex items-start gap-3 transition-all ${readIds.has(n.id) ? "border-light opacity-70" : "border-yellow-200"}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${readIds.has(n.id) ? "bg-gray-100" : "bg-yellow-50"}`}>
                <n.icon size={16} className={n.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${readIds.has(n.id) ? "text-gray-400" : "text-dark font-medium"}`}>{n.text}</p>
                <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
              </div>
              {!readIds.has(n.id) && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                  <button onClick={() => markRead(n.id)} className="text-xs text-gray-400 hover:text-dark whitespace-nowrap">
                    Marquer comme lu
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderSection() {
    if (dbLoading) {
      return (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 rounded-full border-4 border-gold/30 border-t-gold animate-spin" />
        </div>
      )
    }

    if (!restaurant) {
      return (
        <div className="max-w-xl mx-auto text-center py-16 px-4">
          <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store size={40} className="text-gold" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-dark mb-3">
            Complétez votre profil vendeur
          </h2>
          <p className="text-muted mb-8 leading-relaxed">
            Vous n'avez pas encore créé votre fiche restaurant. Commencez dès maintenant pour apparaître dans les résultats de recherche et attirer vos premiers clients.
          </p>
          <div className="space-y-3">
            <Link to="/devenir-vendeur" className="btn btn-gold w-full justify-center py-3 text-base">
              Créer ma fiche restaurant →
            </Link>
            <p className="text-muted text-xs">Moins de 5 minutes • Gratuit</p>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { icon: Store,    label: 'Fiche restaurant', done: false },
              { icon: Utensils, label: 'Carte & Menu',     done: false },
              { icon: Star,     label: 'Premiers avis',    done: false },
            ].map(({ icon: Icon, label, done }, i) => (
              <div key={label} className={`rounded-xl p-4 ${done ? 'bg-green-50' : i === 0 ? 'bg-amber-50' : 'bg-cream'}`}>
                <Icon size={24} className={`mx-auto mb-2 ${done ? 'text-green-500' : i === 0 ? 'text-amber-500' : 'text-muted'}`} />
                <p className="text-xs text-muted font-medium">{label}</p>
                <p className={`text-xs font-bold mt-1 ${done ? 'text-green-500' : i === 0 ? 'text-amber-600' : 'text-red-400'}`}>
                  {done ? 'Fait' : i === 0 ? 'En attente' : 'À compléter'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )
    }

    switch (activeSection) {
      case 'apercu':     return renderApercu()
      case 'restaurant': return renderRestaurant()
      case 'menu':       return renderMenu()
      case 'avis':       return renderAvis()
      case 'stats':      return renderStats()
      case 'notifs':     return renderNotifs()
      default:           return renderApercu()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-cream overflow-hidden">
      <DashboardTopbar variant="vendor" />
    <div className="flex flex-1 overflow-hidden" style={{ marginTop: '56px' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-30 flex-shrink-0
          transform transition-all duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
          ${collapsed ? 'lg:w-16' : 'lg:w-64'}
        `}
        style={{ backgroundColor: '#1a1a2e' }}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-1 text-dark">
            <Menu size={22} />
          </button>
          <span className="font-serif font-bold text-dark">DiaTable</span>
          <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 text-xs font-bold">
            {vendorName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Scrollable content area */}
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${collapsed ? 'lg:pl-16' : 'lg:pl-8'}`}>
          {/* Persistent alerts */}
          {restaurant && !restaurant.is_verified && (
            <div className="flex items-center gap-3 bg-amber-50 border-b border-amber-200 px-5 py-3 lg:px-8">
              <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-800 font-medium">
                Votre fiche est <strong>en attente de vérification</strong> par notre équipe. Elle ne sera pas visible publiquement avant validation.
              </p>
            </div>
          )}
          {restaurant && menuItems.length === 0 && (
            <div className="flex items-center gap-3 bg-red-50 border-b border-red-200 px-5 py-3 lg:px-8">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-800 font-medium">
                Votre carte est vide — les clients ne peuvent pas voir ce que vous proposez.{' '}
                <button onClick={() => setActiveSection('menu')} className="underline font-bold hover:text-red-900">
                  Ajouter des plats →
                </button>
              </p>
            </div>
          )}
          <div className="p-5 lg:p-8">
            <div className="max-w-5xl mx-auto">
              {renderSection()}
            </div>
          </div>
        </main>
      </div>
    </div>
    </div>
  )
}
