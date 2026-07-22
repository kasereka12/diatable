import { useState, useEffect } from 'react'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { useAuth } from '../context/AuthContext'
import { Mail, MessageCircle, MapPin, Clock, CheckCircle, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { contactSchema, flattenErrors } from '../lib/schemas'

export default function Contact() {
  const { t } = useTranslation()
  const ref = useScrollReveal()
  const [form, setForm] = useState({ name: '', email: '', reason: '', message: '' })
  const [submitted,   setSubmit]     = useState(false)
  const [loading,     setLoading]    = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const { user } = useAuth()
  const [isVendor, setIsVendor] = useState(false)

  const REASONS_DEFAULT = [
    t('contact_page.reason_general'),
    t('contact_page.reason_vendor'),
    t('contact_page.reason_issue'),
    t('contact_page.reason_press'),
    t('contact_page.reason_other'),
  ]
  const REASONS_VENDOR = [
    t('contact_page.reason_general'),
    t('contact_page.reason_issue'),
    t('contact_page.reason_press'),
    t('contact_page.reason_other'),
  ]
  const REASONS = isVendor ? REASONS_VENDOR : REASONS_DEFAULT

  const INFO_ITEMS = [
    { Icon: Mail,          title: t('contact_page.info_email'),    val: 'contact@datable.ma' },
    { Icon: MessageCircle, title: t('contact_page.info_whatsapp'), val: '+212 76 18 41 41' },
    { Icon: MapPin,        title: t('contact_page.info_office'),   val: 'Casablanca, Maroc' },
    { Icon: Clock,         title: t('contact_page.info_hours'),    val: t('contact_page.hours_value') },
  ]

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    setIsVendor((data as { role: string } | null)?.role === 'vendor')
  }
  useEffect(() => {
    if (user) fetchProfile(user.id)
  }, [user])

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldErrors({})
    const result = contactSchema.safeParse(form)
    if (!result.success) { setFieldErrors(flattenErrors(result.error)); return }
    setLoading(true)
    setTimeout(() => { setLoading(false); setSubmit(true) }, 1200)
  }

  return (
    <div className="bg-cream min-h-screen pt-24" ref={ref}>
      {/* Header */}
      <div className="bg-dark py-16 relative overflow-hidden">
        <div className="absolute inset-0 zellige-pattern opacity-30" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <p className="section-label" data-reveal>{t('contact_page.label')}</p>
          <h1 className="font-serif text-4xl font-black text-white mb-3" data-reveal data-delay="0.1s">
            {t('contact_page.title_before')}{' '}
            <em style={{ color: '#c5611a' }}>{t('contact_page.title_em')}</em>
          </h1>
          <p className="text-light/70" data-reveal data-delay="0.2s">
            {t('contact_page.subtitle')}
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
                <p className="text-white/70 text-sm mb-3">{t('contact_page.vendor_pitch')}</p>
                <a href="/inscription?role=vendor" className="btn btn-gold text-sm w-full justify-center">
                  {t('footer.become_vendor')} →
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
                <h2 className="font-serif text-2xl font-bold text-dark mb-3">{t('contact_page.success_title')}</h2>
                <p className="text-muted mb-6">{t('contact_page.success_body')}</p>
                <button onClick={() => setSubmit(false)} className="btn btn-gold text-sm">
                  {t('contact_page.send_another')}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-black/[0.05]">
                <h2 className="font-serif text-xl font-bold text-dark mb-6">{t('contact_page.form_title')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-1.5">{t('contact_page.name_label')} *</label>
                      <input value={form.name} onChange={e => set('name', e.target.value)}
                        placeholder={t('contact_page.name_placeholder')}
                        className="w-full bg-cream border border-black/10 rounded-xl px-4 py-3 text-dark text-sm focus:outline-none focus:border-gold transition-all" />
                      {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-1.5">{t('contact_page.email_label')} *</label>
                      <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                        placeholder={t('contact_page.email_placeholder')}
                        className="w-full bg-cream border border-black/10 rounded-xl px-4 py-3 text-dark text-sm focus:outline-none focus:border-gold transition-all" />
                      {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-1.5">{t('contact_page.subject_label')} *</label>
                    <select value={form.reason} onChange={e => set('reason', e.target.value)}
                      className="w-full bg-cream border border-black/10 rounded-xl px-4 py-3 text-dark text-sm focus:outline-none focus:border-gold transition-all">
                      <option value="">{t('contact_page.subject_placeholder')}</option>
                      {REASONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                    {fieldErrors.reason && <p className="text-red-500 text-xs mt-1">{fieldErrors.reason}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-1.5">{t('contact_page.message_label')} *</label>
                    <textarea value={form.message} onChange={e => set('message', e.target.value)}
                      rows={5} placeholder={t('contact_page.message_placeholder')}
                      className="w-full bg-cream border border-black/10 rounded-xl px-4 py-3 text-dark text-sm focus:outline-none focus:border-gold transition-all resize-none" />
                    {fieldErrors.message && <p className="text-red-500 text-xs mt-1">{fieldErrors.message}</p>}
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full btn btn-gold justify-center py-3.5 disabled:opacity-60 flex items-center gap-2">
                    {loading ? t('contact_page.sending') : (
                      <><Send size={16} /> {t('contact_page.send')}</>
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
