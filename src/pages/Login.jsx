import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Globe, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || '/profil'
  const registered = location.state?.registered || false

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPwd,  setShowPwd]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate(from, { replace: true })
  }

  async function handleGoogle() {
    const { error } = await signInWithGoogle()
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      {/* Zellige bg */}
      <div className="absolute inset-0 zellige-pattern opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark to-dark2 pointer-events-none" />

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-20">
        {/* Logo */}
        <Link to="/" className="font-serif text-3xl font-bold text-white mb-10 flex items-center gap-1.5">
          Dia<span className="text-gold">Table</span>
          <Globe size={24} className="text-gold" />
        </Link>

        <div className="w-full max-w-md">
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h1 className="font-serif text-2xl font-bold text-white mb-1">
              {registered ? 'Compte créé !' : 'Bon retour'}
            </h1>
            <p className="text-muted text-sm mb-6">
              {registered ? 'Votre compte a bien été créé. Connectez-vous pour continuer.' : 'Connectez-vous pour accéder à votre compte'}
            </p>
            {registered && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm mb-6">
                Inscription réussie — connectez-vous avec vos identifiants.
              </div>
            )}

            {/* Google */}
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl
                         bg-white/[0.06] border border-white/10 text-white text-sm font-medium
                         hover:bg-white/10 transition-all duration-200 mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuer avec Google
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-muted text-xs">ou avec votre email</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-light/70 mb-1.5 tracking-wide uppercase">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="vous@exemple.com"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3
                             text-white text-sm placeholder-muted
                             focus:outline-none focus:border-gold focus:bg-white/[0.08] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-light/70 mb-1.5 tracking-wide uppercase">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3
                               text-white text-sm placeholder-muted pr-12
                               focus:outline-none focus:border-gold focus:bg-white/[0.08] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors flex items-center justify-center"
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="text-right mt-1.5">
                  <Link to="/mot-de-passe-oublie" className="text-xs text-muted hover:text-gold transition-colors">
                    Mot de passe oublié ?
                  </Link>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold hover:bg-gold-light text-dark font-semibold py-3.5 rounded-xl
                           transition-all duration-200 hover:shadow-[0_8px_24px_rgba(244,168,40,0.4)]
                           disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-2"
              >
                {loading ? 'Connexion en cours…' : 'Se connecter'}
              </button>
            </form>
          </div>

          <p className="text-center text-muted text-sm mt-6">
            Pas encore de compte ?{' '}
            <Link to="/inscription" className="text-gold font-semibold hover:text-gold-light transition-colors">
              Créer un compte
            </Link>
          </p>
          <p className="text-center text-muted text-sm mt-3">
            Vous cuisinez ?{' '}
            <Link to="/inscription?role=vendor" className="text-gold font-semibold hover:text-gold-light transition-colors">
              Rejoindre en tant que vendeur →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
