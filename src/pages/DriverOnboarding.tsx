import { useState } from 'react'
import type React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bike, AlertCircle, Mail, Eye, EyeOff, ArrowRight, Wallet, Clock, Zap,
  MessageCircle, ShieldCheck, CheckCircle2, ChevronDown, MapPin,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const VALUE_PROPS = [
  { icon: Wallet,        title: 'Revenus attractifs', desc: 'Gagnez selon vos livraisons — vos gains sont visibles en temps réel dans votre espace livreur.' },
  { icon: Clock,         title: 'Liberté totale',     desc: 'Connectez-vous quand vous voulez, sans horaires fixes ni engagement minimum.' },
  { icon: Zap,           title: 'Démarrage rapide',   desc: 'Inscription en quelques minutes, profil validé sous 24 à 48h.' },
  { icon: MessageCircle, title: 'Support dédié',      desc: 'Une équipe DiaTable disponible pour vous accompagner au quotidien.' },
]

const STEPS = [
  { title: 'Inscription',            desc: 'Renseignez vos informations personnelles et celles de votre moto.' },
  { title: 'Vérification',           desc: 'Notre équipe valide votre permis et vos documents sous 24 à 48h.' },
  { title: 'Prise en main',          desc: 'Découvrez votre espace livreur et le fonctionnement des courses.' },
  { title: 'Premières livraisons',   desc: 'Recevez vos commandes assignées et commencez à gagner.' },
]

const REQUIREMENTS = [
  'Permis de conduire valide',
  'Moto en bon état, à votre nom ou mise à votre disposition',
  'Smartphone avec connexion internet',
  'Résider dans une ville couverte par DiaTable',
]

const FAQ_ITEMS = [
  { q: 'Dois-je posséder ma propre moto ?', a: 'Oui, vous devez avoir accès à une moto en état de marche, à votre nom ou mise à votre disposition.' },
  { q: 'Quels sont mes horaires de travail ?', a: 'Vous êtes libre de vous connecter quand vous le souhaitez, sans horaires imposés ni nombre d\'heures minimum.' },
  { q: 'Combien de temps prend la validation de mon profil ?', a: 'Notre équipe vérifie votre permis et vos documents sous 24 à 48h ouvrées.' },
  { q: 'Dans quelles villes puis-je livrer ?', a: 'DiaTable est présent à Casablanca, Rabat, Marrakech et Tanger, avec de nouvelles villes à venir.' },
  { q: 'Comment suis-je payé ?', a: 'Vos gains sont enregistrés à chaque livraison et consultables dans votre espace livreur. Notre équipe vous communique les modalités de retrait à la validation de votre profil.' },
  { q: 'Que se passe-t-il si mon profil est refusé ?', a: 'Vous êtes informé du motif et pouvez corriger les documents manquants avant de soumettre à nouveau votre dossier.' },
]

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-white/10 last:border-0">
      <button type="button" onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left">
        <span className="font-medium text-white text-sm md:text-base">{q}</span>
        <ChevronDown size={18} className={`flex-shrink-0 text-white/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="text-white/50 text-sm leading-relaxed pb-5 pr-8">{a}</p>
      )}
    </div>
  )
}

export default function DriverOnboarding() {
  const { user, signUp } = useAuth()
  const navigate   = useNavigate()

  // Already have an account (came from /inscription with role "Livreur", or
  // redirected here from the driver dashboard/login) — only the delivery
  // profile (phone, vehicle) is still missing, no need to sign up again.
  const hasAccount = !!user

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
  const [openFaq,  setOpenFaq]  = useState<number | null>(0)

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!hasAccount) {
      if (!form.full_name.trim())  return setError('Le nom complet est requis.')
      if (!form.email.trim())      return setError('L\'adresse email est requise.')
      if (form.password.length < 6) return setError('Le mot de passe doit contenir au moins 6 caractères.')
      if (form.password !== form.confirm) return setError('Les mots de passe ne correspondent pas.')
    }
    if (!form.phone.trim()) return setError('Le numéro de téléphone est requis.')

    setLoading(true)

    let driverId: string
    let driverEmail: string

    if (hasAccount) {
      driverId    = user!.id
      driverEmail = user!.email || ''
    } else {
      // 1. Créer le compte auth
      const { error: signUpErr } = await signUp(form.email.trim(), form.password, form.full_name.trim(), 'driver')
      if (signUpErr) { setLoading(false); return setError(signUpErr.message) }

      // 2. Récupérer l'utilisateur créé
      const { data: { user: newUser } } = await supabase.auth.getUser()
      if (!newUser) { setLoading(false); return setError('Erreur lors de la création du compte.') }
      driverId    = newUser.id
      driverEmail = newUser.email || form.email.trim()
    }

    // 3. Créer le profil livreur
    const { error: dbErr } = await (supabase.from('delivery_drivers') as any).insert({
      profile_id:    driverId,
      full_name:     (hasAccount ? user!.user_metadata?.full_name : form.full_name.trim()) || '',
      phone:         form.phone.trim(),
      email:         driverEmail,
      vehicle_type:  form.vehicle_type,
      type:          'external',
      is_active:     false,
      is_available:  true,
    })

    if (dbErr) { setLoading(false); return setError(dbErr.message) }

    // 4. Marquer le profil comme livreur
    await (supabase.from('profiles') as any).update({ role: 'driver' }).eq('id', driverId)

    setLoading(false)
    navigate('/livreur', { replace: true })
  }

  const inputCls = `w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3
    text-white text-sm placeholder-white/30
    focus:outline-none focus:border-[#c5611a] focus:bg-white/[0.08] transition-all`

  return (
    <div className="min-h-screen bg-dark">
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-6 max-w-6xl mx-auto">
        <Link to="/" className="font-serif text-xl font-bold text-white flex items-center gap-1">
          Dia<span className="text-[#f4a828]">Table</span>
        </Link>
        {!hasAccount && (
          <Link to="/connexion-livreur" className="text-sm text-white/50 hover:text-white transition-colors">
            Déjà livreur ? <span className="text-[#f4a828] font-semibold">Se connecter</span>
          </Link>
        )}
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-10 pb-24">
        <div className="absolute inset-0 zellige-pattern opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs font-bold uppercase tracking-widest text-[#f4a828] mb-6">
            <Bike size={13} /> Réseau de livraison DiaTable
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-black text-white leading-[1.08] mb-5">
            Livrez avec DiaTable,<br /><span className="text-[#f4a828]">augmentez vos revenus</span>
          </h1>
          <p className="text-white/60 text-base md:text-lg max-w-xl mx-auto mb-9">
            Rejoignez notre réseau de livreurs indépendants et gagnez de l'argent selon votre propre emploi du temps, en moto, dans votre ville.
          </p>
          <a href="#inscription"
            className="inline-flex items-center gap-2 bg-[#c5611a] hover:bg-[#d9722a] text-white font-semibold px-8 py-4 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(197,97,26,0.4)]">
            Devenir livreur <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* Value props */}
      <section className="relative px-6 py-16" style={{ backgroundColor: '#1c1b2a' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {VALUE_PROPS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
              <div className="w-11 h-11 rounded-xl bg-[#c5611a]/15 flex items-center justify-center mb-4">
                <Icon size={20} className="text-[#f4a828]" />
              </div>
              <h3 className="font-serif font-bold text-white mb-2">{title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c5611a] mb-3">Simple &amp; rapide</p>
            <h2 className="font-serif text-3xl md:text-4xl font-black text-white">Comment ça marche</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.title}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-serif font-black text-lg text-[#f4a828] mb-4"
                  style={{ backgroundColor: 'rgba(197,97,26,0.15)', border: '1px solid rgba(197,97,26,0.30)' }}>
                  {i + 1}
                </div>
                <h3 className="font-serif font-bold text-white mb-2">{s.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="px-6 py-16" style={{ backgroundColor: '#1c1b2a' }}>
        <div className="max-w-2xl mx-auto bg-white/[0.04] border border-white/10 rounded-2xl p-8">
          <h3 className="font-serif text-xl font-bold text-white mb-5 flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#f4a828]" /> Conditions pour devenir livreur
          </h3>
          <ul className="space-y-3">
            {REQUIREMENTS.map(r => (
              <li key={r} className="flex items-start gap-3 text-white/70 text-sm">
                <CheckCircle2 size={16} className="text-[#f4a828] flex-shrink-0 mt-0.5" /> {r}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Sign-up form */}
      <section id="inscription" className="relative px-4 py-24 scroll-mt-6">
        <div className="absolute inset-0 zellige-pattern opacity-20 pointer-events-none" />
        <div className="relative w-full max-w-md mx-auto">
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 backdrop-blur-sm">

            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#c5611a]/15 flex items-center justify-center">
                <Bike size={28} className="text-[#f4a828]" />
              </div>
            </div>
            <h2 className="font-serif text-2xl font-bold text-white mb-1 text-center">
              {hasAccount ? 'Complétez votre profil livreur' : 'Créez votre compte livreur'}
            </h2>
            <p className="text-white/45 text-sm mb-8 text-center">
              {hasAccount
                ? 'Encore quelques infos pour recevoir vos premières courses.'
                : 'Quelques informations suffisent pour démarrer.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">

              {!hasAccount && (
                <>
                  {/* Nom */}
                  <div>
                    <label className="block text-xs font-semibold text-white/60 mb-1.5 tracking-wide uppercase">Nom complet</label>
                    <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)}
                      placeholder="Ex : Youssef Benali" className={inputCls} />
                  </div>
                </>
              )}

              {/* Téléphone */}
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5 tracking-wide uppercase">Téléphone</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="+212 6XX XXX XXX" className={inputCls} />
              </div>

              {!hasAccount && (
                <>
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
                </>
              )}

              {/* Véhicule */}
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5 tracking-wide uppercase">Véhicule</label>
                <div className="inline-flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium border border-white/10 text-white/60">
                  <Bike size={15} /> Moto
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  <AlertCircle size={14} className="shrink-0" /> {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-[#c5611a] hover:bg-[#d9722a] text-white font-semibold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-60 text-sm mt-2">
                {loading
                  ? (hasAccount ? 'Enregistrement…' : 'Création du compte…')
                  : (hasAccount ? 'Valider mon profil livreur' : 'Créer mon compte livreur')}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20" style={{ backgroundColor: '#1c1b2a' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c5611a] mb-3">Questions fréquentes</p>
            <h2 className="font-serif text-3xl font-black text-white">Vous vous posez des questions ?</h2>
          </div>
          <div>
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem key={item.q} q={item.q} a={item.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-xl mx-auto">
          <MapPin size={28} className="text-[#f4a828] mx-auto mb-4" />
          <h2 className="font-serif text-2xl md:text-3xl font-black text-white mb-3">Prêt à prendre la route ?</h2>
          <p className="text-white/50 text-sm mb-8">Rejoignez le réseau de livreurs DiaTable dès aujourd'hui.</p>
          <a href="#inscription"
            className="inline-flex items-center gap-2 bg-[#c5611a] hover:bg-[#d9722a] text-white font-semibold px-8 py-4 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(197,97,26,0.4)]">
            Devenir livreur <ArrowRight size={18} />
          </a>
        </div>
      </section>
    </div>
  )
}
