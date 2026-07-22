import { Link } from 'react-router-dom'
import { Utensils } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 zellige-pattern opacity-30" />
      <div className="relative">
        <div className="font-serif font-black text-[10rem] leading-none text-gold/10 select-none">404</div>
        <div className="flex justify-center -mt-12 mb-6">
          <Utensils size={56} className="text-gold" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-white mb-3">
          Ce plat n'est pas au menu…
        </h1>
        <p className="text-muted text-base mb-8 max-w-sm">
          La page que vous cherchez n'existe pas ou a été déplacée. Revenez à l'accueil pour continuer à explorer.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/" className="btn btn-gold">Retour à l'accueil</Link>
          <Link to="/restaurants" className="btn btn-outline">Explorer les restaurants</Link>
        </div>
      </div>
    </div>
  )
}
