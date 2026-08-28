import { useState, useRef, useEffect } from 'react'
import type React from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, X, Send, ArrowLeft, ShoppingBag, ChefHat, CreditCard, User, ArrowRight } from 'lucide-react'
import { FAQ_CATEGORIES, FAQS, type FaqEntry } from '../data/faq'

const CATEGORY_ICONS: Record<string, typeof ShoppingBag> = {
  commander: ShoppingBag,
  vendeurs:  ChefHat,
  paiement:  CreditCard,
  compte:    User,
}

const ALL_FAQS = Object.values(FAQS).flat()

interface Bubble { from: 'bot' | 'user'; text: string }

type Stage =
  | { type: 'categories' }
  | { type: 'questions'; categoryId: string }
  | { type: 'answer' }
  | { type: 'search-results'; results: FaqEntry[] }

const GREETING = 'Bonjour 👋 Comment puis-je vous aider ? Choisissez une catégorie ou décrivez votre question ci-dessous.'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [stage, setStage] = useState<Stage>({ type: 'categories' })
  const [history, setHistory] = useState<Bubble[]>([{ from: 'bot', text: GREETING }])
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [history, stage])

  function pick(entries: Bubble[]) {
    setHistory(prev => [...prev, ...entries])
  }

  function openCategory(id: string, label: string) {
    pick([
      { from: 'user', text: label },
      { from: 'bot', text: `Voici les questions les plus fréquentes sur "${label}" :` },
    ])
    setStage({ type: 'questions', categoryId: id })
  }

  function openAnswer(faq: FaqEntry) {
    pick([{ from: 'user', text: faq.q }, { from: 'bot', text: faq.a }])
    setStage({ type: 'answer' })
  }

  function backToCategories() {
    pick([{ from: 'bot', text: 'Autre chose ? Choisissez une catégorie ou tapez votre question.' }])
    setStage({ type: 'categories' })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const query = input.trim()
    if (!query) return
    setInput('')
    const results = ALL_FAQS.filter(f =>
      f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 4)
    pick([
      { from: 'user', text: query },
      {
        from: 'bot',
        text: results.length
          ? 'Voici ce que j\'ai trouvé :'
          : 'Je n\'ai pas trouvé de réponse à ça — contactez notre équipe directement, ils vous répondront sous 24h.',
      },
    ])
    setStage({ type: 'search-results', results })
  }

  return (
    <>
      {/* Floating panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[250] w-[min(360px,calc(100vw-2.5rem))] rounded-2xl overflow-hidden flex flex-col shadow-[0_16px_48px_rgba(0,0,0,0.25)]"
          style={{ height: 480, maxHeight: 'calc(100vh - 140px)' }}
          role="dialog" aria-modal="true" aria-label="Assistant DiaTable">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
            style={{ backgroundColor: '#1f1f1f' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#c5611a' }}>
                <MessageCircle size={15} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-tight">Assistant DiaTable</p>
                <p className="text-white/40 text-[0.68rem] leading-tight">Réponses instantanées</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fermer" className="text-white/60 hover:text-white transition-colors p-1">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ backgroundColor: '#f9f4ee' }}>
            {history.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.from === 'user' ? 'text-white rounded-br-sm' : 'bg-white text-dark rounded-bl-sm shadow-sm'
                }`} style={m.from === 'user' ? { backgroundColor: '#c5611a' } : {}}>
                  {m.text}
                </div>
              </div>
            ))}

            {/* Dynamic options based on stage */}
            {stage.type === 'categories' && (
              <div className="flex flex-wrap gap-2 pt-1">
                {FAQ_CATEGORIES.map(cat => {
                  const Icon = CATEGORY_ICONS[cat.id]
                  return (
                    <button key={cat.id} onClick={() => openCategory(cat.id, cat.label)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-white border border-black/10 text-dark hover:border-gold hover:text-gold transition-all">
                      <Icon size={13} /> {cat.label}
                    </button>
                  )
                })}
              </div>
            )}

            {stage.type === 'questions' && (
              <div className="flex flex-col gap-2 pt-1">
                {FAQS[stage.categoryId].map(faq => (
                  <button key={faq.q} onClick={() => openAnswer(faq)}
                    className="text-left px-3.5 py-2.5 rounded-xl text-xs font-medium bg-white border border-black/10 text-dark hover:border-gold hover:text-gold-dark transition-all">
                    {faq.q}
                  </button>
                ))}
                <button onClick={backToCategories}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-gold transition-all mt-1 self-start">
                  <ArrowLeft size={12} /> Retour aux catégories
                </button>
              </div>
            )}

            {stage.type === 'search-results' && stage.results.length > 0 && (
              <div className="flex flex-col gap-2 pt-1">
                {stage.results.map(faq => (
                  <button key={faq.q} onClick={() => openAnswer(faq)}
                    className="text-left px-3.5 py-2.5 rounded-xl text-xs font-medium bg-white border border-black/10 text-dark hover:border-gold hover:text-gold-dark transition-all">
                    {faq.q}
                  </button>
                ))}
              </div>
            )}

            {(stage.type === 'answer' || (stage.type === 'search-results' && stage.results.length === 0)) && (
              <div className="flex flex-wrap gap-2 pt-1">
                <button onClick={backToCategories}
                  className="px-3.5 py-2 rounded-full text-xs font-semibold bg-white border border-black/10 text-dark hover:border-gold hover:text-gold transition-all">
                  Poser une autre question
                </button>
                <Link to="/contact" onClick={() => setOpen(false)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-white transition-all"
                  style={{ backgroundColor: '#c5611a' }}>
                  Contacter un humain <ArrowRight size={12} />
                </Link>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 p-3 border-t border-black/[0.06] bg-white flex-shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Tapez votre question…"
              className="flex-1 bg-cream rounded-full px-4 py-2.5 text-sm text-dark focus:outline-none focus:ring-1 focus:ring-gold"
            />
            <button type="submit" aria-label="Envoyer"
              className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40 transition-all"
              style={{ backgroundColor: '#c5611a' }} disabled={!input.trim()}>
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Fermer l\'assistant' : 'Ouvrir l\'assistant DiaTable'}
        className="fixed bottom-6 right-6 z-[250] w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.30)] transition-all duration-300"
        style={{ backgroundColor: '#c5611a' }}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  )
}
