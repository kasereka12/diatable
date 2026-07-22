import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface Props { children: ReactNode }

export default function AdminRoute({ children }: Props) {
  const { user, profile, loading } = useAuth()
  // Wait for both session AND profile to load
  if (loading || (user && profile === null)) return null
  if (!user || profile?.role !== 'admin') return <Navigate to="/" replace />
  return children
}
