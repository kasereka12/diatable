import { useState, useEffect } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { useAuth } from '../context/AuthContext'
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
  const { profile } = useAuth()
  const isVendor = profile?.role === 'vendor'
  const [team, setTeam]             = useState([])
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
      <div className="pt-32 pb-24 relative overflow-hidden" style={{ backgroundColor: '#1f1f1f' }}>
        <div className="absolute inset-0 zellige-pattern opacity-30" />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(31,31,31,0.65))' }} />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <p className="section-label" data-reveal>Notre Histoire</p>
          <h1 className="font-serif text-4xl md:text-5xl font-black mb-6 leading-tight"
            style={{ color: '#f8f8f8' }} data-reveal data-delay="0.1s">
            La table de{' '}
            <em style={{ color: '#c5611a', fontStyle: 'italic' }}>toute la diaspora</em>
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'rgba(248,248,248,0.70)' }}
            data-reveal data-delay="0.2s">
            DiaTable est née d'une simple question :{' '}
            <em style={{ color: '#bd9f87' }}>"Où trouver un bon Thiéboudienne à Casablanca ?"</em><br/>
            Et si la réponse était une seule plateforme pour tous ?
          </p>
        </div>
      </div>

      {/* Story */}
      <section className="py-24" style={{ backgroundColor: '#eae5d9' }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div data-reveal>
              <p className="section-label">Notre Mission</p>
              <h2 className="font-serif text-3xl font-bold mb-5" style={{ color: '#1f1f1f' }}>
                Connecter les communautés à travers la{' '}
                <em style={{ color: '#c5611a', fontStyle: 'italic' }}>nourriture</em>
              </h2>
              <p className="leading-relaxed mb-4" style={{ color: 'rgba(31,31,31,0.70)' }}>
                Chaque expatrié qui arrive au Maroc emporte dans ses bagages les saveurs de son pays. DiaTable les aide à retrouver ces saveurs — et aide les cuisiniers de la diaspora à partager leur culture avec des milliers de personnes.
              </p>
              <p className="leading-relaxed" style={{ color: 'rgba(31,31,31,0.70)' }}>
                De Casablanca à Marrakech, en passant par Rabat et Tanger, nous construisons le plus grand annuaire de cuisines de la diaspora au Maroc.
              </p>
            </div>
            <div data-reveal data-delay="0.15s">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { n: '30+',  l: 'Pays représentés' },
                  { n: '200+', l: 'Vendeurs actifs' },
                  { n: '8',    l: 'Villes couvertes' },
                  { n: '5K+',  l: 'Expats satisfaits' },
                ].map(s => (
                  <div key={s.l} className="rounded-2xl p-5 text-center"
                    style={{ backgroundColor: '#f8f8f8', boxShadow: '0 2px 12px rgba(80,70,64,0.08)', border: '1px solid rgba(80,70,64,0.06)' }}>
                    <div className="font-serif text-3xl font-black" style={{ color: '#c5611a' }}>{s.n}</div>
                    <div className="text-xs mt-1" style={{ color: '#80716a' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24" style={{ backgroundColor: '#504640' }}>
        <div className="max-w-6xl mx-auto px-6" ref={useScrollReveal()}>
          <SectionHeader label="Ce En Quoi Nous Croyons" title="Nos <em>Valeurs</em>" light />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => (
              <div key={v.title} data-reveal data-delay={`${i * 0.1}s`}
                className="rounded-2xl p-6 text-center transition-all duration-300"
                style={{ backgroundColor: 'rgba(248,248,248,0.04)', border: '1px solid rgba(248,248,248,0.08)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(197,97,26,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(197,97,26,0.25)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(248,248,248,0.04)'
                  e.currentTarget.style.borderColor = 'rgba(248,248,248,0.08)'
                }}
              >
                <div className="flex justify-center mb-4">
                  <v.Icon size={44} style={{ color: '#c5611a' }} />
                </div>
                <h3 className="font-serif font-bold text-base mb-2" style={{ color: '#f8f8f8' }}>{v.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#bd9f87' }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24" style={{ backgroundColor: '#eae5d9' }}>
        <div className="max-w-5xl mx-auto px-6" ref={useScrollReveal()}>
          <SectionHeader label="Les Fondateurs" title="L'équipe <em>DiaTable</em>" />
          {teamLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 rounded-full animate-spin"
                style={{ border: '4px solid rgba(197,97,26,0.25)', borderTopColor: '#c5611a' }} />
            </div>
          ) : team.length === 0 ? (
            <p className="text-center py-12" style={{ color: '#80716a' }}>Aucun membre d'équipe pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {team.map((m, i) => (
                <div key={m.id} data-reveal data-delay={`${i * 0.12}s`}
                  className="rounded-2xl p-7 text-center transition-all duration-300 hover:-translate-y-1"
                  style={{ backgroundColor: '#f8f8f8', border: '1px solid rgba(80,70,64,0.06)', boxShadow: '0 2px 12px rgba(80,70,64,0.08)' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 28px rgba(80,70,64,0.14)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(80,70,64,0.08)'}
                >
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center font-serif text-xl font-black"
                    style={{ background: m.avatar_bg || 'linear-gradient(135deg,#c5611a,#a04d12)', color: '#f8f8f8' }}>
                    {m.initials}
                  </div>
                  <h3 className="font-serif font-bold text-lg" style={{ color: '#1f1f1f' }}>{m.name}</h3>
                  <p className="text-xs font-semibold mt-1" style={{ color: '#c5611a' }}>{m.role}</p>
                  <p className="text-xs mt-2" style={{ color: '#80716a' }}>{m.origin}</p>
                  {m.bio && <p className="text-xs mt-3 leading-relaxed" style={{ color: 'rgba(31,31,31,0.60)' }}>{m.bio}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center" style={{ backgroundColor: '#1f1f1f' }} ref={useScrollReveal()}>
        <div className="max-w-2xl mx-auto px-6" data-reveal>
          <h2 className="font-serif text-3xl font-bold mb-4" style={{ color: '#f8f8f8' }}>
            Rejoignez l'aventure{' '}
            <em style={{ color: '#c5611a', fontStyle: 'italic' }}>DiaTable</em>
          </h2>
          <p className="mb-8" style={{ color: '#80716a' }}>
            Que vous cherchiez de la nourriture ou que vous cuisiniez, votre place est ici.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/restaurants" className="btn btn-gold">Explorer les cuisines</a>
            {!isVendor && (
              <a href="/inscription?role=vendor" className="btn btn-outline">Devenir vendeur</a>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}