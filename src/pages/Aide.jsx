import { useState } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'
import SectionHeader from '../components/ui/SectionHeader'
import { Link } from 'react-router-dom'
import { Search, ShoppingBag, ChefHat, CreditCard, User, MessageCircle, ChevronDown, ChevronUp, Mail, Phone, ArrowRight } from 'lucide-react'

const CATEGORIES = [
  { Icon: ShoppingBag,  label: 'Commander',         id: 'commander' },
  { Icon: ChefHat,      label: 'Vendeurs',           id: 'vendeurs' },
  { Icon: CreditCard,   label: 'Paiement',           id: 'paiement' },
  { Icon: User,         label: 'Mon compte',         id: 'compte' },
]

const FAQS = {
  commander: [
    { q: 'Comment trouver un restaurant ou un cuisinier ?', a: 'Utilisez la page Restaurants pour filtrer par cuisine, ville ou note. Vous pouvez aussi passer par la page Cuisines pour naviguer par pays.' },
    { q: 'Comment contacter un vendeur ?', a: 'Sur la fiche de chaque restaurant, vous trouverez le numéro de téléphone, WhatsApp et un formulaire de contact. Les vendeurs répondent généralement sous 2h.' },
    { q: 'Les commandes sont-elles livrées à domicile ?', a: 'Cela dépend du vendeur. Certains proposent la livraison, d\'autres uniquement le retrait sur place ou la réservation de table. Les options disponibles sont indiquées sur chaque fiche.' },
    { q: 'Puis-je annuler une commande ?', a: 'L\'annulation se fait directement avec le vendeur. Contactez-le dès que possible via WhatsApp ou téléphone. DiaTable n\'intervient pas dans la gestion des commandes.' },
    { q: 'Comment laisser un avis ?', a: 'Après votre commande, rendez-vous sur la fiche du restaurant et cliquez sur "Laisser un avis". Vous devez être connecté à votre compte.' },
  ],
  vendeurs: [
    { q: 'Comment devenir vendeur sur DiaTable ?', a: 'Cliquez sur "Devenir vendeur" depuis le menu ou votre profil. Remplissez le formulaire en 5 étapes (type de cuisine, coordonnées, photos, menu). Votre profil est examiné sous 48h.' },
    { q: 'Est-ce gratuit de s\'inscrire ?', a: 'Oui, l\'inscription est entièrement gratuite. De plus, DiaTable ne prend aucune commission pendant vos 3 premiers mois d\'activité.' },
    { q: 'Combien de temps pour être validé ?', a: 'Notre équipe examine les nouveaux profils sous 24 à 48h en jours ouvrés. Vous recevez un email de confirmation une fois validé.' },
    { q: 'Comment gérer mon menu ?', a: 'Depuis votre tableau de bord vendeur, section "Menu", vous pouvez ajouter, modifier ou supprimer des plats à tout moment.' },
    { q: 'Puis-je vendre depuis mon domicile ?', a: 'Absolument. DiaTable accueille les cuisiniers à domicile, les traiteurs et les pop-ups, pas seulement les restaurants.' },
  ],
  paiement: [
    { q: 'Quels modes de paiement sont acceptés ?', a: 'Le règlement se fait directement avec le vendeur : espèces, virement ou paiement mobile selon ce que propose chaque vendeur. Les options sont indiquées sur leur fiche.' },
    { q: 'DiaTable prend-il des commissions ?', a: 'Aucune commission pendant les 3 premiers mois. Après cette période, un faible pourcentage est prélevé uniquement sur les paiements en ligne (si activés).' },
    { q: 'Y a-t-il des frais d\'abonnement ?', a: 'Non. L\'inscription et la publication de votre profil sont gratuites. Des options premium (mise en avant, publicité) seront disponibles prochainement.' },
  ],
  compte: [
    { q: 'Comment créer un compte ?', a: 'Cliquez sur "S\'inscrire" dans la barre de navigation. Choisissez votre rôle (client ou vendeur), entrez votre email et créez votre mot de passe. Vous pouvez aussi vous connecter avec Google.' },
    { q: 'J\'ai oublié mon mot de passe.', a: 'Sur la page de connexion, cliquez sur "Mot de passe oublié". Vous recevrez un lien de réinitialisation par email dans quelques minutes.' },
    { q: 'Comment modifier mes informations personnelles ?', a: 'Rendez-vous dans "Mon profil" (icône utilisateur en haut à droite), onglet "Paramètres". Vous pouvez y modifier votre nom, photo et coordonnées.' },
    { q: 'Comment supprimer mon compte ?', a: 'Contactez-nous à hello@datable.ma avec la demande de suppression. Votre compte sera supprimé sous 72h conformément au RGPD.' },
  ],
}

function FAQList({ items }) {
  const [open, setOpen] = useState(null)
  return (
    <div className="space-y-3">
      {items.map((faq, i) => (
        <div key={i} className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full text-left px-5 py-4 flex items-center justify-between gap-3"
          >
            <span className="font-medium text-dark text-sm">{faq.q}</span>
            {open === i
              ? <ChevronUp size={16} className="text-muted flex-shrink-0" />
              : <ChevronDown size={16} className="text-muted flex-shrink-0" />}
          </button>
          {open === i && (
            <div className="px-5 pb-4 text-dark/60 text-sm leading-relaxed border-t border-black/[0.05] pt-4">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function Aide() {
  const ref = useScrollReveal()
  const [activeCategory, setActiveCategory] = useState('commander')
  const [search, setSearch] = useState('')

  const allFaqs = Object.values(FAQS).flat()
  const filteredFaqs = search.trim()
    ? allFaqs.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()))
    : FAQS[activeCategory]

  return (
    <div ref={ref}>
      {/* Header */}
      <div className="bg-dark pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 zellige-pattern opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark/70" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <p className="section-label" data-reveal>Support</p>
          <h1 className="font-serif text-4xl md:text-5xl font-black text-white mb-6" data-reveal data-delay="0.1s">
            Aide &amp; <em className="text-gold italic">Support</em>
          </h1>
          {/* Search bar */}
          <div data-reveal data-delay="0.2s" className="relative max-w-xl mx-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cherchez une question…"
              className="w-full bg-white/10 border border-white/20 rounded-2xl pl-11 pr-5 py-3.5 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-gold/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* FAQ */}
      <section className="bg-cream py-24">
        <div className="max-w-4xl mx-auto px-6">
          {!search.trim() && (
            <>
              <SectionHeader label="Centre d'aide" title="Questions <em>fréquentes</em>" />
              {/* Category tabs */}
              <div className="flex flex-wrap gap-3 mb-10" data-reveal>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200
                      ${activeCategory === cat.id
                        ? 'bg-gold text-dark shadow-md'
                        : 'bg-white text-dark/60 border border-black/10 hover:border-gold/30 hover:text-gold'}`}
                  >
                    <cat.Icon size={15} />
                    {cat.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {search.trim() && (
            <div className="mb-8">
              <p className="text-muted text-sm">
                {filteredFaqs.length} résultat{filteredFaqs.length !== 1 ? 's' : ''} pour <strong className="text-dark">"{search}"</strong>
              </p>
            </div>
          )}

          <FAQList items={filteredFaqs} />

          {search.trim() && filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted mb-4">Aucun résultat trouvé. Contactez-nous directement.</p>
              <Link to="/contact" className="btn btn-gold">Nous contacter <ArrowRight size={15} /></Link>
            </div>
          )}
        </div>
      </section>

      {/* Contact rapide */}
      <section className="bg-dark2 py-24">
        <div className="max-w-4xl mx-auto px-6" ref={useScrollReveal()}>
          <SectionHeader label="Besoin d'aide" title="Contactez <em>notre équipe</em>" light />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { Icon: MessageCircle, title: 'WhatsApp', val: '+212 6 00 00 00 00', cta: 'Écrire sur WhatsApp', href: '#' },
              { Icon: Mail,          title: 'Email',    val: 'hello@datable.ma',   cta: 'Envoyer un email',  href: 'mailto:hello@datable.ma' },
              { Icon: Phone,         title: 'Téléphone', val: '+212 5 22 00 00 00', cta: 'Appeler',          href: 'tel:+212522000000' },
            ].map((c, i) => (
              <div key={c.title} data-reveal data-delay={`${i * 0.1}s`}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-7 text-center hover:bg-gold/[0.05] hover:border-gold/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <c.Icon size={24} className="text-gold" />
                </div>
                <div className="font-serif font-bold text-white text-base mb-1">{c.title}</div>
                <div className="text-muted text-sm mb-4">{c.val}</div>
                <a href={c.href}
                  className="inline-block text-xs font-semibold text-gold border border-gold/30 px-4 py-2 rounded-full
                             hover:bg-gold hover:text-dark transition-all duration-200">
                  {c.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cream py-20 text-center" ref={useScrollReveal()}>
        <div className="max-w-xl mx-auto px-6" data-reveal>
          <h2 className="font-serif text-2xl font-bold text-dark mb-3">Pas encore trouvé votre réponse ?</h2>
          <p className="text-muted text-sm mb-6">Notre équipe répond dans les 24h en jours ouvrés.</p>
          <Link to="/contact" className="btn btn-gold">
            Formulaire de contact <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  )
}
