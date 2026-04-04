import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getCuisineIcon } from '../lib/cuisineIcons'
import { getGradient } from '../lib/gradients'
import {
  Package, Heart, Settings, MapPin, Check, ChefHat, Utensils,
  MessageCircle, Clock, ArrowRight, ShoppingBag
} from 'lucide-react'

const STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

const STATUS_COLORS = {
  pending: 'bg-amber-50 text-amber-600',
  confirmed: 'bg-blue-50 text-blue-600',
  preparing: 'bg-orange-50 text-orange-600',
  ready: 'bg-purple-50 text-purple-600',
  delivered: 'bg-green-50 text-green-600',
  cancelled: 'bg-red-50 text-red-600',
}

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('commandes')
  const [orders, setOrders] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingFavorites, setLoadingFavorites] = useState(true)

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilisateur'
  const initials    = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  // Fetch real orders
  useEffect(() => {
    if (!supabase || !user) { setLoadingOrders(false); return }
    supabase
      .from('orders')
      .select('*, restaurant:restaurants(name, cuisine, cuisine_label, flag)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setOrders(data || [])
        setLoadingOrders(false)
      })
  }, [user])

  // Fetch real favorites
  useEffect(() => {
    if (!supabase || !user) { setLoadingFavorites(false); return }
    supabase
      .from('restaurant_likes')
      .select('*, restaurant:restaurants(id, name, cuisine, cuisine_label, flag, gradient, location, image_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setFavorites((data || []).map(l => l.restaurant).filter(Boolean))
        setLoadingFavorites(false)
      })
  }, [user])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const TABS = [
    { id: 'commandes', label: 'Commandes', Icon: Package },
    { id: 'favoris',   label: 'Favoris',   Icon: Heart },
    { id: 'compte',    label: 'Mon Compte', Icon: Settings },
  ]

  return (
    <div className="bg-cream min-h-screen pt-24">
      {/* Header */}
      <div className="bg-dark pt-12 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 zellige-pattern opacity-30" />
        <div className="relative max-w-4xl mx-auto px-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center font-serif text-2xl font-black text-dark flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#f4a828,#c8841a)' }}>
            {initials}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-white">{displayName}</h1>
            <p className="text-muted text-sm mt-0.5">{user?.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 bg-gold/15 border border-gold/30 text-gold text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {profile?.role === 'vendor'
                ? <><ChefHat size={12} /> Vendeur</>
                : <><Utensils size={12} /> Client</>
              }
            </span>
          </div>
          <div className="ml-auto flex gap-2">
            {profile?.role === 'vendor' && (
              <Link to="/tableau-de-bord" className="btn btn-gold text-sm">
                Tableau de bord
              </Link>
            )}
            <Link to="/messages" className="btn btn-outline text-sm px-4 py-2.5 flex items-center gap-1.5">
              <MessageCircle size={14} /> Messages
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-10">
        {/* Nav tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/[0.05] p-1.5 flex gap-1 mb-8">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5
                ${activeTab === t.id ? 'bg-gold text-dark shadow-sm' : 'text-muted hover:text-dark'}`}>
              <t.Icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* Commandes */}
        {activeTab === 'commandes' && (
          <div className="space-y-4 pb-12">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-dark">Dernières commandes</h2>
              <Link to="/mes-commandes" className="text-gold text-sm font-semibold flex items-center gap-1 hover:underline">
                Voir tout <ArrowRight size={14} />
              </Link>
            </div>

            {loadingOrders ? (
              <div className="text-center py-12 text-muted text-sm">Chargement...</div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-black/[0.05]">
                <ShoppingBag size={40} className="text-muted/20 mx-auto mb-3" />
                <p className="font-serif font-bold text-dark mb-2">Aucune commande</p>
                <p className="text-muted text-sm mb-5">Commandez votre premier repas !</p>
                <Link to="/restaurants" className="btn btn-gold text-sm">
                  Explorer les restaurants
                </Link>
              </div>
            ) : (
              orders.map(o => {
                const OrderIcon = getCuisineIcon(o.restaurant?.cuisine)
                const statusColor = STATUS_COLORS[o.status] || STATUS_COLORS.pending
                const statusLabel = STATUS_LABELS[o.status] || o.status

                return (
                  <Link
                    key={o.id}
                    to="/mes-commandes"
                    className="bg-white rounded-2xl p-5 shadow-sm border border-black/[0.05] flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md transition-all block"
                  >
                    <div className="w-14 h-14 rounded-xl bg-cream flex items-center justify-center flex-shrink-0">
                      <OrderIcon size={28} className="text-gold" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-dark text-sm">{o.restaurant?.name || 'Restaurant'}</div>
                      <div className="text-muted text-xs mt-0.5">
                        {new Date(o.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })} · #{o.id.slice(0, 8)}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-dark">{Number(o.total).toFixed(2)} MAD</div>
                      <span className={`inline-flex items-center gap-1 mt-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${statusColor}`}>
                        {o.status === 'delivered' ? <Check size={10} /> : <Clock size={10} />}
                        {statusLabel}
                      </span>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        )}

        {/* Favoris */}
        {activeTab === 'favoris' && (
          <div className="pb-12">
            <h2 className="font-serif text-xl font-bold text-dark mb-6">Mes restaurants favoris</h2>

            {loadingFavorites ? (
              <div className="text-center py-12 text-muted text-sm">Chargement...</div>
            ) : favorites.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-black/[0.05]">
                <Heart size={40} className="text-muted/20 mx-auto mb-3" />
                <p className="font-serif font-bold text-dark mb-2">Aucun favori</p>
                <p className="text-muted text-sm mb-5">Ajoutez des restaurants en cliquant sur le coeur</p>
                <Link to="/restaurants" className="btn btn-gold text-sm">
                  Explorer les restaurants
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {favorites.map(r => {
                  const FavIcon = getCuisineIcon(r.cuisine)
                  return (
                    <Link key={r.id} to={`/restaurants/${r.id}`}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-black/[0.05] hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                      <div className="h-32 relative overflow-hidden"
                        style={!r.image_url ? { background: getGradient(r.gradient) } : {}}>
                        {r.image_url ? (
                          <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <FavIcon size={40} className="text-white/90" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 text-red-400">
                          <Heart size={18} className="fill-red-400" />
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-serif font-bold text-sm text-dark mb-1 leading-snug">{r.name}</h3>
                        <p className="text-muted text-xs flex items-center gap-1">
                          <MapPin size={10} /> {r.location}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Compte */}
        {activeTab === 'compte' && (
          <div className="pb-12 space-y-5">
            <h2 className="font-serif text-xl font-bold text-dark">Informations du compte</h2>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/[0.05]">
              <div className="space-y-5">
                {[
                  { label: 'Nom complet', value: displayName },
                  { label: 'Adresse email', value: user?.email },
                  { label: 'Rôle', value: profile?.role === 'vendor' ? 'Vendeur' : 'Client' },
                  { label: 'Membre depuis', value: profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                    : 'Mars 2026'
                  },
                ].map(f => (
                  <div key={f.label} className="flex items-center justify-between py-3 border-b border-black/[0.05] last:border-0">
                    <span className="text-muted text-sm">{f.label}</span>
                    <span className="font-semibold text-dark text-sm">{f.value}</span>
                  </div>
                ))}
              </div>
              <button className="mt-5 w-full py-3 rounded-xl border-2 border-gold text-gold-dark font-semibold text-sm hover:bg-gold hover:text-dark transition-all">
                Modifier mes informations
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/[0.05]">
              <h3 className="font-serif font-bold text-dark mb-4">Sécurité</h3>
              <button className="w-full py-3 rounded-xl border border-black/10 text-dark text-sm font-medium hover:bg-cream transition-all mb-3">
                Changer le mot de passe
              </button>
              <button onClick={handleSignOut}
                className="w-full py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-100 transition-all">
                Se déconnecter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
