import { useScrollReveal } from '../hooks/useScrollReveal'
import { TESTIMONIALS } from '../data/restaurants'
import SectionHeader from './ui/SectionHeader'
import StarRating from './ui/StarRating'

function TestimonialCard({ t, delay = '0s' }) {
  return (
    <div
      data-reveal
      data-delay={delay}
      className="bg-white rounded-2xl p-9 shadow-[0_4px_24px_rgba(0,0,0,0.08)]
                 border border-black/[0.05] relative
                 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
    >
      {/* Decorative quote */}
      <div className="absolute top-5 right-7 font-serif text-[5rem] text-gold/15 leading-none select-none">
        "
      </div>

      {/* Stars */}
      <div className="mb-4">
        <StarRating rating={t.rating} size={14} />
      </div>

      {/* Quote */}
      <p className="font-serif italic text-dark3 text-[1rem] leading-[1.7] mb-6">
        {t.text}
      </p>

      {/* Author */}
      <div className="flex items-center gap-3.5">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center
                     font-serif font-bold text-dark text-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#f4a828,#c8841a)' }}
        >
          {t.initials}
        </div>
        <div>
          <div className="font-semibold text-dark text-sm">{t.name}</div>
          <div className="text-muted text-xs mt-0.5">{t.origin}</div>
        </div>
      </div>
    </div>
  )
}

export default function Testimonials() {
  const ref = useScrollReveal()

  return (
    <section className="bg-cream py-24" ref={ref}>
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
