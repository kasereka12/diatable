import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Globe, Eye, EyeOff } from 'lucide-react'
import Logo from '../assets/Logo.png';


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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1f1f1f' }}>
      {/* Zellige bg */}
      <div className="absolute inset-0 zellige-pattern opacity-40 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, #1f1f1f 0%, #1f1f1f 70%, #504640 100%)' }} />

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-20">
    {/* Logo */}
    <div className="flex justify-center mb-8">
      <Link to="/" aria-label="DiaTable - Accueil">
        <img
          src={Logo}
          alt="DiaTable"
          className="h-16 w-auto object-contain"
        />
      </Link>
    </div>

        <div className="w-full max-w-md">
          <div className="rounded-2xl p-8 backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(248,248,248,0.04)', border: '1px solid rgba(248,248,248,0.10)' }}>

            <h1 className="font-serif text-2xl font-bold mb-1" style={{ color: '#f8f8f8' }}>
              {registered ? 'Compte créé !' : 'Bon retour'}
            </h1>
            <p className="text-sm mb-6" style={{ color: '#80716a' }}>
              {registered
                ? 'Votre compte a bien été créé. Connectez-vous pour continuer.'
                : 'Connectez-vous pour accéder à votre compte'}
            </p>

            {registered && (
              <div className="rounded-xl px-4 py-3 text-sm mb-6"
                style={{ backgroundColor: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.30)', color: '#4ade80' }}>
                Inscription réussie — connectez-vous avec vos identifiants.
              </div>
            )}

            {/* Google */}
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl
                         text-sm font-medium transition-all duration-200 mb-6"
              style={{ backgroundColor: 'rgba(248,248,248,0.06)', border: '1px solid rgba(248,248,248,0.10)', color: '#f8f8f8' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(248,248,248,0.10)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(248,248,248,0.06)'}
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
              <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(248,248,248,0.10)' }} />
              <span className="text-xs" style={{ color: '#80716a' }}>ou avec votre email</span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(248,248,248,0.10)' }} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase"
                  style={{ color: 'rgba(248,248,248,0.60)' }}>
                  Adresse email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="vous@exemple.com"
                  className="w-full rounded-xl px-4 py-3 text-sm transition-all focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(248,248,248,0.06)',
                    border: '1px solid rgba(248,248,248,0.10)',
                    color: '#f8f8f8',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#c5611a'
                    e.target.style.backgroundColor = 'rgba(248,248,248,0.08)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(248,248,248,0.10)'
                    e.target.style.backgroundColor = 'rgba(248,248,248,0.06)'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase"
                  style={{ color: 'rgba(248,248,248,0.60)' }}>
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-xl px-4 py-3 pr-12 text-sm transition-all focus:outline-none"
                    style={{
                      backgroundColor: 'rgba(248,248,248,0.06)',
                      border: '1px solid rgba(248,248,248,0.10)',
                      color: '#f8f8f8',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#c5611a'
                      e.target.style.backgroundColor = 'rgba(248,248,248,0.08)'
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'rgba(248,248,248,0.10)'
                      e.target.style.backgroundColor = 'rgba(248,248,248,0.06)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors"
                    style={{ color: '#80716a' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#f8f8f8'}
                    onMouseLeave={e => e.currentTarget.style.color = '#80716a'}
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="text-right mt-1.5">
                  <Link to="/mot-de-passe-oublie"
                    className="text-xs transition-colors"
                    style={{ color: '#80716a' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#c5611a'}
                    onMouseLeave={e => e.currentTarget.style.color = '#80716a'}>
                    Mot de passe oublié ?
                  </Link>
                </div>
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm"
                  style={{ backgroundColor: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#f87171' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full font-semibold py-3.5 rounded-xl transition-all duration-200
                           disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-2"
                style={{ backgroundColor: '#c5611a', color: '#f8f8f8' }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#d9722a'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(197,97,26,0.40)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#c5611a'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {loading ? 'Connexion en cours…' : 'Se connecter'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm mt-6" style={{ color: '#80716a' }}>
            Pas encore de compte ?{' '}
            <Link to="/inscription"
              className="font-semibold transition-colors"
              style={{ color: '#c5611a' }}
              onMouseEnter={e => e.currentTarget.style.color = '#d9722a'}
              onMouseLeave={e => e.currentTarget.style.color = '#c5611a'}>
              Créer un compte
            </Link>
          </p>
          <p className="text-center text-sm mt-3" style={{ color: '#80716a' }}>
            Vous cuisinez ?{' '}
            <Link to="/inscription?role=vendor"
              className="font-semibold transition-colors"
              style={{ color: '#c5611a' }}
              onMouseEnter={e => e.currentTarget.style.color = '#d9722a'}
              onMouseLeave={e => e.currentTarget.style.color = '#c5611a'}>
              Rejoindre en tant que vendeur →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}