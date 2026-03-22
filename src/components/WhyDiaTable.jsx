import { useScrollReveal } from '../hooks/useScrollReveal'
import SectionHeader from './ui/SectionHeader'
import { Globe, ShieldCheck, Users } from 'lucide-react'

const FEATURES = [
  {
    Icon: Globe,
    title: '30+ Cuisines',
    desc: 'De l\'Afrique de l\'Ouest à l\'Asie de l\'Est, du Moyen-Orient à l\'Europe — si une communauté de la diaspora existe au Maroc, sa cuisine est sur DiaTable.',
  },
  {
    Icon: ShieldCheck,
    title: 'Vendeurs Vérifiés',
    desc: 'Chaque restaurant et cuisinier à domicile sur notre plateforme est évalué, vérifié et approuvé par notre communauté d\'expatriés et de locaux.',
  },
  {
    Icon: Users,
    title: 'La Communauté Avant Tout',
    desc: 'Nous soutenons les entrepreneurs de la diaspora qui construisent leur vie et leur activité au Maroc — parce que la culture voyage à travers la nourriture.',
  },
]

export default function WhyDiaTable() {
  const ref = useScrollReveal()

  return (
    <section className="bg-dark2 py-24 relative overflow-hidden" ref={ref}>
      {/* Decorative glow blob */}
      <div
        className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full
                   bg-gold/[0.04] pointer-events-none"
      />

      <div className="max-w-6xl mx-auto px-6 relative">
        <SectionHeader label="Notre Engagement" title="Pourquoi Choisir <em>DiaTable ?</em>" light />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              data-reveal
              data-delay={`${i * 0.15}s`}
              className="text-center p-10 rounded-2xl bg-white/[0.03] border border-white/[0.07]
                         transition-all duration-300
                         hover:bg-gold/[0.06] hover:border-gold/20 hover:-translate-y-1"
            >
              <div className="flex justify-center mb-5">
                <f.Icon size={44} className="text-gold" />
              </div>
              <h3 className="font-serif font-bold text-white text-xl mb-3">{f.title}</h3>
              <p className="text-muted text-sm leading-[1.75]">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
