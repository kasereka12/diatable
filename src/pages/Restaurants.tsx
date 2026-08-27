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
import { Search, MapPin, ShieldCheck, Utensils, Crown, Sparkles, Clock, ChevronRight } from 'lucide-react'
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
    { type: 'restaurant', cuisine, city: ville, minRating: note, search: debouncedSearch },
    page,
  )
  const filtered = data?.data ?? []
  const total = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function resetFilters() {
    setCuisine('all'); setVille(''); setNote(0); setSearch('')
  }

  return (
    <div className="bg-white min-h-screen pt-24" ref={ref}>
      <div className="max-w-6xl mx-auto px-6 pt-6">
        {/* Breadcrumb */}
        <p className="text-xs text-muted mb-2 flex items-center gap-1" data-reveal>
          <span className="text-gold font-semibold">Maroc</span> <ChevronRight size={11} /> {t('restaurants_page.title')}
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-black text-dark mb-6" data-reveal data-delay="0.05s">
          {t('restaurants_page.title')}
        </h1>

        {/* Search */}
        <div className="relative mb-6" data-reveal data-delay="0.1s">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted flex items-center">
            <Search size={17} />
          </span>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('restaurants_page.search_placeholder')}
            className="w-full pl-11 pr-4 py-3 rounded-xl text-dark text-sm border border-black/10
                       focus:outline-none focus:border-gold transition-all"
            style={{ backgroundColor: '#f2f2f2' }}
          />
        </div>

        {/* Cuisine — circular icon rail, Glovo-style category strip */}
        <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-2 mb-5" data-reveal data-delay="0.12s">
          {TABS.map(tab => {
            const [flag, ...rest] = tab.label.split(' ')
            const name = rest.join(' ')
            const active = cuisine === tab.id
            return (
              <button key={tab.id} onClick={() => setCuisine(tab.id)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all"
                  style={{
                    backgroundColor: '#f2f2f2',
                    boxShadow: active ? '0 0 0 2px #c5611a' : 'none',
                  }}>
                  {flag}
                </div>
                <span className={`text-[0.7rem] text-center leading-tight ${active ? 'text-dark font-bold' : 'text-muted font-medium'}`}>
                  {name}
                </span>
              </button>
            )
          })}
        </div>

        {/* Ville / Note / Reset — neutral grey pills */}
        <div className="flex flex-wrap items-center gap-2 mb-8" data-reveal data-delay="0.15s">
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
          <button onClick={resetFilters}
            className="ml-auto px-3.5 py-1.5 rounded-full text-xs font-semibold text-muted hover:text-gold transition-all">
            {t('hero.reset')}
          </button>
        </div>
      </div>

      <FeaturedCarousel />

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Section label */}
        <div className="flex items-center justify-between mb-5" data-reveal>
          <h2 className="font-serif text-xl font-bold text-dark">{t('restaurants_page.title')}</h2>
          <p className="text-muted text-sm">
            <span className="text-dark font-semibold">{total}</span>{' '}
            {total === 1 ? t('restaurants_page.results_one') : t('restaurants_page.results_other')}
          </p>
        </div>

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
                  className="bg-white rounded-xl overflow-hidden border border-black/[0.08] transition-all duration-300 block
                             hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)]"
                  onMouseEnter={() => queryClient.prefetchQuery({
                    queryKey: ['vendeur', r.id, 'detail'],
                    queryFn:  () => fetchVendeurDetail(r.id),
                  })}
                >
                  <div className="relative">
                    <div className="h-36 relative overflow-hidden" style={!r.image_url ? { background: getGradient(r.gradient) } : {}}>
                      {r.image_url ? (
                        <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg">
                          <CuisineIcon size={44} className="text-white/90" />
                        </div>
                      )}
                      {r.plan === 'premium' && (
                        <div className="absolute top-2.5 left-2.5 text-[0.65rem] font-bold px-2 py-1 rounded-md flex items-center gap-1"
                          style={{ backgroundColor: '#c5611a', color: '#fff' }}>
                          <Crown size={10} /> {t('restaurants_page.premium')}
                        </div>
                      )}
                      {r.plan === 'pro' && (
                        <div className="absolute top-2.5 left-2.5 text-[0.65rem] font-bold px-2 py-1 rounded-md flex items-center gap-1"
                          style={{ backgroundColor: '#7c3aed', color: '#fff' }}>
                          <Sparkles size={10} /> {t('restaurants_page.pro')}
                        </div>
                      )}
                      {r.plan !== 'premium' && r.plan !== 'pro' && r.is_verified && (
                        <div className="absolute top-2.5 left-2.5 bg-green-600 text-white text-[0.65rem] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                          <ShieldCheck size={10} /> {t('restaurants_page.verified')}
                        </div>
                      )}
                      {!isOpen && (
                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                          <span className="text-white text-xs font-bold px-3 py-1 rounded-full bg-black/50">
                            {t('restaurants_page.closed')}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Cuisine "logo bug" — overlaps the bottom-left corner like a store's own logo */}
                    <div className="absolute -bottom-4 left-3 w-10 h-10 rounded-full bg-white border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.20)] flex items-center justify-center text-lg">
                      {r.flag}
                    </div>
                  </div>
                  <div className="p-3.5 pt-6">
                    <h3 className="font-bold text-dark text-sm leading-snug mb-1.5 truncate">{r.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted flex-wrap">
                      {r.reviews > 0 ? (
                        <span className="flex items-center gap-1 font-semibold text-dark">
                          <StarRating rating={r.rating ?? 0} /> {r.rating}
                          <span className="text-muted font-normal">({r.reviews})</span>
                        </span>
                      ) : (
                        <span className="italic">{t('restaurants_page.no_reviews')}</span>
                      )}
                      <span className="text-black/20">•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {r.prep_time_min ?? 15}-{(r.prep_time_min ?? 15) + 10} min
                      </span>
                    </div>
                    <p className="text-muted text-[0.7rem] mt-1 flex items-center gap-1 truncate">
                      <MapPin size={10} /> {r.location}
                    </p>
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
