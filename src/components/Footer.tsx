import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Facebook, Instagram, MessageCircle, Apple, PlayCircle } from 'lucide-react'
import Logo from '../assets/LogoBlanc.png'

const SOCIAL = [
  { Icon: Facebook, title: 'Facebook', href: '#' },
  { Icon: Instagram, title: 'Instagram', href: '#' },
  { Icon: MessageCircle, title: 'WhatsApp', href: '#' },
]

interface FooterLink { label: string; href?: string | null; to?: string }
interface FooterColProps { title: string; links: FooterLink[] }

function FooterCol({ title, links }: FooterColProps) {
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
          return <li key={l.label}><Link to={l.to ?? '#'} className={cls}>{l.label}</Link></li>
        })}
      </ul>
    </div>
  )
}

// Same "coming soon" badge as AppPromo, scaled down for the footer — no fake
// store links since there's no app to send people to yet.
function MiniStoreBadge({ Icon, label }: { Icon: typeof Apple; label: string }) {
  return (
    <div title={`Bientôt disponible sur ${label}`}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-muted cursor-default select-none">
      <Icon size={16} />
      <span className="text-xs font-medium">{label}</span>
    </div>
  )
}

export default function Footer() {
  const { t } = useTranslation()
  const { profile } = useAuth()

  const ABOUT_LINKS = [
    { label: t('footer.our_story'), to: '/a-propos' },
    { label: t('footer.how_it_works'), to: '/comment-ca-marche' },
    { label: t('footer.press'), to: '/presse' },
    { label: t('footer.careers'), to: '/carrieres' },
  ]

  const JOIN_LINKS = [
    { label: t('footer.become_vendor'), to: '/devenir-vendeur' },
    { label: t('footer.become_driver'), to: '/devenir-livreur' },
    { label: t('footer.my_orders'), to: '/mes-commandes' },
  ]

  const SUPPORT_LINKS = [
    { label: t('footer.help'), to: '/aide' },
    { label: 'contact@datable.ma', href: 'mailto:contact@datable.ma' },
    { label: '+212 76 18 41 41', href: 'tel:+21276184141' },
    { label: 'Casablanca, Maroc', href: null },
  ]

  const isVendor = profile?.role === 'vendor'
  const joinLinks = isVendor
    ? JOIN_LINKS.filter(l => l.label !== t('footer.become_vendor'))
    : JOIN_LINKS

  return (
    <footer id="contact" className="bg-dark border-t border-white/[0.05] pt-18 pb-0">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-12 pb-14">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center" aria-label="DiaTable - Accueil">
              <img src={Logo} alt="DiaTable" className="h-20 w-auto object-contain" />
            </Link>
            <p className="text-muted text-sm leading-[1.7] max-w-[260px] mb-6">
              {t('footer.tagline')}
            </p>
            <div className="flex gap-3 mb-7">
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
            <div className="flex flex-wrap gap-2">
              <MiniStoreBadge Icon={Apple} label="App Store" />
              <MiniStoreBadge Icon={PlayCircle} label="Google Play" />
            </div>
          </div>

          <FooterCol title={t('footer.col_about')}   links={ABOUT_LINKS} />
          <FooterCol title={t('footer.col_join')}    links={joinLinks} />
          <FooterCol title={t('footer.col_support')} links={SUPPORT_LINKS} />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] py-6 flex flex-wrap items-center justify-between gap-3">
          <span className="text-muted text-xs">{t('footer.copyright')}</span>
        </div>
      </div>
    </footer>
  )
}
