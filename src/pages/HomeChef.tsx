import { useState, useEffect } from 'react'
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
import HomeChefLoader from '../components/HomeChefLoader'
import { Search, MapPin, ShieldCheck, ArrowRight, ChefHat } from 'lucide-react'
import { getGradient } from '../lib/gradients'
import { getEffectivelyOpen } from '../lib/scheduleParser'

export default function HomeChef() {
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

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(id)
  }, [search])

  useEffect(() => { setPage(0) }, [cuisine, ville, note, debouncedSearch])

  const { data, isLoading: loading, isPlaceholderData } = useRestaurantListings(
    { type: 'homecook', cuisine, city: ville, minRating: note, search: debouncedSearch },
    page,
  )
  const filtered = data?.data ?? []
  const total = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function resetFilters() {
    setCuisine('all'); setVille(''); setNote(0); setSearch('')
  }

  // First visit to the page gets a full-screen branded loader, held for at
  // least 3s so it actually registers instead of flashing by on a fast
  // connection.
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setMinTimeElapsed(true), 3000)
    return () => clearTimeout(id)
  }, [])

  const showFullPageLoader = !data || !minTimeElapsed

  // The loader is a fixed overlay covering the navbar/footer too — lock body
  // scroll so it can't be scrolled away to reveal them underneath.
  useEffect(() => {
    document.body.style.overflow = showFullPageLoader ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showFullPageLoader])

  if (showFullPageLoader) {
    return <HomeChefLoader fullPage />
  }

  return (
    <div className="min-h-screen pt-24" style={{ backgroundColor: '#f2ebe0' }} ref={ref}>
      <div className="w-full px-6 md:px-12 lg:px-20 py-12">
        {/* Search + Filters */}
        <div className="rounded-[1.75rem] bg-white p-5 mb-10" style={{ border: '1.5px dashed rgba(197,97,26,0.35)' }} data-reveal>
          {/* Search bar */}
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted flex items-center">
              <Search size={18} />
            </span>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('home_chef_page.search_placeholder')}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-black/10 text-dark text-sm"
              style={{ backgroundColor: '#f2ebe0' }}
            />
          </div>
          {/* Filter row */}
          <div className="flex flex-wrap gap-3">
            {/* Cuisine */}
            <div className="flex-1 min-w-[160px]">
              <label className="block text-[0.68rem] font-bold uppercase tracking-widest text-muted mb-1.5">{t('restaurants_page.cuisine')}</label>
              <select value={cuisine} onChange={e => setCuisine(e.target.value)}
                className="w-full border border-black/10 rounded-xl px-3 py-2.5 text-dark text-sm focus:outline-none focus:border-gold"
                style={{ backgroundColor: '#f2ebe0' }}>
                {TABS.map(tab => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
              </select>
            </div>
            {/* Ville */}
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[0.68rem] font-bold uppercase tracking-widest text-muted mb-1.5">{t('restaurants_page.city')}</label>
              <select value={ville} onChange={e => setVille(e.target.value)}
                className="w-full border border-black/10 rounded-xl px-3 py-2.5 text-dark text-sm focus:outline-none focus:border-gold"
                style={{ backgroundColor: '#f2ebe0' }}>
                {VILLES.map(v => <option key={v.val} value={v.val}>{v.label}</option>)}
              </select>
            </div>
            {/* Note */}
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[0.68rem] font-bold uppercase tracking-widest text-muted mb-1.5">{t('restaurants_page.min_rating')}</label>
              <select value={note} onChange={e => setNote(parseFloat(e.target.value))}
                className="w-full border border-black/10 rounded-xl px-3 py-2.5 text-dark text-sm focus:outline-none focus:border-gold"
                style={{ backgroundColor: '#f2ebe0' }}>
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
        <p className="text-muted text-sm mb-8" data-reveal>
          <span className="text-dark font-semibold">{total}</span>{' '}
          {total === 1 ? t('restaurants_page.results_one') : t('restaurants_page.results_other')}
        </p>

        {loading && !isPlaceholderData ? (
          <HomeChefLoader />
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="flex justify-center mb-4">
              <ChefHat size={56} className="text-gold" />
            </div>
            <h3 className="font-serif text-xl font-bold text-dark mb-2">{t('restaurants_page.no_results')}</h3>
            <p className="text-muted">{t('restaurants_page.no_results_sub')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-7 gap-y-14">
            {filtered.map((r, i) => {
              const CuisineIcon = getCuisineIcon(r.cuisine)
              const isOpen = getEffectivelyOpen(r)
              return (
                <Link
                  key={r.id}
                  to={`/restaurants/${r.id}`}
                  data-reveal data-delay={`${(i % 3) * 0.08}s`}
                  className="relative flex flex-col items-center text-center rounded-[1.75rem] pt-14 pb-6 px-5
                             transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
                  style={{ backgroundColor: '#fff', border: '1.5px dashed rgba(197,97,26,0.35)' }}
                  onMouseEnter={() => queryClient.prefetchQuery({
                    queryKey: ['vendeur', r.id, 'detail'],
                    queryFn:  () => fetchVendeurDetail(r.id),
                  })}
                >
                  {/* Chef "portrait" avatar, overlapping the card top — the defining visual break from the rectangular restaurant photo cards */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
                    style={{
                      border: '4px solid #f2ebe0',
                      boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
                      ...(!r.image_url ? { background: getGradient(r.gradient) } : {}),
                    }}>
                    {r.image_url ? (
                      <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <CuisineIcon size={34} className="text-white/90" />
                    )}
                  </div>
                  {/* Handmade "stamp" badge on the avatar */}
                  <div className="absolute flex items-center justify-center rounded-full bg-white"
                    style={{
                      top: 30, left: 'calc(50% + 26px)',
                      width: 32, height: 32, border: '2px dashed #c5611a', transform: 'rotate(-10deg)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                    }}
                    title={t('home_chef_page.handmade')}>
                    <ChefHat size={13} style={{ color: '#c5611a' }} />
                  </div>

                  <p className="text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: '#c5611a' }}>
                    {t('home_chef_page.slogan', { name: r.name })}
                  </p>
                  <h3 className="font-serif font-bold text-dark text-lg leading-snug mt-1">{r.name}</h3>

                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2 text-xs" style={{ color: '#80716a' }}>
                    <span>{r.flag} {r.cuisine_label}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><MapPin size={11} /> {r.location}</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                    <span className={`text-[0.62rem] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${isOpen ? 'bg-green-500/15 text-green-700' : 'bg-black/5 text-muted'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-green-600' : 'bg-black/30'}`} />
                      {isOpen ? t('restaurants_page.open') : t('restaurants_page.closed')}
                    </span>
                    {r.is_verified && (
                      <span className="text-[0.62rem] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 bg-green-500/15 text-green-700">
                        <ShieldCheck size={10} /> {t('restaurants_page.verified')}
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    {r.reviews > 0 ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-dark">
                        <StarRating rating={r.rating ?? 0} />
                        {r.rating} <span className="text-muted font-normal">({r.reviews})</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted italic">{t('restaurants_page.no_reviews')}</span>
                    )}
                  </div>

                  <div className="mt-4 pt-4 w-full flex items-center justify-center gap-1 text-sm font-semibold"
                    style={{ borderTop: '1px dashed rgba(197,97,26,0.25)', color: '#c5611a' }}>
                    {t('restaurants_page.view_profile')} <ArrowRight size={14} />
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
