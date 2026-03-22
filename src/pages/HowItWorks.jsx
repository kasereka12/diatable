import { useScrollReveal } from '../hooks/useScrollReveal'
import SectionHeader from '../components/ui/SectionHeader'
import { Link } from 'react-router-dom'
import { Search, MapPin, Utensils, ChefHat, Star, ShieldCheck, Bell, CreditCard, MessageCircle, ArrowRight } from 'lucide-react'

const STEPS_BUYER = [
  {
    n: '01',
    Icon: Search,
    title: 'Choisissez votre cuisine',
    desc: "Parcourez plus de 30 cuisines du monde entier — d'Afrique de l'Ouest à l'Asie, du Moyen-Orient à l'Europe. Filtrez par pays, ville ou plat.",
  },
  {
    n: '02',
    Icon: MapPin,
    title: 'Trouvez un vendeur près de vous',
    desc: 'Restaurants, cuisiniers à domicile et pop-ups — localisez les vendeurs vérifiés dans votre ville au Maroc : Casablanca, Rabat, Marrakech, Tanger…',
  },
  {
    n: '03',
    Icon: Utensils,
    title: 'Commandez ou visitez',
    desc: "Contactez directement le vendeur, commandez en ligne ou réservez une table. Réglez et savourez le goût de votre pays d'origine.",
  },
]

const STEPS_VENDOR = [
  {
    n: '01',
    Icon: ChefHat,
    title: 'Créez votre profil vendeur',
    desc: 'Inscrivez-vous gratuitement en quelques minutes. Décrivez votre cuisine, ajoutez vos spécialités et vos photos.',
  },
  {
    n: '02',
    Icon: Bell,
    title: 'Recevez des commandes',
    desc: "Vos plats apparaissent dans notre annuaire. Des milliers d'expatriés et de curieux vous découvrent chaque jour.",
  },
  {
    n: '03',
    Icon: Star,
    title: 'Développez votre activité',
    desc: 'Gérez vos avis, suivez vos statistiques depuis votre tableau de bord et faites grandir votre clientèle au Maroc.',
  },
]

const FAQS = [
  { q: 'DiaTable est-il gratuit ?', a: "L'inscription est entièrement gratuite. Aucune commission sur vos 3 premiers mois d'activité." },
  { q: 'Comment les vendeurs sont-ils vérifiés ?', a: "Notre équipe examine chaque profil vendeur avant publication. Nous vérifions l'identité, les avis clients et la qualité des plats." },
  { q: 'Quelles villes sont couvertes ?', a: "Casablanca, Rabat, Marrakech, Tanger, Fès, Agadir, Meknès et Oujda. D'autres villes arrivent bientôt." },
  { q: 'Comment contacter un vendeur ?', a: 'Chaque fiche vendeur affiche ses coordonnées : téléphone, WhatsApp et formulaire de contact intégré.' },
  { q: 'Puis-je vendre depuis chez moi ?', a: "Oui ! Les cuisiniers à domicile sont les bienvenus sur DiaTable. Vous n'avez pas besoin d'un restaurant." },
]

export default function HowItWorks() {
  const ref = useScrollReveal()

  return (
    <div ref={ref}>
      {/* Header */}
      <div className="bg-dark pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 zellige-pattern opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark/70" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <p className="section-label" data-reveal>Guide</p>
          <h1 className="font-serif text-4xl md:text-5xl font-black text-white mb-4" data-reveal data-delay="0.1s">
            Comment ça <em className="text-gold italic">marche ?</em>
          </h1>
          <p className="text-light/70 text-lg" data-reveal data-delay="0.2s">
            Trouver de la nourriture de chez vous ou vendre votre cuisine — DiaTable simplifie tout.
          </p>
        </div>
      </div>

      {/* Pour les acheteurs */}
      <section className="bg-cream py-24">
        <div className="max-w-5xl mx-auto px-6">
          <SectionHeader label="Pour les expatriés" title="Trouvez le goût de <em>chez vous</em>" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS_BUYER.map((s, i) => (
              <div key={s.n} data-reveal data-delay={`${i * 0.1}s`}
                className="bg-white rounded-2xl p-8 shadow-sm border border-black/[0.05] relative overflow-hidden group hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <div className="absolute top-4 right-5 font-serif text-6xl font-black text-black/[0.04] select-none leading-none">{s.n}</div>
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-5">
                  <s.Icon size={24} className="text-gold" />
                </div>
                <h3 className="font-serif font-bold text-dark text-lg mb-3">{s.title}</h3>
                <p className="text-dark/60 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10" data-reveal>
            <Link to="/cuisines" className="btn btn-gold">Explorer les cuisines <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      {/* Pour les vendeurs */}
      <section className="bg-dark2 py-24">
        <div className="max-w-5xl mx-auto px-6" ref={useScrollReveal()}>
          <SectionHeader label="Pour les vendeurs" title="Partagez votre <em>cuisine</em>" light />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS_VENDOR.map((s, i) => (
              <div key={s.n} data-reveal data-delay={`${i * 0.1}s`}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 relative overflow-hidden group hover:bg-gold/[0.05] hover:border-gold/20 transition-all duration-300">
                <div className="absolute top-4 right-5 font-serif text-6xl font-black text-white/[0.03] select-none leading-none">{s.n}</div>
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-5">
                  <s.Icon size={24} className="text-gold" />
                </div>
                <h3 className="font-serif font-bold text-white text-lg mb-3">{s.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10" data-reveal>
            <Link to="/inscription?role=vendor" className="btn btn-gold">Devenir vendeur <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="bg-cream py-24">
        <div className="max-w-5xl mx-auto px-6" ref={useScrollReveal()}>
          <SectionHeader label="Pourquoi DiaTable" title="Tout en un <em>seul endroit</em>" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { Icon: ShieldCheck, title: 'Vendeurs vérifiés', desc: 'Chaque profil est validé par notre équipe. Commandez en toute confiance.' },
              { Icon: CreditCard, title: 'Paiement sécurisé', desc: 'Réglez en ligne ou à la livraison. Vos données sont protégées.' },
              { Icon: MessageCircle, title: 'Support réactif', desc: 'Notre équipe répond sous 24h. Un problème ? On règle ça.' },
            ].map((f, i) => (
              <div key={f.title} data-reveal data-delay={`${i * 0.1}s`}
                className="bg-white rounded-2xl p-7 shadow-sm border border-black/[0.05] text-center hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <f.Icon size={28} className="text-gold" />
                </div>
                <h3 className="font-serif font-bold text-dark text-base mb-2">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-dark py-24">
        <div className="max-w-3xl mx-auto px-6" ref={useScrollReveal()}>
          <SectionHeader label="FAQ" title="Questions <em>fréquentes</em>" light />
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={faq.q} data-reveal data-delay={`${i * 0.07}s`}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 hover:border-gold/20 transition-all duration-300">
                <h4 className="font-serif font-bold text-white text-base mb-2">{faq.q}</h4>
                <p className="text-muted text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gold py-20 text-center" ref={useScrollReveal()}>
        <div className="max-w-2xl mx-auto px-6" data-reveal>
          <h2 className="font-serif text-3xl font-bold text-dark mb-4">Prêt à commencer ?</h2>
          <p className="text-dark/70 mb-8">Rejoignez des milliers d'expatriés et de vendeurs qui font confiance à DiaTable.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/restaurants" className="btn bg-dark text-white hover:bg-dark/90">Explorer les restaurants</Link>
            <Link to="/inscription?role=vendor" className="btn bg-white text-dark hover:bg-white/90">Devenir vendeur</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
