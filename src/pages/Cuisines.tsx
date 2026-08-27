import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { supabase } from '../lib/supabase'
import { getCuisineIcon } from '../lib/cuisineIcons'
import { ChevronRight, Utensils, Globe } from 'lucide-react'
import FeaturedCuisines from '../components/FeaturedCuisines'
import CuisineFilter from '../components/CuisineFilter'
import FeaturedCarousel from '../components/FeaturedCarousel'
import PageHero from '../components/ui/PageHero'

// Visual mapping — UI-only, not stored in DB
const CUISINE_META: Record<string, { bg: string; dish: string }> = {
  senegalaise: { bg: 'linear-gradient(135deg,#e8521a,#f4a828)',  dish: 'Thiéboudienne' },
  libanaise:   { bg: 'linear-gradient(135deg,#1b5e20,#43a047)',  dish: 'Mezze' },
  chinoise:    { bg: 'linear-gradient(135deg,#b71c1c,#e53935)',  dish: 'Dim Sum' },
  syrienne:    { bg: 'linear-gradient(135deg,#4a148c,#7b1fa2)',  dish: 'Shawarma' },
  francaise:   { bg: 'linear-gradient(135deg,#0d47a1,#1565c0)',  dish: 'Croissants' },
  italienne:   { bg: 'linear-gradient(135deg,#c62828,#1b5e20)',  dish: 'Pasta' },
  nigeriane:   { bg: 'linear-gradient(135deg,#1b5e20,#f9a825)',  dish: 'Jollof Rice' },
  indienne:    { bg: 'linear-gradient(135deg,#e65100,#fbc02d)',  dish: 'Curry' },
  bresilienne: { bg: 'linear-gradient(135deg,#1b5e20,#0d47a1)',  dish: 'Feijoada' },
  ivoirienne:  { bg: 'linear-gradient(135deg,#e65100,#f4a828)',  dish: 'Alloco' },
  marocaine:   { bg: 'linear-gradient(135deg,#b71c1c,#f4a828)',  dish: 'Tajine' },
  turque:      { bg: 'linear-gradient(135deg,#b71c1c,#e53935)',  dish: 'Kebab' },
}

export default function Cuisines() {
  const ref = useScrollReveal()
  interface CuisineEntry { id: string; label: string; flag: string; vendors: number }
  const [cuisines, setCuisines] = useState<CuisineEntry[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    supabase
      .from('restaurants')
      .select('cuisine, cuisine_label, flag')
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (error || !data?.length) { setLoading(false); return }
        type Row = { cuisine: string; cuisine_label: string; flag: string }
        const rows = data as Row[]

        // Group by cuisine and count vendors
        const map: Record<string, CuisineEntry> = {}
        rows.forEach(r => {
          if (!map[r.cuisine]) {
            map[r.cuisine] = { id: r.cuisine, label: r.cuisine_label, flag: r.flag, vendors: 0 }
          }
          map[r.cuisine].vendors++
        })

        setCuisines(
          Object.values(map).sort((a, b) => b.vendors - a.vendors)
        )
        setLoading(false)
      })
  }, [])

  return (
    <div className="bg-cream min-h-screen" ref={ref}>
      <PageHero variant="tall" icon={Globe} eyebrow="Explorer"
        title={<>Toutes les <em style={{ color: '#1f1f1f', fontStyle: 'italic' }}>Cuisines</em></>}
        subtitle={`${loading ? '…' : cuisines.length} cuisines du monde entier, représentées par la diaspora au Maroc`} />

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-black/[0.05] animate-pulse">
                <div className="h-28 bg-black/[0.06]" />
                <div className="p-4 space-y-2.5">
                  <div className="h-4 bg-black/[0.06] rounded w-2/3" />
                  <div className="h-3 bg-black/[0.06] rounded w-1/2" />
                  <div className="flex items-center justify-between pt-1">
                    <div className="h-5 bg-black/[0.06] rounded-full w-20" />
                    <div className="h-3 bg-black/[0.06] rounded w-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : cuisines.length === 0 ? (
          <div className="text-center py-24">
            <Utensils size={48} className="text-gold mx-auto mb-4" />
            <p className="text-muted">Aucune cuisine disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {cuisines.map((c, i) => {
              const meta = CUISINE_META[c.id] || { bg: 'linear-gradient(135deg,#1a1a2e,#f4a828)', dish: '' }
              const Icon = getCuisineIcon(c.id)
              return (
                <Link
                  key={c.id}
                  to={`/restaurants?cuisine=${c.id}`}
                  data-reveal data-delay={`${(i % 4) * 0.07}s`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-black/[0.05]
                             hover:-translate-y-1.5 hover:shadow-[0_12px_36px_rgba(0,0,0,0.12)] transition-all duration-300"
                >
                  <div className="h-28 relative" style={{ background: meta.bg }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon size={48} className="text-white/80 drop-shadow-lg" />
                    </div>
                    <div className="absolute top-2.5 right-3 text-xl">{c.flag}</div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif font-bold text-dark text-base leading-tight">{c.label}</h3>
                    <p className="text-muted text-xs mt-0.5">{meta.dish}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[0.7rem] bg-gold/10 text-gold-dark font-semibold px-2.5 py-0.5 rounded-full">
                        {c.vendors} vendeur{c.vendors > 1 ? 's' : ''}
                      </span>
                      <span className="text-gold text-xs font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Voir <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <FeaturedCarousel />
      <FeaturedCuisines />
      <CuisineFilter />

      {/* CTA */}
      <div className="bg-dark2 py-16 text-center">
        <div className="max-w-xl mx-auto px-6" data-reveal>
          <h2 className="font-serif text-2xl font-bold text-white mb-3">
            Votre cuisine n'est pas listée ?
          </h2>
          <p className="text-muted text-sm mb-6">
            Rejoignez DiaTable en tant que vendeur et représentez votre pays.
          </p>
          <Link to="/inscription?role=vendor" className="btn btn-gold">
            Ajouter ma cuisine →
          </Link>
        </div>
      </div>
    </div>
  )
}
