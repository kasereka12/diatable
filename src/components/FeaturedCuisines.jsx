import { useState, useEffect } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'
import SectionHeader from './ui/SectionHeader'
import { getCuisineIcon } from '../lib/cuisineIcons'
import { supabase } from '../lib/supabase'
import { ArrowRight } from 'lucide-react'

// UI-only metadata — not stored in DB
const CUISINE_META = {
  senegalaise: { bg: 'linear-gradient(160deg,#8b2500,#c8581a,#f4a828)', country: 'Sénégal',     dish: 'Thiéboudienne', desc: "Le plat emblématique de la diaspora sénégalaise — riz au poisson, légumes et épices d'Afrique de l'Ouest." },
  libanaise:   { bg: 'linear-gradient(160deg,#145a32,#1e8449,#76b041)', country: 'Liban',        dish: 'Mezze & Grills', desc: 'Houmous, falafel, kafta grillée — la générosité libanaise à chaque bouchée.' },
  chinoise:    { bg: 'linear-gradient(160deg,#7b0000,#c0392b,#e74c3c)', country: 'Chine',        dish: 'Dim Sum',       desc: 'Bouchées vapeur et saveurs de Canton — une tradition millénaire revisitée à Casablanca.' },
  syrienne:    { bg: 'linear-gradient(160deg,#2c0042,#6c3483,#9b59b6)', country: 'Syrie',        dish: 'Shawarma',      desc: 'Viande rôtie à la broche, marinée aux épices du Levant, servie en pita généreux.' },
  nigeriane:   { bg: 'linear-gradient(160deg,#0a3d0a,#1e8449,#f9a825)', country: 'Nigéria',      dish: 'Jollof Rice',   desc: "Riz fumé au feu de bois dans une sauce tomate relevée — la fierté de l'Afrique de l'Ouest." },
  indienne:    { bg: 'linear-gradient(160deg,#7d3200,#c05a00,#fbc02d)', country: 'Inde',         dish: 'Curry & Biryani', desc: 'Épices dorées, currys crémeux et riz basmati parfumé au safran.' },
  francaise:   { bg: 'linear-gradient(160deg,#0a1a4a,#1565c0,#42a5f5)', country: 'France',       dish: 'Boulangerie',   desc: 'Croissants pur beurre, bœuf bourguignon et pâtisseries fines — le savoir-faire français au Maroc.' },
  italienne:   { bg: 'linear-gradient(160deg,#6a0000,#c62828,#1b5e20)', country: 'Italie',       dish: 'Pizza & Pasta', desc: 'Pâte napolitaine et pasta al dente — la dolce vita à votre table.' },
  marocaine:   { bg: 'linear-gradient(160deg,#6a0000,#b71c1c,#f4a828)', country: 'Maroc',        dish: 'Tajine',        desc: "Tajine d'agneau aux pruneaux, harira et pastilla — les saveurs authentiques du Maroc." },
  bresilienne: { bg: 'linear-gradient(160deg,#0a3d0a,#2e7d32,#0d47a1)', country: 'Brésil',       dish: 'Feijoada',      desc: 'Ragoût de haricots noirs, viandes fumées et caïpirinha — le Brésil s\'invite à Casablanca.' },
  ivoirienne:  { bg: 'linear-gradient(160deg,#7d3200,#e65100,#ffd54f)', country: "Côte d'Ivoire", dish: 'Alloco',       desc: "Bananes plantains frites, kedjenou de poulet — les saveurs chaleureuses d'Abidjan." },
  turque:      { bg: 'linear-gradient(160deg,#6a0000,#b71c1c,#e53935)', country: 'Turquie',      dish: 'Kebab Adana',   desc: 'Kebab Adana, börek au fromage et baklava au miel — Istanbul dans votre assiette.' },
}

const DEFAULT_BG = 'linear-gradient(160deg,#1a1a2e,#f4a828)'

function FeaturedCard({ f, delay = '0s' }) {
  const CuisineIcon = getCuisineIcon(f.cuisine)
  const meta = CUISINE_META[f.cuisine] || { bg: DEFAULT_BG, country: f.cuisine_label, dish: f.cuisine_label, desc: '' }

  return (
    <a
      href={`/restaurants?cuisine=${f.cuisine}`}
      data-reveal
      data-delay={delay}
      className="rounded-2xl overflow-hidden relative min-h-[280px] flex flex-col justify-end
                 cursor-pointer group transition-all duration-300
                 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
    >
      <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]"
        style={{ background: meta.bg }} />
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(12,11,20,0.92)] via-[rgba(12,11,20,0.3)] to-transparent" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] z-10
                      transition-transform duration-300 group-hover:-translate-y-[65%] group-hover:scale-110">
        <CuisineIcon size={64} className="text-white/90 drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]" />
      </div>

      <div className="relative z-20 p-7">
        <span className="text-2xl block mb-1.5">{f.flag}</span>
        <div className="text-[0.68rem] font-bold tracking-[0.15em] uppercase text-gold mb-1.5">
          {meta.country}
        </div>
        <h3 className="font-serif font-bold text-white text-2xl mb-2">{meta.dish}</h3>
        <p className="text-white/70 text-sm leading-relaxed mb-4 line-clamp-2">{meta.desc}</p>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-gold text-sm font-semibold">
            Explorer cette cuisine
            <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
          </span>
          {f.avg_rating && (
            <span className="text-white/50 text-xs">{parseFloat(f.avg_rating).toFixed(1)} ★ · {f.count} resto{f.count > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </a>
  )
}

export default function FeaturedCuisines() {
  const ref = useScrollReveal()
  const [featured, setFeatured] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    supabase
      .from('restaurants')
      .select('cuisine, cuisine_label, flag, rating')
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (error || !data?.length) { setLoading(false); return }

        // Group by cuisine, compute avg rating + count
        const map = {}
        data.forEach(r => {
          if (!map[r.cuisine]) {
            map[r.cuisine] = { cuisine: r.cuisine, cuisine_label: r.cuisine_label, flag: r.flag, total: 0, count: 0 }
          }
          map[r.cuisine].total += parseFloat(r.rating) || 0
          map[r.cuisine].count++
        })

        const sorted = Object.values(map)
          .map(c => ({ ...c, avg_rating: c.total / c.count }))
          .sort((a, b) => b.avg_rating - a.avg_rating)
          .slice(0, 4)

        setFeatured(sorted)
        setLoading(false)
      })
  }, [])

  return (
    <section id="cuisines" className="bg-cream2 py-24" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader label="Les Plus Populaires" title="Cuisines les plus <em>Aimées</em>" />
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-4 border-gold/30 border-t-gold animate-spin" />
          </div>
        ) : featured.length === 0 ? (
          <p className="text-center text-muted py-12">Aucune cuisine disponible pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {featured.map((f, i) => (
              <FeaturedCard key={f.cuisine} f={f} delay={`${i * 0.1}s`} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
