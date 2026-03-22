import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TABS } from '../data/restaurants'
import { Globe, Store, HomeIcon, Zap, Phone, MessageCircle, Instagram, Check, Sparkles, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const STEPS = ['Votre restaurant', 'Localisation', 'Cuisine & horaires', 'Contact', 'Confirmation']

const VILLES = ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès', 'Agadir', 'Meknès', 'Autre']

const TYPES = [
  { id: 'restaurant', Icon: Store,    label: 'Restaurant' },
  { id: 'homecook',   Icon: HomeIcon, label: 'Cuisine à domicile' },
  { id: 'popup',      Icon: Zap,      label: 'Pop-up / Traiteur' },
]

// Hours presets: jours → string
const JOURS_OPTIONS = [
  'Lundi – Vendredi',
  'Lundi – Samedi',
  'Lundi – Dimanche',
  'Mardi – Dimanche',
  'Mercredi – Dimanche',
  'Sur commande uniquement',
  'Weekends uniquement',
]
const HEURE_OPTIONS = [
  '07h00','08h00','09h00','10h00','11h00','11h30',
  '12h00','12h30','13h00','14h00','15h00','16h00',
  '17h00','18h00','18h30','19h00','19h30','20h00',
  '20h30','21h00','21h30','22h00','22h30','23h00','23h30',
]

// Map cuisine id → { label, flag }
const CUISINE_MAP = Object.fromEntries(
  TABS.filter(t => t.id !== 'all').map(t => {
    const parts = t.label.split(' ')
    return [t.id, { flag: parts[0], label: parts.slice(1).join(' ') }]
  })
)

// Shared select style (dark bg so options are readable in native picker)
const SELECT_CLS = `w-full bg-[#1e1e35] border border-white/10 rounded-xl px-4 py-3 text-white text-sm
  focus:outline-none focus:border-gold transition-all appearance-none`

// Phone helpers
const MAX_LOCAL_DIGITS = 9   // after +212

function formatPhone(raw) {
  // strip non-digits, limit to MAX_LOCAL_DIGITS
  return raw.replace(/\D/g, '').slice(0, MAX_LOCAL_DIGITS)
}

export default function VendorOnboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep]         = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', type: 'restaurant',
    cuisine: '', cuisineCustom: '', city: '', address: '',
    joursOuverture: 'Lundi – Samedi',
    heureOuverture: '11h00',
    heureFermeture: '22h00',
    phone: '', whatsapp: '', instagram: '',
  })

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))
  const next = () => { if (step < STEPS.length - 1) setStep(s => s + 1) }
  const prev = () => setStep(s => s - 1)

  const isHomecook = form.type === 'homecook'

  // Build hours string from structured fields
  const hoursString = form.joursOuverture === 'Sur commande uniquement'
    ? 'Sur commande uniquement'
    : `${form.joursOuverture} · ${form.heureOuverture}–${form.heureFermeture}`

  async function handleSubmit() {
    if (!supabase || !user) { next(); return }
    setSubmitting(true)
    const isCustom = form.cuisine === '__custom__'
    const cuisineId = isCustom ? 'internationale' : form.cuisine
    const meta = isCustom
      ? { flag: '🌍', label: form.cuisineCustom || 'Internationale' }
      : (CUISINE_MAP[form.cuisine] || { flag: '🍽️', label: form.cuisine })
    await supabase.from('restaurants').insert({
      owner_id:      user.id,
      type:          form.type,
      name:          form.name,
      cuisine:       cuisineId,
      cuisine_label: meta.label,
      flag:          meta.flag,
      emoji:         meta.flag,
      gradient:      'linear-gradient(135deg,#f4a828,#c8841a)',
      location:      form.city,
      address:       isHomecook ? null : form.address,
      description:   form.description,
      hours:         hoursString,
      phone:         form.phone ? `+212${form.phone}` : null,
      whatsapp:      form.whatsapp ? `+212${form.whatsapp}` : null,
      instagram:     form.instagram || null,
      is_active:     false,
      is_verified:   false,
    })
    await supabase.from('profiles').update({ role: 'vendor' }).eq('id', user.id)
    setSubmitting(false)
    next()
  }

  function handleFinish() {
    navigate('/tableau-de-bord')
  }

  const progressPct = (step / (STEPS.length - 1)) * 100

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <div className="absolute inset-0 zellige-pattern opacity-30 pointer-events-none" />

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-20">
        <a href="/" className="font-serif text-2xl font-bold text-white mb-10 flex items-center gap-1.5">
          Dia<span className="text-gold">Table</span>
          <Globe size={20} className="text-gold" />
        </a>

        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-muted mb-2">
              <span>{STEPS[step]}</span>
              <span>Étape {step + 1} / {STEPS.length}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gold rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 backdrop-blur-sm">

            {/* Step 0: Type & Nom */}
            {step === 0 && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-white mb-1">Votre établissement</h2>
                <p className="text-muted text-sm mb-6">Comment souhaitez-vous vous présenter sur DiaTable ?</p>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {TYPES.map(t => (
                    <button key={t.id} onClick={() => set('type', t.id)}
                      className={`p-4 rounded-xl border-2 text-center transition-all
                        ${form.type === t.id ? 'border-gold bg-gold/10' : 'border-white/10 bg-white/[0.03] hover:border-white/20'}`}>
                      <div className="flex justify-center mb-1.5">
                        <t.Icon size={24} className={form.type === t.id ? 'text-gold' : 'text-muted'} />
                      </div>
                      <div className={`text-xs font-semibold ${form.type === t.id ? 'text-white' : 'text-muted'}`}>{t.label}</div>
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-light/60 mb-1.5">Nom de l'établissement *</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)}
                      placeholder="Ex: Chez Fatou — Saveurs du Sénégal"
                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-gold transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-light/60 mb-1.5">Description courte</label>
                    <textarea value={form.description} onChange={e => set('description', e.target.value)}
                      rows={3} placeholder="Décrivez votre cuisine et ce qui vous rend unique…"
                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-gold transition-all resize-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Localisation */}
            {step === 1 && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-white mb-1">Où vous trouvez-vous ?</h2>
                <p className="text-muted text-sm mb-6">
                  {isHomecook
                    ? 'Indiquez votre ville — votre adresse exacte restera confidentielle.'
                    : 'Indiquez votre ville et adresse pour que les clients vous trouvent.'}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-light/60 mb-1.5">Ville *</label>
                    <select value={form.city} onChange={e => set('city', e.target.value)} className={SELECT_CLS}>
                      <option value="" className="bg-[#1e1e35]">Sélectionner une ville</option>
                      {VILLES.map(v => <option key={v} value={v} className="bg-[#1e1e35]">{v}</option>)}
                    </select>
                  </div>

                  {isHomecook ? (
                    <div className="flex items-start gap-3 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3">
                      <Lock size={16} className="text-gold mt-0.5 flex-shrink-0" />
                      <p className="text-muted text-sm leading-relaxed">
                        En tant que cuisine à domicile, votre adresse exacte n'est pas publiée. Seule votre ville sera visible par les clients.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-light/60 mb-1.5">Adresse</label>
                      <input value={form.address} onChange={e => set('address', e.target.value)}
                        placeholder="Rue, quartier, numéro…"
                        className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-gold transition-all" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Cuisine & Horaires */}
            {step === 2 && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-white mb-1">Cuisine & Horaires</h2>
                <p className="text-muted text-sm mb-6">Quelle cuisine proposez-vous et quand êtes-vous disponible ?</p>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-light/60 mb-1.5">Type de cuisine *</label>
                    <select value={form.cuisine} onChange={e => set('cuisine', e.target.value)} className={SELECT_CLS}>
                      <option value="" className="bg-[#1e1e35]">Sélectionner une cuisine</option>
                      {TABS.filter(t => t.id !== 'all').map(t => (
                        <option key={t.id} value={t.id} className="bg-[#1e1e35]">{t.label}</option>
                      ))}
                      <option value="__custom__" className="bg-[#1e1e35]">🌍 Cuisine du monde / Personnalisé</option>
                    </select>
                    {form.cuisine === '__custom__' && (
                      <input
                        value={form.cuisineCustom}
                        onChange={e => set('cuisineCustom', e.target.value)}
                        placeholder="Ex: Fusion afro-asiatique, Street food international…"
                        className="mt-2 w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-gold transition-all"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-light/60 mb-2">Jours d'ouverture</label>
                    <select value={form.joursOuverture} onChange={e => set('joursOuverture', e.target.value)} className={SELECT_CLS}>
                      {JOURS_OPTIONS.map(j => <option key={j} value={j} className="bg-[#1e1e35]">{j}</option>)}
                    </select>
                  </div>

                  {form.joursOuverture !== 'Sur commande uniquement' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-light/60 mb-1.5">Ouverture</label>
                        <select value={form.heureOuverture} onChange={e => set('heureOuverture', e.target.value)} className={SELECT_CLS}>
                          {HEURE_OPTIONS.map(h => <option key={h} value={h} className="bg-[#1e1e35]">{h}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-light/60 mb-1.5">Fermeture</label>
                        <select value={form.heureFermeture} onChange={e => set('heureFermeture', e.target.value)} className={SELECT_CLS}>
                          {HEURE_OPTIONS.map(h => <option key={h} value={h} className="bg-[#1e1e35]">{h}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gold font-medium">
                    Aperçu : {hoursString}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Contact */}
            {step === 3 && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-white mb-1">Coordonnées</h2>
                <p className="text-muted text-sm mb-6">Comment les clients peuvent-ils vous contacter ?</p>
                <div className="space-y-5">
                  {/* Phone */}
                  {[
                    { key: 'phone',    label: 'Téléphone', Icon: Phone },
                    { key: 'whatsapp', label: 'WhatsApp',  Icon: MessageCircle },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-light/60 mb-1.5">
                        <f.Icon size={12} /> {f.label}
                      </label>
                      <div className="flex rounded-xl overflow-hidden border border-white/10 focus-within:border-gold transition-all">
                        <span className="bg-white/[0.08] px-4 py-3 text-gold text-sm font-semibold flex items-center select-none flex-shrink-0">
                          +212
                        </span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={form[f.key]}
                          onChange={e => set(f.key, formatPhone(e.target.value))}
                          maxLength={MAX_LOCAL_DIGITS}
                          placeholder="6 12 34 56 78"
                          className="flex-1 bg-white/[0.06] px-4 py-3 text-white text-sm placeholder-muted focus:outline-none"
                        />
                        <span className={`flex items-center pr-3 text-xs font-medium flex-shrink-0 ${form[f.key].length === MAX_LOCAL_DIGITS ? 'text-green-400' : 'text-muted'}`}>
                          {form[f.key].length}/{MAX_LOCAL_DIGITS}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Instagram */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-light/60 mb-1.5">
                      <Instagram size={12} /> Instagram
                    </label>
                    <div className="flex rounded-xl overflow-hidden border border-white/10 focus-within:border-gold transition-all">
                      <span className="bg-white/[0.08] px-4 py-3 text-muted text-sm flex items-center select-none flex-shrink-0">@</span>
                      <input
                        value={form.instagram}
                        onChange={e => set('instagram', e.target.value.replace('@', ''))}
                        placeholder="monrestaurant"
                        className="flex-1 bg-white/[0.06] px-3 py-3 text-white text-sm placeholder-muted focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <div className="text-center py-4">
                <div className="flex justify-center mb-5">
                  <Sparkles size={56} className="text-gold" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-white mb-3">Vous êtes prêt !</h2>
                <p className="text-muted text-sm mb-6 leading-relaxed">
                  Votre établissement <span className="text-white font-semibold">"{form.name || 'Mon Restaurant'}"</span> a
                  été soumis. Notre équipe le vérifiera sous 24h et vous notifiera par email.
                </p>
                <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 text-left space-y-2 mb-6">
                  {[
                    ['Nom',      form.name || '—'],
                    ['Ville',    form.city || '—'],
                    ['Cuisine',  form.cuisine === '__custom__' ? (form.cuisineCustom || 'Personnalisé') : (CUISINE_MAP[form.cuisine]?.label || form.cuisine || '—')],
                    ['Horaires', hoursString],
                    ['Contact',  form.phone ? `+212 ${form.phone}` : form.whatsapp ? `+212 ${form.whatsapp}` : '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-muted">{k}</span>
                      <span className="text-white font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-7">
              {step > 0 && step < 4 && (
                <button onClick={prev}
                  className="flex-1 py-3.5 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/5 transition-all">
                  ← Retour
                </button>
              )}
              {step < 3 && (
                <button onClick={next}
                  className="flex-[2] bg-gold hover:bg-gold-light text-dark font-semibold py-3.5 rounded-xl transition-all text-sm hover:shadow-[0_8px_24px_rgba(244,168,40,0.4)]">
                  Continuer →
                </button>
              )}
              {step === 3 && (
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-[2] bg-gold hover:bg-gold-light text-dark font-semibold py-3.5 rounded-xl transition-all text-sm hover:shadow-[0_8px_24px_rgba(244,168,40,0.4)] flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting ? 'Envoi…' : <><span>Soumettre mon établissement</span><Check size={16} /></>}
                </button>
              )}
              {step === 4 && (
                <button onClick={handleFinish}
                  className="w-full bg-gold hover:bg-gold-light text-dark font-semibold py-3.5 rounded-xl transition-all text-sm">
                  Accéder à mon tableau de bord →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
