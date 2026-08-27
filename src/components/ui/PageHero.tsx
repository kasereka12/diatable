import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

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

// Shared page banner — solid brand-gradient + white icon badge, replacing the
// old bg-dark/zellige header repeated across every content page.
export default function PageHero({ icon: Icon, eyebrow, title, subtitle, variant = 'compact', children }: PageHeroProps) {
  return (
    <div
      className={`relative overflow-hidden ${variant === 'tall' ? 'pt-32 pb-20' : 'py-16'}`}
      style={{ background: 'linear-gradient(155deg, #d9722a 0%, #c5611a 55%, #a8500f 100%)' }}
    >
      <div className="absolute inset-0 zellige-pattern opacity-[0.08] pointer-events-none" />
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <div className="flex justify-center mb-5" data-reveal>
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.20)]">
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
