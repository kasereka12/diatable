import { useState } from 'react'
import type React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bike, Globe, AlertCircle, Mail, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function DriverLogin() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim())    return setError('Entrez votre adresse email.')
    if (!password.trim()) return setError('Entrez votre mot de passe.')

    setLoading(true)
    const { error: authErr } = await signIn(email.trim(), password)
    if (authErr) { setLoading(false); return setError(authErr.message) }

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

            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#c5611a]/15 flex items-center justify-center">
                <Bike size={28} className="text-[#f4a828]" />
              </div>
            </div>

            <h1 className="font-serif text-2xl font-bold text-white mb-1 text-center">Espace livreur</h1>
            <p className="text-white/45 text-sm mb-8 text-center">Connectez-vous à votre compte</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5 tracking-wide uppercase">
                  Email
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className={`${inputCls} pl-10`}
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5 tracking-wide uppercase">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputCls} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  <AlertCircle size={14} className="shrink-0" /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#c5611a] hover:bg-[#d9722a] text-white font-semibold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-60 text-sm"
              >
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>
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
