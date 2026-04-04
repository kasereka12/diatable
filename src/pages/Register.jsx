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

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <div className="absolute inset-0 zellige-pattern opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark to-dark2 pointer-events-none" />

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-20">
        <Link to="/" className="font-serif text-3xl font-bold text-white mb-10 flex items-center gap-1.5">
          Dia<span className="text-gold">Table</span>
          <Globe size={24} className="text-gold" />
        </Link>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1,2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${step >= s ? 'bg-gold text-dark' : 'bg-white/10 text-muted'}`}>
                {step > s ? <Check size={12} /> : s}
              </div>
              {s < 2 && <div className={`w-12 h-px transition-all ${step > 1 ? 'bg-gold' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <div className="w-full max-w-md">
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 backdrop-blur-sm">

            {/* STEP 1: Role selection */}
            {step === 1 && (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="font-serif text-2xl font-bold text-white">Bienvenue !</h1>
                  <Sparkles size={24} className="text-gold" />
                </div>
                <p className="text-muted text-sm mb-8">Comment souhaitez-vous utiliser DiaTable ?</p>
                <div className="space-y-3 mb-8">
                  {ROLES.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                        ${role === r.id
                          ? 'border-gold bg-gold/10'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/20'}`}
                    >
                      <div className="flex items-start gap-3">
                        <r.Icon size={24} className={role === r.id ? 'text-gold' : 'text-muted'} />
                        <div>
                          <div className={`font-semibold text-sm ${role === r.id ? 'text-white' : 'text-light'}`}>{r.title}</div>
                          <div className="text-muted text-xs mt-0.5 leading-relaxed">{r.desc}</div>
                        </div>
                        <div className={`ml-auto w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all
                          ${role === r.id ? 'border-gold bg-gold' : 'border-white/20'}`}>
                          {role === r.id && (
                            <div className="w-full h-full rounded-full flex items-center justify-center text-dark">
                              <Check size={12} />
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-gold hover:bg-gold-light text-dark font-semibold py-3.5 rounded-xl transition-all text-sm hover:shadow-[0_8px_24px_rgba(244,168,40,0.4)]"
                >
                  Continuer →
                </button>
              </>
            )}

            {/* STEP 2: Account info */}
            {step === 2 && (
              <>
                <h1 className="font-serif text-2xl font-bold text-white mb-1">Créer votre compte</h1>
                <p className="text-muted text-sm mb-6">
                  En tant que <span className="text-gold font-semibold">{role === 'vendor' ? 'vendeur' : 'client'}</span>
                </p>

                <button
                  onClick={handleGoogle}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl
                             bg-white/[0.06] border border-white/10 text-white text-sm font-medium
                             hover:bg-white/10 transition-all duration-200 mb-5"
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
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-muted text-xs">ou par email</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-light/70 mb-1.5 uppercase tracking-wide">Nom complet</label>
                    <input
                      type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                      placeholder="Aminata Sow"
                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-gold focus:bg-white/[0.08] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light/70 mb-1.5 uppercase tracking-wide">Email</label>
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      placeholder="vous@exemple.com"
                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-gold focus:bg-white/[0.08] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light/70 mb-1.5 uppercase tracking-wide">Mot de passe</label>
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                        placeholder="Minimum 6 caractères"
                        className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-muted pr-12 focus:outline-none focus:border-gold focus:bg-white/[0.08] transition-all"
                      />
                      <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors flex items-center justify-center">
                        {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {/* Password strength indicator */}
                    {password && (
                      <div className="mt-2">
                        <div className="flex gap-1">
                          {[1,2,3,4].map(level => {
                            const strength = (password.length >= 6 ? 1 : 0) + (password.length >= 8 ? 1 : 0) + (/[A-Z]/.test(password) && /[a-z]/.test(password) ? 1 : 0) + (/\d/.test(password) || /[^a-zA-Z0-9]/.test(password) ? 1 : 0)
                            const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500']
                            return <div key={level} className={`h-1 flex-1 rounded-full transition-all ${level <= strength ? colors[strength - 1] : 'bg-white/10'}`} />
                          })}
                        </div>
                        <p className="text-[0.65rem] text-muted mt-1">
                          {password.length < 6 ? 'Trop court' : password.length < 8 ? 'Acceptable' : 'Bon mot de passe'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light/70 mb-1.5 uppercase tracking-wide">Confirmer le mot de passe</label>
                    <input
                      type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                      placeholder="••••••••"
                      className={`w-full bg-white/[0.06] border rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:bg-white/[0.08] transition-all ${
                        confirm && confirm !== password ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-gold'
                      }`}
                    />
                    {confirm && confirm !== password && (
                      <p className="text-red-400 text-xs mt-1">Les mots de passe ne correspondent pas</p>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
                  )}

                  <div className="flex gap-3 mt-2">
                    <button type="button" onClick={() => setStep(1)}
                      className="flex-1 py-3.5 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/5 transition-all">
                      ← Retour
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-[2] bg-gold hover:bg-gold-light text-dark font-semibold py-3.5 rounded-xl transition-all text-sm hover:shadow-[0_8px_24px_rgba(244,168,40,0.4)] disabled:opacity-60">
                      {loading ? 'Création…' : "Créer mon compte"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-muted text-sm mt-6">
            Déjà un compte ?{' '}
            <Link to="/connexion" className="text-gold font-semibold hover:text-gold-light transition-colors">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
