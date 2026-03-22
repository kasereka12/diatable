import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { RESTAURANTS } from '../data/restaurants'
import { getCuisineIcon } from '../lib/cuisineIcons'
import { Package, Heart, Settings, MapPin, Check, ChefHat, Utensils } from 'lucide-react'

const FAVORITES = RESTAURANTS.slice(0, 3)
const GRAD_STYLES = {
  'grad-senegal':   'linear-gradient(135deg,#e8521a,#f4a828)',
  'grad-chinese':   'linear-gradient(135deg,#b71c1c,#e53935)',
  'grad-lebanese':  'linear-gradient(135deg,#1b5e20,#43a047)',
}

const ORDERS = [
  { id: 'CMD001', restaurant: 'Chez Fatou — Saveurs du Sénégal', date: '18 mars 2026', total: '170 MAD', status: 'Livré', cuisine: 'senegalaise' },
  { id: 'CMD002', restaurant: 'Dragon Palace — Chef Wei',         date: '12 mars 2026', total: '230 MAD', status: 'Livré', cuisine: 'chinoise' },
  { id: 'CMD003', restaurant: 'Beit Beirut — Mezze & Grills',     date: '5 mars 2026',  total: '145 MAD', status: 'Livré', cuisine: 'libanaise' },
]

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('commandes')

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilisateur'
  const initials    = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

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
          {profile?.role === 'vendor' && (
            <Link to="/tableau-de-bord" className="ml-auto btn btn-gold text-sm">
              Tableau de bord →
            </Link>
          )}
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
            <h2 className="font-serif text-xl font-bold text-dark">Historique des commandes</h2>
            {ORDERS.map(o => {
              const OrderIcon = getCuisineIcon(o.cuisine)
              return (
                <div key={o.id} className="bg-white rounded-2xl p-5 shadow-sm border border-black/[0.05] flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-cream flex items-center justify-center flex-shrink-0">
                    <OrderIcon size={28} className="text-gold" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-dark text-sm">{o.restaurant}</div>
                    <div className="text-muted text-xs mt-0.5">{o.date} · Réf. {o.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-dark">{o.total}</div>
                    <div className="inline-flex items-center gap-1 mt-1 bg-green-50 text-green-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      <Check size={10} /> {o.status}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Favoris */}
        {activeTab === 'favoris' && (
          <div className="pb-12">
            <h2 className="font-serif text-xl font-bold text-dark mb-6">Mes restaurants favoris</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {FAVORITES.map(r => {
                const FavIcon = getCuisineIcon(r.cuisine)
                return (
                  <Link key={r.id} to={`/restaurants/${r.id}`}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-black/[0.05] hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                    <div className="h-32 relative" style={{ background: GRAD_STYLES[r.gradient] || 'linear-gradient(135deg,#e8521a,#f4a828)' }}>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <FavIcon size={40} className="text-white/90" />
                      </div>
                      <button className="absolute top-2 right-2 text-white/80 hover:text-red-400 transition-colors">
                        <Heart size={18} className="fill-red-400 text-red-400" />
                      </button>
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
                  { label: 'Membre depuis', value: 'Mars 2026' },
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
