import { useCounter } from '../hooks/useCounter'
import { useAuth } from '../context/AuthContext'
import { Sparkles, Utensils, UtensilsCrossed, ChefHat, Coffee } from 'lucide-react'

const STATS = [
  { target: 30, suffix: '+', label: 'Cuisines' },
  { target: 200, suffix: '+', label: 'Vendeurs' },
  { target: 8, suffix: '', label: 'Villes' },
  { target: 5000, suffix: '+', label: 'Expats Satisfaits' },
]

function StatItem({ target, suffix, label }) {
  const { value, ref } = useCounter(target, suffix)
  return (
    <div ref={ref} className="text-center px-4 py-2 border-r border-white/10 last:border-r-0">
      <div className="font-serif text-3xl font-bold text-gold leading-none mb-1">{value}</div>
      <div className="text-[0.7rem] text-muted font-semibold tracking-widest uppercase">{label}</div>
    </div>
  )
}

// Floating food orb
function FoodOrb({ icon: Icon, className, delay }) {
  return (
    <div
      className={`absolute rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.3)] animate-orbitFloat ${className}`}
      style={{ animationDelay: delay }}
    >
      <Icon size={28} className="text-white drop-shadow-lg" />
    </div>
  )
}

export default function Hero() {
  const { profile } = useAuth()
  const isVendor = profile?.role === 'vendor'
  return (
    <section id="home" className="min-h-screen bg-dark relative overflow-hidden flex flex-col">
      {/* Background glow + zellige */}
      <div className="absolute inset-0 bg-hero-glow" />
      <div className="absolute inset-0 zellige-pattern" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark/60" />

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-6xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center pt-28 pb-16">

          {/* Text */}
          <div>
            <div
              className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30
                         text-gold text-[0.72rem] font-bold tracking-[0.12em] uppercase
                         px-4 py-2 rounded-full mb-7"
              style={{ animation: 'fadeInUp 0.6s ease forwards' }}
            >
              <Sparkles size={12} />
              La Plateforme Food de la Diaspora au Maroc
            </div>

            <h1
              className="font-serif font-black text-white leading-[1.1] tracking-tight mb-6"
              style={{
                fontSize: 'clamp(2.4rem, 5vw, 4rem)',
                animation: 'fadeInUp 0.7s ease 0.1s both',
              }}
            >
              Retrouvez le{' '}
              <em className="text-gold" style={{ fontStyle: 'italic' }}>
                Goût de Chez Vous,
              </em>
              <br />
              Ici Même au Maroc
            </h1>

            <p
              className="text-light/80 text-[1.05rem] leading-[1.75] mb-10 max-w-[480px]"
              style={{ animation: 'fadeInUp 0.7s ease 0.2s both' }}
            >
              Découvrez des restaurants de la diaspora, des cuisiniers à domicile
              et des vendeurs de nourriture authentique de plus de 30 pays — en un seul endroit.
            </p>

            <div
              className="flex flex-wrap gap-4"
              style={{ animation: 'fadeInUp 0.7s ease 0.3s both' }}
            >
              <a href="#restaurants" className="btn btn-gold">
                Explorer les Cuisines
              </a>
              {!isVendor && (
                <a href="#vendor" className="btn btn-outline">
                  Référencer mon Restaurant
                </a>
              )}
            </div>
          </div>

          {/* Food orbit visual */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-[400px] h-[400px]">
              {/* Rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-dashed border-gold/20" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full border border-dashed border-gold/10" />

              {/* Central bowl */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48
                           rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.5)]
                           flex items-center justify-center animate-float"
                style={{ background: 'radial-gradient(circle at 35% 35%, #f4a828, #c8581a 60%, #7a1a0a)' }}
              >
                <ChefHat size={80} className="text-white/90 drop-shadow-lg" />
              </div>

              {/* Orbiting food */}
              <FoodOrb icon={Utensils}        className="w-[72px] h-[72px] bg-gradient-to-br from-green-600 to-green-900 top-5 left-14"  delay="0.5s" />
              <FoodOrb icon={UtensilsCrossed} className="w-[64px] h-[64px] bg-gradient-to-br from-orange-500 to-red-900 top-8 right-10"  delay="1s" />
              <FoodOrb icon={ChefHat}         className="w-[80px] h-[80px] bg-gradient-to-br from-yellow-500 to-amber-800 bottom-8 left-8" delay="1.5s" />
              <FoodOrb icon={Coffee}          className="w-[60px] h-[60px] bg-gradient-to-br from-purple-500 to-purple-900 bottom-12 right-14" delay="2s" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="relative z-10 bg-white/[0.03] border-t border-white/[0.06] backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {STATS.map((s) => (
              <StatItem key={s.label} {...s} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
