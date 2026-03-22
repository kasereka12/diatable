import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Store, Star, Flag, Settings,
  LogOut, Menu, Eye, Ban, CheckCircle, XCircle, Trash2,
  Search, ChevronLeft, ChevronRight, Bell, TrendingUp,
  AlertTriangle, UserPlus, MessageSquare
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ─── Sample data ──────────────────────────────────────────────────────────────

const GLOBAL_KPIS = [
  { label: "Total utilisateurs",  value: "1 247", icon: Users,         color: "bg-blue-50 text-blue-600"   },
  { label: "Vendeurs actifs",     value: "203",   icon: Store,         color: "bg-green-50 text-green-600" },
  { label: "Restaurants listés",  value: "198",   icon: Store,         color: "bg-yellow-50 text-yellow-600" },
  { label: "Avis publiés",        value: "4 821", icon: Star,          color: "bg-purple-50 text-purple-600" },
  { label: "Villes couvertes",    value: "8",     icon: TrendingUp,    color: "bg-pink-50 text-pink-600"   },
  { label: "Cuisines",            value: "30+",   icon: MessageSquare, color: "bg-orange-50 text-orange-600" },
]

const RECENT_ACTIVITY = [
  { event: "Inscription vendeur",    user: "Moussa Diallo",     date: "21 mars 2026 09:14", statut: "nouveau",    color: "bg-blue-100 text-blue-700"   },
  { event: "Nouveau restaurant",     user: "Lina El Amrani",    date: "21 mars 2026 08:52", statut: "en attente", color: "bg-yellow-100 text-yellow-700" },
  { event: "Avis publié",            user: "Fatima Ouyahia",    date: "20 mars 2026 23:30", statut: "publié",     color: "bg-green-100 text-green-700"  },
  { event: "Signalement",            user: "Ahmed Bencherif",   date: "20 mars 2026 18:07", statut: "urgent",     color: "bg-red-100 text-red-700"     },
  { event: "Inscription client",     user: "Nadia Coulibaly",   date: "20 mars 2026 15:44", statut: "nouveau",    color: "bg-blue-100 text-blue-700"   },
  { event: "Restauration profil",    user: "Karim Touré",       date: "20 mars 2026 14:20", statut: "traité",     color: "bg-gray-100 text-gray-600"   },
  { event: "Nouveau restaurant",     user: "Sara Benjelloun",   date: "19 mars 2026 11:10", statut: "vérifié",    color: "bg-green-100 text-green-700"  },
  { event: "Avis signalé",           user: "Youssef El Fassi",  date: "19 mars 2026 09:05", statut: "en attente", color: "bg-yellow-100 text-yellow-700" },
]

const PENDING_RESTAURANTS = [
  {
    id: 1,
    nom: "Le Baobab Doré",
    cuisine: "Afrique de l'Ouest",
    ville: "Casablanca",
    owner: "Moussa Diallo",
    gradient: "from-yellow-400 to-orange-500",
  },
  {
    id: 2,
    nom: "Saveurs du Nil",
    cuisine: "Cuisine égyptienne",
    ville: "Rabat",
    owner: "Hana Ibrahim",
    gradient: "from-blue-400 to-indigo-500",
  },
  {
    id: 3,
    nom: "Chez Mamadou",
    cuisine: "Sénégalaise",
    ville: "Marrakech",
    owner: "Mamadou Balde",
    gradient: "from-green-400 to-teal-500",
  },
]

const USERS_DATA = [
  { id: 1, nom: "Fatima Ouyahia",   email: "f.ouyahia@email.com",   role: "client",  ville: "Casablanca",  inscrit: "12 jan 2026", statut: "actif"    },
  { id: 2, nom: "Moussa Diallo",    email: "m.diallo@email.com",    role: "vendor",  ville: "Casablanca",  inscrit: "5 fév 2026",  statut: "actif"    },
  { id: 3, nom: "Lina El Amrani",   email: "l.amrani@email.com",    role: "vendor",  ville: "Rabat",       inscrit: "18 jan 2026", statut: "actif"    },
  { id: 4, nom: "Ahmed Bencherif",  email: "a.bencherif@email.com", role: "client",  ville: "Fès",         inscrit: "2 mar 2026",  statut: "suspendu" },
  { id: 5, nom: "Nadia Coulibaly",  email: "n.coulibaly@email.com", role: "client",  ville: "Marrakech",   inscrit: "8 mar 2026",  statut: "actif"    },
  { id: 6, nom: "Karim Touré",      email: "k.toure@email.com",     role: "vendor",  ville: "Tanger",      inscrit: "15 fév 2026", statut: "actif"    },
  { id: 7, nom: "Sara Benjelloun",  email: "s.benjelloun@email.com",role: "vendor",  ville: "Agadir",      inscrit: "20 jan 2026", statut: "actif"    },
  { id: 8, nom: "Youssef El Fassi", email: "y.elfassi@email.com",   role: "client",  ville: "Meknès",      inscrit: "1 mar 2026",  statut: "actif"    },
  { id: 9, nom: "Aicha Traoré",     email: "a.traore@email.com",    role: "client",  ville: "Oujda",       inscrit: "10 mar 2026", statut: "actif"    },
  { id: 10, nom: "Admin DiaTable",  email: "admin@datable.ma",      role: "admin",   ville: "Casablanca",  inscrit: "1 jan 2026",  statut: "actif"    },
]

const RESTAURANTS_DATA = [
  { id: 1, nom: "Saveurs du Continent", cuisine: "Afrique de l'Ouest", ville: "Casablanca", owner: "Moussa Diallo",   note: 4.8, statut: "vérifié",   gradient: "from-yellow-400 to-orange-400" },
  { id: 2, nom: "Le Nil Bleu",          cuisine: "Égyptienne",          ville: "Rabat",       owner: "Hana Ibrahim",    note: 4.5, statut: "vérifié",   gradient: "from-blue-400 to-indigo-400"  },
  { id: 3, nom: "Chez Mamadou",         cuisine: "Sénégalaise",         ville: "Marrakech",   owner: "Mamadou Balde",   note: 4.7, statut: "en attente",gradient: "from-green-400 to-teal-400"   },
  { id: 4, nom: "Dakar Palace",         cuisine: "Sénégalaise",         ville: "Casablanca",  owner: "Ibrahima Sow",    note: 4.3, statut: "vérifié",   gradient: "from-pink-400 to-red-400"     },
  { id: 5, nom: "Al Khaima",            cuisine: "Mauritanienne",       ville: "Fès",         owner: "Ahmed Ould",      note: 4.6, statut: "inactif",   gradient: "from-orange-400 to-amber-400" },
  { id: 6, nom: "Baobab Doré",          cuisine: "Afrique de l'Ouest", ville: "Tanger",      owner: "Fatoumata Bah",   note: 4.9, statut: "vérifié",   gradient: "from-purple-400 to-pink-400"  },
  { id: 7, nom: "Nairobi Kitchen",      cuisine: "Kényane",             ville: "Agadir",      owner: "James Mwangi",    note: 4.2, statut: "en attente",gradient: "from-teal-400 to-cyan-400"    },
  { id: 8, nom: "Addis Grill",          cuisine: "Éthiopienne",         ville: "Rabat",       owner: "Tigist Haile",    note: 4.4, statut: "vérifié",   gradient: "from-red-400 to-rose-400"     },
]

const AVIS_DATA = [
  { id: 1, auteur: "Fatima M.",  initials: "FM", restaurant: "Saveurs du Continent", note: 5, date: "15 mar 2026", statut: "approuvé",   comment: "Extraordinaire ! Le thiéboudiène était exactement comme à Dakar." },
  { id: 2, auteur: "Ahmed K.",   initials: "AK", restaurant: "Le Nil Bleu",          note: 2, date: "12 mar 2026", statut: "signalé",    comment: "Service très lent, j'ai attendu plus d'une heure." },
  { id: 3, auteur: "Nadia C.",   initials: "NC", restaurant: "Chez Mamadou",         note: 4, date: "10 mar 2026", statut: "en attente", comment: "Bonne cuisine, cadre agréable. Je recommande les brochettes." },
  { id: 4, auteur: "Youssef F.", initials: "YF", restaurant: "Dakar Palace",         note: 1, date: "8 mar 2026",  statut: "signalé",    comment: "Commande jamais arrivée, impossible de les joindre. Arnaque !" },
  { id: 5, auteur: "Sara B.",    initials: "SB", restaurant: "Baobab Doré",          note: 5, date: "5 mar 2026",  statut: "approuvé",   comment: "Le meilleur restaurant diaspora de Tanger. Qualité exceptionnelle !" },
]

const SIGNALEMENTS_DATA = [
  { id: 1, type: "Avis",        contenu: "Commentaire offensant",     signale_par: "Moussa D.",  date: "20 mar 2026", priorite: "Haute"   },
  { id: 2, type: "Restaurant",  contenu: "Informations incorrectes",  signale_par: "Fatima O.",  date: "19 mar 2026", priorite: "Moyenne" },
  { id: 3, type: "Utilisateur", contenu: "Comportement abusif",       signale_par: "Ahmed B.",   date: "18 mar 2026", priorite: "Haute"   },
  { id: 4, type: "Avis",        contenu: "Avis frauduleux (spam)",    signale_par: "Nadia C.",   date: "17 mar 2026", priorite: "Basse"   },
  { id: 5, type: "Restaurant",  contenu: "Photos inappropriées",      signale_par: "Sara B.",    date: "15 mar 2026", priorite: "Moyenne" },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const styles = {
    admin:  "bg-red-100 text-red-700",
    vendor: "bg-yellow-100 text-yellow-700",
    client: "bg-blue-100 text-blue-700",
  }
  const labels = { admin: "Admin", vendor: "Vendeur", client: "Client" }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[role] || "bg-gray-100 text-gray-600"}`}>
      {labels[role] || role}
    </span>
  )
}

function StatutBadge({ statut }) {
  const styles = {
    actif:       "bg-green-100 text-green-700",
    suspendu:    "bg-red-100 text-red-700",
    "vérifié":   "bg-green-100 text-green-700",
    "en attente":"bg-yellow-100 text-yellow-700",
    inactif:     "bg-gray-100 text-gray-500",
    nouveau:     "bg-blue-100 text-blue-700",
    publié:      "bg-green-100 text-green-700",
    traité:      "bg-gray-100 text-gray-600",
    urgent:      "bg-red-100 text-red-700",
    approuvé:    "bg-green-100 text-green-700",
    signalé:     "bg-red-100 text-red-700",
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${styles[statut] || "bg-gray-100 text-gray-600"}`}>
      {statut}
    </span>
  )
}

function PrioriteBadge({ priorite }) {
  const styles = {
    Haute:   "bg-red-100 text-red-700",
    Moyenne: "bg-yellow-100 text-yellow-700",
    Basse:   "bg-gray-100 text-gray-600",
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[priorite] || "bg-gray-100 text-gray-600"}`}>
      {priorite}
    </span>
  )
}

function Stars({ count }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={12} className={i <= count ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
      ))}
    </span>
  )
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-red-500 text-white font-semibold"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon size={18} />
      <span className="flex-1 text-left">{label}</span>
    </button>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const adminName = profile?.full_name || user?.user_metadata?.full_name || "Admin"

  const [activeSection, setActiveSection]   = useState('vue-globale')
  const [sidebarOpen, setSidebarOpen]       = useState(false)
  const [userFilter, setUserFilter]         = useState('Tous')
  const [userSearch, setUserSearch]         = useState('')
  const [restFilter, setRestFilter]         = useState('Tous')
  const [restSearch, setRestSearch]         = useState('')
  const [avisFilter, setAvisFilter]         = useState('Tous')
  const [pendingRests, setPendingRests]     = useState(PENDING_RESTAURANTS)
  const [signalements, setSignalements]     = useState(SIGNALEMENTS_DATA)
  const [settings, setSettings]            = useState({
    inscriptionsOuvertes: true,
    confirmationEmail: false,
    modeMaintenance: false,
    commission: "5",
    emailSupport: "support@datable.ma",
  })

  function handleSignOut() {
    signOut()
    navigate('/')
  }

  function approuverRest(id) {
    setPendingRests(prev => prev.filter(r => r.id !== id))
  }

  function refuserRest(id) {
    setPendingRests(prev => prev.filter(r => r.id !== id))
  }

  function resolveSignalement(id) {
    setSignalements(prev => prev.filter(s => s.id !== id))
  }

  function nav(section) {
    setActiveSection(section)
    setSidebarOpen(false)
  }

  // ── Sidebar ────────────────────────────────────────────────────────────────

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold text-white">DiaTable</span>
          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-semibold">Admin</span>
        </div>
        <p className="text-white/40 text-xs mt-0.5">Panneau d'administration</p>
      </div>

      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{adminName}</p>
            <span className="text-xs bg-red-500/30 text-red-300 px-2 py-0.5 rounded-full">Administrateur</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem icon={LayoutDashboard} label="Vue globale"       active={activeSection === 'vue-globale'}   onClick={() => nav('vue-globale')}   />
        <NavItem icon={Users}          label="Utilisateurs"       active={activeSection === 'utilisateurs'}  onClick={() => nav('utilisateurs')}  />
        <NavItem icon={Store}          label="Restaurants"        active={activeSection === 'restaurants'}   onClick={() => nav('restaurants')}   />
        <NavItem icon={Star}           label="Avis & Modération"  active={activeSection === 'avis'}          onClick={() => nav('avis')}          />
        <NavItem icon={Flag}           label="Signalements"       active={activeSection === 'signalements'}  onClick={() => nav('signalements')}  />
        <NavItem icon={Settings}       label="Paramètres"         active={activeSection === 'parametres'}    onClick={() => nav('parametres')}    />
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
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

  // ── Sections ───────────────────────────────────────────────────────────────

  function renderVueGlobale() {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-dark">Vue globale</h1>
          <p className="text-gray-500 text-sm mt-1">Aperçu de la plateforme DiaTable</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {GLOBAL_KPIS.map((kpi, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-light">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${kpi.color}`}>
                <kpi.icon size={20} />
              </div>
              <p className="text-2xl font-serif font-bold text-dark">{kpi.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Recent activity table */}
        <div className="bg-white rounded-xl shadow-sm border border-light overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-dark">Activité récente</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Événement</th>
                  <th className="px-4 py-3 text-left">Utilisateur</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {RECENT_ACTIVITY.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-dark font-medium">{row.event}</td>
                    <td className="px-4 py-3 text-gray-600">{row.user}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-3"><StatutBadge statut={row.statut} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending restaurants */}
        <div className="bg-white rounded-xl shadow-sm border border-light overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-dark">Restaurants en attente d'approbation</h2>
          </div>
          {pendingRests.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">Aucun restaurant en attente.</div>
          ) : (
            <div className="p-5 grid gap-4 md:grid-cols-3">
              {pendingRests.map(r => (
                <div key={r.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className={`h-16 bg-gradient-to-br ${r.gradient}`} />
                  <div className="p-4">
                    <p className="font-semibold text-dark text-sm">{r.nom}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.cuisine} — {r.ville}</p>
                    <p className="text-xs text-gray-500 mt-1">Propriétaire : {r.owner}</p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => approuverRest(r.id)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <CheckCircle size={13} /> Approuver
                      </button>
                      <button
                        onClick={() => refuserRest(r.id)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <XCircle size={13} /> Refuser
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderUtilisateurs() {
    const roleFilters = ['Tous', 'Clients', 'Vendeurs', 'Admins']
    const roleMap = { Clients: 'client', Vendeurs: 'vendor', Admins: 'admin' }

    const filtered = USERS_DATA.filter(u => {
      const matchRole   = userFilter === 'Tous' || u.role === roleMap[userFilter]
      const matchSearch = !userSearch || u.nom.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
      return matchRole && matchSearch
    })

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-serif font-bold text-dark">Utilisateurs</h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40"
            />
          </div>
          <select
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40 bg-white"
          >
            {roleFilters.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-light overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Nom</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Rôle</th>
                  <th className="px-4 py-3 text-left">Ville</th>
                  <th className="px-4 py-3 text-left">Inscrit le</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-dark flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.nom.charAt(0)}
                        </div>
                        <span className="font-medium text-dark whitespace-nowrap">{u.nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{u.email}</td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3 text-gray-500">{u.ville}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{u.inscrit}</td>
                    <td className="px-4 py-3"><StatutBadge statut={u.statut} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="text-gray-400 hover:text-dark transition-colors" title="Voir profil"><Eye size={15} /></button>
                        <button className="text-gray-400 hover:text-red-500 transition-colors" title="Suspendre"><Ban size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">{filtered.length} utilisateurs</p>
            <div className="flex items-center gap-1">
              <button className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100"><ChevronLeft size={14} /></button>
              {[1, 2, 3].map(p => (
                <button key={p} className={`w-7 h-7 rounded text-xs font-medium ${p === 1 ? "bg-dark text-white" : "text-gray-500 hover:bg-gray-100"}`}>{p}</button>
              ))}
              <span className="text-gray-400 text-xs px-1">...</span>
              <button className="w-7 h-7 rounded text-xs font-medium text-gray-500 hover:bg-gray-100">47</button>
              <button className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function renderRestaurants() {
    const statusFilters = ['Tous', 'Vérifiés', 'En attente', 'Inactifs']
    const statusMap = { Vérifiés: 'vérifié', 'En attente': 'en attente', Inactifs: 'inactif' }

    const filtered = RESTAURANTS_DATA.filter(r => {
      const matchStatus = restFilter === 'Tous' || r.statut === statusMap[restFilter]
      const matchSearch = !restSearch || r.nom.toLowerCase().includes(restSearch.toLowerCase()) || r.ville.toLowerCase().includes(restSearch.toLowerCase())
      return matchStatus && matchSearch
    })

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-serif font-bold text-dark">Restaurants</h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={restSearch}
              onChange={e => setRestSearch(e.target.value)}
              placeholder="Rechercher un restaurant..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40"
            />
          </div>
          <select
            value={restFilter}
            onChange={e => setRestFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40 bg-white"
          >
            {statusFilters.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-light overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Restaurant</th>
                  <th className="px-4 py-3 text-left">Cuisine</th>
                  <th className="px-4 py-3 text-left">Ville</th>
                  <th className="px-4 py-3 text-left">Propriétaire</th>
                  <th className="px-4 py-3 text-left">Note</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${r.gradient} flex-shrink-0`} />
                        <span className="font-medium text-dark whitespace-nowrap">{r.nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.cuisine}</td>
                    <td className="px-4 py-3 text-gray-500">{r.ville}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.owner}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs font-medium">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        {r.note}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatutBadge statut={r.statut} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="text-gray-400 hover:text-dark transition-colors" title="Voir"><Eye size={14} /></button>
                        <button className="text-gray-400 hover:text-green-600 transition-colors" title="Approuver"><CheckCircle size={14} /></button>
                        <button className="text-gray-400 hover:text-orange-500 transition-colors" title="Rejeter"><XCircle size={14} /></button>
                        <button className="text-gray-400 hover:text-red-500 transition-colors" title="Supprimer"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  function renderAvis() {
    const filters = ['Tous', 'Signalés', 'En attente']
    const filterMap = { Signalés: 'signalé', 'En attente': 'en attente' }

    const filtered = AVIS_DATA.filter(a =>
      avisFilter === 'Tous' || a.statut === filterMap[avisFilter]
    )

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-serif font-bold text-dark">Avis & Modération</h1>

        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setAvisFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                avisFilter === f
                  ? "bg-dark text-white"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-dark"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map(a => (
            <div key={a.id} className="bg-white rounded-xl p-5 shadow-sm border border-light">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-dark flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {a.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-sm font-semibold text-dark">{a.auteur}</p>
                      <p className="text-xs text-gray-400">sur {a.restaurant}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatutBadge statut={a.statut} />
                      <span className="text-xs text-gray-400">{a.date}</span>
                    </div>
                  </div>
                  <Stars count={a.note} />
                  <p className="text-sm text-dark/80 mt-2 leading-relaxed">{a.comment}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <button className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700 transition-colors">
                      <CheckCircle size={13} /> Approuver
                    </button>
                    <button className="flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors">
                      <XCircle size={13} /> Masquer
                    </button>
                    <button className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 transition-colors">
                      <Flag size={13} /> Signaler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderSignalements() {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-serif font-bold text-dark">Signalements</h1>

        <div className="bg-white rounded-xl shadow-sm border border-light overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Contenu</th>
                  <th className="px-4 py-3 text-left">Signalé par</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Priorité</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {signalements.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s.type}</span>
                    </td>
                    <td className="px-4 py-3 text-dark">{s.contenu}</td>
                    <td className="px-4 py-3 text-gray-500">{s.signale_par}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{s.date}</td>
                    <td className="px-4 py-3"><PrioriteBadge priorite={s.priorite} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => resolveSignalement(s.id)}
                          className="text-xs font-medium text-green-600 hover:text-green-700 flex items-center gap-1 transition-colors"
                        >
                          <CheckCircle size={13} /> Résoudre
                        </button>
                        <button
                          onClick={() => resolveSignalement(s.id)}
                          className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          Ignorer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {signalements.length === 0 && (
              <div className="py-8 text-center text-gray-400 text-sm">Aucun signalement en cours.</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  function Toggle({ value, onChange, label }) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
        <span className="text-sm text-dark">{label}</span>
        <button
          onClick={() => onChange(!value)}
          className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-green-500" : "bg-gray-200"}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>
    )
  }

  function renderParametres() {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-serif font-bold text-dark">Paramètres de la plateforme</h1>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-light space-y-2">
          <h2 className="text-base font-semibold text-dark mb-4">Configuration générale</h2>

          <Toggle
            label="Inscriptions ouvertes"
            value={settings.inscriptionsOuvertes}
            onChange={v => setSettings(p => ({ ...p, inscriptionsOuvertes: v }))}
          />
          <Toggle
            label="Confirmation email requise"
            value={settings.confirmationEmail}
            onChange={v => setSettings(p => ({ ...p, confirmationEmail: v }))}
          />
          <Toggle
            label="Mode maintenance"
            value={settings.modeMaintenance}
            onChange={v => setSettings(p => ({ ...p, modeMaintenance: v }))}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Commission plateforme (%)</label>
              <input
                type="number"
                value={settings.commission}
                onChange={e => setSettings(p => ({ ...p, commission: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email support</label>
              <input
                type="email"
                value={settings.emailSupport}
                onChange={e => setSettings(p => ({ ...p, emailSupport: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40"
              />
            </div>
          </div>

          <div className="pt-4">
            <button className="bg-dark text-white font-semibold px-5 py-2 rounded-lg text-sm hover:bg-dark/90 transition-colors">
              Enregistrer les paramètres
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-red-100">
          <h2 className="text-base font-semibold text-red-600 mb-2">Zone de danger</h2>
          <p className="text-sm text-gray-500 mb-4">Cette action supprime le cache Redis et peut affecter temporairement les performances.</p>
          <button className="border border-red-400 text-red-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center gap-2">
            <AlertTriangle size={15} /> Vider le cache
          </button>
        </div>
      </div>
    )
  }

  function renderSection() {
    switch (activeSection) {
      case 'vue-globale':   return renderVueGlobale()
      case 'utilisateurs':  return renderUtilisateurs()
      case 'restaurants':   return renderRestaurants()
      case 'avis':          return renderAvis()
      case 'signalements':  return renderSignalements()
      case 'parametres':    return renderParametres()
      default:              return renderVueGlobale()
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
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-dark">DiaTable</span>
            <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded font-semibold">Admin</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
            {adminName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  )
}
