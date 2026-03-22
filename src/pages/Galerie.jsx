import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { supabase } from '../lib/supabase'
import { Search, ArrowRight, X, Utensils } from 'lucide-react'

/* ─── DISH CARD ─────────────────────────────────────────── */
function DishCard({ dish, onClick }) {
  const isLarge = dish.size === 'large'
  return (
    <button
      onClick={() => onClick(dish)}
      className={`group relative rounded-2xl overflow-hidden cursor-pointer text-left transition-all duration-300
        hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.25)]
        ${isLarge ? 'row-span-2' : 'row-span-1'}`}
      style={{ background: dish.gradient }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
        <div className="w-32 h-32 rounded-full border-4 border-white/30"
          style={{ boxShadow: `0 0 60px ${dish.accent || '#fff'}` }} />
        <div className="absolute w-20 h-20 rounded-full border-2 border-white/20" />
      </div>
      <div className="absolute top-4 left-4">
        <span className="text-[0.65rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/30 text-white/90 backdrop-blur-sm">
          {dish.tag}
        </span>
      </div>
      <div className="absolute top-4 right-4 text-xl">{dish.flag}</div>
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">{dish.country}</div>
        <h3 className={`font-serif font-bold text-white leading-tight ${isLarge ? 'text-2xl' : 'text-lg'}`}>
          {dish.name}
        </h3>
        {isLarge && dish.description && (
          <p className="text-white/70 text-xs mt-2 leading-relaxed line-clamp-2">{dish.description}</p>
        )}
        <div className="flex items-center gap-1 mt-3 text-white/50 text-xs font-semibold group-hover:text-white/80 transition-colors">
          Voir les restaurants <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </button>
  )
}

/* ─── MODAL ──────────────────────────────────────────────── */
function DishModal({ dish, onClose }) {
  if (!dish) return null
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-dark2 rounded-3xl overflow-hidden w-full max-w-lg shadow-[0_32px_80px_rgba(0,0,0,0.5)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-52 relative" style={{ background: dish.gradient }}>
          <div className="absolute inset-0 bg-gradient-to-t from-dark2/80 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center opacity-25">
            <div className="w-40 h-40 rounded-full border-4 border-white/30"
              style={{ boxShadow: `0 0 80px ${dish.accent || '#fff'}` }} />
          </div>
          <button onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors">
            <X size={16} />
          </button>
          <div className="absolute bottom-5 left-6 right-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{dish.flag}</span>
              <span className="text-white/60 text-xs font-bold uppercase tracking-widest">{dish.country}</span>
              <span className="text-[0.65rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-white/80">{dish.tag}</span>
            </div>
            <h2 className="font-serif text-3xl font-black text-white">{dish.name}</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-muted text-sm leading-relaxed mb-6">{dish.description}</p>
          <Link
            to={`/restaurants?cuisine=${dish.cuisine}`}
            onClick={onClose}
            className="btn btn-gold w-full justify-center"
          >
            Voir les restaurants {dish.flag} <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ─── PAGE ───────────────────────────────────────────────── */
export default function Galerie() {
  const ref = useScrollReveal()
  const [dishes,       setDishes]      = useState([])
  const [loading,      setLoading]     = useState(true)
  const [search,       setSearch]      = useState('')
  const [activeCountry, setActiveCountry] = useState('Tous')
  const [activeRegion,  setActiveRegion]  = useState('Tous')
  const [selected,     setSelected]    = useState(null)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    supabase
      .from('dishes')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (!error && data?.length) setDishes(data)
        setLoading(false)
      })
  }, [])

  const countries = ['Tous', ...Array.from(new Set(dishes.map(d => d.country)))]
  const REGIONS = {
    'Tous':        [],
    'Afrique':     ['Sénégal', 'Nigéria', "Côte d'Ivoire", 'Maroc'],
    'Moyen-Orient':['Liban', 'Syrie', 'Turquie'],
    'Asie':        ['Chine', 'Inde'],
    'Europe':      ['France', 'Italie'],
    'Amériques':   ['Brésil'],
  }

  const filtered = dishes.filter(d => {
    const matchCountry = activeCountry === 'Tous' || d.country === activeCountry
    const matchRegion  = activeRegion === 'Tous' || REGIONS[activeRegion]?.includes(d.country)
    const matchSearch  = !search.trim() ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.country.toLowerCase().includes(search.toLowerCase()) ||
      (d.tag || '').toLowerCase().includes(search.toLowerCase())
    return matchCountry && matchRegion && matchSearch
  })

  function selectRegion(r) {
    setActiveRegion(r)
    setActiveCountry('Tous')
  }

  return (
    <>
      <div ref={ref}>
        {/* Hero */}
        <div className="bg-dark pt-32 pb-20 relative overflow-hidden">
          <div className="absolute inset-0 zellige-pattern opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark/80" />
          <div className="relative max-w-3xl mx-auto px-6 text-center">
            <p className="section-label" data-reveal>Galerie mondiale</p>
            <h1 className="font-serif text-4xl md:text-5xl font-black text-white mb-4" data-reveal data-delay="0.1s">
              Les Plats du <em className="text-gold italic">Monde</em>
            </h1>
            <p className="text-light/70 text-lg mb-8" data-reveal data-delay="0.2s">
              {loading ? '…' : `${dishes.length} plats emblématiques`} disponibles ici au Maroc.
            </p>
            <div className="relative max-w-sm mx-auto" data-reveal data-delay="0.3s">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un plat ou un pays…"
                className="w-full bg-white/10 border border-white/15 rounded-2xl pl-11 pr-4 py-3 text-white text-sm
                           placeholder:text-white/35 focus:outline-none focus:border-gold/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        {!loading && dishes.length > 0 && (
          <div className="bg-dark/95 sticky top-[72px] z-40 border-b border-white/[0.06] py-4 shadow-lg">
            <div className="max-w-6xl mx-auto px-6 space-y-3">
              <div className="flex flex-wrap gap-2">
                {Object.keys(REGIONS).map(r => (
                  <button key={r} onClick={() => selectRegion(r)}
                    className={`text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full transition-all duration-200
                      ${activeRegion === r
                        ? 'bg-gold text-dark'
                        : 'bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white'}`}>
                    {r}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                {countries.map(c => (
                  <button key={c} onClick={() => { setActiveCountry(c); setActiveRegion('Tous') }}
                    className={`flex-shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap
                      ${activeCountry === c
                        ? 'bg-white text-dark'
                        : 'bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="bg-dark min-h-screen py-12">
          <div className="max-w-6xl mx-auto px-6">
            {loading ? (
              <div className="flex justify-center py-24">
                <div className="w-12 h-12 rounded-full border-4 border-gold/30 border-t-gold animate-spin" />
              </div>
            ) : dishes.length === 0 ? (
              <div className="text-center py-24">
                <Utensils size={48} className="text-gold mx-auto mb-4" />
                <p className="text-muted text-lg mb-2">Aucun plat dans la galerie.</p>
                <p className="text-muted/60 text-sm">Ajoutez des plats via le SQL Editor Supabase.</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-muted text-lg mb-4">Aucun plat trouvé pour "{search}"</p>
                <button onClick={() => setSearch('')} className="btn btn-gold text-sm">Effacer la recherche</button>
              </div>
            ) : (
              <>
                <p className="text-muted text-xs font-semibold uppercase tracking-widest mb-6">
                  {filtered.length} plat{filtered.length > 1 ? 's' : ''}
                  {activeCountry !== 'Tous' ? ` · ${activeCountry}` : ''}
                  {activeRegion !== 'Tous' ? ` · ${activeRegion}` : ''}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" style={{ gridAutoRows: '200px' }}>
                  {filtered.map(dish => (
                    <DishCard key={dish.id} dish={dish} onClick={setSelected} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-dark2 py-16 text-center border-t border-white/[0.05]">
          <div className="max-w-xl mx-auto px-6" data-reveal>
            <h2 className="font-serif text-2xl font-bold text-white mb-3">
              Vous cuisinez l'un de ces plats ?
            </h2>
            <p className="text-muted text-sm mb-6">
              Rejoignez DiaTable et faites découvrir votre cuisine à des milliers d'expatriés au Maroc.
            </p>
            <Link to="/inscription?role=vendor" className="btn btn-gold">
              Devenir vendeur <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      {selected && <DishModal dish={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
