import { useState } from 'react'
import type React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Globe, Bike, AlertCircle, Mail, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const VEHICLE_OPTIONS = [
  { value: 'moto',    label: '🛵 Moto' },
  { value: 'voiture', label: '🚗 Voiture' },
  { value: 'velo',    label: '🚲 Vélo' },
  { value: 'pieton',  label: '🚶 Piéton' },
]

export default function DriverOnboarding() {
  const { signUp } = useAuth()
  const navigate   = useNavigate()

  const [form, setForm] = useState({
    full_name:     '',
    phone:         '',
    email:         '',
    password:      '',
    confirm:       '',
    vehicle_type:  'moto',
  })
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.full_name.trim())  return setError('Le nom complet est requis.')
    if (!form.phone.trim())      return setError('Le numéro de téléphone est requis.')
    if (!form.email.trim())      return setError('L\'adresse email est requise.')
    if (form.password.length < 6) return setError('Le mot de passe doit contenir au moins 6 caractères.')
    if (form.password !== form.confirm) return setError('Les mots de passe ne correspondent pas.')

    setLoading(true)

    // 1. Créer le compte auth
    const { error: signUpErr } = await signUp(form.email.trim(), form.password, form.full_name.trim())
    if (signUpErr) { setLoading(false); return setError(signUpErr.message) }

    // 2. Récupérer l'utilisateur créé
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return setError('Erreur lors de la création du compte.') }

    // 3. Créer le profil livreur
    const { error: dbErr } = await (supabase.from('delivery_drivers') as any).insert({
      profile_id:    user.id,
      full_name:     form.full_name.trim(),
      phone:         form.phone.trim(),
      email:         form.email.trim(),
      vehicle_type:  form.vehicle_type,
      type:          'external',
      is_active:     true,
      is_available:  true,
    })

    if (dbErr) { setLoading(false); return setError(dbErr.message) }

    // 4. Marquer le profil comme livreur
    await (supabase.from('profiles') as any).update({ role: 'driver' }).eq('id', user.id)

    setLoading(false)
    navigate('/livreur', { replace: true })
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
            <h1 className="font-serif text-2xl font-bold text-white mb-1 text-center">Devenir livreur</h1>
            <p className="text-white/45 text-sm mb-8 text-center">
              Créez votre compte pour être assigné aux commandes DiaTable.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Nom */}
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5 tracking-wide uppercase">Nom complet</label>
                <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)}
                  placeholder="Ex : Youssef Benali" className={inputCls} />
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5 tracking-wide uppercase">Téléphone</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="+212 6XX XXX XXX" className={inputCls} />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5 tracking-wide uppercase">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="votre@email.com" className={`${inputCls} pl-10`} />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5 tracking-wide uppercase">Mot de passe</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="••••••••" className={`${inputCls} pr-11`} />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirmation mot de passe */}
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5 tracking-wide uppercase">Confirmer le mot de passe</label>
                <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)}
                  placeholder="••••••••" className={`${inputCls} ${
                    form.confirm && form.confirm !== form.password ? 'border-red-500/50' : ''
                  }`} />
                {form.confirm && form.confirm !== form.password && (
                  <p className="text-xs text-red-400 mt-1">Les mots de passe ne correspondent pas</p>
                )}
              </div>

              {/* Véhicule */}
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5 tracking-wide uppercase">Véhicule</label>
                <div className="grid grid-cols-2 gap-2">
                  {VEHICLE_OPTIONS.map(v => (
                    <button key={v.value} type="button" onClick={() => set('vehicle_type', v.value)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                        form.vehicle_type === v.value
                          ? 'bg-[#c5611a] border-[#c5611a] text-white'
                          : 'border-white/10 text-white/60 hover:border-white/25'
                      }`}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  <AlertCircle size={14} className="shrink-0" /> {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-[#c5611a] hover:bg-[#d9722a] text-white font-semibold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-60 text-sm mt-2">
                {loading ? 'Création du compte…' : 'Créer mon compte livreur'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm mt-6 text-white/40">
            Déjà livreur ?{' '}
            <Link to="/connexion-livreur" className="text-[#c5611a] hover:text-[#d9722a] font-semibold transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
