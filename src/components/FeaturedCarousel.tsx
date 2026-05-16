import { useRef, useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Crown, Sparkles, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRestaurants } from '../hooks/useRestaurants'
import { getGradient } from '../lib/gradients'
import { getCuisineIcon } from '../lib/cuisineIcons'
import StarRating from './ui/StarRating'

const GAP = 20

export default function FeaturedCarousel() {
  const { restaurants, loading } = useRestaurants()
  const featured = restaurants.filter(r => r.plan === 'premium' || r.plan === 'pro')

  const trackRef  = useRef<HTMLDivElement>(null)
  const hoverRef  = useRef(false)
  const [activeIdx, setActiveIdx] = useState(0)

  // Keep activeIdx in sync with native scroll position
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const onScroll = () => {
      const card = el.children[0] as HTMLElement | undefined
      if (!card) return
      const step = card.offsetWidth + GAP
      setActiveIdx(Math.round(el.scrollLeft / step))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [featured.length])

  const scrollTo = useCallback((idx: number) => {
    const el = trackRef.current
    if (!el) return
    const card = el.children[0] as HTMLElement | undefined
    if (!card) return
    const step = card.offsetWidth + GAP
    const clamped = Math.max(0, Math.min(idx, featured.length - 1))
    el.scrollTo({ left: clamped * step, behavior: 'smooth' })
    setActiveIdx(clamped)
  }, [featured.length])

  // Auto-scroll every 4 s, pauses while hovering
  useEffect(() => {
    if (loading || featured.length <= 1) return
    const id = setInterval(() => {
      if (hoverRef.current) return
      setActiveIdx(prev => {
        const next = prev >= featured.length - 1 ? 0 : prev + 1
        scrollTo(next)
        return next
      })
    }, 4000)
    return () => clearInterval(id)
  }, [loading, featured.length, scrollTo])

  if (loading || featured.length === 0) return null

  return (
    <section className="bg-[#1a1410] py-16 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#c5611a] mb-1.5">
              Sélection
            </p>
            <h2 className="font-serif text-2xl md:text-3xl font-black text-white leading-tight">
              Nos <em className="not-italic text-[#f4a828]">coups de cœur</em>
            </h2>
          </div>

          {/* Prev / Next */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => scrollTo(activeIdx - 1)}
              disabled={activeIdx === 0}
              aria-label="Précédent"
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center
                         text-white/50 hover:border-[#c5611a] hover:text-[#c5611a]
                         disabled:opacity-25 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scrollTo(activeIdx + 1)}
              disabled={activeIdx >= featured.length - 1}
              aria-label="Suivant"
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center
                         text-white/50 hover:border-[#c5611a] hover:text-[#c5611a]
                         disabled:opacity-25 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Track */}
        <div
          ref={trackRef}
          onMouseEnter={() => { hoverRef.current = true }}
          onMouseLeave={() => { hoverRef.current = false }}
          className="flex overflow-x-auto snap-x snap-mandatory pb-2"
          style={{ gap: GAP, scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {featured.map((r) => {
            const CuisineIcon = getCuisineIcon(r.cuisine)
            return (
              <Link
                key={r.id}
                to={`/restaurants/${r.id}`}
                className="snap-start shrink-0 w-[290px] md:w-[320px] rounded-2xl overflow-hidden group
                           transition-transform duration-300 hover:-translate-y-1.5"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}
              >
                {/* Image */}
                <div
                  className="h-52 relative overflow-hidden"
                  style={!r.image_url ? { background: getGradient(r.gradient) } : {}}
                >
                  {r.image_url ? (
                    <img
                      src={r.image_url} alt={r.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg">
                      <CuisineIcon size={56} className="text-white/80" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />

                  {/* Plan badge */}
                  {r.plan === 'premium' ? (
                    <div
                      className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.68rem] font-bold text-white"
                      style={{
                        background: 'linear-gradient(135deg,#f4a828,#c5611a)',
                        boxShadow: '0 2px 12px rgba(197,97,26,0.55)',
                      }}
                    >
                      <Crown size={10} /> Premium
                    </div>
                  ) : (
                    <div
                      className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.68rem] font-bold text-white"
                      style={{
                        background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
                        boxShadow: '0 2px 12px rgba(109,40,217,0.4)',
                      }}
                    >
                      <Sparkles size={10} /> Pro
                    </div>
                  )}

                  {/* Cuisine tag */}
                  <div className="absolute bottom-3 left-3 bg-black/65 backdrop-blur-sm text-white text-[0.68rem] font-semibold px-2.5 py-1 rounded-full">
                    {r.flag} {r.cuisine_label}
                  </div>
                </div>

                {/* Card body */}
                <div className="bg-[#241e18] p-4">
                  <h3 className="font-serif font-bold text-white text-[0.95rem] leading-snug mb-2 group-hover:text-[#f4a828] transition-colors line-clamp-1">
                    {r.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[0.72rem] text-white/45 flex items-center gap-1">
                      <MapPin size={11} /> {r.location}
                    </span>
                    {r.reviews > 0 ? (
                      <span className="text-[0.72rem] font-semibold text-white/80 flex items-center gap-1">
                        <StarRating rating={r.rating ?? 0} />
                        {r.rating}{' '}
                        <span className="text-white/35 font-normal">({r.reviews})</span>
                      </span>
                    ) : (
                      <span className="text-[0.72rem] text-white/35 italic">Nouveau</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Dots */}
        {featured.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {featured.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                aria-label={`Aller au restaurant ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIdx ? 'w-6 bg-[#c5611a]' : 'w-1.5 bg-white/20 hover:bg-white/35'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
