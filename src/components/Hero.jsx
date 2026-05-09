import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import heroBg from '../assets/top-view-shakh-plov-delicious.jpg'

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen w-full overflow-hidden flex flex-col"
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Subtle dark overlay for text readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.10) 35%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* "Trouver à Manger" floating pill */}
      <div className="relative z-10 flex justify-center pt-28 md:pt-32">
        <Link
          to="/restaurants"
          className="flex items-center gap-3 px-8 md:px-10 py-3.5 md:py-4 rounded-full font-medium text-base md:text-lg shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: '#c5611a', color: '#f8f8f8' }}
        >
          Trouver à Manger
          <ChevronDown size={20} strokeWidth={2.5} />
        </Link>
      </div>

      {/* Main headline anchored bottom-left */}
      <div className="relative z-10 flex-1 flex items-end">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 pb-20 md:pb-28">
          <h1
            className="font-serif font-black leading-[1.05] tracking-tight text-white"
            style={{
              fontSize: 'clamp(2.4rem, 6vw, 5rem)',
              animation: 'fadeInUp 0.7s ease 0.1s both',
              textShadow: '0 4px 24px rgba(0,0,0,0.45)',
            }}
          >
            Retrouvez le{' '}
            <span style={{ color: '#bdbdbd' }}>Goût de Chez Vous,</span>
            <br />
            Même Loin de Chez Vous
          </h1>

          <p
            className="mt-6 max-w-2xl text-base md:text-lg leading-[1.75]"
            style={{
              color: 'rgba(248,248,248,0.85)',
              animation: 'fadeInUp 0.7s ease 0.2s both',
              textShadow: '0 2px 12px rgba(0,0,0,0.4)',
            }}
          >
            Accédez en un clic à une diversité culinaire unique :
            restaurants internationaux, cuisiniers à domicile et spécialités du monde,
            réunis au même endroit.
          </p>
        </div>
      </div>
    </section>
  )
}
