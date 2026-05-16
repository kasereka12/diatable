import type { ReactNode } from 'react'

interface AdBannerProps {
  /** Inject custom ad content (AdSense <ins>, image, etc.).
   *  If omitted, renders a styled placeholder. */
  children?: ReactNode
  /** Label affiché en haut à droite — default "Annonce" */
  label?: string
}

/**
 * Espace publicitaire 728×90 (leaderboard).
 * Pour intégrer AdSense, passez l'<ins> comme children.
 * Pour une bannière statique (partenaire direct), passez une <img> ou un <a>.
 */
export default function AdBanner({ children, label = 'Annonce' }: AdBannerProps) {
  return (
    <section className="bg-cream py-5 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden border border-black/[0.07] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">

          {/* Label réglementaire */}
          <span className="absolute top-2 right-3 z-10 text-[0.58rem] font-bold uppercase tracking-[0.18em] text-black/25 select-none">
            {label}
          </span>

          {children ?? <AdPlaceholder />}
        </div>
      </div>
    </section>
  )
}

function AdPlaceholder() {
  return (
    <div className="flex items-center justify-between px-8 py-5 min-h-[100px] gap-6">
      {/* Left: logo placeholder */}
      <div className="shrink-0 w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center">
        <span className="text-2xl">🍽️</span>
      </div>

      {/* Center: copy */}
      <div className="flex-1">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#c5611a] mb-0.5">
          Partenaire DiaTable
        </p>
        <p className="font-serif font-bold text-dark text-base leading-snug">
          Votre marque auprès de la diaspora
        </p>
        <p className="text-muted text-xs mt-0.5">
          Touchez des milliers de clients passionnés de cuisine du monde.
        </p>
      </div>

      {/* CTA */}
      <a
        href="mailto:pub@diatble.ma"
        className="shrink-0 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-dark text-xs font-bold transition-all hover:shadow-[0_4px_16px_rgba(244,168,40,0.4)]"
      >
        Nous contacter
      </a>
    </div>
  )
}
