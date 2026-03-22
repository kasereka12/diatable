import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Mail, CheckCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email,     setEmail]     = useState('')
  const [sent,      setSent]      = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
      })
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      // Demo mode — simulate delay
      await new Promise(r => setTimeout(r, 1000))
    }
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <div className="absolute inset-0 zellige-pattern opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark to-dark2 pointer-events-none" />

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-20">
        {/* Logo */}
        <Link to="/" className="font-serif text-3xl font-bold text-white mb-10 flex items-center gap-1.5">
          Dia<span className="text-gold">Table</span>
          <Globe size={24} className="text-gold" />
        </Link>

        <div className="w-full max-w-md">
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 backdrop-blur-sm">

            {sent ? (
              <div className="text-center py-4">
                <div className="flex justify-center mb-5">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle size={36} className="text-green-400" />
                  </div>
                </div>
                <h2 className="font-serif text-xl font-bold text-white mb-3">Email envoyé !</h2>
                <p className="text-muted text-sm leading-relaxed mb-6">
                  Si un compte existe pour <span className="text-white font-medium">{email}</span>, vous recevrez un lien de réinitialisation dans quelques minutes. Vérifiez vos spams.
                </p>
                <Link to="/connexion"
                  className="inline-flex items-center gap-2 text-gold text-sm font-semibold hover:text-gold-light transition-colors">
                  <ArrowLeft size={15} /> Retour à la connexion
                </Link>
              </div>
            ) : (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center">
                    <Mail size={28} className="text-gold" />
                  </div>
                </div>
                <h1 className="font-serif text-2xl font-bold text-white mb-1 text-center">Mot de passe oublié</h1>
                <p className="text-muted text-sm mb-8 text-center">
                  Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-light/70 mb-1.5 tracking-wide uppercase">
                      Adresse email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="vous@exemple.com"
                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3
                                 text-white text-sm placeholder-muted
                                 focus:outline-none focus:border-gold focus:bg-white/[0.08] transition-all"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gold hover:bg-gold-light text-dark font-semibold py-3.5 rounded-xl
                               transition-all duration-200 hover:shadow-[0_8px_24px_rgba(244,168,40,0.4)]
                               disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                  >
                    {loading ? 'Envoi en cours…' : 'Envoyer le lien'}
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-muted text-sm mt-6">
            <Link to="/connexion" className="inline-flex items-center gap-1.5 text-muted hover:text-gold transition-colors">
              <ArrowLeft size={14} /> Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
