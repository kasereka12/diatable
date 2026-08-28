import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import woodTexture from '../../assets/WoodGrain08-byGhostlyPixels.png'

interface PageHeroProps {
  icon: LucideIcon
  eyebrow: string
  title: ReactNode
  subtitle?: ReactNode
  /** 'tall' for pages with no separate pt-24 body wrapper (header sits right under the fixed navbar) */
  variant?: 'compact' | 'tall'
  /** Extra content below the subtitle — a search field, filter pills, etc. */
  children?: ReactNode
}

// Shared page banner — warm wood-table texture instead of a flat saturated
// color fill, with a soft curved bottom edge (à la Glovo).
export default function PageHero({ icon: Icon, eyebrow, title, subtitle, variant = 'compact', children }: PageHeroProps) {
  return (
    <div
      className={`relative overflow-hidden ${variant === 'tall' ? 'pt-32 pb-16' : 'py-14'}`}
      style={{
        backgroundColor: '#3d2314',
        borderBottomLeftRadius: '50% 28px',
        borderBottomRightRadius: '50% 28px',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `url(${woodTexture})`,
        backgroundSize: '600px auto',
        backgroundRepeat: 'repeat',
        mixBlendMode: 'multiply',
        opacity: 0.5,
      }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25 pointer-events-none" />

      {/* Ambient glow + drifting sparkles for a bit of life on an otherwise static banner */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="animate-glow-orb absolute" style={{
          top: '10%', left: '60%', width: 220, height: 220, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,168,40,0.35) 0%, rgba(244,168,40,0) 70%)',
          filter: 'blur(16px)',
        }} />
        <div className="animate-glow-orb absolute" style={{
          bottom: '5%', left: '10%', width: 180, height: 180, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(197,97,26,0.30) 0%, rgba(197,97,26,0) 70%)',
          filter: 'blur(18px)', animationDelay: '3s',
        }} />
      </div>

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <div className="flex justify-center mb-5" data-reveal>
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.20)] animate-logo-bob">
            <Icon size={28} style={{ color: '#c5611a' }} />
          </div>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/75 mb-3" data-reveal data-delay="0.05s">
          {eyebrow}
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-black text-white mb-4" data-reveal data-delay="0.1s">
          {title}
        </h1>
        {subtitle && (
          <p className="text-white/80 max-w-xl mx-auto" data-reveal data-delay="0.2s">
            {subtitle}
          </p>
        )}
        {children && <div className="mt-6" data-reveal data-delay="0.3s">{children}</div>}
      </div>
    </div>
  )
}
