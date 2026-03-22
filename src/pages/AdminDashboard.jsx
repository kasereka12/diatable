import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardTopbar from '../components/DashboardTopbar'
import {
  LayoutDashboard, Users, Store, ImageIcon, Users2, LogOut,
  Plus, Pencil, Trash2, CheckCircle, XCircle, Search,
  Globe, ShieldCheck, AlertCircle, RefreshCw, Menu, X, ChevronLeft,
  Phone, MessageCircle, Instagram, Clock, MapPin, Utensils, Eye, ChevronRight
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 rounded-full border-4 border-[#f4a828]/30 border-t-[#f4a828] animate-spin" />
    </div>
  )
}

function ErrorMsg({ msg }) {
  return (
    <div className="flex items-center gap-2 bg-red-900/30 border border-red-500/40 text-red-300 rounded-lg px-4 py-3 text-sm">
      <AlertCircle className="w-4 h-4 shrink-0" />
      {msg}
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-[#8892a4] gap-2">
      <AlertCircle className="w-8 h-8 opacity-40" />
      <p className="text-sm">{text}</p>
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Section 1: Vue globale ────────────────────────────────────────────────────

function SectionOverview() {
  const [stats, setStats] = useState(null)
  const [latestUsers, setLatestUsers] = useState([])
  const [latestRestaurants, setLatestRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [
          { count: profilesCount, error: e1 },
          { count: restaurantsCount, error: e2 },
          { count: dishesCount, error: e3 },
          { count: teamCount, error: e4 },
          { count: reviewsCount, error: e5 },
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('restaurants').select('*', { count: 'exact', head: true }),
          supabase.from('dishes').select('*', { count: 'exact', head: true }),
          supabase.from('team').select('*', { count: 'exact', head: true }),
          supabase.from('reviews').select('*', { count: 'exact', head: true }),
        ])
        const err = e1 || e2 || e3 || e4 || e5
        if (err) throw err
        setStats({ profilesCount, restaurantsCount, dishesCount, teamCount, reviewsCount })

        const [{ data: users, error: ue }, { data: restaurants, error: re }] = await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5),
          supabase.from('restaurants').select('*').order('created_at', { ascending: false }).limit(5),
        ])
        if (ue) throw ue
        if (re) throw re
        setLatestUsers(users || [])
        setLatestRestaurants(restaurants || [])
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const kpis = stats ? [
    { label: 'Utilisateurs', value: stats.profilesCount ?? 0, icon: Users, color: 'text-blue-400' },
    { label: 'Restaurants', value: stats.restaurantsCount ?? 0, icon: Store, color: 'text-[#f4a828]' },
    { label: 'Plats (galerie)', value: stats.dishesCount ?? 0, icon: ImageIcon, color: 'text-green-400' },
    { label: "Membres équipe", value: stats.teamCount ?? 0, icon: Users2, color: 'text-purple-400' },
    { label: 'Avis', value: stats.reviewsCount ?? 0, icon: ShieldCheck, color: 'text-pink-400' },
  ] : []

  const roleBadge = (role) => {
    const map = { admin: 'bg-red-900/50 text-red-300', vendor: 'bg-[#f4a828]/20 text-[#f4a828]', client: 'bg-blue-900/40 text-blue-300' }
    return map[role] || 'bg-white/10 text-[#8892a4]'
  }

  return (
    <div>
      <h2 className="text-2xl font-serif text-[#f9f5f0] mb-6">Vue globale</h2>
      {loading && <Spinner />}
      {error && <ErrorMsg msg={error} />}
      {!loading && !error && stats && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {kpis.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-[#16213e] rounded-xl p-5 flex flex-col gap-2 border border-white/5">
                <Icon className={`w-6 h-6 ${color}`} />
                <span className="text-3xl font-bold text-[#f9f5f0]">{value.toLocaleString('fr-FR')}</span>
                <span className="text-xs text-[#8892a4]">{label}</span>
              </div>
            ))}
          </div>

          {/* Two panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latest users */}
            <div className="bg-[#16213e] rounded-xl border border-white/5 p-5">
              <h3 className="font-semibold text-[#f9f5f0] mb-4">Derniers utilisateurs inscrits</h3>
              {latestUsers.length === 0 ? (
                <EmptyState text="Aucun utilisateur" />
              ) : (
                <ul className="divide-y divide-white/5">
                  {latestUsers.map((u) => (
                    <li key={u.id} className="flex items-center justify-between py-3 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#f4a828]/20 flex items-center justify-center text-[#f4a828] font-bold text-sm shrink-0">
                          {(u.full_name || u.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-[#f9f5f0] truncate">{u.full_name || u.email || '—'}</p>
                          <p className="text-xs text-[#8892a4]">{formatDate(u.created_at)}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${roleBadge(u.role)}`}>{u.role || '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Latest restaurants */}
            <div className="bg-[#16213e] rounded-xl border border-white/5 p-5">
              <h3 className="font-semibold text-[#f9f5f0] mb-4">Derniers restaurants ajoutés</h3>
              {latestRestaurants.length === 0 ? (
                <EmptyState text="Aucun restaurant" />
              ) : (
                <ul className="divide-y divide-white/5">
                  {latestRestaurants.map((r) => (
                    <li key={r.id} className="flex items-center justify-between py-3 gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-[#f9f5f0] truncate">{r.name || '—'}</p>
                        <p className="text-xs text-[#8892a4]">{r.cuisine || '—'}</p>
                      </div>
                      {r.is_verified ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/40 text-green-300 shrink-0">Vérifié</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-[#8892a4] shrink-0">Non vérifié</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Section 2: Utilisateurs ───────────────────────────────────────────────────

function SectionUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('tous')
  const [updatingId, setUpdatingId] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (err) throw err
      setUsers(data || [])
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const updateRole = async (userId, role) => {
    setUpdatingId(userId)
    try {
      const { error: err } = await supabase.from('profiles').update({ role }).eq('id', userId)
      if (err) throw err
      await fetchUsers()
    } catch (err) {
      alert(err.message || 'Erreur')
    } finally {
      setUpdatingId(null)
    }
  }

  const roleBadgeClass = (role) => {
    const map = { admin: 'bg-red-900/50 text-red-300', vendor: 'bg-[#f4a828]/20 text-[#f4a828]', client: 'bg-blue-900/40 text-blue-300' }
    return map[role] || 'bg-white/10 text-[#8892a4]'
  }

  const roleFilters = [
    { key: 'tous', label: 'Tous' },
    { key: 'client', label: 'Clients' },
    { key: 'vendor', label: 'Vendeurs' },
    { key: 'admin', label: 'Admins' },
  ]

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === 'tous' || u.role === roleFilter
    const q = search.toLowerCase()
    const matchSearch = !q || (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
    return matchRole && matchSearch
  })

  return (
    <div>
      <h2 className="text-2xl font-serif text-[#f9f5f0] mb-6">Utilisateurs</h2>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8892a4]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="w-full bg-[#16213e] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-[#f9f5f0] placeholder-[#8892a4] focus:outline-none focus:border-[#f4a828]/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {roleFilters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRoleFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${roleFilter === key ? 'bg-[#f4a828] text-[#1a1a2e] font-semibold' : 'bg-[#16213e] text-[#8892a4] border border-white/10 hover:border-[#f4a828]/40'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button onClick={fetchUsers} className="p-2 rounded-lg bg-[#16213e] border border-white/10 text-[#8892a4] hover:text-[#f4a828] transition-colors" title="Actualiser">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && <ErrorMsg msg={error} />}
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState text="Aucun utilisateur trouvé" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#16213e] text-[#8892a4] text-left">
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Rôle</th>
                <th className="px-4 py-3 font-medium">Inscrit le</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((u) => (
                <tr key={u.id} className="bg-[#16213e]/60 hover:bg-[#16213e] transition-colors">
                  <td className="px-4 py-3 text-[#f9f5f0]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#f4a828]/20 flex items-center justify-center text-[#f4a828] font-bold text-xs shrink-0">
                        {(u.full_name || u.email || '?')[0].toUpperCase()}
                      </div>
                      {u.full_name || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#8892a4]">{u.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadgeClass(u.role)}`}>{u.role || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-[#8892a4]">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => updateRole(u.id, 'admin')}
                          disabled={updatingId === u.id}
                          className="px-2 py-1 rounded text-xs bg-red-900/40 text-red-300 hover:bg-red-900/60 disabled:opacity-50 transition-colors"
                        >
                          Admin
                        </button>
                      )}
                      {u.role !== 'vendor' && (
                        <button
                          onClick={() => updateRole(u.id, 'vendor')}
                          disabled={updatingId === u.id}
                          className="px-2 py-1 rounded text-xs bg-[#f4a828]/20 text-[#f4a828] hover:bg-[#f4a828]/30 disabled:opacity-50 transition-colors"
                        >
                          Vendeur
                        </button>
                      )}
                      {u.role !== 'client' && (
                        <button
                          onClick={() => updateRole(u.id, 'client')}
                          disabled={updatingId === u.id}
                          className="px-2 py-1 rounded text-xs bg-blue-900/40 text-blue-300 hover:bg-blue-900/60 disabled:opacity-50 transition-colors"
                        >
                          Client
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Profile completion scorer ─────────────────────────────────────────────────

const PROFILE_FIELDS = [
  { key: 'name',          label: 'Nom',           weight: 15 },
  { key: 'description',   label: 'Description',   weight: 15 },
  { key: 'cuisine_label', label: 'Cuisine',        weight: 10 },
  { key: 'location',      label: 'Ville',          weight: 10 },
  { key: 'address',       label: 'Adresse',        weight: 10 },
  { key: 'hours',         label: 'Horaires',       weight: 10 },
  { key: 'phone',         label: 'Téléphone',      weight: 10 },
  { key: 'whatsapp',      label: 'WhatsApp',       weight: 5  },
  { key: 'instagram',     label: 'Instagram',      weight: 5  },
]
const MENU_WEIGHT = 10  // up to 10 points for menu items

function profileScore(r, menuCount = 0) {
  let score = 0
  for (const f of PROFILE_FIELDS) {
    if (r[f.key] && String(r[f.key]).trim() !== '') score += f.weight
  }
  // menu: 0 items = 0, 1-2 = 5, 3+ = full 10
  score += menuCount === 0 ? 0 : menuCount < 3 ? 5 : MENU_WEIGHT
  return Math.min(score, 100)
}

// ─── Restaurant detail panel ───────────────────────────────────────────────────

function RestaurantDetailPanel({ r, onClose, onUpdate }) {
  const [menuItems, setMenuItems] = useState([])
  const [loadingMenu, setLoadingMenu] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    async function fetchMenu() {
      setLoadingMenu(true)
      const { data } = await supabase.from('menu_items').select('*').eq('restaurant_id', r.id).order('category')
      setMenuItems(data || [])
      setLoadingMenu(false)
    }
    fetchMenu()
  }, [r.id])

  const menuByCategory = menuItems.reduce((acc, item) => {
    const cat = item.category || 'Autres'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  const score = profileScore(r, menuItems.length)
  const scoreColor = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
  const scoreText  = score >= 80 ? 'text-green-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'

  async function toggle(field) {
    setUpdating(true)
    await supabase.from('restaurants').update({ [field]: !r[field] }).eq('id', r.id)
    setUpdating(false)
    onUpdate()
  }

  async function handleVerify() {
    setUpdating(true)
    await supabase.from('restaurants').update({ is_verified: true, is_active: true }).eq('id', r.id)
    setUpdating(false)
    onUpdate()
  }

  async function handleReject() {
    if (!window.confirm('Rejeter et désactiver ce restaurant ?')) return
    setUpdating(true)
    await supabase.from('restaurants').update({ is_verified: false, is_active: false }).eq('id', r.id)
    setUpdating(false)
    onUpdate()
  }

  const INFO_ROWS = [
    { Icon: Store,          label: 'Cuisine',    value: `${r.flag || ''} ${r.cuisine_label || '—'}` },
    { Icon: MapPin,         label: 'Ville',      value: r.location || '—' },
    { Icon: MapPin,         label: 'Adresse',    value: r.address || <span className="text-red-400 text-xs">Non renseigné</span> },
    { Icon: Clock,          label: 'Horaires',   value: r.hours || <span className="text-red-400 text-xs">Non renseigné</span> },
    { Icon: Phone,          label: 'Téléphone',  value: r.phone || <span className="text-red-400 text-xs">Non renseigné</span> },
    { Icon: MessageCircle,  label: 'WhatsApp',   value: r.whatsapp || <span className="text-red-400 text-xs">Non renseigné</span> },
    { Icon: Instagram,      label: 'Instagram',  value: r.instagram ? `@${r.instagram.replace('@','')}` : <span className="text-red-400 text-xs">Non renseigné</span> },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-xl h-full bg-[#1a1a2e] border-l border-white/10 overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a2e] border-b border-white/10 px-6 py-4 flex items-start justify-between z-10">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#f9f5f0] leading-tight">{r.name}</h3>
            <p className="text-[#8892a4] text-xs mt-0.5">{r.profiles?.full_name || r.profiles?.email || 'Vendeur inconnu'}</p>
          </div>
          <button onClick={onClose} className="text-[#8892a4] hover:text-white transition-colors mt-0.5">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">

          {/* Completion score */}
          <div className="bg-[#16213e] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[#f9f5f0]">Complétion du profil</span>
              <span className={`text-2xl font-bold ${scoreText}`}>{score}%</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${scoreColor}`} style={{ width: `${score}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {PROFILE_FIELDS.map(f => {
                const filled = r[f.key] && String(r[f.key]).trim() !== ''
                return (
                  <div key={f.key} className={`flex items-center gap-1.5 text-xs rounded-lg px-2 py-1 ${filled ? 'bg-green-900/30 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                    {filled ? <CheckCircle size={10} /> : <XCircle size={10} />}
                    {f.label}
                  </div>
                )
              })}
              <div className={`flex items-center gap-1.5 text-xs rounded-lg px-2 py-1 ${menuItems.length >= 3 ? 'bg-green-900/30 text-green-400' : menuItems.length > 0 ? 'bg-amber-900/30 text-amber-400' : 'bg-red-900/20 text-red-400'}`}>
                {menuItems.length >= 3 ? <CheckCircle size={10} /> : <XCircle size={10} />}
                Carte ({menuItems.length})
              </div>
            </div>
          </div>

          {/* Description */}
          {r.description && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#8892a4] mb-2">Description</p>
              <p className="text-sm text-[#f9f5f0] leading-relaxed bg-[#16213e] rounded-xl px-4 py-3">{r.description}</p>
            </div>
          )}

          {/* Info rows */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#8892a4] mb-3">Informations</p>
            <div className="bg-[#16213e] rounded-xl divide-y divide-white/5">
              {INFO_ROWS.map(({ Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 px-4 py-3">
                  <Icon size={14} className="text-[#8892a4] flex-shrink-0" />
                  <span className="text-[#8892a4] text-xs w-24 flex-shrink-0">{label}</span>
                  <span className="text-sm text-[#f9f5f0] flex-1">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Menu */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-[#8892a4]">Carte & Menu</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${menuItems.length === 0 ? 'bg-red-900/40 text-red-400' : 'bg-green-900/40 text-green-400'}`}>
                {menuItems.length} plat{menuItems.length !== 1 ? 's' : ''}
              </span>
            </div>
            {loadingMenu ? (
              <div className="text-center py-4 text-[#8892a4] text-sm">Chargement…</div>
            ) : menuItems.length === 0 ? (
              <div className="bg-red-900/20 border border-red-500/20 rounded-xl px-4 py-4 text-center">
                <Utensils size={24} className="text-red-400 mx-auto mb-2 opacity-60" />
                <p className="text-red-400 text-sm font-medium">Aucun plat — carte vide</p>
                <p className="text-red-400/60 text-xs mt-1">Le vendeur n'a pas encore ajouté de plats.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(menuByCategory).map(([cat, items]) => (
                  <div key={cat} className="bg-[#16213e] rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-white/5">
                      <p className="text-xs font-bold uppercase tracking-widest text-[#f4a828]">{cat}</p>
                    </div>
                    {items.map(item => (
                      <div key={item.id} className="flex items-center justify-between px-4 py-2.5 border-t border-white/5">
                        <div>
                          <span className="text-sm text-[#f9f5f0] font-medium">{item.name}</span>
                          {item.description && <p className="text-xs text-[#8892a4] mt-0.5 line-clamp-1">{item.description}</p>}
                        </div>
                        <span className="text-[#f4a828] text-sm font-semibold ml-4 flex-shrink-0">
                          {Number(item.price).toFixed(2)} MAD
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action footer */}
        <div className="sticky bottom-0 bg-[#1a1a2e] border-t border-white/10 px-6 py-4 space-y-2">
          {!r.is_verified && (
            <button
              onClick={handleVerify}
              disabled={updating}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm"
            >
              <CheckCircle size={16} /> Valider et publier le restaurant
            </button>
          )}
          {r.is_verified && (
            <button
              onClick={() => toggle('is_verified')}
              disabled={updating}
              className="w-full flex items-center justify-center gap-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-400 font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm border border-amber-500/30"
            >
              <XCircle size={16} /> Retirer la vérification
            </button>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => toggle('is_active')}
              disabled={updating}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 border ${r.is_active ? 'border-red-500/30 text-red-400 hover:bg-red-900/20' : 'border-green-500/30 text-green-400 hover:bg-green-900/20'}`}
            >
              {r.is_active ? 'Désactiver' : 'Activer'}
            </button>
            <button
              onClick={handleReject}
              disabled={updating}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-60"
            >
              <Trash2 size={14} /> Rejeter & supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Section 3: Restaurants ────────────────────────────────────────────────────

function SectionRestaurants() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('tous')
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)

  const fetchRestaurants = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('restaurants')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false })
      if (err) throw err
      setRestaurants(data || [])
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRestaurants() }, [fetchRestaurants])

  const statusFilters = [
    { key: 'tous',       label: 'Tous' },
    { key: 'pending',    label: 'En attente' },
    { key: 'verified',   label: 'Vérifiés' },
    { key: 'inactive',   label: 'Inactifs' },
  ]

  const filtered = restaurants.filter((r) => {
    let matchStatus = true
    if (statusFilter === 'pending')   matchStatus = !r.is_verified
    else if (statusFilter === 'verified')  matchStatus = r.is_verified === true
    else if (statusFilter === 'inactive')  matchStatus = r.is_active === false
    const q = search.toLowerCase()
    const matchSearch = !q || (r.name || '').toLowerCase().includes(q) || (r.location || '').toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  function handleUpdate() {
    fetchRestaurants()
    // refresh selected if open
    if (selectedRestaurant) {
      setSelectedRestaurant(prev => {
        const updated = restaurants.find(r => r.id === prev?.id)
        return updated || prev
      })
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-serif text-[#f9f5f0] mb-6">Restaurants</h2>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8892a4]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un restaurant..."
            className="w-full bg-[#16213e] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-[#f9f5f0] placeholder-[#8892a4] focus:outline-none focus:border-[#f4a828]/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${statusFilter === key ? 'bg-[#f4a828] text-[#1a1a2e] font-semibold' : 'bg-[#16213e] text-[#8892a4] border border-white/10 hover:border-[#f4a828]/40'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button onClick={fetchRestaurants} className="p-2 rounded-lg bg-[#16213e] border border-white/10 text-[#8892a4] hover:text-[#f4a828] transition-colors" title="Actualiser">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && <ErrorMsg msg={error} />}
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState text="Aucun restaurant trouvé" />
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div
              key={r.id}
              onClick={() => setSelectedRestaurant(r)}
              className="bg-[#16213e]/60 hover:bg-[#16213e] border border-white/5 hover:border-[#f4a828]/30 rounded-xl px-4 py-3.5 cursor-pointer transition-all flex items-center gap-4"
            >
              {/* Flag + name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-lg leading-none">{r.flag}</span>
                  <span className="text-[#f9f5f0] font-semibold text-sm truncate">{r.name}</span>
                </div>
                <p className="text-[#8892a4] text-xs truncate">
                  {r.cuisine_label} · {r.location || '—'} · {r.profiles?.full_name || r.profiles?.email || '—'}
                </p>
              </div>

              {/* Completion badge */}
              <div className="flex-shrink-0 text-center w-14">
                <CompletionRing restaurantId={r.id} restaurant={r} />
              </div>

              {/* Status */}
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                {r.is_verified
                  ? <span className="text-xs font-semibold text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">Vérifié</span>
                  : <span className="text-xs font-semibold text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded-full">En attente</span>
                }
                {!r.is_active && <span className="text-xs text-red-400 bg-red-900/20 px-2 py-0.5 rounded-full">Inactif</span>}
              </div>

              <ChevronRight size={16} className="text-[#8892a4] flex-shrink-0" />
            </div>
          ))}
        </div>
      )}

      {selectedRestaurant && (
        <RestaurantDetailPanel
          r={selectedRestaurant}
          onClose={() => setSelectedRestaurant(null)}
          onUpdate={async () => { await fetchRestaurants(); setSelectedRestaurant(null) }}
        />
      )}
    </div>
  )
}

// Mini ring showing completion % — fetches menu count lazily
function CompletionRing({ restaurant: r }) {
  const [menuCount, setMenuCount] = useState(null)
  useEffect(() => {
    supabase.from('menu_items').select('*', { count: 'exact', head: true }).eq('restaurant_id', r.id)
      .then(({ count }) => setMenuCount(count || 0))
  }, [r.id])

  const score = menuCount !== null ? profileScore(r, menuCount) : null
  const color = score === null ? '#8892a4' : score >= 80 ? '#4ade80' : score >= 50 ? '#f59e0b' : '#f87171'

  return (
    <div className="relative w-10 h-10 mx-auto">
      <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
        <circle cx="18" cy="18" r="14" fill="none" stroke="#ffffff10" strokeWidth="3" />
        {score !== null && (
          <circle cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${(score / 100) * 87.96} 87.96`}
            strokeLinecap="round" />
        )}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color }}>
        {score !== null ? `${score}%` : '…'}
      </span>
    </div>
  )
}

// ─── Section 4: Galerie (dishes) ───────────────────────────────────────────────

const DISH_FORM_INIT = {
  name: '', country: '', flag: '', cuisine: '', tag: '',
  description: '', gradient: '', accent: '', size: 'small',
  sort_order: 0, is_active: true,
}

function SectionGallery() {
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingDish, setEditingDish] = useState(null)
  const [form, setForm] = useState(DISH_FORM_INIT)
  const [saving, setSaving] = useState(false)

  const fetchDishes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase.from('dishes').select('*').order('sort_order')
      if (err) throw err
      setDishes(data || [])
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDishes() }, [fetchDishes])

  const openAdd = () => {
    setEditingDish(null)
    setForm(DISH_FORM_INIT)
    setShowForm(true)
  }

  const openEdit = (dish) => {
    setEditingDish(dish)
    setForm({
      name: dish.name || '', country: dish.country || '', flag: dish.flag || '',
      cuisine: dish.cuisine || '', tag: dish.tag || '', description: dish.description || '',
      gradient: dish.gradient || '', accent: dish.accent || '', size: dish.size || 'small',
      sort_order: dish.sort_order ?? 0, is_active: dish.is_active ?? true,
    })
    setShowForm(true)
  }

  const cancelForm = () => { setShowForm(false); setEditingDish(null); setForm(DISH_FORM_INIT) }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name, country: form.country, flag: form.flag,
        cuisine: form.cuisine, tag: form.tag, description: form.description,
        gradient: form.gradient, accent: form.accent, size: form.size,
        sort_order: Number(form.sort_order), is_active: form.is_active,
      }
      let err
      if (editingDish) {
        ({ error: err } = await supabase.from('dishes').update(payload).eq('id', editingDish.id))
      } else {
        ({ error: err } = await supabase.from('dishes').insert(payload))
      }
      if (err) throw err
      cancelForm()
      await fetchDishes()
    } catch (err) {
      alert(err.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const deleteDish = async (dish) => {
    if (!window.confirm(`Supprimer le plat "${dish.name}" ?`)) return
    try {
      const { error: err } = await supabase.from('dishes').delete().eq('id', dish.id)
      if (err) throw err
      await fetchDishes()
    } catch (err) {
      alert(err.message || 'Erreur')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif text-[#f9f5f0]">Galerie (plats)</h2>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#f4a828] text-[#1a1a2e] rounded-lg font-semibold text-sm hover:bg-[#f4a828]/90 transition-colors">
          <Plus className="w-4 h-4" />
          Ajouter un plat
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-[#16213e] rounded-xl border border-[#f4a828]/30 p-6 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <h3 className="col-span-full font-semibold text-[#f9f5f0] mb-1">
            {editingDish ? 'Modifier le plat' : 'Nouveau plat'}
          </h3>
          {[
            { name: 'name', label: 'Nom *', required: true },
            { name: 'country', label: 'Pays *', required: true },
            { name: 'flag', label: 'Drapeau *', required: true, placeholder: '🇸🇳' },
            { name: 'cuisine', label: 'Cuisine *', required: true },
            { name: 'tag', label: 'Tag *', required: true },
            { name: 'gradient', label: 'Gradient CSS' },
            { name: 'accent', label: 'Accent (couleur)' },
          ].map(({ name, label, required, placeholder }) => (
            <div key={name} className="flex flex-col gap-1">
              <label className="text-xs text-[#8892a4]">{label}</label>
              <input
                type="text"
                name={name}
                value={form[name]}
                onChange={handleChange}
                required={required}
                placeholder={placeholder || ''}
                className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#f9f5f0] placeholder-[#8892a4] focus:outline-none focus:border-[#f4a828]/50"
              />
            </div>
          ))}
          <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
            <label className="text-xs text-[#8892a4]">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#f9f5f0] placeholder-[#8892a4] focus:outline-none focus:border-[#f4a828]/50 resize-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#8892a4]">Taille</label>
            <select
              name="size"
              value={form.size}
              onChange={handleChange}
              className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#f9f5f0] focus:outline-none focus:border-[#f4a828]/50"
            >
              <option value="small">small</option>
              <option value="large">large</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#8892a4]">Ordre</label>
            <input
              type="number"
              name="sort_order"
              value={form.sort_order}
              onChange={handleChange}
              className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#f9f5f0] focus:outline-none focus:border-[#f4a828]/50"
            />
          </div>
          <div className="flex items-center gap-2 self-end pb-1">
            <input
              type="checkbox"
              id="dish_active"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="w-4 h-4 accent-[#f4a828]"
            />
            <label htmlFor="dish_active" className="text-sm text-[#8892a4]">Actif</label>
          </div>
          <div className="col-span-full flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#f4a828] text-[#1a1a2e] rounded-lg font-semibold text-sm hover:bg-[#f4a828]/90 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button type="button" onClick={cancelForm} className="px-5 py-2 bg-white/5 text-[#8892a4] rounded-lg text-sm hover:bg-white/10 transition-colors">
              Annuler
            </button>
          </div>
        </form>
      )}

      {error && <ErrorMsg msg={error} />}
      {loading ? <Spinner /> : dishes.length === 0 ? (
        <EmptyState text="Aucun plat dans la galerie" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#16213e] text-[#8892a4] text-left">
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Pays</th>
                <th className="px-4 py-3 font-medium">Cuisine</th>
                <th className="px-4 py-3 font-medium">Tag</th>
                <th className="px-4 py-3 font-medium">Taille</th>
                <th className="px-4 py-3 font-medium">Ordre</th>
                <th className="px-4 py-3 font-medium">Actif</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dishes.map((d) => (
                <tr key={d.id} className="bg-[#16213e]/60 hover:bg-[#16213e] transition-colors">
                  <td className="px-4 py-3 text-[#f9f5f0] font-medium">{d.name}</td>
                  <td className="px-4 py-3 text-[#8892a4]">{d.flag} {d.country}</td>
                  <td className="px-4 py-3 text-[#8892a4]">{d.cuisine}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#f4a828]/15 text-[#f4a828]">{d.tag}</span>
                  </td>
                  <td className="px-4 py-3 text-[#8892a4]">{d.size}</td>
                  <td className="px-4 py-3 text-[#8892a4]">{d.sort_order}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block w-3 h-3 rounded-full ${d.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(d)} className="p-1.5 rounded text-[#f4a828] hover:bg-[#f4a828]/10 transition-colors" title="Modifier">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteDish(d)} className="p-1.5 rounded text-red-400 hover:bg-red-900/30 transition-colors" title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Section 5: Équipe ─────────────────────────────────────────────────────────

const TEAM_FORM_INIT = {
  initials: '', name: '', role: '', origin: '',
  bio: '', avatar_bg: '', sort_order: 0, is_active: true,
}

function SectionTeam() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [form, setForm] = useState(TEAM_FORM_INIT)
  const [saving, setSaving] = useState(false)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase.from('team').select('*').order('sort_order')
      if (err) throw err
      setMembers(data || [])
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const openAdd = () => {
    setEditingMember(null)
    setForm(TEAM_FORM_INIT)
    setShowForm(true)
  }

  const openEdit = (m) => {
    setEditingMember(m)
    setForm({
      initials: m.initials || '', name: m.name || '', role: m.role || '',
      origin: m.origin || '', bio: m.bio || '', avatar_bg: m.avatar_bg || '',
      sort_order: m.sort_order ?? 0, is_active: m.is_active ?? true,
    })
    setShowForm(true)
  }

  const cancelForm = () => { setShowForm(false); setEditingMember(null); setForm(TEAM_FORM_INIT) }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        initials: form.initials.slice(0, 2), name: form.name, role: form.role,
        origin: form.origin, bio: form.bio, avatar_bg: form.avatar_bg,
        sort_order: Number(form.sort_order), is_active: form.is_active,
      }
      let err
      if (editingMember) {
        ({ error: err } = await supabase.from('team').update(payload).eq('id', editingMember.id))
      } else {
        ({ error: err } = await supabase.from('team').insert(payload))
      }
      if (err) throw err
      cancelForm()
      await fetchMembers()
    } catch (err) {
      alert(err.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const deleteMember = async (m) => {
    if (!window.confirm(`Supprimer "${m.name}" de l'équipe ?`)) return
    try {
      const { error: err } = await supabase.from('team').delete().eq('id', m.id)
      if (err) throw err
      await fetchMembers()
    } catch (err) {
      alert(err.message || 'Erreur')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif text-[#f9f5f0]">Équipe</h2>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#f4a828] text-[#1a1a2e] rounded-lg font-semibold text-sm hover:bg-[#f4a828]/90 transition-colors">
          <Plus className="w-4 h-4" />
          Ajouter un membre
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-[#16213e] rounded-xl border border-[#f4a828]/30 p-6 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <h3 className="col-span-full font-semibold text-[#f9f5f0] mb-1">
            {editingMember ? 'Modifier le membre' : 'Nouveau membre'}
          </h3>
          {[
            { name: 'initials', label: 'Initiales * (2 car.)', required: true, maxLength: 2 },
            { name: 'name', label: 'Nom *', required: true },
            { name: 'role', label: 'Rôle *', required: true },
            { name: 'origin', label: 'Origine' },
            { name: 'avatar_bg', label: 'Gradient avatar (CSS)' },
          ].map(({ name, label, required, maxLength }) => (
            <div key={name} className="flex flex-col gap-1">
              <label className="text-xs text-[#8892a4]">{label}</label>
              <input
                type="text"
                name={name}
                value={form[name]}
                onChange={handleChange}
                required={required}
                maxLength={maxLength}
                className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#f9f5f0] placeholder-[#8892a4] focus:outline-none focus:border-[#f4a828]/50"
              />
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#8892a4]">Ordre</label>
            <input
              type="number"
              name="sort_order"
              value={form.sort_order}
              onChange={handleChange}
              className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#f9f5f0] focus:outline-none focus:border-[#f4a828]/50"
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
            <label className="text-xs text-[#8892a4]">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#f9f5f0] placeholder-[#8892a4] focus:outline-none focus:border-[#f4a828]/50 resize-none"
            />
          </div>
          <div className="flex items-center gap-2 self-center">
            <input
              type="checkbox"
              id="team_active"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="w-4 h-4 accent-[#f4a828]"
            />
            <label htmlFor="team_active" className="text-sm text-[#8892a4]">Actif</label>
          </div>
          <div className="col-span-full flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#f4a828] text-[#1a1a2e] rounded-lg font-semibold text-sm hover:bg-[#f4a828]/90 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button type="button" onClick={cancelForm} className="px-5 py-2 bg-white/5 text-[#8892a4] rounded-lg text-sm hover:bg-white/10 transition-colors">
              Annuler
            </button>
          </div>
        </form>
      )}

      {error && <ErrorMsg msg={error} />}
      {loading ? <Spinner /> : members.length === 0 ? (
        <EmptyState text="Aucun membre dans l'équipe" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <div key={m.id} className="bg-[#16213e] rounded-xl border border-white/5 p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                  style={{ background: m.avatar_bg || 'linear-gradient(135deg, #f4a828, #e8631a)' }}
                >
                  {m.initials || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[#f9f5f0] truncate">{m.name}</p>
                  <p className="text-xs text-[#f4a828]">{m.role}</p>
                </div>
              </div>
              {m.origin && <p className="text-xs text-[#8892a4]">{m.origin}</p>}
              {m.bio && <p className="text-sm text-[#8892a4] line-clamp-2">{m.bio}</p>}
              <div className="flex gap-2 mt-auto pt-2 border-t border-white/5">
                <button onClick={() => openEdit(m)} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-[#f4a828] bg-[#f4a828]/10 hover:bg-[#f4a828]/20 transition-colors">
                  <Pencil className="w-3 h-3" />
                  Modifier
                </button>
                <button onClick={() => deleteMember(m)} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-red-400 bg-red-900/20 hover:bg-red-900/40 transition-colors">
                  <Trash2 className="w-3 h-3" />
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'overview', label: 'Vue globale', icon: LayoutDashboard },
  { key: 'users', label: 'Utilisateurs', icon: Users },
  { key: 'restaurants', label: 'Restaurants', icon: Store },
  { key: 'gallery', label: 'Galerie', icon: ImageIcon },
  { key: 'team', label: 'Équipe', icon: Users2 },
]

function Sidebar({ active, setActive, onSignOut, user, mobileOpen, setMobileOpen, collapsed, setCollapsed }) {
  const initials = (user?.full_name || user?.email || 'A')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`${collapsed ? 'px-2 py-5 justify-center' : 'px-6 py-5'} flex items-center justify-between border-b border-white/10`}>
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#f4a828] shrink-0" />
          {!collapsed && (
            <>
              <span className="text-lg font-serif text-[#f9f5f0]">
                Dia<span className="text-[#f4a828]">Table</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-red-600 text-white rounded font-semibold tracking-wide">Admin</span>
            </>
          )}
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-[#8892a4] hover:text-[#f9f5f0]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Avatar */}
      <div className={`${collapsed ? 'px-2 py-5 justify-center' : 'px-6 py-5'} flex items-center gap-3 border-b border-white/10`}>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f4a828] to-[#e8631a] flex items-center justify-center text-[#1a1a2e] font-bold text-sm shrink-0">
          {initials}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#f9f5f0] truncate">{user?.full_name || 'Administrateur'}</p>
            <p className="text-xs text-[#8892a4] truncate">{user?.email || ''}</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setActive(key); setMobileOpen(false) }}
            title={collapsed ? label : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left
              ${collapsed ? 'justify-center px-0' : ''}
              ${active === key
                ? 'bg-[#f4a828]/15 text-[#f4a828] font-semibold'
                : 'text-[#8892a4] hover:bg-white/5 hover:text-[#f9f5f0]'
              }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && label}
          </button>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-3">
        <button
          onClick={onSignOut}
          title={collapsed ? "Se déconnecter" : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#8892a4] hover:bg-red-900/20 hover:text-red-400 transition-colors ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && 'Se déconnecter'}
        </button>
      </div>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="hidden lg:flex w-full items-center justify-center py-3 text-[#8892a4] hover:text-[#f9f5f0] transition-colors border-t border-white/10 mt-auto"
        title={collapsed ? "Agrandir" : "Réduire"}
      >
        <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
      </button>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col min-h-screen bg-[#1a1a2e] border-r border-white/5 fixed left-0 top-0 bottom-0 z-30 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        {content}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-[#1a1a2e] flex flex-col z-50">
            {content}
          </aside>
        </div>
      )}
    </>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':     return <SectionOverview />
      case 'users':        return <SectionUsers />
      case 'restaurants':  return <SectionRestaurants />
      case 'gallery':      return <SectionGallery />
      case 'team':         return <SectionTeam />
      default:             return <SectionOverview />
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] font-sans">
      <DashboardTopbar variant="admin" />
      <div style={{ paddingTop: '56px' }}>
      <Sidebar
        active={activeSection}
        setActive={setActiveSection}
        onSignOut={handleSignOut}
        user={user}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main content */}
      <div className={`min-h-screen flex flex-col transition-all duration-300 ${collapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#16213e] border-b border-white/5 sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)} className="text-[#8892a4] hover:text-[#f9f5f0]">
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-base font-serif text-[#f9f5f0]">
            Dia<span className="text-[#f4a828]">Table</span>
            <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-red-600 text-white rounded font-semibold tracking-wide align-middle">Admin</span>
          </span>
          <div className="w-6" />
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          {renderSection()}
        </main>
      </div>
    </div>
    </div>
  )
}
