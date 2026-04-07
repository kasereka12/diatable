import { useState, useEffect } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { useAuth } from '../context/AuthContext'
import { Mail, MessageCircle, MapPin, Clock, CheckCircle, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'

const REASONS_DEFAULT = [
  'Question générale',
  'Devenir vendeur',
  'Signaler un problème',
  'Partenariat / Presse',
  'Autre',
]
const REASONS_VENDOR = [
  'Question générale',
  'Signaler un problème',
  'Partenariat / Presse',
  'Autre',
]

const INFO_ITEMS = [
  { Icon: Mail, title: 'Email', val: 'contact@datable.ma' },
  { Icon: MessageCircle, title: 'WhatsApp', val: '+212 76 18 41 41' },
  { Icon: MapPin, title: 'Bureau', val: 'Casablanca, Maroc' },
  { Icon: Clock, title: 'Horaires', val: 'Lun–Ven, 9h–18h' },
]

export default function Contact() {
  const ref = useScrollReveal()
  const isVendor = profile?.role === 'vendor'
  const REASONS = isVendor ? REASONS_VENDOR : REASONS_DEFAULT
  const [form, setForm] = useState({ name: '', email: '', reason: '', message: '' })
  const [submitted, setSubmit] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)


  async function fetchProfile(userId) {
    if (!supabase) return
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    setProfile(data)
  }
  useEffect(() => {
    if (user) {
      fetchProfile(user.id)
    }
  }, [user])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => { setLoading(false); setSubmit(true) }, 1200)
  }

  return (
    <div className="bg-cream min-h-screen pt-24" ref={ref}>
      {/* Header */}
      <div className="bg-dark py-16 relative overflow-hidden">
        <div className="absolute inset-0 zellige-pattern opacity-30" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <p className="section-label" data-reveal>Parlons-nous</p>
          <h1 className="font-serif text-4xl font-black text-white mb-3" data-reveal data-delay="0.1s">
            Nous <em className="text-gold italic">Contacter</em>
          </h1>
          <p className="text-light/70" data-reveal data-delay="0.2s">
            Une question, un problème, ou vous souhaitez rejoindre DiaTable ? On vous répond dans les 24h.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Info sidebar */}
          <div className="space-y-5" data-reveal>
            {INFO_ITEMS.map(c => (
              <div key={c.title} className="bg-white rounded-2xl p-5 shadow-sm border border-black/[0.05] flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <c.Icon size={20} className="text-gold" />
                </div>
                <div>
                  <div className="font-semibold text-dark text-sm">{c.title}</div>
                  <div className="text-muted text-sm">{c.val}</div>
                </div>
              </div>
            ))}

            {!isVendor && (
              <div className="bg-dark rounded-2xl p-5 text-center">
                <p className="text-white/70 text-sm mb-3">Envie de rejoindre DiaTable en tant que vendeur ?</p>
                <a href="/inscription?role=vendor" className="btn btn-gold text-sm w-full justify-center">
                  Devenir vendeur →
                </a>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="lg:col-span-2" data-reveal data-delay="0.1s">
            {submitted ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-black/[0.05] text-center">
                <div className="flex justify-center mb-5">
                  <CheckCircle size={56} className="text-green-500" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-dark mb-3">Message envoyé !</h2>
                <p className="text-muted mb-6">Merci pour votre message. Notre équipe vous répondra dans les 24 heures.</p>
                <button onClick={() => setSubmit(false)} className="btn btn-gold text-sm">
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-black/[0.05]">
                <h2 className="font-serif text-xl font-bold text-dark mb-6">Envoyer un message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-1.5">Nom complet *</label>
                      <input value={form.name} onChange={e => set('name', e.target.value)} required
                        placeholder="Votre nom"
                        className="w-full bg-cream border border-black/10 rounded-xl px-4 py-3 text-dark text-sm focus:outline-none focus:border-gold transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-1.5">Email *</label>
                      <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required
                        placeholder="votre@email.com"
                        className="w-full bg-cream border border-black/10 rounded-xl px-4 py-3 text-dark text-sm focus:outline-none focus:border-gold transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-1.5">Objet *</label>
                    <select value={form.reason} onChange={e => set('reason', e.target.value)} required
                      className="w-full bg-cream border border-black/10 rounded-xl px-4 py-3 text-dark text-sm focus:outline-none focus:border-gold transition-all">
                      <option value="">Choisir un objet…</option>
                      {REASONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-1.5">Message *</label>
                    <textarea value={form.message} onChange={e => set('message', e.target.value)} required
                      rows={5} placeholder="Décrivez votre demande en détail…"
                      className="w-full bg-cream border border-black/10 rounded-xl px-4 py-3 text-dark text-sm focus:outline-none focus:border-gold transition-all resize-none" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full btn btn-gold justify-center py-3.5 disabled:opacity-60 flex items-center gap-2">
                    {loading ? 'Envoi en cours…' : (
                      <><Send size={16} /> Envoyer le message</>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
