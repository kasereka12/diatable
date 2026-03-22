import { useState, useEffect } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'
import SectionHeader from '../components/ui/SectionHeader'
import { supabase } from '../lib/supabase'
import { Globe, Users, ShieldCheck, Heart } from 'lucide-react'

const VALUES = [
  { Icon: Globe,       title: 'Multiculturalisme',    desc: 'Nous croyons que la diversité culturelle est une richesse. DiaTable célèbre chaque communauté et chaque saveur.' },
  { Icon: Users,       title: "Communauté d'abord",   desc: 'Nous sommes au service des vendeurs de la diaspora — des entrepreneurs qui construisent leur vie au Maroc.' },
  { Icon: ShieldCheck, title: 'Confiance & Qualité',  desc: 'Chaque vendeur est vérifié par notre équipe. Vous commandez en toute confiance, chaque fois.' },
  { Icon: Heart,       title: 'Fabriqué avec amour',  desc: "DiaTable est né d'un besoin réel. Nous avons tous vécu loin de chez nous — nous comprenons ce que représente un bon plat du pays." },
]

export default function About() {
  const ref = useScrollReveal()
  const [team, setTeam]       = useState([])
  const [teamLoading, setTeamLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setTeamLoading(false); return }
    supabase
      .from('team')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data?.length) setTeam(data)
        setTeamLoading(false)
      })
  }, [])

  return (
    <div ref={ref}>
      {/* Hero */}
      <div className="bg-dark pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 zellige-pattern opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark/60" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <p className="section-label" data-reveal>Notre Histoire</p>
          <h1 className="font-serif text-4xl md:text-5xl font-black text-white mb-6 leading-tight" data-reveal data-delay="0.1s">
            La table de <em className="text-gold italic">toute la diaspora</em>
          </h1>
          <p className="text-light/70 text-lg leading-relaxed" data-reveal data-delay="0.2s">
            DiaTable est née d'une simple question : <em>"Où trouver un bon Thiéboudienne à Casablanca ?"</em><br/>
            Et si la réponse était une seule plateforme pour tous ?
          </p>
        </div>
      </div>

      {/* Story */}
      <section className="bg-cream py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div data-reveal>
              <p className="section-label">Notre Mission</p>
              <h2 className="font-serif text-3xl font-bold text-dark mb-5">
                Connecter les communautés à travers la <em className="text-gold italic">nourriture</em>
              </h2>
              <p className="text-dark/70 leading-relaxed mb-4">
                Chaque expatrié qui arrive au Maroc emporte dans ses bagages les saveurs de son pays. DiaTable les aide à retrouver ces saveurs — et aide les cuisiniers de la diaspora à partager leur culture avec des milliers de personnes.
              </p>
              <p className="text-dark/70 leading-relaxed">
                De Casablanca à Marrakech, en passant par Rabat et Tanger, nous construisons le plus grand annuaire de cuisines de la diaspora au Maroc.
              </p>
            </div>
            <div data-reveal data-delay="0.15s">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { n: '30+', l: 'Pays représentés' },
                  { n: '200+', l: 'Vendeurs actifs' },
                  { n: '8', l: 'Villes couvertes' },
                  { n: '5K+', l: 'Expats satisfaits' },
                ].map(s => (
                  <div key={s.l} className="bg-white rounded-2xl p-5 shadow-sm border border-black/[0.05] text-center">
                    <div className="font-serif text-3xl font-black text-gold">{s.n}</div>
                    <div className="text-muted text-xs mt-1">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-dark2 py-24">
        <div className="max-w-6xl mx-auto px-6" ref={useScrollReveal()}>
          <SectionHeader label="Ce En Quoi Nous Croyons" title="Nos <em>Valeurs</em>" light />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => (
              <div key={v.title} data-reveal data-delay={`${i * 0.1}s`}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 text-center hover:bg-gold/[0.05] hover:border-gold/20 transition-all duration-300">
                <div className="flex justify-center mb-4">
                  <v.Icon size={44} className="text-gold" />
                </div>
                <h3 className="font-serif font-bold text-white text-base mb-2">{v.title}</h3>
                <p className="text-muted text-xs leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-cream py-24">
        <div className="max-w-5xl mx-auto px-6" ref={useScrollReveal()}>
          <SectionHeader label="Les Fondateurs" title="L'équipe <em>DiaTable</em>" />
          {teamLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 rounded-full border-4 border-gold/30 border-t-gold animate-spin" />
            </div>
          ) : team.length === 0 ? (
            <p className="text-center text-muted py-12">Aucun membre d'équipe pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {team.map((m, i) => (
                <div key={m.id} data-reveal data-delay={`${i * 0.12}s`}
                  className="bg-white rounded-2xl p-7 shadow-sm border border-black/[0.05] text-center hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center font-serif text-xl font-black text-dark"
                    style={{ background: m.avatar_bg || 'linear-gradient(135deg,#f4a828,#c8841a)' }}>
                    {m.initials}
                  </div>
                  <h3 className="font-serif font-bold text-dark text-lg">{m.name}</h3>
                  <p className="text-gold text-xs font-semibold mt-1">{m.role}</p>
                  <p className="text-muted text-xs mt-2">{m.origin}</p>
                  {m.bio && <p className="text-dark/60 text-xs mt-3 leading-relaxed">{m.bio}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-dark py-20 text-center" ref={useScrollReveal()}>
        <div className="max-w-2xl mx-auto px-6" data-reveal>
          <h2 className="font-serif text-3xl font-bold text-white mb-4">
            Rejoignez l'aventure <em className="text-gold italic">DiaTable</em>
          </h2>
          <p className="text-muted mb-8">Que vous cherchiez de la nourriture ou que vous cuisiniez, votre place est ici.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/restaurants" className="btn btn-gold">Explorer les cuisines</a>
            <a href="/inscription?role=vendor" className="btn btn-outline">Devenir vendeur</a>
          </div>
        </div>
      </section>
    </div>
  )
}
