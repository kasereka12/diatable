import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { useRestaurants } from '../hooks/useRestaurants'
import { TABS } from '../data/restaurants'
import SectionHeader from './ui/SectionHeader'
import StarRating from './ui/StarRating'
import { getCuisineIcon } from '../lib/cuisineIcons'
import { MapPin, ArrowRight } from 'lucide-react'

// Tailwind gradient class → inline style fallback map
const GRAD_STYLES = {
  'grad-senegal':   'linear-gradient(135deg,#e8521a 0%,#c8841a 40%,#f4a828 100%)',
  'grad-chinese':   'linear-gradient(135deg,#b71c1c 0%,#e53935 50%,#ef9a9a 100%)',
  'grad-lebanese':  'linear-gradient(135deg,#1b5e20 0%,#43a047 50%,#a5d6a7 100%)',
  'grad-syrian':    'linear-gradient(135deg,#4a148c 0%,#7b1fa2 50%,#ce93d8 100%)',
  'grad-french':    'linear-gradient(135deg,#0d47a1 0%,#1565c0 50%,#90caf9 100%)',
  'grad-italian':   'linear-gradient(135deg,#c62828 0%,#1b5e20 50%,#f9f5f0 100%)',
  'grad-nigerian':  'linear-gradient(135deg,#1b5e20 0%,#f9a825 50%,#1b5e20 100%)',
  'grad-indian':    'linear-gradient(135deg,#e65100 0%,#f57f17 40%,#fbc02d 100%)',
  'grad-brazilian': 'linear-gradient(135deg,#1b5e20 0%,#f9a825 30%,#0d47a1 100%)',
}

function RestaurantCard({ r, delay = '0s' }) {
  const CuisineIcon = getCuisineIcon(r.cuisine)

  return (
    <Link
      to={`/restaurants/${r.id}`}
      data-reveal
      data-delay={delay}
      className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.10)]
                 border border-black/5 transition-all duration-300 block
                 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.15)]"
    >
      {/* Card image */}
      <div
        className="h-44 relative overflow-hidden"
        style={!r.image_url ? { background: GRAD_STYLES[r.gradient] } : {}}
      >
        {r.image_url ? (
          <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg">
            <CuisineIcon size={52} className="text-white/90" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
        <div
          className="absolute top-3 left-3 bg-dark/75 backdrop-blur-sm text-white
                     text-[0.72rem] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5"
        >
          {r.flag} {r.cuisine_label}
        </div>
      </div>

      {/* Card body */}
      <div className="p-5">
        <h3 className="font-serif font-bold text-dark text-[1.1rem] leading-snug mb-3">
          {r.name}
        </h3>
        <div className="flex items-center justify-between mb-4">
          <span className="text-muted text-xs flex items-center gap-1">
            <MapPin size={12} /> {r.location}
          </span>
          {r.reviews > 0 ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-dark">
              <StarRating rating={r.rating} />
              {r.rating}
              <span className="text-muted font-normal">({r.reviews})</span>
            </span>
          ) : (
            <span className="text-xs text-muted italic">Aucun avis</span>
          )}
        </div>
        <div className="w-full py-2.5 rounded-lg text-sm font-semibold border-2 border-gold
                     text-gold-dark bg-transparent transition-all duration-200
                     group-hover:bg-gold group-hover:text-dark
                     flex items-center justify-center gap-1.5">
          Voir le profil <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  )
}

export default function CuisineFilter() {
  const [active, setActive] = useState('all')
  const { restaurants, loading } = useRestaurants()
  const ref = useScrollReveal()

  const filtered = active === 'all'
    ? restaurants
    : restaurants.filter((r) => r.cuisine === active)

  return (
    <section id="restaurants" className="bg-cream py-24" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader label="Découvrir" title="Explorer par <em>Cuisine</em>" />

        {/* Filter tabs */}
        <div data-reveal className="overflow-x-auto scrollbar-hide mb-12">
          <div className="flex gap-2.5 w-max mx-auto pb-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap
                            border-2 transition-all duration-200
                            ${active === tab.id
                              ? 'bg-gold text-dark border-gold shadow-[0_4px_16px_rgba(244,168,40,0.3)]'
                              : 'bg-white text-dark3 border-transparent shadow-sm hover:border-gold hover:text-gold-dark'
                            }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards grid */}
        {loading ? (
          <div className="text-center py-16 text-muted">Chargement des restaurants…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {filtered.map((r, i) => (
              <RestaurantCard
                key={r.id}
                r={r}
                delay={`${(i % 3) * 0.1}s`}
              />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-16 text-muted">
                Aucun restaurant trouvé pour cette cuisine pour l'instant. Revenez bientôt !
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
