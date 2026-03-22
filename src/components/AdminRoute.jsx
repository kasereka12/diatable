import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth()
  // Wait for both session AND profile to load
  if (loading || (user && profile === null)) return null
  if (!user || profile?.role !== 'admin') return <Navigate to="/" replace />
  return children
}
