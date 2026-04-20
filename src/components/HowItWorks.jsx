import { useScrollReveal } from '../hooks/useScrollReveal'
import SectionHeader from './ui/SectionHeader'
import { Search, MapPin, Utensils } from 'lucide-react'

const STEPS = [
  {
    num: '01',
    Icon: Search,
    title: 'Cherchez Votre Cuisine',
    desc: 'Parcourez plus de 30 cuisines d\'Afrique, d\'Asie, d\'Europe et des Amériques. Retrouvez instantanément les saveurs de chez vous.',
  },
  {
    num: '02',
    Icon: MapPin,
    title: 'Trouvez des Vendeurs Proches',
    desc: 'Restaurants, cuisiniers à domicile et cuisines éphémères près de vous — à Casablanca, Rabat, Marrakech et ailleurs.',
  },
  {
    num: '03',
    Icon: Utensils,
    title: 'Commandez ou Rendez-vous',
    desc: 'Contactez directement, commandez en ligne ou réservez une table. Savourez une cuisine authentique, ici même au Maroc.',
  },
]

export default function HowItWorks() {
  const ref = useScrollReveal()

  return (
    <section id="about" className="py-24 relative overflow-hidden" style={{ backgroundColor: '#1f1f1f' }} ref={ref}>
      {/* Glow central terracotta */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ backgroundColor: 'rgba(197,97,26,0.04)' }} />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative">
        <SectionHeader label="Simple & Rapide" title="Comment fonctionne <em>DiaTable</em> ?" light />

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-0">
          {/* Ligne de connexion desktop */}
          <div
            className="hidden md:block absolute top-12 h-px"
            style={{
              left: 'calc(16.66% + 24px)',
              right: 'calc(16.66% + 24px)',
              background: 'linear-gradient(90deg, #c5611a, rgba(189,159,135,0.25), #c5611a)',
            }}
          />

          {STEPS.map((s, i) => (
            <div
              key={s.num}
              data-reveal
              data-delay={`${i * 0.15}s`}
              className="text-center px-8 pb-12 pt-0 relative"
            >
              {/* Numéro géant en filigrane */}
              <div
                className="absolute top-[-20px] left-1/2 -translate-x-1/2 font-serif font-black
                           text-[4.5rem] leading-none select-none z-0"
                style={{ color: 'rgba(197,97,26,0.10)' }}
              >
                {s.num}
              </div>

              {/* Cercle icône */}
              <div
                className="relative z-10 w-24 h-24 rounded-full mx-auto mb-7 flex items-center
                           justify-center transition-all duration-300 hover:scale-110"
                style={{
                  backgroundColor: 'rgba(197,97,26,0.10)',
                  border: '2px solid rgba(197,97,26,0.28)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(197,97,26,0.22)'
                  e.currentTarget.style.borderColor = '#c5611a'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(197,97,26,0.10)'
                  e.currentTarget.style.borderColor = 'rgba(197,97,26,0.28)'
                }}
              >
                <s.Icon size={36} style={{ color: '#c5611a' }} />
              </div>

              <div className="text-[0.68rem] font-bold tracking-[0.15em] uppercase mb-3"
                style={{ color: '#c5611a' }}>
                Étape {s.num}
              </div>
              <h3 className="font-serif font-bold text-[1.3rem] mb-3" style={{ color: '#f8f8f8' }}>
                {s.title}
              </h3>
              <p className="text-sm leading-[1.75] max-w-[240px] mx-auto" style={{ color: '#bd9f87' }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}