import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { supabase } from '../lib/supabase'
import { getCuisineIcon } from '../lib/cuisineIcons'
import { ChevronRight, Utensils } from 'lucide-react'

// Visual mapping — UI-only, not stored in DB
const CUISINE_META = {
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
  const [cuisines, setCuisines] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    supabase
      .from('restaurants')
      .select('cuisine, cuisine_label, flag')
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (error || !data?.length) { setLoading(false); return }

        // Group by cuisine and count vendors
        const map = {}
        data.forEach(r => {
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
      {/* Header */}
      <div className="bg-dark pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 zellige-pattern opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark/70" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <p className="section-label" data-reveal>Explorer</p>
          <h1 className="font-serif text-4xl md:text-5xl font-black text-white mb-4" data-reveal data-delay="0.1s">
            Toutes les <em style={{ color: '#c5611a'}}>Cuisines</em>
          </h1>
          <p className="text-light/70" data-reveal data-delay="0.2s">
            {loading ? '…' : cuisines.length} cuisines du monde entier, représentées par la diaspora au Maroc
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 rounded-full border-4 border-gold/30 border-t-gold animate-spin" />
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
