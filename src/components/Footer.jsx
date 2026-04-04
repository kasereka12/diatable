import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Facebook, Instagram, MessageCircle, Heart, Globe } from 'lucide-react'

const ABOUT_LINKS = [
  { label: 'Notre histoire',      to: '/a-propos' },
  { label: 'Comment ça marche',   to: '/comment-ca-marche' },
  { label: 'Presse',              to: '/presse' },
  { label: 'Carrières',           to: '/carrieres' },
]

const CUISINE_LINKS = [
  { label: '🇸🇳 Sénégalaise',      to: '/restaurants?cuisine=senegalaise' },
  { label: '🇱🇧 Libanaise',         to: '/restaurants?cuisine=libanaise' },
  { label: '🇨🇳 Chinoise',          to: '/restaurants?cuisine=chinoise' },
  { label: '🇳🇬 Nigériane',         to: '/restaurants?cuisine=nigeriane' },
  { label: 'Toutes les cuisines',  to: '/cuisines' },
]

const CONTACT_LINKS = [
  { label: 'hello@datable.ma',    href: 'mailto:hello@datable.ma' },
  { label: '+212 6 00 00 00 00',  href: 'tel:+212600000000' },
  { label: 'Casablanca, Maroc',   href: null },
  { label: 'Devenir vendeur',     to: '/devenir-vendeur' },
  { label: 'Aide & Support',      to: '/aide' },
]

const SOCIAL = [
  { Icon: Facebook,      title: 'Facebook',  href: '#' },
  { Icon: Instagram,     title: 'Instagram', href: '#' },
  { Icon: MessageCircle, title: 'WhatsApp',  href: '#' },
]

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="font-serif font-bold text-white text-base mb-5">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => {
          const cls = "text-muted text-sm transition-all duration-200 hover:text-gold hover:pl-1"
          if (l.href === null) {
            return <li key={l.label}><span className="text-muted text-sm">{l.label}</span></li>
          }
          if (l.href) {
            return <li key={l.label}><a href={l.href} className={cls}>{l.label}</a></li>
          }
          return <li key={l.label}><Link to={l.to} className={cls}>{l.label}</Link></li>
        })}
      </ul>
    </div>
  )
}

export default function Footer() {
  const { profile } = useAuth()
  const isVendor = profile?.role === 'vendor'
  const contactLinks = isVendor
    ? CONTACT_LINKS.filter(l => l.label !== 'Devenir vendeur')
    : CONTACT_LINKS
  return (
    <footer id="contact" className="bg-dark border-t border-white/[0.05] pt-18 pb-0">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-12 pb-16">
          {/* Brand */}
          <div>
            <Link to="/" className="font-serif text-[1.75rem] font-bold text-white flex items-center gap-1.5 mb-4">
              Dia<span className="text-gold">Table</span>
              <Globe size={20} className="text-gold" />
            </Link>
            <p className="text-muted text-sm leading-[1.7] max-w-[260px] mb-7">
              Relier les communautés de la diaspora à travers la nourriture. Retrouvez le goût de chez vous, ici au Maroc.
            </p>
            <div className="flex gap-3">
              {SOCIAL.map((s) => (
                <a
                  key={s.title}
                  href={s.href}
                  title={s.title}
                  className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/[0.08]
                             flex items-center justify-center text-muted
                             transition-all duration-200 hover:bg-gold/15 hover:border-gold/30 hover:text-gold"
                >
                  <s.Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="À propos"  links={ABOUT_LINKS} />
          <FooterCol title="Cuisines"  links={CUISINE_LINKS} />
          <FooterCol title="Contact"   links={contactLinks} />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] py-6 flex flex-wrap items-center justify-between gap-3">
          <span className="text-muted text-xs">© 2026 DiaTable. Tous droits réservés.</span>
          <span className="text-muted text-xs flex items-center gap-1">
            Fait avec <Heart size={14} className="text-red-400 fill-red-400" /> pour la diaspora au Maroc 🇲🇦
          </span>
        </div>
      </div>
    </footer>
  )
}
