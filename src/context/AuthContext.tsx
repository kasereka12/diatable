import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, callEdgeFunction } from '../lib/supabase'
import type { Profile } from '../types/supabase'

type AuthResult = { data?: unknown; error: { message: string } | null }

interface AuthContextValue {
  user:              User | null
  profile:           Profile | null
  loading:           boolean
  isVendor:          boolean
  isClient:          boolean
  isAdmin:           boolean
  signIn:            (email: string, password: string) => Promise<AuthResult>
  signUp:            (email: string, password: string, fullName: string, role?: string) => Promise<AuthResult>
  signOut:           () => Promise<void>
  signInWithGoogle:  () => Promise<AuthResult>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
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

  async function fetchProfile(userId: string) {
    if (!supabase) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  async function signIn(email: string, password: string): Promise<AuthResult> {
    if (!supabase) {
      const fakeUser = { id: 'demo', email, user_metadata: { full_name: 'Demo Utilisateur' } } as unknown as User
      setUser(fakeUser)
      setProfile({ id: 'demo', full_name: 'Demo Utilisateur', role: 'client', email, avatar_url: null, created_at: new Date().toISOString(), rib: null, bank_name: null, account_name: null })
      return { error: null }
    }

    const res = await callEdgeFunction('auth-login', { email, password })
    const data = await res.json()

    if (!res.ok) {
      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After')
        return { error: { message: retryAfter
          ? `Trop de tentatives. Réessayez dans ${retryAfter} secondes.`
          : 'Trop de tentatives. Réessayez plus tard.' } }
      }
      const msg = (data.error_description || data.msg || data.error || '').toLowerCase()
      if (msg.includes('invalid') || msg.includes('credentials'))
        return { error: { message: 'Email ou mot de passe incorrect.' } }
      if (msg.includes('email not confirmed'))
        return { error: { message: 'Veuillez confirmer votre email avant de vous connecter.' } }
      return { error: { message: data.error_description || data.msg || 'Erreur de connexion.' } }
    }

    // Hydrate the Supabase JS client with the session received from the Edge Function
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    })
    if (sessionError) return { error: { message: sessionError.message } }

    return { data, error: null }
  }

  async function signUp(email: string, password: string, fullName: string, role = 'client'): Promise<AuthResult> {
    if (!supabase) return { error: null }

    const res = await callEdgeFunction('auth-signup', {
      email,
      password,
      data: { full_name: fullName, role },
    })
    const data = await res.json()

    if (!res.ok) {
      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After')
        return { error: { message: retryAfter
          ? `Trop de tentatives. Réessayez dans ${retryAfter} secondes.`
          : 'Trop de tentatives. Réessayez plus tard.' } }
      }
      if (res.status === 500)
        return { error: { message: "Une erreur serveur est survenue. Veuillez réessayer dans quelques instants." } }
      const msg = (data.msg || data.error || '').toLowerCase()
      if (msg.includes('already registered') || msg.includes('already been registered'))
        return { error: { message: "Cette adresse email est déjà utilisée. Essayez de vous connecter." } }
      if (msg.includes('password') && msg.includes('short'))
        return { error: { message: "Le mot de passe doit contenir au moins 6 caractères." } }
      if (msg.includes('invalid') && msg.includes('email'))
        return { error: { message: "Adresse email invalide." } }
      return { error: { message: data.msg || data.error || "Une erreur est survenue." } }
    }

    // If email confirmation is disabled, Supabase returns a session immediately
    if (data.access_token) {
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      })
    }

    return { data, error: null }
  }

  async function signOut(): Promise<void> {
    setUser(null)
    setProfile(null)
    if (supabase) await supabase.auth.signOut()
  }

  async function signInWithGoogle(): Promise<AuthResult> {
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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
