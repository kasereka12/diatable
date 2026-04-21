import { useScrollReveal } from '../hooks/useScrollReveal'
import { TESTIMONIALS } from '../data/restaurants'
import SectionHeader from './ui/SectionHeader'
import StarRating from './ui/StarRating'

function TestimonialCard({ t, delay = '0s' }) {
  return (
    <div
      data-reveal
      data-delay={delay}
      className="rounded-2xl p-9 relative transition-all duration-300 hover:-translate-y-1"
      style={{
        backgroundColor: '#f8f8f8',
        border: '1px solid rgba(80,70,64,0.08)',
        boxShadow: '0 4px 24px rgba(80,70,64,0.08)',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 40px rgba(80,70,64,0.14)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(80,70,64,0.08)'}
    >
      {/* Guillemet décoratif */}
      <div className="absolute top-5 right-7 font-serif text-[5rem] leading-none select-none"
        style={{ color: 'rgba(197,97,26,0.12)' }}>
        "
      </div>

      {/* Étoiles */}
      <div className="mb-4">
        <StarRating rating={t.rating} size={14} />
      </div>

      {/* Citation */}
      <p className="font-serif italic text-[1rem] leading-[1.7] mb-6" style={{ color: '#504640' }}>
        {t.text}
      </p>

      {/* Auteur */}
      <div className="flex items-center gap-3.5">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center
                     font-serif font-bold text-sm flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #c5611a, #a04d12)',
            color: '#f8f8f8',
          }}
        >
          {t.initials}
        </div>
        <div>
          <div className="font-semibold text-sm" style={{ color: '#1f1f1f' }}>{t.name}</div>
          <div className="text-xs mt-0.5" style={{ color: '#bd9f87' }}>{t.origin}</div>
        </div>
      </div>
    </div>
  )
}

export default function Testimonials() {
  const ref = useScrollReveal()

  return (
    <section className="py-24" style={{ backgroundColor: '#eae5d9' }} ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader label="Témoignages" title="Ce que dit notre <em>Communauté</em>" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.id} t={t} delay={`${i * 0.12}s`} />
          ))}
        </div>
      </div>
    </section>
  )
}