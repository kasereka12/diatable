import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { useRestaurants } from '../hooks/useRestaurants'
import { TABS } from '../data/restaurants'
import StarRating from '../components/ui/StarRating'
import { getCuisineIcon } from '../lib/cuisineIcons'
import { Search, MapPin, ShieldCheck, ArrowRight, Utensils } from 'lucide-react'
import { getGradient } from '../lib/gradients'

const VILLES  = ['Toutes', 'Casablanca', 'Rabat', 'Marrakech', 'Tanger']
const NOTES   = [{ label: 'Toutes', val: 0 }, { label: '4.5+', val: 4.5 }, { label: '4.8+', val: 4.8 }]

export default function Restaurants() {
  const { restaurants, loading } = useRestaurants()
  const [cuisine, setCuisine]   = useState('all')
  const [ville,   setVille]     = useState('Toutes')
  const [note,    setNote]      = useState(0)
  const [search,  setSearch]    = useState('')
  const ref = useScrollReveal()

  const filtered = useMemo(() => restaurants.filter(r => {
    if (cuisine !== 'all' && r.cuisine !== cuisine) return false
    if (ville !== 'Toutes' && r.location !== ville) return false
    if (note > 0 && (r.reviews === 0 || r.rating === null || r.rating < note)) return false
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) &&
        !r.cuisine_label.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [restaurants, cuisine, ville, note, search])

  return (
    <div className="bg-cream min-h-screen pt-24" ref={ref}>
      {/* Page header */}
      <div className="bg-dark py-16 relative overflow-hidden">
        <div className="absolute inset-0 zellige-pattern opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark/80" />
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <p className="section-label" data-reveal>Explorer</p>
          <h1 className="font-serif text-4xl md:text-5xl font-black text-white mb-4" data-reveal data-delay="0.1s">
            Tous les <em style={{ color: '#c5611a', fontStyle: 'italic' }}>Restaurants</em>
          </h1>
          <p className="text-light/70 max-w-xl mx-auto" data-reveal data-delay="0.2s">
            {restaurants.length} restaurants et cuisiniers de la diaspora au Maroc
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Search + Filters */}
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-5 mb-10" data-reveal>
          {/* Search bar */}
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted flex items-center">
              <Search size={18} />
            </span>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un restaurant, une cuisine…"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-black/10 bg-cream text-dark text-sm
                         focus:outline-none focus:border-gold transition-all"
            />
          </div>
          {/* Filter row */}
          <div className="flex flex-wrap gap-3">
            {/* Cuisine */}
            <div className="flex-1 min-w-[160px]">
              <label className="block text-[0.68rem] font-bold uppercase tracking-widest text-muted mb-1.5">Cuisine</label>
              <select value={cuisine} onChange={e => setCuisine(e.target.value)}
                className="w-full bg-cream border border-black/10 rounded-xl px-3 py-2.5 text-dark text-sm focus:outline-none focus:border-gold">
                {TABS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            {/* Ville */}
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[0.68rem] font-bold uppercase tracking-widest text-muted mb-1.5">Ville</label>
              <select value={ville} onChange={e => setVille(e.target.value)}
                className="w-full bg-cream border border-black/10 rounded-xl px-3 py-2.5 text-dark text-sm focus:outline-none focus:border-gold">
                {VILLES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            {/* Note */}
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[0.68rem] font-bold uppercase tracking-widest text-muted mb-1.5">Note minimum</label>
              <select value={note} onChange={e => setNote(parseFloat(e.target.value))}
                className="w-full bg-cream border border-black/10 rounded-xl px-3 py-2.5 text-dark text-sm focus:outline-none focus:border-gold">
                {NOTES.map(n => <option key={n.val} value={n.val}>{n.label}</option>)}
              </select>
            </div>
            {/* Reset */}
            <button onClick={() => { setCuisine('all'); setVille('Toutes'); setNote(0); setSearch('') }}
              className="self-end px-4 py-2.5 rounded-xl border border-black/10 text-muted text-sm hover:text-gold hover:border-gold transition-all">
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Results count */}
        <p className="text-muted text-sm mb-6" data-reveal>
          <span className="text-dark font-semibold">{filtered.length}</span> résultat{filtered.length !== 1 ? 's' : ''}
        </p>

        {loading ? (
          <div className="text-center py-24 text-muted">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="flex justify-center mb-4">
              <Utensils size={56} className="text-gold" />
            </div>
            <h3 className="font-serif text-xl font-bold text-dark mb-2">Aucun résultat</h3>
            <p className="text-muted">Essayez de modifier vos filtres ou votre recherche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {filtered.map((r, i) => {
              const CuisineIcon = getCuisineIcon(r.cuisine)
              return (
                <Link
                  key={r.id}
                  to={`/restaurants/${r.id}`}
                  data-reveal data-delay={`${(i % 3) * 0.08}s`}
                  className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)]
                             border border-black/5 transition-all duration-300 block
                             hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.15)]"
                >
                  <div className="h-44 relative overflow-hidden" style={!r.image_url ? { background: getGradient(r.gradient) } : {}}>
                    {r.image_url ? (
                      <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg">
                        <CuisineIcon size={52} className="text-white/90" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                    <div className="absolute top-3 left-3 bg-dark/75 backdrop-blur-sm text-white text-[0.72rem] font-semibold px-3 py-1 rounded-full">
                      {r.flag} {r.cuisine_label}
                    </div>
                    {r.is_verified && (
                      <div className="absolute top-3 right-3 bg-green-500/90 text-white text-[0.68rem] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <ShieldCheck size={12} /> Vérifié
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif font-bold text-dark text-base leading-snug mb-2">{r.name}</h3>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-muted text-xs flex items-center gap-1">
                        <MapPin size={12} /> {r.location}
                      </span>
                      {r.reviews > 0 ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-dark">
                          <StarRating rating={r.rating} />
                          {r.rating} <span className="text-muted font-normal">({r.reviews})</span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted italic">Aucun avis</span>
                      )}
                    </div>
                    <div className=" text-sm font-semibold flex items-center gap-1" style={{ color: '#c5611a' }}>
                      Voir le profil <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
