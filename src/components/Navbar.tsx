import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useNotifications } from '../context/NotificationContext'
import { useMessages } from '../context/MessageContext'
import {
  Globe, X, ChevronDown, LogOut, User, BarChart2, Utensils,
  ShieldCheck, Image, MapPin, ShoppingBag, MessageCircle, Bell,
  Package, Bike
} from 'lucide-react'
import Logo from '../assets/LogoBlanc.png'

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const { user, profile, signOut, isAdmin } = useAuth()
  const { itemCount, setIsCartOpen } = useCart()
  const { unreadCount } = useNotifications()
  const { unreadMessages } = useMessages()
  const [scrolled,      setScrolled]     = useState(false)
  const [menuOpen,      setMenuOpen]     = useState(false)
  const [userMenu,      setUserMenu]     = useState(false)
  const [explorerOpen,  setExplorerOpen] = useState(false)
  const [notifOpen,     setNotifOpen]    = useState(false)
  const explorerRef = useRef<HTMLLIElement | null>(null)
  const notifRef    = useRef<HTMLDivElement | null>(null)
  const navigate    = useNavigate()

  const isDriver = profile?.role === 'driver'
  const isVendor = profile?.role === 'vendor'
  const isRestrictedRole = isDriver || isVendor
  const dashboardPath  = isDriver ? '/livreur' : '/tableau-de-bord'
  const DashboardIcon  = isDriver ? Bike : BarChart2

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  const initials    = displayName ? displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2) : '?'

  const isEN = i18n.language?.startsWith('en')
  function toggleLang() { i18n.changeLanguage(isEN ? 'fr' : 'en') }

  useEffect(() => {
    let ticking = false
    const handler = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => { setScrolled(window.scrollY > 60); ticking = false })
      }
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    if (!userMenu && !explorerOpen && !notifOpen) return
    const close = (e: MouseEvent) => {
      if (explorerRef.current && !explorerRef.current.contains(e.target as Node)) setExplorerOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      setUserMenu(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [userMenu, explorerOpen, notifOpen])

  async function handleSignOut() {
    await signOut()
    setUserMenu(false)
    navigate('/')
  }

  const NAV_LINKS = [
    { label: t('nav.home'),    to: '/' },
    { label: t('nav.about'),   to: '/a-propos' },
    { label: t('nav.contact'), to: '/contact' },
  ]

  const EXPLORER_LINKS = [
    { label: t('nav.restaurants'), to: '/restaurants',  icon: Utensils,  desc: t('nav.all_restaurants') },
    { label: t('nav.cuisines'),    to: '/cuisines',      icon: MapPin,    desc: t('nav.by_cuisine') },
    { label: t('nav.gallery'),     to: '/galerie',       icon: Image,     desc: t('nav.dishes_photos') },
  ]

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[110] transition-all duration-300" style={{
        background: scrolled
          ? 'linear-gradient(180deg, #3a3a3a 0%, #4a4a4a 18%, #2a2a2a 55%, #141414 100%)'
          : 'linear-gradient(180deg, #353535 0%, #4f4f4f 22%, #262626 60%, #0f0f0f 100%)',
        backdropFilter: 'blur(12px)',
        boxShadow: scrolled
          ? '0 2px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)'
          : '0 2px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)',
      }}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-[1fr_auto_1fr] items-center py-3">

          {/* Left links */}
          <ul className="hidden md:flex items-center gap-2 list-none justify-start">
            <li>
              <NavLink to="/"
                className={({ isActive }) =>
                  `text-sm font-medium px-4 py-2 rounded-full transition-all duration-200
                   ${isActive ? 'bg-white/10' : 'hover:bg-white/10'}`}
                style={({ isActive }) => ({ color: isActive ? '#f8f8f8' : 'rgba(248,248,248,0.85)' })}>
                {t('nav.home')}
              </NavLink>
            </li>

            {!isRestrictedRole && (
              /* Explorer dropdown */
              <li ref={explorerRef} className="relative">
                <button
                  onClick={() => setExplorerOpen(v => !v)}
                  className="flex items-center gap-1.5 text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200"
                  style={{ backgroundColor: '#f8f8f8', color: '#c5611a', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                  {t('nav.explore')}
                  <ChevronDown size={14} strokeWidth={2.5} className={`transition-transform duration-200 ${explorerOpen ? 'rotate-180' : ''}`} />
                </button>
                {explorerOpen && (
                  <div className="absolute top-full left-0 mt-2 w-52 rounded-2xl overflow-hidden z-50"
                    style={{ backgroundColor: '#504640', border: '1px solid rgba(248,248,248,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                    {EXPLORER_LINKS.map(({ label, to, icon: Icon, desc }) => (
                      <NavLink key={to} to={to}
                        onClick={() => setExplorerOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 transition-all hover:bg-white/[0.08]"
                        style={({ isActive }) => ({ color: isActive ? '#f8f8f8' : 'rgba(248,248,248,0.80)' })}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'rgba(197,97,26,0.2)' }}>
                          <Icon size={15} style={{ color: '#c5611a' }} />
                        </div>
                        <div>
                          <div className="text-sm font-medium leading-none mb-0.5">{label}</div>
                          <div className="text-xs" style={{ color: 'rgba(189,159,135,0.6)' }}>{desc}</div>
                        </div>
                      </NavLink>
                    ))}
                  </div>
                )}
              </li>
            )}
          </ul>

          {/* Center logo */}
          <Link to="/" className="flex items-center justify-center" aria-label="DiaTable">
            <div className="rounded-full flex items-center justify-center"
              style={{ width: 96, height: 96, backgroundColor: '#c5611a', boxShadow: '0 8px 24px rgba(0,0,0,0.35)', marginBottom: -28 }}>
              <img src={Logo} alt="DiaTable" className="object-contain" style={{ width: 78, height: 78 }} />
            </div>
          </Link>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2 justify-end">
            {isRestrictedRole && user ? (
              <Link to={dashboardPath}
                className="flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200"
                style={{ backgroundColor: '#f8f8f8', color: '#c5611a', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                <DashboardIcon size={15} /> {t('nav.dashboard')}
              </Link>
            ) : (
            <>
            {NAV_LINKS.slice(1).map((l) => (
              <NavLink key={l.to} to={l.to}
                className={({ isActive }) =>
                  `text-sm font-medium px-4 py-2 rounded-full transition-all duration-200
                   ${isActive ? 'bg-white/10' : 'hover:bg-white/10'}`}
                style={({ isActive }) => ({ color: isActive ? '#f8f8f8' : 'rgba(248,248,248,0.85)' })}>
                {l.label}
              </NavLink>
            ))}

            {/* Language toggle */}
            <button
              onClick={toggleLang}
              title={isEN ? 'Passer en français' : 'Switch to English'}
              className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full transition-all hover:bg-white/10"
              style={{ color: 'rgba(248,248,248,0.65)', border: '1px solid rgba(248,248,248,0.12)' }}>
              <Globe size={13} />
              {isEN ? 'FR' : 'EN'}
            </button>

            {user ? (
              <>
                {/* Cart */}
                <button onClick={() => setIsCartOpen(true)}
                  className="relative p-2 rounded-lg transition-all hover:bg-white/10"
                  style={{ color: 'rgba(248,248,248,0.70)' }} aria-label={t('nav.open_cart')}>
                  <ShoppingBag size={18} />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 text-[0.6rem] font-bold min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#c5611a', color: '#f8f8f8' }}>{itemCount}</span>
                  )}
                </button>

                {/* Messages */}
                <Link to="/messages" className="relative p-2 rounded-lg transition-all hover:bg-white/10"
                  style={{ color: 'rgba(248,248,248,0.70)' }} aria-label={t('nav.messages')}>
                  <MessageCircle size={18} />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] flex items-center justify-center rounded-full text-[0.6rem] font-bold text-white px-1"
                      style={{ backgroundColor: '#25d366' }}>
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  )}
                </Link>

                {/* Notifications */}
                <div ref={notifRef} className="relative">
                  <button onClick={() => setNotifOpen(v => !v)}
                    className="relative p-2 rounded-lg transition-all hover:bg-white/10"
                    style={{ color: 'rgba(248,248,248,0.70)' }}
                    aria-label={t('nav.notifications')} aria-expanded={notifOpen}>
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[0.6rem] font-bold min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && <NotifDropdown onClose={() => setNotifOpen(false)} navigate={navigate} />}
                </div>

                {/* User menu */}
                <div className="relative" onMouseDown={e => e.stopPropagation()}>
                  <button onClick={() => setUserMenu(v => !v)}
                    aria-label="Menu utilisateur" aria-expanded={userMenu}
                    className="flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5 transition-all border"
                    style={{ backgroundColor: 'rgba(248,248,248,0.06)', borderColor: 'rgba(248,248,248,0.10)' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                      style={{ background: 'linear-gradient(135deg, #c5611a, #a04d12)', color: '#f8f8f8' }}>
                      {initials}
                    </div>
                    <span className="text-xs font-medium max-w-[80px] truncate" style={{ color: '#f8f8f8' }}>{displayName}</span>
                    <ChevronDown size={14} style={{ color: 'rgba(248,248,248,0.50)' }} />
                  </button>
                  {userMenu && (
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-50"
                      style={{ backgroundColor: '#504640', border: '1px solid rgba(248,248,248,0.10)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(248,248,248,0.07)' }}>
                        <div className="text-sm font-semibold truncate" style={{ color: '#f8f8f8' }}>{displayName}</div>
                        <div className="text-xs truncate" style={{ color: '#bd9f87' }}>{user.email}</div>
                      </div>
                      <div className="py-1">
                        {[
                          { to: '/profil',        icon: User,          label: t('nav.my_profile') },
                          { to: '/mes-commandes', icon: Package,       label: t('nav.my_orders') },
                          { to: '/messages',      icon: MessageCircle, label: t('nav.messages') },
                        ].map(({ to, icon: Icon, label }) => (
                          <Link key={to} to={to} onClick={() => setUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm transition-all hover:bg-white/[0.06]"
                            style={{ color: 'rgba(248,248,248,0.80)' }}>
                            <Icon size={15} /> {label}
                          </Link>
                        ))}
                        {isAdmin && (
                          <Link to="/admin" onClick={() => setUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm transition-all"
                            style={{ color: '#c5611a' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(197,97,26,0.12)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <ShieldCheck size={15} /> {t('nav.administration')}
                          </Link>
                        )}
                        <Link to="/restaurants" onClick={() => setUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm transition-all hover:bg-white/[0.06]"
                          style={{ color: 'rgba(248,248,248,0.80)' }}>
                          <Utensils size={15} /> {t('nav.restaurants')}
                        </Link>
                      </div>
                      <div className="py-1" style={{ borderTop: '1px solid rgba(248,248,248,0.07)' }}>
                        <button onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400 text-sm hover:bg-red-500/10 transition-all">
                          <LogOut size={15} /> {t('nav.sign_out')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/connexion"
                  className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-full transition-all hover:bg-white/10"
                  style={{ color: 'rgba(248,248,248,0.85)' }}>
                  {t('nav.sign_in')}
                  <span className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(248,248,248,0.10)' }}>
                    <User size={15} />
                  </span>
                </Link>
                <button onClick={() => setIsCartOpen(true)}
                  className="relative p-2 rounded-full transition-all hover:bg-white/10"
                  style={{ color: 'rgba(248,248,248,0.85)' }} aria-label={t('nav.open_cart')}>
                  <ShoppingBag size={18} />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 text-[0.6rem] font-bold min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#c5611a', color: '#f8f8f8' }}>{itemCount}</span>
                  )}
                </button>
              </>
            )}
            </>
            )}
          </div>

          {/* Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {/* Lang toggle mobile */}
            <button onClick={toggleLang}
              className="text-xs font-bold px-2 py-1 rounded-full"
              style={{ color: 'rgba(248,248,248,0.65)', border: '1px solid rgba(248,248,248,0.12)' }}>
              {isEN ? 'FR' : 'EN'}
            </button>
            <button onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-lg transition-all hover:bg-white/10"
              style={{ color: 'rgba(248,248,248,0.70)' }} aria-label={t('nav.open_cart')}>
              <ShoppingBag size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 text-[0.6rem] font-bold min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#c5611a', color: '#f8f8f8' }}>{itemCount}</span>
              )}
            </button>
            <button className="flex flex-col gap-1.5 p-2"
              onClick={() => setMenuOpen(true)} aria-label={t('nav.open_menu')}>
              {[0, 1, 2].map((i) => (
                <span key={i} className="block w-6 h-0.5 rounded-full" style={{ backgroundColor: '#f8f8f8' }} />
              ))}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-7"
          style={{ backgroundColor: '#1f1f1f' }}
          role="dialog" aria-modal="true" aria-label={t('nav.nav_menu')}>
          <button className="absolute top-6 right-6 flex items-center justify-center"
            style={{ color: '#f8f8f8' }}
            onClick={() => setMenuOpen(false)} aria-label={t('nav.close_menu')}>
            <X size={20} />
          </button>

          {(isRestrictedRole ? [NAV_LINKS[0]] : [NAV_LINKS[0], ...EXPLORER_LINKS, ...NAV_LINKS.slice(1)]).map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
              className="font-serif text-3xl font-semibold transition-colors"
              style={{ color: '#f8f8f8' }}
              onMouseEnter={e => e.currentTarget.style.color = '#c5611a'}
              onMouseLeave={e => e.currentTarget.style.color = '#f8f8f8'}>
              {l.label}
            </Link>
          ))}

          <div className="flex flex-col gap-3 mt-4 w-48">
            {isRestrictedRole && user ? (
              <>
                <Link to={dashboardPath} onClick={() => setMenuOpen(false)} className="btn btn-gold justify-center flex items-center gap-2">
                  <DashboardIcon size={16} /> {t('nav.dashboard')}
                </Link>
                <button onClick={() => { handleSignOut(); setMenuOpen(false) }}
                  className="text-red-400 text-sm font-medium py-2">{t('nav.sign_out')}</button>
              </>
            ) : user ? (
              <>
                <Link to="/profil" onClick={() => setMenuOpen(false)} className="btn btn-gold justify-center">{t('nav.my_profile')}</Link>
                <Link to="/mes-commandes" onClick={() => setMenuOpen(false)}
                  className="text-center text-sm py-2 transition-colors"
                  style={{ color: 'rgba(248,248,248,0.70)' }}>{t('nav.my_orders')}</Link>
                <Link to="/messages" onClick={() => setMenuOpen(false)}
                  className="text-center text-sm py-2 transition-colors flex items-center justify-center gap-2"
                  style={{ color: 'rgba(248,248,248,0.70)' }}>
                  {t('nav.messages')}
                  {unreadMessages > 0 && (
                    <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[0.6rem] font-bold text-white px-1"
                      style={{ backgroundColor: '#25d366' }}>
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  )}
                </Link>
                <button onClick={() => { handleSignOut(); setMenuOpen(false) }}
                  className="text-red-400 text-sm font-medium py-2">{t('nav.sign_out')}</button>
              </>
            ) : (
              <>
                <Link to="/restaurants" onClick={() => setMenuOpen(false)} className="btn btn-gold justify-center">{t('nav.find_food')}</Link>
                <Link to="/connexion" onClick={() => setMenuOpen(false)}
                  className="text-center text-sm py-2 transition-colors"
                  style={{ color: 'rgba(248,248,248,0.70)' }}>{t('nav.sign_in')}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function NotifDropdown({ onClose, navigate }: { onClose: () => void; navigate: ReturnType<typeof useNavigate> }) {
  const { t, i18n } = useTranslation()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  const typeIcons = {
    order:   Package,
    message: MessageCircle,
    review:  Bell,
    system:  Bell,
    info:    Bell,
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden z-50"
      style={{ backgroundColor: '#504640', border: '1px solid rgba(248,248,248,0.10)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(248,248,248,0.07)' }}>
        <span className="text-sm font-semibold" style={{ color: '#f8f8f8' }}>{t('nav.notifications')}</span>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="text-xs hover:underline" style={{ color: '#c5611a' }}>
            {t('nav.mark_all_read')}
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Bell size={24} className="mx-auto mb-2" style={{ color: 'rgba(248,248,248,0.20)' }} />
            <p className="text-sm" style={{ color: 'rgba(248,248,248,0.40)' }}>{t('nav.no_notifications')}</p>
          </div>
        ) : (
          notifications.slice(0, 10).map(n => {
            const Icon = typeIcons[n.type] || Bell
            return (
              <button key={n.id}
                onClick={() => { markAsRead(n.id); if (n.link?.startsWith('/')) navigate(n.link); onClose() }}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-all hover:bg-white/[0.05]"
                style={{ backgroundColor: !n.is_read ? 'rgba(248,248,248,0.03)' : 'transparent' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: !n.is_read ? 'rgba(197,97,26,0.20)' : 'rgba(248,248,248,0.05)' }}>
                  <Icon size={14} style={{ color: !n.is_read ? '#c5611a' : 'rgba(248,248,248,0.40)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug"
                    style={{ color: !n.is_read ? '#f8f8f8' : 'rgba(248,248,248,0.60)', fontWeight: !n.is_read ? 500 : 400 }}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(248,248,248,0.40)' }}>{n.body}</p>
                  )}
                  <p className="text-[0.6rem] mt-1" style={{ color: 'rgba(248,248,248,0.30)' }}>
                    {new Date(n.created_at).toLocaleString(i18n?.language?.startsWith('en') ? 'en-GB' : 'fr-FR', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                {!n.is_read && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ backgroundColor: '#c5611a' }} />
                )}
              </button>
            )
          })
        )}
      </div>
      {notifications.length > 0 && (
        <Link to="/profil" onClick={onClose}
          className="block text-center py-2.5 text-xs transition-all hover:bg-white/[0.03]"
          style={{ color: '#c5611a', borderTop: '1px solid rgba(248,248,248,0.07)' }}>
          {t('nav.view_all_notifications')}
        </Link>
      )}
    </div>
  )
}
