import { useTranslation } from 'react-i18next'
import { useScrollReveal } from '../hooks/useScrollReveal'
import SectionHeader from './ui/SectionHeader'
import { Globe, ShieldCheck, Users } from 'lucide-react'

export default function WhyDiaTable() {
  const { t } = useTranslation()
  const ref = useScrollReveal()

  const FEATURES = [
    { Icon: Globe, title: t('why.feat1_title'), desc: t('why.feat1_desc') },
    { Icon: ShieldCheck, title: t('why.feat2_title'), desc: t('why.feat2_desc') },
    { Icon: Users, title: t('why.feat3_title'), desc: t('why.feat3_desc') },
  ]

  return (
    <section className="bg-dark2 py-24 relative overflow-hidden" ref={ref}>
      {/* Decorative glow blob */}
      <div
        className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full
                   bg-gold/[0.04] pointer-events-none"
      />

      <div className="max-w-6xl mx-auto px-6 relative">
        <SectionHeader label={t('why.label')} title={t('why.title')} light />

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
