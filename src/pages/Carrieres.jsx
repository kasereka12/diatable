import { useState } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'
import SectionHeader from '../components/ui/SectionHeader'
import { Link } from 'react-router-dom'
import { MapPin, Clock, Briefcase, Heart, Users, Zap, Globe, ChevronDown, ChevronUp, ArrowRight, Mail } from 'lucide-react'

const PERKS = [
  { Icon: Heart,   title: 'Mission qui a du sens',  desc: 'Contribuez à une plateforme qui soutient des entrepreneurs de la diaspora et célèbre la diversité culturelle.' },
  { Icon: Globe,   title: 'Équipe multiculturelle', desc: 'Travaillez avec des personnes venues de plus de 10 pays. La diversité est notre ADN.' },
  { Icon: Zap,     title: 'Startup en croissance',  desc: 'Rejoignez tôt et grandissez avec nous. Responsabilités réelles, impact visible dès le premier jour.' },
  { Icon: Users,   title: 'Culture bienveillante',  desc: 'Flexibilité, bienveillance et autonomie. Nous faisons confiance à nos équipes.' },
]

const JOBS = [
  {
    id: 1,
    title: 'Responsable Croissance & Marketing',
    type: 'CDI',
    location: 'Casablanca',
    dept: 'Marketing',
    remote: 'Hybride',
    desc: 'Vous pilotez notre acquisition utilisateurs et vendeurs, gérez nos campagnes digitales et développez notre présence sur les réseaux sociaux.',
    skills: ['Growth hacking', 'SEO/SEA', 'Social media', 'Analytics'],
  },
  {
    id: 2,
    title: 'Développeur(se) Fullstack React / Node',
    type: 'CDI',
    location: 'Casablanca',
    dept: 'Tech',
    remote: 'Full remote possible',
    desc: 'Vous participez au développement de la plateforme DiaTable : nouvelles fonctionnalités, performance, APIs Supabase et expérience utilisateur.',
    skills: ['React', 'Node.js', 'Supabase', 'PostgreSQL', 'TypeScript'],
  },
  {
    id: 3,
    title: 'Community Manager – Diaspora',
    type: 'CDI',
    location: 'Casablanca / Rabat',
    dept: 'Communauté',
    remote: 'Présentiel',
    desc: "Vous animez notre communauté de vendeurs et d'utilisateurs, organisez des événements culinaires et êtes le visage de DiaTable sur le terrain.",
    skills: ['Animation communauté', 'Événementiel', 'Multilingue', 'Réseaux sociaux'],
  },
  {
    id: 4,
    title: 'Chargé(e) de Partenariats Vendeurs',
    type: 'CDD 6 mois',
    location: 'Marrakech',
    dept: 'Commercial',
    remote: 'Présentiel',
    desc: 'Vous recrutez et accompagnez les nouveaux vendeurs sur DiaTable dans la région de Marrakech-Tensift.',
    skills: ['Prospection', 'Négociation', 'Compte-rendu', 'Arabe / Français'],
  },
  {
    id: 5,
    title: 'Stagiaire Product Design (UI/UX)',
    type: 'Stage 4-6 mois',
    location: 'Casablanca',
    dept: 'Design',
    remote: 'Hybride',
    desc: 'Vous assistez notre équipe design dans la création de nouvelles interfaces, réalisez des tests utilisateurs et contribuez à notre design system.',
    skills: ['Figma', 'Prototypage', 'Recherche utilisateur', 'Design system'],
  },
]

const DEPT_COLORS = {
  Marketing: 'bg-purple-100 text-purple-700',
  Tech: 'bg-blue-100 text-blue-700',
  Communauté: 'bg-green-100 text-green-700',
  Commercial: 'bg-orange-100 text-orange-700',
  Design: 'bg-pink-100 text-pink-700',
}

function JobCard({ job }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/[0.05] overflow-hidden transition-all duration-300 hover:shadow-md">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left p-6 flex items-start justify-between gap-4"
      >
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-[0.65rem] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${DEPT_COLORS[job.dept]}`}>
              {job.dept}
            </span>
            <span className="text-[0.65rem] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-gold/10 text-gold-dark">
              {job.type}
            </span>
          </div>
          <h3 className="font-serif font-bold text-dark text-lg leading-snug">{job.title}</h3>
          <div className="flex flex-wrap gap-4 mt-2">
            <span className="flex items-center gap-1 text-muted text-xs"><MapPin size={12} />{job.location}</span>
            <span className="flex items-center gap-1 text-muted text-xs"><Clock size={12} />{job.remote}</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center flex-shrink-0 mt-1">
          {open ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
        </div>
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-black/[0.05] pt-5">
          <p className="text-dark/70 text-sm leading-relaxed mb-4">{job.desc}</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {job.skills.map(s => (
              <span key={s} className="text-xs bg-cream text-dark/70 font-medium px-3 py-1 rounded-full">{s}</span>
            ))}
          </div>
          <Link to={`/contact`}
            className="btn btn-gold text-sm">
            Postuler <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  )
}

export default function Carrieres() {
  const ref = useScrollReveal()

  return (
    <div ref={ref}>
      {/* Header */}
      <div className="bg-dark pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 zellige-pattern opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark/70" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <p className="section-label" data-reveal>Rejoignez-nous</p>
          <h1 className="font-serif text-4xl md:text-5xl font-black text-white mb-4" data-reveal data-delay="0.1s">
            Carrières chez <em className="text-gold italic">DiaTable</em>
          </h1>
          <p className="text-light/70 text-lg" data-reveal data-delay="0.2s">
            Construisez avec nous la plus grande plateforme de cuisine de la diaspora en Afrique.
          </p>
        </div>
      </div>

      {/* Perks */}
      <section className="bg-cream py-24">
        <div className="max-w-5xl mx-auto px-6">
          <SectionHeader label="Pourquoi nous rejoindre" title="Travailler chez <em>DiaTable</em>" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PERKS.map((p, i) => (
              <div key={p.title} data-reveal data-delay={`${i * 0.1}s`}
                className="bg-white rounded-2xl p-7 shadow-sm border border-black/[0.05] hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4">
                  <p.Icon size={24} className="text-gold" />
                </div>
                <h3 className="font-serif font-bold text-dark text-base mb-2">{p.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jobs */}
      <section className="bg-dark2 py-24">
        <div className="max-w-4xl mx-auto px-6" ref={useScrollReveal()}>
          <SectionHeader label="Offres d'emploi" title="Postes <em>ouverts</em>" light />
          <div className="space-y-4">
            {JOBS.map((job, i) => (
              <div key={job.id} data-reveal data-delay={`${i * 0.07}s`}>
                <JobCard job={job} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Candidature spontanée */}
      <section className="bg-cream py-24">
        <div className="max-w-3xl mx-auto px-6 text-center" ref={useScrollReveal()}>
          <div data-reveal>
            <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-6">
              <Briefcase size={32} className="text-gold" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-dark mb-4">Candidature spontanée</h2>
            <p className="text-dark/60 mb-8 max-w-md mx-auto">
              Vous ne trouvez pas le poste qui vous correspond mais vous croyez en notre mission ? Envoyez-nous votre profil.
            </p>
            <a href="mailto:jobs@datable.ma" className="btn btn-gold">
              <Mail size={16} /> jobs@datable.ma
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
