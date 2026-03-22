import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TABS } from '../data/restaurants'
import { Globe, Store, HomeIcon, Zap, Phone, MessageCircle, Instagram, Check, Sparkles } from 'lucide-react'

const STEPS = ['Votre restaurant', 'Localisation', 'Cuisine & horaires', 'Contact', 'Confirmation']

const VILLES = ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès', 'Agadir', 'Meknès', 'Autre']

const TYPES = [
  { id: 'restaurant', Icon: Store,    label: 'Restaurant' },
  { id: 'homecook',   Icon: HomeIcon, label: 'Cuisine à domicile' },
  { id: 'popup',      Icon: Zap,      label: 'Pop-up / Traiteur' },
]

const CONTACT_FIELDS = [
  { key: 'phone',     label: 'Téléphone', placeholder: '+212 6 00 00 00 00', Icon: Phone },
  { key: 'whatsapp',  label: 'WhatsApp',  placeholder: '+212 6 00 00 00 00', Icon: MessageCircle },
  { key: 'instagram', label: 'Instagram', placeholder: '@monrestaurant',     Icon: Instagram },
]

export default function VendorOnboarding() {
  const navigate = useNavigate()
  const [step, setStep]   = useState(0)
  const [form, setForm]   = useState({
    name: '', description: '', type: 'restaurant',
    cuisine: '', city: '', address: '',
    hours: '', phone: '', whatsapp: '', instagram: '',
  })

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))
  const next = () => { if (step < STEPS.length - 1) setStep(s => s + 1) }
  const prev = () => setStep(s => s - 1)

  function handleFinish() {
    navigate('/tableau-de-bord')
  }

  const progressPct = ((step) / (STEPS.length - 1)) * 100

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
                <p className="text-muted text-sm mb-6">Indiquez votre ville et adresse pour que les clients vous trouvent.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-light/60 mb-1.5">Ville *</label>
                    <select value={form.city} onChange={e => set('city', e.target.value)}
                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold transition-all">
                      <option value="">Sélectionner une ville</option>
                      {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-light/60 mb-1.5">Adresse</label>
                    <input value={form.address} onChange={e => set('address', e.target.value)}
                      placeholder="Rue, quartier, numéro…"
                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-gold transition-all" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Cuisine & Horaires */}
            {step === 2 && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-white mb-1">Cuisine & Horaires</h2>
                <p className="text-muted text-sm mb-6">Quelle cuisine proposez-vous et quand êtes-vous disponible ?</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-light/60 mb-1.5">Type de cuisine *</label>
                    <select value={form.cuisine} onChange={e => set('cuisine', e.target.value)}
                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold transition-all">
                      <option value="">Sélectionner une cuisine</option>
                      {TABS.filter(t => t.id !== 'all').map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-light/60 mb-1.5">Horaires d'ouverture</label>
                    <input value={form.hours} onChange={e => set('hours', e.target.value)}
                      placeholder="Ex: Lun–Sam 11h30–22h00 · Dim fermé"
                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-gold transition-all" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Contact */}
            {step === 3 && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-white mb-1">Coordonnées</h2>
                <p className="text-muted text-sm mb-6">Comment les clients peuvent-ils vous contacter ?</p>
                <div className="space-y-4">
                  {CONTACT_FIELDS.map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-bold uppercase tracking-widest text-light/60 mb-1.5 flex items-center gap-1.5">
                        <f.Icon size={12} /> {f.label}
                      </label>
                      <input value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-gold transition-all" />
                    </div>
                  ))}
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
                    ['Nom', form.name || '—'],
                    ['Ville', form.city || '—'],
                    ['Cuisine', form.cuisine || '—'],
                    ['Contact', form.phone || form.whatsapp || '—'],
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
                <button onClick={next}
                  className="flex-[2] bg-gold hover:bg-gold-light text-dark font-semibold py-3.5 rounded-xl transition-all text-sm hover:shadow-[0_8px_24px_rgba(244,168,40,0.4)] flex items-center justify-center gap-2">
                  Soumettre mon établissement <Check size={16} />
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
