import { useScrollReveal } from '../hooks/useScrollReveal'
import SectionHeader from '../components/ui/SectionHeader'
import { Link } from 'react-router-dom'
import { Download, ExternalLink, Mail, ArrowRight } from 'lucide-react'

const PRESS_ARTICLES = [
  {
    source: 'TelQuel',
    date: 'Mars 2026',
    title: 'DiaTable, la startup qui connecte la diaspora africaine au Maroc via la nourriture',
    excerpt: 'La plateforme casablancaise a réuni plus de 200 vendeurs de 30 nationalités différentes en moins d\'un an d\'existence.',
    url: '#',
    logo: 'TQ',
    color: 'linear-gradient(135deg, #1a1a2e, #2d2d4e)',
  },
  {
    source: 'Médias24',
    date: 'Février 2026',
    title: 'Les startups de la foodtech marocaine à suivre en 2026',
    excerpt: 'DiaTable figure parmi les 10 startups marocaines les plus prometteuses de l\'année dans le secteur de la restauration.',
    url: '#',
    logo: 'M24',
    color: 'linear-gradient(135deg, #b71c1c, #e53935)',
  },
  {
    source: 'Jeune Afrique',
    date: 'Janvier 2026',
    title: 'Au Maroc, la diaspora réinvente la restauration',
    excerpt: 'Entre cuisine sénégalaise, libanaise et nigériane, DiaTable cartographie les saveurs du monde entier à Casablanca.',
    url: '#',
    logo: 'JA',
    color: 'linear-gradient(135deg, #e65100, #f4a828)',
  },
  {
    source: 'L\'Économiste',
    date: 'Décembre 2025',
    title: 'DiaTable lève des fonds pour accélérer son déploiement national',
    excerpt: 'La startup a bouclé un premier tour de table pour financer son expansion dans 5 nouvelles villes marocaines.',
    url: '#',
    logo: 'ÉCO',
    color: 'linear-gradient(135deg, #0d47a1, #1565c0)',
  },
]

const ASSETS = [
  { label: 'Logo DiaTable (SVG + PNG)', size: '2.4 MB' },
  { label: "Photos de l'équipe fondatrice", size: '8.1 MB' },
  { label: "Captures d'écran de la plateforme", size: '5.6 MB' },
  { label: 'Dossier de presse complet (PDF)', size: '3.2 MB' },
  { label: 'Kit presse tout-en-un (.zip)', size: '18 MB' },
]

const KEY_FIGURES = [
  { n: '200+', l: 'Vendeurs actifs' },
  { n: '30+', l: 'Cuisines représentées' },
  { n: '8', l: 'Villes couvertes' },
  { n: '5K+', l: 'Utilisateurs satisfaits' },
]

export default function Presse() {
  const ref = useScrollReveal()

  return (
    <div ref={ref}>
      {/* Header */}
      <div className="bg-dark pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 zellige-pattern opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark/70" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <p className="section-label" data-reveal>Médias</p>
          <h1 className="font-serif text-4xl md:text-5xl font-black text-white mb-4" data-reveal data-delay="0.1s">
            Espace <em className="text-gold italic">Presse</em>
          </h1>
          <p className="text-light/70 text-lg" data-reveal data-delay="0.2s">
            Ressources, articles et contacts pour les journalistes et partenaires médias.
          </p>
        </div>
      </div>

      {/* Key figures */}
      <section className="bg-gold py-14">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {KEY_FIGURES.map((s, i) => (
              <div key={s.l} data-reveal data-delay={`${i * 0.08}s`} className="text-center">
                <div className="font-serif text-4xl font-black text-dark">{s.n}</div>
                <div className="text-dark/70 text-sm mt-1 font-medium">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="bg-cream py-24">
        <div className="max-w-5xl mx-auto px-6">
          <SectionHeader label="Ils parlent de nous" title="DiaTable dans les <em>médias</em>" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PRESS_ARTICLES.map((a, i) => (
              <a key={a.source} href={a.url}
                data-reveal data-delay={`${(i % 2) * 0.1}s`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-black/[0.05]
                           hover:-translate-y-1 hover:shadow-md transition-all duration-300 group flex flex-col">
                <div className="h-24 flex items-center px-8 relative" style={{ background: a.color }}>
                  <span className="font-serif text-2xl font-black text-white/90">{a.logo}</span>
                  <span className="ml-auto text-white/50 text-xs">{a.date}</span>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-serif font-bold text-dark text-base leading-snug mb-2">{a.title}</h3>
                  <p className="text-muted text-sm leading-relaxed flex-1">{a.excerpt}</p>
                  <div className="flex items-center gap-1.5 mt-4 text-gold text-xs font-semibold group-hover:gap-2.5 transition-all">
                    Lire l'article <ExternalLink size={13} />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Press kit */}
      <section className="bg-dark2 py-24">
        <div className="max-w-4xl mx-auto px-6" ref={useScrollReveal()}>
          <SectionHeader label="Ressources" title="Kit <em>presse</em>" light />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ASSETS.map((a, i) => (
              <div key={a.label} data-reveal data-delay={`${i * 0.08}s`}
                className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5 flex items-center justify-between
                           hover:bg-gold/[0.05] hover:border-gold/20 transition-all duration-300 group cursor-pointer">
                <div>
                  <div className="text-white text-sm font-medium">{a.label}</div>
                  <div className="text-muted text-xs mt-0.5">{a.size}</div>
                </div>
                <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                  <Download size={16} className="text-gold" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press contact */}
      <section className="bg-cream py-24">
        <div className="max-w-3xl mx-auto px-6 text-center" ref={useScrollReveal()}>
          <div data-reveal>
            <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-6">
              <Mail size={32} className="text-gold" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-dark mb-4">Contact presse</h2>
            <p className="text-dark/60 mb-6">
              Pour toute demande d'interview, de partenariat médias ou d'information complémentaire, contactez notre service de communication.
            </p>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-black/[0.05] inline-block text-left min-w-[280px]">
              <div className="text-sm text-muted mb-1">Responsable communication</div>
              <div className="font-serif font-bold text-dark text-lg mb-3">Aminata Sow</div>
              <a href="mailto:presse@datable.ma" className="text-gold font-semibold text-sm hover:underline flex items-center gap-1.5">
                <Mail size={14} /> presse@datable.ma
              </a>
            </div>
            <div className="mt-8">
              <Link to="/contact" className="btn btn-gold">
                Envoyer un message <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
