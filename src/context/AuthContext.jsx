import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// Demo user for when Supabase is not configured
const DEMO_USER = null

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(DEMO_USER)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) await fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    if (!supabase) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  async function signIn(email, password) {
    if (!supabase) {
      // Demo mode: fake login
      const fakeUser = { id: 'demo', email, user_metadata: { full_name: 'Demo Utilisateur' } }
      setUser(fakeUser)
      setProfile({ id: 'demo', full_name: 'Demo Utilisateur', role: 'client', email })
      return { error: null }
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const msg = error.message?.toLowerCase() || ''
      if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
        return { data, error: { message: 'Email ou mot de passe incorrect.' } }
      }
      if (msg.includes('email not confirmed')) {
        return { data, error: { message: 'Veuillez confirmer votre email avant de vous connecter.' } }
      }
      return { data, error: { message: error.message || 'Erreur de connexion.' } }
    }
    return { data, error }
  }

  async function signUp(email, password, fullName, role = 'client') {
    if (!supabase) {
      // Demo mode — ne pas connecter, juste simuler le succès
      return { error: null }
    }
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, role } },
    })
    if (error) {
      // Erreur 500 = confirmation email activée sans SMTP, ou tables manquantes
      if (error.status === 500 || error.message?.includes('500')) {
        return { error: { message: "Une erreur serveur est survenue. Veuillez réessayer dans quelques instants." } }
      }
      // Map common Supabase errors to user-friendly French messages
      const msg = error.message?.toLowerCase() || ''
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        return { error: { message: "Cette adresse email est déjà utilisée. Essayez de vous connecter." } }
      }
      if (msg.includes('password') && msg.includes('short')) {
        return { error: { message: "Le mot de passe doit contenir au moins 6 caractères." } }
      }
      if (msg.includes('invalid') && msg.includes('email')) {
        return { error: { message: "Adresse email invalide." } }
      }
      return { error: { message: error.message || "Une erreur est survenue." } }
    }
    // Le trigger handle_new_user() crée le profil automatiquement
    return { data, error: null }
  }

  async function signOut() {
    setUser(null)
    setProfile(null)
    if (supabase) await supabase.auth.signOut()
  }

  async function signInWithGoogle() {
    if (!supabase) return { error: { message: 'Supabase non configuré' } }
    return supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/profil` } })
  }

  const isVendor = profile?.role === 'vendor'
  const isClient = profile?.role === 'client' || (!profile && !!user)
  const isAdmin  = profile?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, profile, loading, isVendor, isClient, isAdmin, signIn, signUp, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
