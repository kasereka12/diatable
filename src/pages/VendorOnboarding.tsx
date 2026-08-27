import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TABS } from '../data/restaurants'
import {
  Store, HomeIcon, Zap, Phone, MessageCircle, Instagram, Check, Sparkles, Lock,
  ArrowRight, Users, ShieldCheck, Percent, ChevronDown, LayoutDashboard,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  vendorStep0Schema, vendorStep1Schema, vendorStep2Schema, vendorStep3Schema,
  flattenErrors,
} from '../lib/schemas'

const VALUE_PROPS = [
  { icon: Users,       title: 'Une audience prête à acheter', desc: 'Touchez des milliers d\'expatriés et de locaux qui recherchent activement votre cuisine.' },
  { icon: Percent,     title: 'Aucune commission les 3 premiers mois', desc: 'Démarrez sans risque : zéro frais sur vos premières ventes.' },
  { icon: ShieldCheck, title: 'Vérifié, donc crédible', desc: 'Chaque profil est validé par notre équipe — les clients commandent en confiance.' },
  { icon: LayoutDashboard, title: 'Un tableau de bord complet', desc: 'Gérez commandes, menu, avis et statistiques depuis un seul endroit.' },
]

const VENDOR_STEPS = [
  { title: 'Créez votre profil',              desc: 'Présentez votre établissement : nom, cuisine, horaires.' },
  { title: 'Vérification',                    desc: 'Notre équipe valide votre profil sous 24h.' },
  { title: 'Premières commandes',              desc: 'Les clients vous découvrent et vous contactent directement.' },
  { title: 'Suivez votre activité',            desc: 'Gérez commandes, avis et statistiques depuis votre tableau de bord.' },
]

const FAQ_ITEMS = [
  { q: 'Dois-je avoir un restaurant physique ?', a: 'Non — DiaTable accueille aussi les cuisiniers à domicile et les pop-up/traiteurs, en plus des restaurants classiques.' },
  { q: 'Combien coûte l\'inscription ?', a: 'L\'inscription est gratuite, sans commission pendant vos 3 premiers mois.' },
  { q: 'Combien de temps avant d\'être visible ?', a: 'Votre profil est vérifié par notre équipe sous 24h après soumission.' },
  { q: 'Comment les clients me contactent-ils ?', a: 'Directement par téléphone, WhatsApp ou message via DiaTable, selon les coordonnées que vous renseignez.' },
  { q: 'Puis-je modifier mes informations plus tard ?', a: 'Oui, vous gérez votre profil (menu, horaires, photos) à tout moment depuis votre tableau de bord.' },
  { q: 'Je cuisine à domicile et ne suis pas enregistré légalement, est-ce un problème ?', a: 'Pas de souci : les cuisiniers à domicile vendent sous l\'enseigne DiaTable, qui les accompagne dans leurs démarches.' },
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

function formatPhone(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, MAX_LOCAL_DIGITS)
}

export default function VendorOnboarding() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const [step,        setStep]       = useState(0)
  const [submitting,  setSubmitting] = useState(false)
  const [stepErrors,  setStepErrors] = useState<Record<string, string>>({})
  const [openFaq,     setOpenFaq]    = useState<number | null>(0)
  const [form, setForm] = useState({
    name: '', description: '', type: 'restaurant',
    cuisine: '', cuisineCustom: '', city: '', address: '',
    joursOuverture: 'Lundi – Samedi',
    heureOuverture: '11h00',
    heureFermeture: '22h00',
    phone: '', whatsapp: '', instagram: '',
  })

  const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }))
  const prev = () => { setStepErrors({}); setStep(s => s - 1) }

  const STEP_SCHEMAS = [vendorStep0Schema, vendorStep1Schema, vendorStep2Schema, vendorStep3Schema]
  const STEP_DATA = [
    { name: form.name, type: form.type },
    { city: form.city },
    { cuisine: form.cuisine },
    { phone: form.phone, whatsapp: form.whatsapp, instagram: form.instagram },
  ]

  function validateAndNext() {
    const schema = STEP_SCHEMAS[step]
    if (!schema) { setStep(s => s + 1); return }
    const result = schema.safeParse(STEP_DATA[step])
    if (!result.success) { setStepErrors(flattenErrors(result.error)); return }
    setStepErrors({})
    setStep(s => s + 1)
  }

  const isHomecook = form.type === 'homecook'

  // Build hours string from structured fields
  const hoursString = form.joursOuverture === 'Sur commande uniquement'
    ? 'Sur commande uniquement'
    : `${form.joursOuverture} · ${form.heureOuverture}–${form.heureFermeture}`

  async function handleSubmit() {
    setStepErrors({})
    const result = vendorStep3Schema.safeParse(STEP_DATA[3])
    if (!result.success) { setStepErrors(flattenErrors(result.error)); return }
    if (!user) { setStep(s => s + 1); return }
    setSubmitting(true)
    const isCustom = form.cuisine === '__custom__'
    const cuisineId = isCustom ? 'internationale' : form.cuisine
    const meta = isCustom
      ? { flag: '🌍', label: form.cuisineCustom || 'Internationale' }
      : (CUISINE_MAP[form.cuisine] || { flag: '🍽️', label: form.cuisine })
    await (supabase.from('restaurants') as any).insert({
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
    await (supabase.from('profiles') as any).update({ role: 'vendor' }).eq('id', user.id)
    await refreshProfile()
    setSubmitting(false)
    setStep(s => s + 1)
  }

  function handleFinish() {
    navigate('/tableau-de-bord')
  }

  const progressPct = (step / (STEPS.length - 1)) * 100

  return (
    <div className="min-h-screen bg-dark">
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-6 max-w-6xl mx-auto">
        <a href="/" className="font-serif text-xl font-bold text-white flex items-center gap-1">
          Dia<span className="text-gold">Table</span>
        </a>
        {!user && (
          <a href="/connexion" className="text-sm text-white/50 hover:text-white transition-colors">
            Déjà inscrit ? <span className="text-gold font-semibold">Se connecter</span>
          </a>
        )}
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-10 pb-24">
        <div className="absolute inset-0 zellige-pattern opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs font-bold uppercase tracking-widest text-gold mb-6">
            <Store size={13} /> Rejoindre DiaTable
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-black text-white leading-[1.08] mb-5">
            Vous cuisinez les plats<br />de <span className="text-gold">votre pays au Maroc ?</span>
          </h1>
          <p className="text-white/60 text-base md:text-lg max-w-xl mx-auto mb-9">
            Rejoignez DiaTable et touchez des milliers d'expatriés qui cherchent votre cuisine — restaurant, cuisine à domicile ou pop-up.
          </p>
          <a href="#inscription"
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-dark font-semibold px-8 py-4 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(244,168,40,0.4)]">
            Devenir vendeur <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* Value props */}
      <section className="relative px-6 py-16" style={{ backgroundColor: '#1c1b2a' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {VALUE_PROPS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
              <div className="w-11 h-11 rounded-xl bg-gold/15 flex items-center justify-center mb-4">
                <Icon size={20} className="text-gold" />
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
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold mb-3">Simple &amp; rapide</p>
            <h2 className="font-serif text-3xl md:text-4xl font-black text-white">Comment ça marche</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {VENDOR_STEPS.map((s, i) => (
              <div key={s.title}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-serif font-black text-lg text-gold mb-4"
                  style={{ backgroundColor: 'rgba(244,168,40,0.15)', border: '1px solid rgba(244,168,40,0.30)' }}>
                  {i + 1}
                </div>
                <h3 className="font-serif font-bold text-white mb-2">{s.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who can join */}
      <section className="px-6 py-16" style={{ backgroundColor: '#1c1b2a' }}>
        <div className="max-w-2xl mx-auto bg-white/[0.04] border border-white/10 rounded-2xl p-8">
          <h3 className="font-serif text-xl font-bold text-white mb-5">Qui peut rejoindre DiaTable ?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TYPES.map(t => (
              <div key={t.id} className="flex flex-col items-center text-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl p-4">
                <t.Icon size={22} className="text-gold" />
                <span className="text-white text-sm font-semibold">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="relative px-4 py-24 scroll-mt-6" id="inscription">
        <div className="w-full max-w-lg mx-auto">
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
                    {stepErrors.name && <p className="text-red-400 text-xs mt-1">{stepErrors.name}</p>}
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
                    {stepErrors.city && <p className="text-red-400 text-xs mt-1">{stepErrors.city}</p>}
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
                    {stepErrors.cuisine && <p className="text-red-400 text-xs mt-1">{stepErrors.cuisine}</p>}
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
                          value={(form as Record<string, string>)[f.key]}
                          onChange={e => set(f.key, formatPhone(e.target.value))}
                          maxLength={MAX_LOCAL_DIGITS}
                          placeholder="6 12 34 56 78"
                          className="flex-1 bg-white/[0.06] px-4 py-3 text-white text-sm placeholder-muted focus:outline-none"
                        />
                        <span className={`flex items-center pr-3 text-xs font-medium flex-shrink-0 ${(form as Record<string, string>)[f.key].length === MAX_LOCAL_DIGITS ? 'text-green-400' : 'text-muted'}`}>
                          {(form as Record<string, string>)[f.key].length}/{MAX_LOCAL_DIGITS}
                        </span>
                      </div>
                      {stepErrors[f.key] && <p className="text-red-400 text-xs mt-1">{stepErrors[f.key]}</p>}
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
                <button onClick={validateAndNext}
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

      {/* FAQ */}
      <section className="px-6 py-20" style={{ backgroundColor: '#1c1b2a' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold mb-3">Questions fréquentes</p>
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
          <Sparkles size={28} className="text-gold mx-auto mb-4" />
          <h2 className="font-serif text-2xl md:text-3xl font-black text-white mb-3">Prêt à faire découvrir votre cuisine ?</h2>
          <p className="text-white/50 text-sm mb-8">Rejoignez les vendeurs DiaTable dès aujourd'hui.</p>
          <a href="#inscription"
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-dark font-semibold px-8 py-4 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(244,168,40,0.4)]">
            Devenir vendeur <ArrowRight size={18} />
          </a>
        </div>
      </section>
    </div>
  )
}
