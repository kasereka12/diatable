import { useScrollReveal } from '../hooks/useScrollReveal'
import { FEATURED } from '../data/restaurants'
import SectionHeader from './ui/SectionHeader'
import { getCuisineIcon } from '../lib/cuisineIcons'
import { ArrowRight } from 'lucide-react'

const BG_STYLES = {
  'feat-senegal': 'linear-gradient(160deg,#8b2500 0%,#c8581a 50%,#f4a828 100%)',
  'feat-liban':   'linear-gradient(160deg,#145a32 0%,#1e8449 50%,#76b041 100%)',
  'feat-chine':   'linear-gradient(160deg,#7b0000 0%,#c0392b 50%,#e74c3c 100%)',
  'feat-syrie':   'linear-gradient(160deg,#2c0042 0%,#6c3483 50%,#9b59b6 100%)',
}

function FeaturedCard({ f, delay = '0s' }) {
  const CuisineIcon = getCuisineIcon(f.cuisine)

  return (
    <div
      data-reveal
      data-delay={delay}
      className="rounded-2xl overflow-hidden relative min-h-[280px] flex flex-col justify-end
                 cursor-pointer group transition-all duration-300
                 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
    >
      {/* Background */}
      <div
        className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]"
        style={{ background: BG_STYLES[f.bg] }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(12,11,20,0.92)] via-[rgba(12,11,20,0.3)] to-transparent" />

      {/* Floating icon */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] z-10
                   transition-transform duration-300 group-hover:-translate-y-[65%] group-hover:scale-110"
      >
        <CuisineIcon size={64} className="text-white/90 drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]" />
      </div>

      {/* Text content */}
      <div className="relative z-20 p-7">
        <span className="text-2xl block mb-1.5">{f.flag}</span>
        <div className="text-[0.68rem] font-bold tracking-[0.15em] uppercase text-gold mb-1.5">
          {f.country}
        </div>
        <h3 className="font-serif font-bold text-white text-2xl mb-2">{f.dish}</h3>
        <p className="text-white/70 text-sm leading-relaxed mb-4">{f.desc}</p>
        <span className="inline-flex items-center gap-1 text-gold text-sm font-semibold">
          Explorer cette cuisine
          <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      </div>
    </div>
  )
}

export default function FeaturedCuisines() {
  const ref = useScrollReveal()

  return (
    <section id="cuisines" className="bg-cream2 py-24" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader label="Les Plus Populaires" title="Cuisines les plus <em>Aimées</em>" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FEATURED.map((f, i) => (
            <FeaturedCard key={f.id} f={f} delay={`${i * 0.1}s`} />
          ))}
        </div>
      </div>
    </section>
  )
}
