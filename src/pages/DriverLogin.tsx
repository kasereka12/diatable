import { useState } from 'react'
import type React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bike, Globe, AlertCircle, CheckCircle, Mail, Phone, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

type Mode = 'email' | 'phone'

export default function DriverLogin() {
  const { signInWithMagicLink, signInWithPhone, verifyPhoneOtp } = useAuth()
  const navigate = useNavigate()

  const [mode,    setMode]    = useState<Mode>('email')
  const [step,    setStep]    = useState<1 | 2>(1)
  const [value,   setValue]   = useState('')
  const [otp,     setOtp]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  function switchMode(m: Mode) {
    setMode(m); setStep(1); setValue(''); setOtp(''); setError(''); setSent(false)
  }

  /* ── Email flow ── */
  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!value.trim()) return setError('Entrez votre adresse email.')
    setLoading(true)
    const { error: err } = await signInWithMagicLink(value.trim())
    setLoading(false)
    if (err) return setError(err.message)
    setSent(true)
  }

  /* ── Phone flow — step 1: send OTP ── */
  async function sendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!value.trim()) return setError('Entrez votre numéro de téléphone.')
    setLoading(true)
    const { error: err } = await signInWithPhone(value.trim())
    setLoading(false)
    if (err) return setError(err.message)
    setStep(2)
  }

  /* ── Phone flow — step 2: verify OTP ── */
  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!otp.trim()) return setError('Entrez le code reçu par SMS.')
    setLoading(true)
    const { error: err } = await verifyPhoneOtp(value.trim(), otp.trim())
    if (err) { setLoading(false); return setError(err.message) }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: driver } = await supabase
      .from('delivery_drivers')
      .select('id')
      .eq('profile_id', user?.id ?? '')
      .maybeSingle()

    setLoading(false)
    navigate(driver ? '/livreur' : '/devenir-livreur', { replace: true })
  }

  const inputCls = `w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3
    text-white text-sm placeholder-white/30
    focus:outline-none focus:border-[#c5611a] focus:bg-white/[0.08] transition-all`

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <div className="absolute inset-0 zellige-pattern opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark to-dark2 pointer-events-none" />

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-20">
        <Link to="/" className="font-serif text-3xl font-bold text-white mb-10 flex items-center gap-1.5">
          Dia<span className="text-[#f4a828]">Table</span>
          <Globe size={24} className="text-[#f4a828]" />
        </Link>

        <div className="w-full max-w-md">
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 backdrop-blur-sm">

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#c5611a]/15 flex items-center justify-center">
                <Bike size={28} className="text-[#f4a828]" />
              </div>
            </div>

            <h1 className="font-serif text-2xl font-bold text-white mb-1 text-center">Espace livreur</h1>
            <p className="text-white/45 text-sm mb-6 text-center">Connectez-vous sans mot de passe</p>

            {/* Switch Email / Téléphone */}
            {!sent && step === 1 && (
              <div className="flex bg-white/[0.06] rounded-xl p-1 mb-6 gap-1">
                {([
                  { id: 'email', label: 'Email',     Icon: Mail  },
                  { id: 'phone', label: 'Téléphone', Icon: Phone },
                ] as { id: Mode; label: string; Icon: typeof Mail }[]).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => switchMode(id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      mode === id
                        ? 'bg-[#c5611a] text-white shadow'
                        : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    <Icon size={15} /> {label}
                  </button>
                ))}
              </div>
            )}

            {/* ── EMAIL MODE ── */}
            {mode === 'email' && !sent && (
              <form onSubmit={sendMagicLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1.5 tracking-wide uppercase">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="email"
                      value={value}
                      onChange={e => setValue(e.target.value)}
                      placeholder="votre@email.com"
                      className={`${inputCls} pl-10`}
                      autoFocus
                    />
                  </div>
                </div>

                {error && <ErrorBox msg={error} />}

                <button type="submit" disabled={loading} className={btnCls}>
                  {loading ? 'Envoi…' : 'Recevoir le lien de connexion'}
                </button>
              </form>
            )}

            {mode === 'email' && sent && (
              <div className="text-center py-2">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle size={36} className="text-green-400" />
                </div>
                <h2 className="font-serif text-lg font-bold text-white mb-3">Vérifiez votre boîte mail</h2>
                <p className="text-white/50 text-sm leading-relaxed">
                  Un lien de connexion a été envoyé à{' '}
                  <span className="text-white/75 font-medium">{value}</span>.
                </p>
                <button
                  onClick={() => { setSent(false); setValue('') }}
                  className="mt-5 text-sm text-white/35 hover:text-white/65 transition-colors"
                >
                  Utiliser un autre email
                </button>
              </div>
            )}

            {/* ── PHONE MODE — step 1 ── */}
            {mode === 'phone' && step === 1 && (
              <form onSubmit={sendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1.5 tracking-wide uppercase">
                    Numéro de téléphone
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="tel"
                      value={value}
                      onChange={e => setValue(e.target.value)}
                      placeholder="+212 6XX XXX XXX"
                      className={`${inputCls} pl-10`}
                      autoFocus
                    />
                  </div>
                </div>

                {error && <ErrorBox msg={error} />}

                <button type="submit" disabled={loading} className={btnCls}>
                  {loading ? 'Envoi…' : 'Recevoir le code SMS'}
                </button>
              </form>
            )}

            {/* ── PHONE MODE — step 2 ── */}
            {mode === 'phone' && step === 2 && (
              <form onSubmit={verifyOtp} className="space-y-4">
                <p className="text-white/50 text-sm text-center -mt-2 mb-2">
                  Code envoyé au <span className="text-white/75 font-medium">{value}</span>
                </p>
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1.5 tracking-wide uppercase">
                    Code OTP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className={`${inputCls} text-center text-xl tracking-[0.5em] font-bold`}
                    autoFocus
                  />
                </div>

                {error && <ErrorBox msg={error} />}

                <button type="submit" disabled={loading} className={btnCls}>
                  {loading ? 'Vérification…' : 'Valider le code'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(''); setError('') }}
                  className="w-full flex items-center justify-center gap-1.5 text-white/35 hover:text-white/65 text-sm transition-colors py-1"
                >
                  <ArrowLeft size={13} /> Changer de numéro
                </button>
              </form>
            )}

          </div>

          <p className="text-center text-sm mt-6 text-white/40">
            Pas encore livreur ?{' '}
            <Link to="/devenir-livreur" className="text-[#c5611a] hover:text-[#d9722a] font-semibold transition-colors">
              Créer mon profil
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
      <AlertCircle size={14} className="shrink-0" /> {msg}
    </div>
  )
}

const btnCls = `w-full bg-[#c5611a] hover:bg-[#d9722a] text-white font-semibold py-3.5 rounded-xl
  transition-all duration-200 disabled:opacity-60 text-sm`
