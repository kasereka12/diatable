import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Globe, Utensils, ChefHat, Check, Sparkles, Eye, EyeOff } from 'lucide-react'

const ROLES = [
  {
    id: 'client',
    Icon: Utensils,
    title: 'Je cherche de la nourriture',
    desc: 'Trouvez des cuisines authentiques de votre pays ou découvrez de nouvelles saveurs au Maroc.',
  },
  {
    id: 'vendor',
    Icon: ChefHat,
    title: 'Je cuisine & vends',
    desc: 'Référencez votre restaurant, cuisine à domicile ou pop-up et touchez des milliers d\'expatriés.',
  },
]

export default function Register() {
  const { signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [step,     setStep]     = useState(1)
  const [role,     setRole]     = useState(params.get('role') || 'client')
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPwd,  setShowPwd]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 6)  { setError('Le mot de passe doit contenir au moins 6 caractères.'); return }
    setError('')
    setLoading(true)
    const { error } = await signUp(email, password, fullName, role)
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/connexion', { replace: true, state: { registered: true } })
  }

  async function handleGoogle() {
    const { error } = await signInWithGoogle()
    if (error) setError(error.message)
  }

  // Shared input style helpers
  const inputBase = {
    backgroundColor: 'rgba(248,248,248,0.06)',
    border: '1px solid rgba(248,248,248,0.10)',
    color: '#f8f8f8',
  }
  const inputFocus = (e) => {
    e.target.style.borderColor = '#c5611a'
    e.target.style.backgroundColor = 'rgba(248,248,248,0.08)'
  }
  const inputBlur = (e) => {
    e.target.style.borderColor = 'rgba(248,248,248,0.10)'
    e.target.style.backgroundColor = 'rgba(248,248,248,0.06)'
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1f1f1f' }}>
      <div className="absolute inset-0 zellige-pattern opacity-40 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, #1f1f1f 0%, #1f1f1f 70%, #504640 100%)' }} />

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-20">
        {/* Logo */}
        <Link to="/" className="font-serif text-3xl font-bold mb-10 flex items-center gap-1.5"
          style={{ color: '#f8f8f8' }}>
          Dia<span style={{ color: '#c5611a' }}>Table</span>
          <Globe size={24} style={{ color: '#c5611a' }} />
        </Link>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={step >= s ? {
                  backgroundColor: '#c5611a',
                  color: '#f8f8f8',
                } : {
                  backgroundColor: 'rgba(248,248,248,0.10)',
                  color: '#80716a',
                }}>
                {step > s ? <Check size={12} /> : s}
              </div>
              {s < 2 && (
                <div className="w-12 h-px transition-all"
                  style={{ backgroundColor: step > 1 ? '#c5611a' : 'rgba(248,248,248,0.10)' }} />
              )}
            </div>
          ))}
        </div>

        <div className="w-full max-w-md">
          <div className="rounded-2xl p-8 backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(248,248,248,0.04)', border: '1px solid rgba(248,248,248,0.10)' }}>

            {/* STEP 1: Role selection */}
            {step === 1 && (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="font-serif text-2xl font-bold" style={{ color: '#f8f8f8' }}>Bienvenue !</h1>
                  <Sparkles size={24} style={{ color: '#c5611a' }} />
                </div>
                <p className="text-sm mb-8" style={{ color: '#80716a' }}>
                  Comment souhaitez-vous utiliser DiaTable ?
                </p>

                <div className="space-y-3 mb-8">
                  {ROLES.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className="w-full text-left p-4 rounded-xl transition-all duration-200"
                      style={role === r.id ? {
                        border: '2px solid #c5611a',
                        backgroundColor: 'rgba(197,97,26,0.10)',
                      } : {
                        border: '2px solid rgba(248,248,248,0.10)',
                        backgroundColor: 'rgba(248,248,248,0.03)',
                      }}
                      onMouseEnter={e => { if (role !== r.id) e.currentTarget.style.borderColor = 'rgba(248,248,248,0.22)' }}
                      onMouseLeave={e => { if (role !== r.id) e.currentTarget.style.borderColor = 'rgba(248,248,248,0.10)' }}
                    >
                      <div className="flex items-start gap-3">
                        <r.Icon size={24} style={{ color: role === r.id ? '#c5611a' : '#80716a' }} />
                        <div>
                          <div className="font-semibold text-sm" style={{ color: '#f8f8f8' }}>{r.title}</div>
                          <div className="text-xs mt-0.5 leading-relaxed" style={{ color: '#80716a' }}>{r.desc}</div>
                        </div>
                        <div className="ml-auto w-5 h-5 rounded-full flex-shrink-0 mt-0.5 transition-all flex items-center justify-center"
                          style={role === r.id ? {
                            border: '2px solid #c5611a',
                            backgroundColor: '#c5611a',
                          } : {
                            border: '2px solid rgba(248,248,248,0.20)',
                            backgroundColor: 'transparent',
                          }}>
                          {role === r.id && <Check size={12} style={{ color: '#f8f8f8' }} />}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full font-semibold py-3.5 rounded-xl transition-all text-sm"
                  style={{ backgroundColor: '#c5611a', color: '#f8f8f8' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#d9722a'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(197,97,26,0.40)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#c5611a'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  Continuer →
                </button>
              </>
            )}

            {/* STEP 2: Account info */}
            {step === 2 && (
              <>
                <h1 className="font-serif text-2xl font-bold mb-1" style={{ color: '#f8f8f8' }}>
                  Créer votre compte
                </h1>
                <p className="text-sm mb-6" style={{ color: '#80716a' }}>
                  En tant que{' '}
                  <span className="font-semibold" style={{ color: '#c5611a' }}>
                    {role === 'vendor' ? 'vendeur' : 'client'}
                  </span>
                </p>

                {/* Google */}
                <button
                  onClick={handleGoogle}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 mb-5"
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

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(248,248,248,0.10)' }} />
                  <span className="text-xs" style={{ color: '#80716a' }}>ou par email</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(248,248,248,0.10)' }} />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Nom */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                      style={{ color: 'rgba(248,248,248,0.60)' }}>Nom complet</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                      placeholder="Aminata Sow"
                      className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                      style={inputBase} onFocus={inputFocus} onBlur={inputBlur} />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                      style={{ color: 'rgba(248,248,248,0.60)' }}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      placeholder="vous@exemple.com"
                      className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                      style={inputBase} onFocus={inputFocus} onBlur={inputBlur} />
                  </div>

                  {/* Mot de passe */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                      style={{ color: 'rgba(248,248,248,0.60)' }}>Mot de passe</label>
                    <div className="relative">
                      <input type={showPwd ? 'text' : 'password'} value={password}
                        onChange={e => setPassword(e.target.value)} required
                        placeholder="Minimum 6 caractères"
                        className="w-full rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none transition-all"
                        style={inputBase} onFocus={inputFocus} onBlur={inputBlur} />
                      <button type="button" onClick={() => setShowPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors"
                        style={{ color: '#80716a' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#f8f8f8'}
                        onMouseLeave={e => e.currentTarget.style.color = '#80716a'}>
                        {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {/* Indicateur de force */}
                    {password && (
                      <div className="mt-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map(level => {
                            const strength =
                              (password.length >= 6 ? 1 : 0) +
                              (password.length >= 8 ? 1 : 0) +
                              (/[A-Z]/.test(password) && /[a-z]/.test(password) ? 1 : 0) +
                              (/\d/.test(password) || /[^a-zA-Z0-9]/.test(password) ? 1 : 0)
                            const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e']
                            return (
                              <div key={level} className="h-1 flex-1 rounded-full transition-all"
                                style={{ backgroundColor: level <= strength ? colors[strength - 1] : 'rgba(248,248,248,0.10)' }} />
                            )
                          })}
                        </div>
                        <p className="text-[0.65rem] mt-1" style={{ color: '#80716a' }}>
                          {password.length < 6 ? 'Trop court' : password.length < 8 ? 'Acceptable' : 'Bon mot de passe'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirmer */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                      style={{ color: 'rgba(248,248,248,0.60)' }}>Confirmer le mot de passe</label>
                    <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                      placeholder="••••••••"
                      className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                      style={{
                        ...inputBase,
                        borderColor: confirm && confirm !== password
                          ? 'rgba(239,68,68,0.50)'
                          : 'rgba(248,248,248,0.10)',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = confirm && confirm !== password ? '#ef4444' : '#c5611a'
                        e.target.style.backgroundColor = 'rgba(248,248,248,0.08)'
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = confirm && confirm !== password
                          ? 'rgba(239,68,68,0.50)'
                          : 'rgba(248,248,248,0.10)'
                        e.target.style.backgroundColor = 'rgba(248,248,248,0.06)'
                      }}
                    />
                    {confirm && confirm !== password && (
                      <p className="text-xs mt-1" style={{ color: '#f87171' }}>
                        Les mots de passe ne correspondent pas
                      </p>
                    )}
                  </div>

                  {error && (
                    <div className="rounded-xl px-4 py-3 text-sm"
                      style={{ backgroundColor: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#f87171' }}>
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 mt-2">
                    <button type="button" onClick={() => setStep(1)}
                      className="flex-1 py-3.5 rounded-xl text-sm font-medium transition-all"
                      style={{ border: '1px solid rgba(248,248,248,0.20)', color: '#f8f8f8' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(248,248,248,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      ← Retour
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-[2] font-semibold py-3.5 rounded-xl transition-all text-sm disabled:opacity-60"
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
                      }}>
                      {loading ? 'Création…' : 'Créer mon compte'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-sm mt-6" style={{ color: '#80716a' }}>
            Déjà un compte ?{' '}
            <Link to="/connexion" className="font-semibold transition-colors"
              style={{ color: '#c5611a' }}
              onMouseEnter={e => e.currentTarget.style.color = '#d9722a'}
              onMouseLeave={e => e.currentTarget.style.color = '#c5611a'}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}