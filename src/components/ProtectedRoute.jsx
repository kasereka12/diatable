import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requireVendor = false }) {
  const { user, isVendor, loading } = useAuth()
  const location = useLocation()

  if (loading || (user && isVendor === undefined)) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-gold border-t-transparent animate-spin" />
          <p className="text-muted text-sm">Chargement…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/connexion" state={{ from: location }} replace />
  if (requireVendor && !isVendor) return <Navigate to="/profil" replace />

  return children
}
