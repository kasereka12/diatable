import { Link } from 'react-router-dom'
import { useScrollReveal } from '../hooks/useScrollReveal'
import SectionHeader from '../components/ui/SectionHeader'
import { ChevronRight } from 'lucide-react'

const ALL_CUISINES = [
  { id: 'senegalaise', flag: '🇸🇳', country: 'Sénégal',    label: 'Sénégalaise',  dish: 'Thiéboudienne', vendors: 12, bg: 'linear-gradient(135deg,#e8521a,#f4a828)' },
  { id: 'libanaise',   flag: '🇱🇧', country: 'Liban',      label: 'Libanaise',    dish: 'Mezze',         vendors: 9,  bg: 'linear-gradient(135deg,#1b5e20,#43a047)' },
  { id: 'chinoise',    flag: '🇨🇳', country: 'Chine',      label: 'Chinoise',     dish: 'Dim Sum',       vendors: 7,  bg: 'linear-gradient(135deg,#b71c1c,#e53935)' },
  { id: 'syrienne',    flag: '🇸🇾', country: 'Syrie',      label: 'Syrienne',     dish: 'Shawarma',      vendors: 11, bg: 'linear-gradient(135deg,#4a148c,#7b1fa2)' },
  { id: 'francaise',   flag: '🇫🇷', country: 'France',     label: 'Française',    dish: 'Croissants',    vendors: 6,  bg: 'linear-gradient(135deg,#0d47a1,#1565c0)' },
  { id: 'italienne',   flag: '🇮🇹', country: 'Italie',     label: 'Italienne',    dish: 'Pasta',         vendors: 5,  bg: 'linear-gradient(135deg,#c62828,#1b5e20)' },
  { id: 'nigeriane',   flag: '🇳🇬', country: 'Nigéria',    label: 'Nigériane',    dish: 'Jollof Rice',   vendors: 8,  bg: 'linear-gradient(135deg,#1b5e20,#f9a825)' },
  { id: 'indienne',    flag: '🇮🇳', country: 'Inde',       label: 'Indienne',     dish: 'Curry',         vendors: 10, bg: 'linear-gradient(135deg,#e65100,#fbc02d)' },
  { id: 'bresilienne', flag: '🇧🇷', country: 'Brésil',     label: 'Brésilienne',  dish: 'Feijoada',      vendors: 4,  bg: 'linear-gradient(135deg,#1b5e20,#0d47a1)' },
  { id: 'ivoirienne',  flag: '🇨🇮', country: 'Côte d\'Ivoire', label: 'Ivoirienne', dish: 'Alloco',      vendors: 3,  bg: 'linear-gradient(135deg,#e65100,#f4a828)' },
  { id: 'marocaine',   flag: '🇲🇦', country: 'Maroc',      label: 'Marocaine',    dish: 'Tajine',        vendors: 15, bg: 'linear-gradient(135deg,#b71c1c,#f4a828)' },
  { id: 'turque',      flag: '🇹🇷', country: 'Turquie',    label: 'Turque',       dish: 'Kebab',         vendors: 6,  bg: 'linear-gradient(135deg,#b71c1c,#e53935)' },
]

export default function Cuisines() {
  const ref = useScrollReveal()

  return (
    <div className="bg-cream min-h-screen" ref={ref}>
      {/* Header */}
      <div className="bg-dark pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 zellige-pattern opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark/70" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <p className="section-label" data-reveal>Explorer</p>
          <h1 className="font-serif text-4xl md:text-5xl font-black text-white mb-4" data-reveal data-delay="0.1s">
            Toutes les <em className="text-gold italic">Cuisines</em>
          </h1>
          <p className="text-light/70" data-reveal data-delay="0.2s">
            {ALL_CUISINES.length} cuisines du monde entier, représentées par la diaspora au Maroc
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <SectionHeader label="Toutes les cuisines" title="Choisissez votre <em>Saveur</em>" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {ALL_CUISINES.map((c, i) => (
            <Link
              key={c.id}
              to={`/restaurants?cuisine=${c.id}`}
              data-reveal data-delay={`${(i % 4) * 0.07}s`}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-black/[0.05]
                         hover:-translate-y-1.5 hover:shadow-[0_12px_36px_rgba(0,0,0,0.12)] transition-all duration-300"
            >
              {/* Image area */}
              <div className="h-28 relative" style={{ background: c.bg }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl filter drop-shadow-lg">{c.flag}</span>
                </div>
              </div>
              {/* Info */}
              <div className="p-4">
                <h3 className="font-serif font-bold text-dark text-base leading-tight">{c.label}</h3>
                <p className="text-muted text-xs mt-0.5">{c.dish}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[0.7rem] bg-gold/10 text-gold-dark font-semibold px-2.5 py-0.5 rounded-full">
                    {c.vendors} vendeurs
                  </span>
                  <span className="text-gold text-xs font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Voir <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-dark2 py-16 text-center" ref={useScrollReveal()}>
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
