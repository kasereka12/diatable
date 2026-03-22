import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Store, Utensils, Star, BarChart2, Bell,
  Eye, LogOut, TrendingUp, TrendingDown, Minus, Phone,
  Instagram, Menu, ChevronRight, Edit2, Trash2, Plus,
  CheckCircle, AlertCircle, MessageSquare
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ─── Sample data ────────────────────────────────────────────────────────────

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const WEEK_DATA = [120, 95, 140, 180, 210, 260, 180]
const MAX_BAR   = Math.max(...WEEK_DATA)

const ACTIVITY = [
  { icon: Star,          color: 'text-yellow-400', text: "Nouveau avis 5 étoiles de Fatima M.",        time: "Il y a 15 min" },
  { icon: Phone,         color: 'text-green-400',  text: "Demande de contact via WhatsApp",            time: "Il y a 1h" },
  { icon: Eye,           color: 'text-blue-400',   text: "47 nouvelles vues sur votre fiche",          time: "Il y a 2h" },
  { icon: Bell,          color: 'text-yellow-500', text: "Votre restaurant apparaît en page 1 Google", time: "Hier" },
  { icon: Instagram,     color: 'text-pink-400',   text: "Mention Instagram @datable.ma",              time: "Hier" },
]

const INITIAL_DISHES = {
  "Entrées": [
    { id: 1, nom: "Pastilla au poulet",    prix: "45", description: "Feuilles de brick, amandes, cannelle", populaire: true  },
    { id: 2, nom: "Zaalouk de courgettes", prix: "30", description: "Salade chaude à la chermoula",         populaire: false },
    { id: 3, nom: "Briouates au fromage",  prix: "35", description: "Croustillants au fromage kefta",       populaire: true  },
    { id: 4, nom: "Harira traditionnelle", prix: "25", description: "Soupe aux tomates et lentilles",       populaire: false },
  ],
  "Plats": [
    { id: 5, nom: "Thiéboudiène royal",  prix: "85", description: "Riz au poisson sénégalais, légumes",  populaire: true  },
    { id: 6, nom: "Mafé agneau",         prix: "90", description: "Ragoût à la pâte de cacahuète",       populaire: true  },
    { id: 7, nom: "Tajine kefta mkawar", prix: "75", description: "Boulettes en sauce tomate aux oeufs", populaire: false },
    { id: 8, nom: "Poulet yassa",        prix: "80", description: "Poulet mariné aux oignons et citron", populaire: true  },
  ],
  "Desserts": [
    { id: 9,  nom: "Gazelle aux amandes", prix: "18", description: "Pâtisserie marocaine traditionnelle", populaire: true  },
    { id: 10, nom: "Thiakry",             prix: "25", description: "Crème au mil et yaourt parfumé",      populaire: false },
    { id: 11, nom: "Chebakia au miel",    prix: "20", description: "Gâteau sésame et miel de fleurs",     populaire: true  },
    { id: 12, nom: "Salade d'oranges",    prix: "15", description: "Oranges cannelle eau de fleur",        populaire: false },
  ],
  "Boissons": [
    { id: 13, nom: "Thé à la menthe",   prix: "12", description: "Thé vert infusé menthe fraîche",       populaire: true  },
    { id: 14, nom: "Bissap hibiscus",   prix: "15", description: "Boisson froide à la fleur d'hibiscus", populaire: true  },
    { id: 15, nom: "Jus de gingembre", prix: "18", description: "Fraîcheur épicée maison",               populaire: false },
    { id: 16, nom: "Eau de tamarin",    prix: "14", description: "Boisson traditionnelle rafraîchissante", populaire: false },
  ],
}

const REVIEWS = [
  {
    initials: "FM", name: "Fatima M.", stars: 5, date: "15 mars 2026",
    comment: "Extraordinaire ! Le thiéboudiène était exactement comme à Dakar. Le service est chaleureux et l'ambiance authentique. Je reviendrai sûrement !"
  },
  {
    initials: "AK", name: "Ahmed K.", stars: 4, date: "8 mars 2026",
    comment: "Très bon restaurant, la pastilla au poulet est une merveille. Légèrement long en service mais la qualité compense largement."
  },
  {
    initials: "SB", name: "Samira B.", stars: 5, date: "1 mars 2026",
    comment: "Le meilleur mafé que j'ai mangé à Casablanca. La patronne est adorable et les portions sont généreuses. Hautement recommandé !"
  },
]

const STAR_DIST = [
  { stars: 5, pct: 78 },
  { stars: 4, pct: 17 },
  { stars: 3, pct: 5  },
  { stars: 2, pct: 0  },
  { stars: 1, pct: 0  },
]

const STATS_MONTH = [
  { label: "Vues totales",    value: "7 420", trend: "+18%",   up: true  },
  { label: "Contacts reçus", value: "312",   trend: "+22%",   up: true  },
  { label: "Taux conversion", value: "4.2%", trend: "+0.3%",  up: true  },
  { label: "Note moyenne",   value: "4.8",   trend: "stable", up: null  },
]

const TOP_PLATS = [
  { nom: "Thiéboudiène royal", vues: 312, pct: 100 },
  { nom: "Mafé agneau",        vues: 287, pct: 92  },
  { nom: "Pastilla au poulet", vues: 241, pct: 77  },
]

const TRAFFIC_SOURCES = [
  { label: "Direct DiaTable", pct: 45, color: "bg-yellow-400" },
  { label: "Google Search",   pct: 30, color: "bg-blue-400"   },
  { label: "WhatsApp",        pct: 25, color: "bg-green-400"  },
]

const SVG_POINTS_DATA = [40, 90, 60, 30, 50, 20, 45]

function svgPolyline(data, w = 560, h = 120, pad = 20) {
  const maxV = Math.max(...data)
  const step = (w - pad * 2) / (data.length - 1)
  return data.map((v, i) => {
    const x = pad + i * step
    const y = pad + (1 - v / maxV) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')
}

const NOTIFICATIONS_INIT = [
  { id: 1, read: false, icon: Star,          color: "text-yellow-400", text: "Vous avez reçu un nouvel avis 5 étoiles",              time: "Il y a 10 min" },
  { id: 2, read: false, icon: Bell,          color: "text-yellow-500", text: "Votre fiche a été vue 200 fois aujourd'hui",            time: "Il y a 1h" },
  { id: 3, read: false, icon: CheckCircle,   color: "text-green-400",  text: "Votre restaurant a été vérifié par DiaTable",           time: "Il y a 3h" },
  { id: 4, read: true,  icon: MessageSquare, color: "text-blue-400",   text: "Réponse à votre commentaire sur Google",               time: "Hier 14h30" },
  { id: 5, read: true,  icon: AlertCircle,   color: "text-gray-400",   text: "Rappel : complétez votre menu pour plus de visibilité", time: "Il y a 2 jours" },
]

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

function NavItem({ icon: Icon, label, active, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-yellow-400 text-gray-900 font-semibold"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon size={18} />
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
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
  const [menuCategory, setMenuCategory]     = useState("Plats")
  const [dishes, setDishes]                 = useState(INITIAL_DISHES)
  const [showAddForm, setShowAddForm]       = useState(false)
  const [editingDish, setEditingDish]       = useState(null)
  const [newDish, setNewDish]               = useState({ nom: '', prix: '', description: '', categorie: 'Plats', populaire: false })
  const [notifications, setNotifications]   = useState(NOTIFICATIONS_INIT)
  const [restaurantForm, setRestaurantForm] = useState({
    nom: "Saveurs du Continent",
    cuisine: "Afrique de l'Ouest",
    ville: "Casablanca",
    adresse: "45 Rue Abdelmoumen, Maarif",
    telephone: "+212 6 12 34 56 78",
    whatsapp: "+212 6 12 34 56 78",
    instagram: "@saveurs_continent",
    description: "Restaurant authentique proposant les meilleures saveurs d'Afrique de l'Ouest. Cadre chaleureux, cuisine généreuse et service attentionné au coeur de Casablanca.",
    horaires: "Lun–Ven 12h–15h / 19h–23h | Sam–Dim 12h–23h"
  })

  const unreadCount = notifications.filter(n => !n.read).length

  function handleSignOut() {
    signOut()
    navigate('/')
  }

  function markRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function deleteDish(id) {
    setDishes(prev => {
      const updated = {}
      for (const cat in prev) {
        updated[cat] = prev[cat].filter(d => d.id !== id)
      }
      return updated
    })
  }

  function saveDish() {
    if (!newDish.nom.trim()) return
    const cat = newDish.categorie
    if (editingDish) {
      setDishes(prev => ({
        ...prev,
        [cat]: prev[cat].map(d => d.id === editingDish ? { ...newDish, id: editingDish } : d)
      }))
      setEditingDish(null)
    } else {
      const id = Date.now()
      setDishes(prev => ({ ...prev, [cat]: [...(prev[cat] || []), { ...newDish, id }] }))
    }
    setNewDish({ nom: '', prix: '', description: '', categorie: menuCategory, populaire: false })
    setShowAddForm(false)
  }

  function startEdit(dish) {
    setEditingDish(dish.id)
    setNewDish({ nom: dish.nom, prix: dish.prix, description: dish.description, categorie: menuCategory, populaire: dish.populaire })
    setShowAddForm(true)
  }

  function navigate_to(section) {
    setActiveSection(section)
    setSidebarOpen(false)
  }

  // ── Sidebar content ───────────────────────────────────────────────────────

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-white/10">
        <span className="font-serif text-2xl font-bold text-yellow-400">DiaTable</span>
        <p className="text-white/40 text-xs mt-0.5">Espace vendeur</p>
      </div>

      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 font-bold text-sm flex-shrink-0">
            {vendorName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{vendorName}</p>
            <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full">Vendeur</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem icon={LayoutDashboard} label="Aperçu"        active={activeSection === 'apercu'}     onClick={() => navigate_to('apercu')}     />
        <NavItem icon={Store}          label="Mon Restaurant" active={activeSection === 'restaurant'} onClick={() => navigate_to('restaurant')} />
        <NavItem icon={Utensils}       label="Carte & Menu"   active={activeSection === 'menu'}       onClick={() => navigate_to('menu')}       />
        <NavItem icon={Star}           label="Avis clients"   active={activeSection === 'avis'}       onClick={() => navigate_to('avis')}       />
        <NavItem icon={BarChart2}      label="Statistiques"   active={activeSection === 'stats'}      onClick={() => navigate_to('stats')}      />
        <NavItem icon={Bell}           label="Notifications"  active={activeSection === 'notifs'}     onClick={() => navigate_to('notifs')}     badge={unreadCount > 0 ? unreadCount : null} />
      </nav>

      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <Link
          to="/restaurants/1"
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
        >
          <Eye size={18} />
          <span>Voir ma page</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all"
        >
          <LogOut size={18} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  )

  // ── Sections ──────────────────────────────────────────────────────────────

  function renderApercu() {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-dark">
            Bonjour {vendorName.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1 capitalize">{today}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Eye}           value="1 847" label="Vues ce mois"   trend="+12%"  up={true} />
          <StatCard icon={Phone}         value="94"    label="Contacts reçus" trend="+8%"   up={true} />
          <StatCard icon={Star}          value="4.8"   label="Note moyenne"   trend="stable" up={null} />
          <StatCard icon={MessageSquare} value="23"    label="Avis publiés"   trend="+3"    up={true} />
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-light">
          <h3 className="text-sm font-semibold text-dark mb-4">Vues cette semaine</h3>
          <div className="flex items-end gap-2 h-32">
            {WEEK_DATA.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-400">{v}</span>
                <div
                  className="w-full bg-yellow-400 rounded-t-md transition-all"
                  style={{ height: `${(v / MAX_BAR) * 96}px` }}
                />
                <span className="text-xs text-gray-400">{WEEK_DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-light">
          <h3 className="text-sm font-semibold text-dark mb-4">Activité récente</h3>
          <div className="space-y-3">
            {ACTIVITY.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <item.icon size={15} className={item.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dark">{item.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
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
              { label: "Type de cuisine",   key: "cuisine",   type: "text" },
              { label: "Ville",             key: "ville",     type: "text" },
              { label: "Adresse complète",  key: "adresse",   type: "text" },
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
          <button className="mt-5 bg-yellow-400 text-gray-900 font-semibold px-5 py-2 rounded-lg hover:bg-yellow-500 transition-colors text-sm">
            Enregistrer les modifications
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-red-100">
          <h2 className="text-base font-semibold text-red-600 mb-2">Zone de danger</h2>
          <p className="text-sm text-gray-500 mb-4">La désactivation rendra votre fiche invisible pour les utilisateurs. Vous pourrez la réactiver à tout moment.</p>
          <button className="border border-red-400 text-red-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
            Désactiver mon restaurant
          </button>
        </div>
      </div>
    )
  }

  function renderMenu() {
    const currentDishes = dishes[menuCategory] || []
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

        <div className="flex gap-2 flex-wrap">
          {Object.keys(dishes).map(cat => (
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
                  {Object.keys(dishes).map(c => <option key={c}>{c}</option>)}
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
            <div className="flex gap-3 mt-4">
              <button onClick={saveDish} className="bg-yellow-400 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-yellow-500 transition-colors">
                Enregistrer
              </button>
              <button onClick={() => { setShowAddForm(false); setEditingDish(null) }} className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                Annuler
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {currentDishes.map(dish => (
            <div key={dish.id} className="bg-white rounded-xl p-4 shadow-sm border border-light flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center flex-shrink-0">
                <Utensils size={18} className="text-yellow-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-dark">{dish.nom}</p>
                  {dish.populaire && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Populaire</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{dish.description}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm font-bold text-dark">{dish.prix} MAD</span>
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
      </div>
    )
  }

  function renderAvis() {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-serif font-bold text-dark">Avis clients</h1>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-light flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="text-center">
            <p className="text-6xl font-serif font-bold text-dark">4.8</p>
            <Stars count={5} size={20} />
            <p className="text-gray-400 text-sm mt-1">23 avis</p>
          </div>
          <div className="flex-1 space-y-2 w-full">
            {STAR_DIST.map(({ stars, pct }) => (
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

        <div className="space-y-4">
          {REVIEWS.map((r, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-light">
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
      </div>
    )
  }

  function renderStats() {
    const points = svgPolyline(SVG_POINTS_DATA)
    const maxV = Math.max(...SVG_POINTS_DATA)
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-serif font-bold text-dark">Statistiques</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS_MONTH.map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-light">
              <p className="text-2xl font-serif font-bold text-dark">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              <span className={`text-xs font-semibold mt-2 inline-block px-2 py-0.5 rounded-full ${
                s.up === true ? "text-green-600 bg-green-50" : s.up === false ? "text-red-600 bg-red-50" : "text-gray-500 bg-gray-100"
              }`}>
                {s.trend}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-light">
          <h3 className="text-sm font-semibold text-dark mb-4">Trafic hebdomadaire</h3>
          <svg viewBox="0 0 560 120" className="w-full" style={{ height: 120 }}>
            <defs>
              <linearGradient id="vendorLineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f4a828" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f4a828" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon
              points={`20,100 ${points} 540,100`}
              fill="url(#vendorLineGrad)"
            />
            <polyline
              points={points}
              fill="none"
              stroke="#f4a828"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {SVG_POINTS_DATA.map((v, i) => {
              const x = 20 + i * ((560 - 40) / (SVG_POINTS_DATA.length - 1))
              const y = 20 + (1 - v / maxV) * 80
              return <circle key={i} cx={x} cy={y} r="4" fill="#f4a828" />
            })}
          </svg>
          <div className="flex justify-between mt-1">
            {WEEK_DAYS.map(d => <span key={d} className="text-xs text-gray-400">{d}</span>)}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-light">
          <h3 className="text-sm font-semibold text-dark mb-4">Top 3 plats les plus consultés</h3>
          <div className="space-y-3">
            {TOP_PLATS.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-yellow-400 text-gray-900 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-dark">{p.nom}</span>
                    <span className="text-gray-400">{p.vues} vues</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-1.5 bg-yellow-400 rounded-full" style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-light">
          <h3 className="text-sm font-semibold text-dark mb-4">Sources de trafic</h3>
          <div className="space-y-3">
            {TRAFFIC_SOURCES.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-dark w-36">{s.label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full">
                  <div className={`h-2 rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                </div>
                <span className="text-sm font-semibold text-dark w-10 text-right">{s.pct}%</span>
              </div>
            ))}
          </div>
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
              onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
              className="text-xs text-yellow-600 hover:underline font-medium"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} className={`bg-white rounded-xl p-4 shadow-sm border flex items-start gap-3 transition-all ${n.read ? "border-light opacity-70" : "border-yellow-200"}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${n.read ? "bg-gray-100" : "bg-yellow-50"}`}>
                <n.icon size={16} className={n.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.read ? "text-gray-400" : "text-dark font-medium"}`}>{n.text}</p>
                <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
              </div>
              {!n.read && (
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
    <div className="flex h-screen bg-cream overflow-hidden">
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
          transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
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
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          <div className="max-w-5xl mx-auto">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  )
}
