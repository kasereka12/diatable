import { useScrollReveal } from '../hooks/useScrollReveal'
import { useAuth } from '../context/AuthContext'
import { ChefHat } from 'lucide-react'

export default function VendorCTA() {
  const ref = useScrollReveal()
  const { profile } = useAuth()
  if (profile?.role === 'vendor') return null

  return (
    <section
      id="vendor"
      className="relative py-24 overflow-hidden text-center"
      style={{ background: 'linear-gradient(135deg,#c8841a 0%,#f4a828 40%,#f9c76a 100%)' }}
      ref={ref}
    >
      {/* Zellige texture */}
      <div className="absolute inset-0 vendor-zellige pointer-events-none" />

      <div className="relative max-w-2xl mx-auto px-6" data-reveal>
        <div className="flex justify-center mb-6">
          <ChefHat size={56} className="text-dark" />
        </div>

        <h2
          className="font-serif font-black text-dark leading-[1.15] mb-4"
          style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}
        >
          Vous Cuisinez les Plats de Votre Pays au Maroc ?
        </h2>

        <p className="text-dark/70 text-[1.05rem] leading-[1.65] mb-9 max-w-xl mx-auto">
          Rejoignez DiaTable et touchez des milliers d'expatriés qui cherchent votre cuisine.
          Référencez votre restaurant, cuisine à domicile ou pop-up gratuitement.
        </p>

        <a href="#contact" className="btn btn-dark text-base px-9 py-4">
          Devenir Vendeur
        </a>

        <p className="mt-4 text-xs text-dark/55">
          Inscription gratuite · Aucune commission les 3 premiers mois · Rejoignez 200+ vendeurs déjà sur DiaTable
        </p>
      </div>
    </section>
  )
}
