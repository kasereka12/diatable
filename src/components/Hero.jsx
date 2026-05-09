import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown, Search, MapPin, ShieldCheck, ArrowRight, Utensils, X,
} from 'lucide-react'
import { useRestaurants } from '../hooks/useRestaurants'
import { TABS } from '../data/restaurants'
import StarRating from './ui/StarRating'
import { getCuisineIcon } from '../lib/cuisineIcons'
import { getGradient } from '../lib/gradients'
import heroBg from '../assets/top-view-shakh-plov-delicious.jpg'
import woodTexture from '../assets/WoodGrain08-byGhostlyPixels.png'

const VILLES = ['Toutes', 'Casablanca', 'Rabat', 'Marrakech', 'Tanger']
const NOTES = [{ label: 'Toutes', val: 0 }, { label: '4.5+', val: 4.5 }, { label: '4.8+', val: 4.8 }]

export default function Hero() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <section
      id="home"
      className="relative min-h-screen w-full overflow-hidden flex flex-col"
      style={{ backgroundColor: '#c5611a' }}
    >
      {/* Wood-textured base background (visible where the food image is curved away) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${woodTexture})`,
          backgroundSize: '600px auto',
          backgroundRepeat: 'repeat',
          mixBlendMode: 'multiply',
          opacity: 0.45,
        }}
      />

      {/* Food image — symmetric curved bottom reveals the wood on both sides */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderBottomLeftRadius: '50% 45%',
          borderBottomRightRadius: '50% 45%',
          boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.10) 35%, rgba(0,0,0,0.55) 100%)',
          borderBottomLeftRadius: '50% 45%',
          borderBottomRightRadius: '50% 45%',
        }}
      />

      {/* Glowing terracotta orbs floating behind the food */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="animate-glow-orb absolute"
          style={{
            top: '15%', left: '55%',
            width: 360, height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(197,97,26,0.45) 0%, rgba(197,97,26,0) 70%)',
            filter: 'blur(20px)',
          }}
        />
        <div
          className="animate-glow-orb absolute"
          style={{
            bottom: '10%', left: '15%',
            width: 280, height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(244,168,40,0.30) 0%, rgba(244,168,40,0) 70%)',
            filter: 'blur(24px)',
            animationDelay: '3s',
          }}
        />
      </div>

      {/* Drifting sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { left: '12%', bottom: '10%', delay: '0s', size: 6 },
          { left: '28%', bottom: '5%', delay: '1.2s', size: 4 },
          { left: '46%', bottom: '12%', delay: '2.4s', size: 7 },
          { left: '68%', bottom: '8%', delay: '0.6s', size: 5 },
          { left: '82%', bottom: '14%', delay: '3s', size: 4 },
          { left: '36%', bottom: '20%', delay: '1.8s', size: 5 },
        ].map((s, i) => (
          <span
            key={i}
            className="animate-sparkle absolute rounded-full"
            style={{
              left: s.left,
              bottom: s.bottom,
              width: s.size, height: s.size,
              background: '#f4a828',
              boxShadow: '0 0 12px rgba(244,168,40,0.9)',
              animationDelay: s.delay,
            }}
          />
        ))}
      </div>

      {/* "Trouver à Manger" floating pill */}
      <div className="relative z-10 flex justify-center pt-28 md:pt-32"
        style={{ animation: 'fadeInUp 0.7s ease 0s both' }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="animate-pill-pulse flex items-center gap-3 px-8 md:px-10 py-3.5 md:py-4 rounded-full font-medium text-base md:text-lg transition-transform hover:-translate-y-0.5 hover:scale-[1.05]"
          style={{ backgroundColor: '#c5611a', color: '#f8f8f8' }}
        >
          Trouver à Manger
          <span className="animate-chevron-bob inline-flex">
            <ChevronDown size={20} strokeWidth={2.5} />
          </span>
        </button>
      </div>

      <div className="relative z-10 flex-1 flex items-end">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 pb-20 md:pb-28">
          <h1
            className="font-serif font-black leading-[1.05] tracking-tight text-white"
            style={{
              fontSize: 'clamp(2.4rem, 6vw, 5rem)',
              animation: 'fadeInUp 0.8s ease 0.15s both',
              textShadow: '0 4px 24px rgba(0,0,0,0.45)',
            }}
          >
            Retrouvez le{' '}
            <span className="text-shimmer">Goût de Chez Vous,</span>
            <br />
            Même Loin de Chez Vous
          </h1>

          <p
            className="mt-6 max-w-2xl text-base md:text-lg leading-[1.75]"
            style={{
              color: 'rgba(248,248,248,0.85)',
              animation: 'fadeInUp 0.8s ease 0.35s both',
              textShadow: '0 2px 12px rgba(0,0,0,0.4)',
            }}
          >
            Accédez en un clic à une diversité culinaire unique :
            restaurants internationaux, cuisiniers à domicile et spécialités du monde,
            réunis au même endroit.
          </p>
        </div>
      </div>

      {open && <RestaurantsModal onClose={() => setOpen(false)} />}
    </section>
  )
}

function RestaurantsModal({ onClose }) {
  const { restaurants, loading } = useRestaurants()
  const [cuisine, setCuisine] = useState('all')
  const [ville, setVille] = useState('Toutes')
  const [note, setNote] = useState(0)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => restaurants.filter(r => {
    if (cuisine !== 'all' && r.cuisine !== cuisine) return false
    if (ville !== 'Toutes' && r.location !== ville) return false
    if (note > 0 && (r.reviews === 0 || r.rating === null || r.rating < note)) return false
    if (search &&
      !r.name.toLowerCase().includes(search.toLowerCase()) &&
      !r.cuisine_label.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [restaurants, cuisine, ville, note, search])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Trouver à manger"
      className="fixed left-0 right-0 bottom-0 z-[100] flex items-start justify-center p-4 md:p-6 pt-6"
      style={{ top: '110px' }}
    >
      {/* Blurred backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(20,12,6,0.55)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-5xl max-h-full rounded-3xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: '#eae5d9',
          boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
          animation: 'fadeInUp 0.35s ease both',
        }}
      >
        {/* Header band */}
        <div
          className="px-6 md:px-8 py-6 relative flex-shrink-0"
          style={{
            background:
              'linear-gradient(135deg, #1f1f1f 0%, #2a2520 60%, rgba(197,97,26,0.45) 100%)',
          }}
        >
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-white/15"
            style={{ color: '#f8f8f8', backgroundColor: 'rgba(248,248,248,0.08)' }}
          >
            <X size={18} />
          </button>

          <div className="text-[0.7rem] font-semibold tracking-[0.18em] uppercase mb-2"
            style={{ color: '#c5611a' }}>
            Explorer
          </div>
          <h2 className="font-serif font-black leading-tight"
            style={{ color: '#f8f8f8', fontSize: 'clamp(1.5rem, 2.6vw, 2rem)' }}>
            Tous les <em style={{ color: '#c5611a', fontStyle: 'italic' }}>Restaurants</em>
          </h2>
          <p className="text-sm mt-1" style={{ color: 'rgba(248,248,248,0.65)' }}>
            {restaurants.length} restaurants et cuisiniers de la diaspora au Maroc
          </p>
        </div>

        {/* Filters + grid scrollable */}
        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
          {/* Filters card */}
          <div
            className="bg-white rounded-2xl p-5 mb-6"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
          >
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: '#80716a' }}>
                <Search size={18} />
              </span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un restaurant, une cuisine…"
                className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm focus:outline-none transition-all"
                style={{
                  borderColor: 'rgba(0,0,0,0.10)',
                  backgroundColor: '#eae5d9',
                  color: '#1f1f1f',
                }}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-[0.68rem] font-bold uppercase tracking-widest mb-1.5"
                  style={{ color: '#80716a' }}>Cuisine</label>
                <select value={cuisine} onChange={e => setCuisine(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none border"
                  style={{ borderColor: 'rgba(0,0,0,0.10)', backgroundColor: '#eae5d9', color: '#1f1f1f' }}>
                  {TABS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[0.68rem] font-bold uppercase tracking-widest mb-1.5"
                  style={{ color: '#80716a' }}>Ville</label>
                <select value={ville} onChange={e => setVille(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none border"
                  style={{ borderColor: 'rgba(0,0,0,0.10)', backgroundColor: '#eae5d9', color: '#1f1f1f' }}>
                  {VILLES.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[0.68rem] font-bold uppercase tracking-widest mb-1.5"
                  style={{ color: '#80716a' }}>Note minimum</label>
                <select value={note} onChange={e => setNote(parseFloat(e.target.value))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none border"
                  style={{ borderColor: 'rgba(0,0,0,0.10)', backgroundColor: '#eae5d9', color: '#1f1f1f' }}>
                  {NOTES.map(n => <option key={n.val} value={n.val}>{n.label}</option>)}
                </select>
              </div>
              <button
                onClick={() => { setCuisine('all'); setVille('Toutes'); setNote(0); setSearch('') }}
                className="self-end px-4 py-2.5 rounded-xl border text-sm transition-all"
                style={{ borderColor: 'rgba(0,0,0,0.10)', color: '#80716a' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#c5611a'; e.currentTarget.style.borderColor = '#c5611a' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#80716a'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.10)' }}
              >
                Réinitialiser
              </button>
            </div>
          </div>

          <p className="text-sm mb-5" style={{ color: '#80716a' }}>
            <span className="font-semibold" style={{ color: '#1f1f1f' }}>{filtered.length}</span> résultat{filtered.length !== 1 ? 's' : ''}
          </p>

          {loading ? (
            <div className="text-center py-16" style={{ color: '#80716a' }}>Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Utensils size={48} className="mx-auto mb-3" style={{ color: '#c5611a' }} />
              <h3 className="font-serif text-lg font-bold mb-1" style={{ color: '#1f1f1f' }}>Aucun résultat</h3>
              <p className="text-sm" style={{ color: '#80716a' }}>Essayez de modifier vos filtres.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((r) => {
                const CuisineIcon = getCuisineIcon(r.cuisine)
                return (
                  <Link
                    key={r.id}
                    to={`/restaurants/${r.id}`}
                    onClick={onClose}
                    className="bg-white rounded-2xl overflow-hidden border block transition-all duration-300 hover:-translate-y-1.5"
                    style={{
                      borderColor: 'rgba(0,0,0,0.05)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    }}
                  >
                    <div className="h-40 relative overflow-hidden"
                      style={!r.image_url ? { background: getGradient(r.gradient) } : {}}>
                      {r.image_url ? (
                        <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg">
                          <CuisineIcon size={48} className="text-white/90" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                      <div className="absolute top-3 left-3 backdrop-blur-sm text-white text-[0.7rem] font-semibold px-3 py-1 rounded-full"
                        style={{ backgroundColor: 'rgba(31,31,31,0.75)' }}>
                        {r.flag} {r.cuisine_label}
                      </div>
                      {r.is_verified && (
                        <div className="absolute top-3 right-3 text-white text-[0.65rem] font-bold px-2 py-1 rounded-full flex items-center gap-1"
                          style={{ backgroundColor: 'rgba(34,197,94,0.92)' }}>
                          <ShieldCheck size={11} /> Vérifié
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif font-bold text-sm leading-snug mb-2" style={{ color: '#1f1f1f' }}>{r.name}</h3>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs flex items-center gap-1" style={{ color: '#80716a' }}>
                          <MapPin size={12} /> {r.location}
                        </span>
                        {r.reviews > 0 ? (
                          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#1f1f1f' }}>
                            <StarRating rating={r.rating} />
                            {r.rating} <span className="font-normal" style={{ color: '#80716a' }}>({r.reviews})</span>
                          </span>
                        ) : (
                          <span className="text-xs italic" style={{ color: '#80716a' }}>Aucun avis</span>
                        )}
                      </div>
                      <div className="text-xs font-semibold flex items-center gap-1" style={{ color: '#c5611a' }}>
                        Voir le profil <ArrowRight size={12} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
