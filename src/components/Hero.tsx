import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ChevronDown, Search, MapPin, ShieldCheck, ArrowRight, Utensils, X, Crown, Sparkles,
} from 'lucide-react'
import { useRestaurants } from '../hooks/useRestaurants'
import { TABS } from '../data/restaurants'
import StarRating from './ui/StarRating'
import { getCuisineIcon } from '../lib/cuisineIcons'
import { getGradient } from '../lib/gradients'
import { getEffectivelyOpen } from '../lib/scheduleParser'
import { supabase } from '../lib/supabase'
import heroBg from '../assets/top-view-shakh-plov-delicious.jpg'
import woodTexture from '../assets/WoodGrain08-byGhostlyPixels.png'

interface HeroSlide {
  id: string
  name: string
  image_url: string | null
  gradient: string
  flag: string
  cuisine_label: string
  location: string
}

export default function Hero() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [slideIdx, setSlideIdx] = useState(0)
  const hoverRef = useRef(false)

  useEffect(() => {
    supabase
      .from('restaurants')
      .select('id, name, image_url, gradient, flag, cuisine_label, location')
      .eq('is_home_featured', true)
      .eq('is_active', true)
      .then(({ data }) => { if (data?.length) setSlides(data as HeroSlide[]) })
  }, [])

  // slide 0 = static image, 1..n = featured restaurants
  const totalSlides       = 1 + slides.length
  const isStatic          = slideIdx === 0
  const currentRestaurant = isStatic ? null : slides[slideIdx - 1]

  useEffect(() => {
    if (slides.length === 0) return
    const id = setInterval(() => {
      if (!hoverRef.current) setSlideIdx(prev => (prev + 1) % totalSlides)
    }, 5000)
    return () => clearInterval(id)
  }, [slides.length, totalSlides])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
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

      {/* Static slide (slide 0) */}
      <div
        className="absolute inset-0 overflow-hidden transition-opacity duration-1000 pointer-events-none"
        style={{
          opacity: isStatic ? 1 : 0,
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderBottomLeftRadius: '50% 45%',
          borderBottomRightRadius: '50% 45%',
          boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
        }}
      />
      {/* Restaurant slides (slides 1..n) */}
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className="absolute inset-0 overflow-hidden transition-opacity duration-1000 pointer-events-none"
          style={{
            opacity: i + 1 === slideIdx ? 1 : 0,
            ...(slide.image_url
              ? { backgroundImage: `url(${slide.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: getGradient(slide.gradient) }
            ),
            borderBottomLeftRadius: '50% 45%',
            borderBottomRightRadius: '50% 45%',
            boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
          }}
        />
      ))}
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
          {t('hero.find_food')}
          <span className="animate-chevron-bob inline-flex">
            <ChevronDown size={20} strokeWidth={2.5} />
          </span>
        </button>
      </div>

      <div
        className="relative z-10 flex-1 flex items-end"
        onMouseEnter={() => { hoverRef.current = true }}
        onMouseLeave={() => { hoverRef.current = false }}
      >
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 pb-20 md:pb-28">

          {/* Content area */}
          {isStatic ? (
            <div key="static" style={{ animation: 'fadeInUp 0.6s ease both' }}>
              <h1
                className="font-serif font-black leading-[1.05] tracking-tight text-white"
                style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)', textShadow: '0 4px 24px rgba(0,0,0,0.45)' }}
              >
                {t('hero.headline1')}{' '}
                <span className="text-shimmer">{t('hero.headline_shimmer')}</span>
                <br />
                {t('hero.headline2')}
              </h1>
              <p
                className="mt-6 max-w-2xl text-base md:text-lg leading-[1.75]"
                style={{ color: 'rgba(248,248,248,0.85)', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
              >
                {t('hero.subtext')}
              </p>
            </div>
          ) : currentRestaurant ? (
            <div key={currentRestaurant.id} style={{ animation: 'fadeInUp 0.6s ease both' }}>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] mb-3"
                style={{ color: '#f4a828' }}>
                {currentRestaurant.flag}&nbsp; {currentRestaurant.cuisine_label}
              </p>
              <h2
                className="font-serif font-black text-white leading-[1.05] tracking-tight mb-4"
                style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', textShadow: '0 4px 24px rgba(0,0,0,0.55)' }}
              >
                {currentRestaurant.name}
              </h2>
              <p className="text-white/60 text-sm flex items-center gap-1.5 mb-7">
                <MapPin size={13} /> {currentRestaurant.location}
              </p>
              <Link
                to={`/restaurants/${currentRestaurant.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-dark transition-all hover:shadow-[0_8px_24px_rgba(244,168,40,0.45)] hover:-translate-y-0.5"
                style={{ backgroundColor: '#f4a828' }}
              >
                Découvrir ce restaurant <ArrowRight size={15} />
              </Link>
            </div>
          ) : null}

          {/* Dots — visible only when restaurant slides exist */}
          {slides.length > 0 && (
            <div className="flex gap-2 mt-8">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIdx(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === slideIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/55'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {open && <RestaurantsModal onClose={() => setOpen(false)} />}
    </section>
  )
}

function RestaurantsModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { restaurants: allRestaurants, loading } = useRestaurants()
  // Home cooks and pop-ups have their own dedicated listing (/home-chef) —
  // this modal, like /restaurants, should only surface physical restaurants.
  const restaurants = useMemo(() => allRestaurants.filter(r => r.type === 'restaurant'), [allRestaurants])
  const [cuisine, setCuisine] = useState('all')
  const [ville, setVille] = useState('')
  const [note, setNote] = useState(0)
  const [search, setSearch] = useState('')

  const VILLES = [
    { label: t('restaurants_page.all'), val: '' },
    { label: 'Casablanca', val: 'Casablanca' },
    { label: 'Rabat', val: 'Rabat' },
    { label: 'Marrakech', val: 'Marrakech' },
    { label: 'Tanger', val: 'Tanger' },
  ]
  const NOTES = [
    { label: t('restaurants_page.all'), val: 0 },
    { label: '4.5+', val: 4.5 },
    { label: '4.8+', val: 4.8 },
  ]

  const filtered = useMemo(() => restaurants.filter(r => {
    if (cuisine !== 'all' && r.cuisine !== cuisine) return false
    if (ville !== '' && r.location !== ville) return false
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
      aria-label={t('hero.find_food')}
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
            aria-label={t('hero.close')}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-white/15"
            style={{ color: '#f8f8f8', backgroundColor: 'rgba(248,248,248,0.08)' }}
          >
            <X size={18} />
          </button>

          <div className="text-[0.7rem] font-semibold tracking-[0.18em] uppercase mb-2"
            style={{ color: '#c5611a' }}>
            {t('hero.modal_label')}
          </div>
          <h2 className="font-serif font-black leading-tight"
            style={{ color: '#f8f8f8', fontSize: 'clamp(1.5rem, 2.6vw, 2rem)' }}>
            {t('hero.modal_title_before')} <em style={{ color: '#c5611a', fontStyle: 'italic' }}>{t('hero.modal_title_em')}</em>
          </h2>
          <p className="text-sm mt-1" style={{ color: 'rgba(248,248,248,0.65)' }}>
            {t('hero.modal_count', { count: restaurants.length })}
          </p>
        </div>

        {/* Filters + grid scrollable */}
        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6" style={{ backgroundColor: '#fff' }}>
          {/* Search */}
          <div className="relative mb-5">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted flex items-center">
              <Search size={17} />
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('hero.search_placeholder')}
              className="w-full pl-11 pr-4 py-3 rounded-xl text-dark text-sm border border-black/10 focus:outline-none focus:border-gold transition-all"
              style={{ backgroundColor: '#f2f2f2' }}
            />
          </div>

          {/* Cuisine — circular icon rail, same pattern as /restaurants */}
          <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-2 mb-4">
            {TABS.map(tab => {
              const [flag, ...rest] = tab.label.split(' ')
              const name = rest.join(' ')
              const active = cuisine === tab.id
              return (
                <button key={tab.id} onClick={() => setCuisine(tab.id)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all"
                    style={{ backgroundColor: '#f2f2f2', boxShadow: active ? '0 0 0 2px #c5611a' : 'none' }}>
                    {flag}
                  </div>
                  <span className={`text-[0.68rem] text-center leading-tight ${active ? 'text-dark font-bold' : 'text-muted font-medium'}`}>
                    {name}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Ville / Note / Reset — neutral pills */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {VILLES.map(v => (
              <button key={v.val || 'all'} onClick={() => setVille(v.val)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  ville === v.val ? 'bg-dark text-white' : 'text-dark/70 hover:bg-black/10'
                }`}
                style={ville === v.val ? {} : { backgroundColor: '#f2f2f2' }}>
                {v.val && <MapPin size={11} className="inline -mt-0.5 mr-1" />}{v.label}
              </button>
            ))}
            {NOTES.map(n => (
              <button key={n.val} onClick={() => setNote(n.val)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  note === n.val ? 'bg-dark text-white' : 'text-dark/70 hover:bg-black/10'
                }`}
                style={note === n.val ? {} : { backgroundColor: '#f2f2f2' }}>
                {n.label}
              </button>
            ))}
            <button
              onClick={() => { setCuisine('all'); setVille(''); setNote(0); setSearch('') }}
              className="ml-auto px-3.5 py-1.5 rounded-full text-xs font-semibold text-muted hover:text-gold transition-all">
              {t('hero.reset')}
            </button>
          </div>

          <p className="text-sm mb-5" style={{ color: '#80716a' }}>
            <span className="font-semibold" style={{ color: '#1f1f1f' }}>{filtered.length}</span>{' '}
            {filtered.length === 1 ? t('hero.results_one') : t('hero.results_other')}
          </p>

          {loading ? (
            <div className="text-center py-16" style={{ color: '#80716a' }}>{t('hero.loading')}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Utensils size={48} className="mx-auto mb-3" style={{ color: '#c5611a' }} />
              <h3 className="font-serif text-lg font-bold mb-1" style={{ color: '#1f1f1f' }}>{t('hero.no_results')}</h3>
              <p className="text-sm" style={{ color: '#80716a' }}>{t('hero.no_results_sub')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((r) => {
                const CuisineIcon = getCuisineIcon(r.cuisine)
                const isOpen = getEffectivelyOpen(r)
                return (
                  <Link
                    key={r.id}
                    to={`/restaurants/${r.id}`}
                    onClick={onClose}
                    className="bg-white rounded-xl overflow-hidden border border-black/[0.08] block transition-all duration-300
                               hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)]"
                  >
                    <div className="relative">
                      <div className="h-32 relative overflow-hidden"
                        style={!r.image_url ? { background: getGradient(r.gradient) } : {}}>
                        {r.image_url ? (
                          <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg">
                            <CuisineIcon size={40} className="text-white/90" />
                          </div>
                        )}
                        {r.plan === 'premium' && (
                          <div className="absolute top-2.5 left-2.5 text-[0.65rem] font-bold px-2 py-1 rounded-md flex items-center gap-1"
                            style={{ backgroundColor: '#c5611a', color: '#fff' }}>
                            <Crown size={10} /> Premium
                          </div>
                        )}
                        {r.plan === 'pro' && (
                          <div className="absolute top-2.5 left-2.5 text-[0.65rem] font-bold px-2 py-1 rounded-md flex items-center gap-1"
                            style={{ backgroundColor: '#7c3aed', color: '#fff' }}>
                            <Sparkles size={10} /> Pro
                          </div>
                        )}
                        {r.plan !== 'premium' && r.plan !== 'pro' && r.is_verified && (
                          <div className="absolute top-2.5 left-2.5 bg-green-600 text-white text-[0.65rem] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                            <ShieldCheck size={10} /> {t('hero.verified')}
                          </div>
                        )}
                        {!isOpen && (
                          <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                            <span className="text-white text-xs font-bold px-3 py-1 rounded-full bg-black/50">
                              {t('hero.closed')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-4 left-3 w-10 h-10 rounded-full bg-white border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.20)] flex items-center justify-center text-lg">
                        {r.flag}
                      </div>
                    </div>
                    <div className="p-3.5 pt-6">
                      <h3 className="font-bold text-sm leading-snug mb-1.5 truncate" style={{ color: '#1f1f1f' }}>{r.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs flex-wrap" style={{ color: '#80716a' }}>
                        {r.reviews > 0 ? (
                          <span className="flex items-center gap-1 font-semibold" style={{ color: '#1f1f1f' }}>
                            <StarRating rating={r.rating ?? 0} /> {r.rating}
                            <span className="font-normal" style={{ color: '#80716a' }}>({r.reviews})</span>
                          </span>
                        ) : (
                          <span className="italic">{t('hero.no_reviews')}</span>
                        )}
                      </div>
                      <p className="text-[0.7rem] mt-1 flex items-center gap-1 truncate" style={{ color: '#80716a' }}>
                        <MapPin size={10} /> {r.location}
                      </p>
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
