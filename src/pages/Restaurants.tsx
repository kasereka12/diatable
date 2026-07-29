import { useState, useEffect } from 'react'
import FeaturedCarousel from '../components/FeaturedCarousel'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { useRestaurantListings, PAGE_SIZE } from '../hooks/useRestaurantListings'
import { fetchVendeurDetail } from '../hooks/useVendeurDetail'
import { TABS } from '../data/restaurants'
import StarRating from '../components/ui/StarRating'
import { getCuisineIcon } from '../lib/cuisineIcons'
import PaginationControls from '../components/ui/PaginationControls'
import { Search, MapPin, ShieldCheck, ArrowRight, Utensils, Crown, Sparkles } from 'lucide-react'
import { getGradient } from '../lib/gradients'
import { getEffectivelyOpen } from '../lib/scheduleParser'

export default function Restaurants() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [cuisine, setCuisine]   = useState('all')
  const [ville,   setVille]     = useState('')
  const [note,    setNote]      = useState(0)
  const [search,  setSearch]    = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const ref = useScrollReveal()

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

  // Debounce the free-text search so we don't fire a query on every
  // keystroke — filtering now happens server-side (paginated), unlike the
  // old in-memory filter which could react instantly.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(id)
  }, [search])

  // Any filter change restarts pagination from page 1.
  useEffect(() => { setPage(0) }, [cuisine, ville, note, debouncedSearch])

  const { data, isLoading: loading, isPlaceholderData } = useRestaurantListings(
    { cuisine, city: ville, minRating: note, search: debouncedSearch },
    page,
  )
  const filtered = data?.data ?? []
  const total = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function resetFilters() {
    setCuisine('all'); setVille(''); setNote(0); setSearch('')
  }

  return (
    <div className="bg-cream min-h-screen pt-24" ref={ref}>
      {/* Page header */}
      <div className="bg-dark py-16 relative overflow-hidden">
        <div className="absolute inset-0 zellige-pattern opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark/80" />
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <p className="section-label" data-reveal>{t('nav.explore')}</p>
          <h1 className="font-serif text-4xl md:text-5xl font-black text-white mb-4" data-reveal data-delay="0.1s">
            {t('restaurants_page.title')}
          </h1>
          <p className="text-light/70 max-w-xl mx-auto" data-reveal data-delay="0.2s">
            {t('restaurants_page.subtitle')}
          </p>
        </div>
      </div>

      <FeaturedCarousel />

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
              placeholder={t('restaurants_page.search_placeholder')}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-black/10 bg-cream text-dark text-sm
                         focus:outline-none focus:border-gold transition-all"
            />
          </div>
          {/* Filter row */}
          <div className="flex flex-wrap gap-3">
            {/* Cuisine */}
            <div className="flex-1 min-w-[160px]">
              <label className="block text-[0.68rem] font-bold uppercase tracking-widest text-muted mb-1.5">{t('restaurants_page.cuisine')}</label>
              <select value={cuisine} onChange={e => setCuisine(e.target.value)}
                className="w-full bg-cream border border-black/10 rounded-xl px-3 py-2.5 text-dark text-sm focus:outline-none focus:border-gold">
                {TABS.map(tab => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
              </select>
            </div>
            {/* Ville */}
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[0.68rem] font-bold uppercase tracking-widest text-muted mb-1.5">{t('restaurants_page.city')}</label>
              <select value={ville} onChange={e => setVille(e.target.value)}
                className="w-full bg-cream border border-black/10 rounded-xl px-3 py-2.5 text-dark text-sm focus:outline-none focus:border-gold">
                {VILLES.map(v => <option key={v.val} value={v.val}>{v.label}</option>)}
              </select>
            </div>
            {/* Note */}
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[0.68rem] font-bold uppercase tracking-widest text-muted mb-1.5">{t('restaurants_page.min_rating')}</label>
              <select value={note} onChange={e => setNote(parseFloat(e.target.value))}
                className="w-full bg-cream border border-black/10 rounded-xl px-3 py-2.5 text-dark text-sm focus:outline-none focus:border-gold">
                {NOTES.map(n => <option key={n.val} value={n.val}>{n.label}</option>)}
              </select>
            </div>
            {/* Reset */}
            <button onClick={resetFilters}
              className="self-end px-4 py-2.5 rounded-xl border border-black/10 text-muted text-sm hover:text-gold hover:border-gold transition-all">
              {t('hero.reset')}
            </button>
          </div>
        </div>

        {/* Results count */}
        <p className="text-muted text-sm mb-6" data-reveal>
          <span className="text-dark font-semibold">{total}</span>{' '}
          {total === 1 ? t('restaurants_page.results_one') : t('restaurants_page.results_other')}
        </p>

        {loading && !isPlaceholderData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-black/5 animate-pulse">
                <div className="h-44 bg-black/[0.06]" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-black/[0.06] rounded w-3/4" />
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-black/[0.06] rounded w-1/3" />
                    <div className="h-3 bg-black/[0.06] rounded w-1/4" />
                  </div>
                  <div className="h-3 bg-black/[0.06] rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="flex justify-center mb-4">
              <Utensils size={56} className="text-gold" />
            </div>
            <h3 className="font-serif text-xl font-bold text-dark mb-2">{t('restaurants_page.no_results')}</h3>
            <p className="text-muted">{t('restaurants_page.no_results_sub')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {filtered.map((r, i) => {
              const CuisineIcon = getCuisineIcon(r.cuisine)
              const isOpen = getEffectivelyOpen(r)
              return (
                <Link
                  key={r.id}
                  to={`/restaurants/${r.id}`}
                  data-reveal data-delay={`${(i % 3) * 0.08}s`}
                  className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)]
                             border border-black/5 transition-all duration-300 block
                             hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.15)]"
                  onMouseEnter={() => queryClient.prefetchQuery({
                    queryKey: ['vendeur', r.id, 'detail'],
                    queryFn:  () => fetchVendeurDetail(r.id),
                  })}
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
                    {r.plan === 'premium' && (
                      <div className="absolute top-3 right-3 text-[0.65rem] font-bold px-2 py-1 rounded-full flex items-center gap-1"
                        style={{ backgroundColor: 'rgba(197,97,26,0.90)', color: '#fff' }}>
                        <Crown size={10} /> {t('restaurants_page.premium')}
                      </div>
                    )}
                    {r.plan === 'pro' && (
                      <div className="absolute top-3 right-3 text-[0.65rem] font-bold px-2 py-1 rounded-full flex items-center gap-1"
                        style={{ backgroundColor: 'rgba(124,58,237,0.88)', color: '#fff' }}>
                        <Sparkles size={10} /> {t('restaurants_page.pro')}
                      </div>
                    )}
                    {r.plan !== 'premium' && r.plan !== 'pro' && r.is_verified && (
                      <div className="absolute top-3 right-3 bg-green-500/90 text-white text-[0.68rem] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <ShieldCheck size={12} /> {t('restaurants_page.verified')}
                      </div>
                    )}
                    <div className={`absolute bottom-3 left-3 text-[0.68rem] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${isOpen ? 'bg-green-500/90 text-white' : 'bg-black/60 text-white/80'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-white' : 'bg-white/50'}`} />
                      {isOpen ? t('restaurants_page.open') : t('restaurants_page.closed')}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif font-bold text-dark text-base leading-snug mb-2">{r.name}</h3>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-muted text-xs flex items-center gap-1">
                        <MapPin size={12} /> {r.location}
                      </span>
                      {r.reviews > 0 ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-dark">
                          <StarRating rating={r.rating ?? 0}   />
                          {r.rating} <span className="text-muted font-normal">({r.reviews})</span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted italic">{t('restaurants_page.no_reviews')}</span>
                      )}
                    </div>
                    <div className=" text-sm font-semibold flex items-center gap-1" style={{ color: '#c5611a' }}>
                      {t('restaurants_page.view_profile')} <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && (
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} className="mt-10" />
        )}
      </div>
    </div>
  )
}
