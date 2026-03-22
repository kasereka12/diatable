import { Link } from 'react-router-dom'
import { Globe, ArrowLeft } from 'lucide-react'

/**
 * Topbar commun aux dashboards vendeur et admin.
 * Affiche le logo + un lien "Retour au site" à gauche,
 * et un slot optionnel à droite (children).
 */
export default function DashboardTopbar({ variant = 'vendor', children }) {
  const isAdmin = variant === 'admin'

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 border-b
      ${isAdmin
        ? 'bg-[#1a1a2e] border-white/[0.08]'
        : 'bg-dark border-white/[0.08]'
      }`}
    >
      {/* Left: logo + back link */}
      <div className="flex items-center gap-4">
        <Link to="/" className="font-serif text-lg font-bold text-white flex items-center gap-1">
          Dia<span className="text-gold">Table</span>
          <Globe size={16} className="text-gold" />
        </Link>
        <span className="text-white/20 text-sm">|</span>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-white/60 text-xs font-medium hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          Retour au site
        </Link>
      </div>

      {/* Right slot */}
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  )
}
