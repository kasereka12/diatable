import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useNotifications } from '../context/NotificationContext'
import { useMessages } from '../context/MessageContext'
import {
  Globe, X, ChevronDown, LogOut, User, BarChart2, Utensils,
  ShieldCheck, Image, MapPin, ShoppingBag, MessageCircle, Bell,
  Package
} from 'lucide-react'
import Logo from '../assets/Logo.png';

const NAV_LINKS = [
  { label: 'Accueil',  to: '/' },
  { label: 'À propos', to: '/a-propos' },
  { label: 'Contact',  to: '/contact' },
]

const EXPLORER_LINKS = [
  { label: 'Restaurants', to: '/restaurants',  icon: Utensils,  desc: 'Tous les restaurants' },
  { label: 'Cuisines',    to: '/cuisines',      icon: MapPin,    desc: 'Par type de cuisine' },
  { label: 'Galerie',     to: '/galerie',       icon: Image,     desc: 'Plats & photos' },
]

export default function Navbar() {
  const { user, profile, signOut, isAdmin } = useAuth()
  const { itemCount, setIsCartOpen } = useCart()
  const { unreadCount } = useNotifications()
  const { unreadMessages } = useMessages()
  const [scrolled,      setScrolled]     = useState(false)
  const [menuOpen,      setMenuOpen]     = useState(false)
  const [userMenu,      setUserMenu]     = useState(false)
  const [explorerOpen,  setExplorerOpen] = useState(false)
  const [notifOpen,     setNotifOpen]    = useState(false)
  const explorerRef = useRef(null)
  const notifRef    = useRef(null)
  const navigate    = useNavigate()

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  const initials    = displayName ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : '?'

  useEffect(() => {
    let ticking = false
    const handler = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 60)
          ticking = false
        })
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
    const close = (e) => {
      if (explorerRef.current && !explorerRef.current.contains(e.target)) setExplorerOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
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

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300`} style={{
        backgroundColor: scrolled ? 'rgba(31,31,31,0.97)' : 'rgba(31,31,31,0.80)',
        backdropFilter: 'blur(12px)',
        boxShadow: scrolled ? '0 2px 24px rgba(0,0,0,0.35)' : 'none',
      }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between py-5">

          {/* Logo */}
          <Link to="/" className="flex items-center" aria-label="DiaTable - Accueil">
          <img
            src={Logo}
            alt="DiaTable"
            className="h-11 w-auto object-contain"
          />
        </Link>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-1 list-none">
            {NAV_LINKS.slice(0, 1).map((l) => (
              <li key={l.to}>
                <NavLink to={l.to}
                  className={({ isActive }) =>
                    `text-sm font-medium px-3.5 py-2 rounded-lg transition-all duration-200
                     ${isActive ? 'bg-white/10' : 'hover:bg-white/10'}`
                  }
                  style={({ isActive }) => ({ color: isActive ? '#f8f8f8' : 'rgba(248,248,248,0.75)' })}
                >
                  {l.label}
                </NavLink>
              </li>
            ))}

            {/* Explorer dropdown */}
            <li ref={explorerRef} className="relative">
              <button
                onClick={() => setExplorerOpen(v => !v)}
                className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg transition-all duration-200 hover:bg-white/10"
                style={{ color: explorerOpen ? '#f8f8f8' : 'rgba(248,248,248,0.75)' }}
              >
                Explorer
                <ChevronDown size={14} className={`transition-transform duration-200 ${explorerOpen ? 'rotate-180' : ''}`} />
              </button>
              {explorerOpen && (
                <div className="absolute top-full left-0 mt-2 w-52 rounded-2xl overflow-hidden z-50"
                  style={{ backgroundColor: '#504640', border: '1px solid rgba(248,248,248,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                  {EXPLORER_LINKS.map(({ label, to, icon: Icon, desc }) => (
                    <NavLink key={to} to={to}
                      onClick={() => setExplorerOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-all hover:bg-white/[0.08]"
                      style={({ isActive }) => ({ color: isActive ? '#f8f8f8' : 'rgba(248,248,248,0.80)' })}
                    >
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

            {NAV_LINKS.slice(1).map((l) => (
              <li key={l.to}>
                <NavLink to={l.to}
                  className={({ isActive }) =>
                    `text-sm font-medium px-3.5 py-2 rounded-lg transition-all duration-200
                     ${isActive ? 'bg-white/10' : 'hover:bg-white/10'}`
                  }
                  style={({ isActive }) => ({ color: isActive ? '#f8f8f8' : 'rgba(248,248,248,0.75)' })}
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {/* Cart */}
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-2 rounded-lg transition-all hover:bg-white/10"
                  style={{ color: 'rgba(248,248,248,0.70)' }}
                  aria-label="Ouvrir le panier"
                >
                  <ShoppingBag size={18} />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 text-[0.6rem] font-bold min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#c5611a', color: '#f8f8f8' }}>
                      {itemCount}
                    </span>
                  )}
                </button>

                {/* Messages */}
                <Link to="/messages"
                  className="relative p-2 rounded-lg transition-all hover:bg-white/10"
                  style={{ color: 'rgba(248,248,248,0.70)' }}
                  aria-label="Messages"
                >
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
                  <button
                    onClick={() => setNotifOpen(v => !v)}
                    className="relative p-2 rounded-lg transition-all hover:bg-white/10"
                    style={{ color: 'rgba(248,248,248,0.70)' }}
                    aria-label="Notifications" aria-expanded={notifOpen}
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[0.6rem] font-bold min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <NotifDropdown onClose={() => setNotifOpen(false)} navigate={navigate} />
                  )}
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
                          { to: '/profil',           icon: User,         label: 'Mon profil' },
                          { to: '/mes-commandes',    icon: Package,      label: 'Mes commandes' },
                          { to: '/messages',         icon: MessageCircle, label: 'Messages' },
                        ].map(({ to, icon: Icon, label }) => (
                          <Link key={to} to={to} onClick={() => setUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm transition-all hover:bg-white/[0.06]"
                            style={{ color: 'rgba(248,248,248,0.80)' }}>
                            <Icon size={15} /> {label}
                          </Link>
                        ))}
                        {profile?.role === 'vendor' && (
                          <Link to="/tableau-de-bord" onClick={() => setUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm transition-all hover:bg-white/[0.06]"
                            style={{ color: 'rgba(248,248,248,0.80)' }}>
                            <BarChart2 size={15} /> Tableau de bord
                          </Link>
                        )}
                        {isAdmin && (
                          <Link to="/admin" onClick={() => setUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm transition-all"
                            style={{ color: '#c5611a' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(197,97,26,0.12)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <ShieldCheck size={15} /> Administration
                          </Link>
                        )}
                        <Link to="/restaurants" onClick={() => setUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm transition-all hover:bg-white/[0.06]"
                          style={{ color: 'rgba(248,248,248,0.80)' }}>
                          <Utensils size={15} /> Restaurants
                        </Link>
                      </div>
                      <div className="py-1" style={{ borderTop: '1px solid rgba(248,248,248,0.07)' }}>
                        <button onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400 text-sm hover:bg-red-500/10 transition-all">
                          <LogOut size={15} /> Se déconnecter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-2 rounded-lg transition-all hover:bg-white/10"
                  style={{ color: 'rgba(248,248,248,0.70)' }}
                  aria-label="Ouvrir le panier"
                >
                  <ShoppingBag size={18} />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 text-[0.6rem] font-bold min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#c5611a', color: '#f8f8f8' }}>
                      {itemCount}
                    </span>
                  )}
                </button>
                <Link to="/connexion"
                  className="text-sm font-medium px-4 py-2 rounded-lg transition-all hover:bg-white/10"
                  style={{ color: 'rgba(248,248,248,0.80)' }}>
                  Connexion
                </Link>
                <Link to="/restaurants" className="btn btn-gold text-sm px-5 py-2.5">
                  Trouver à Manger
                </Link>
              </>
            )}
          </div>

          {/* Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-lg transition-all hover:bg-white/10"
              style={{ color: 'rgba(248,248,248,0.70)' }}
              aria-label="Ouvrir le panier"
            >
              <ShoppingBag size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 text-[0.6rem] font-bold min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#c5611a', color: '#f8f8f8' }}>
                  {itemCount}
                </span>
              )}
            </button>
            <button className="flex flex-col gap-1.5 p-2"
              onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu">
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
          role="dialog" aria-modal="true" aria-label="Menu de navigation">
          <button className="absolute top-6 right-6 flex items-center justify-center"
            style={{ color: '#f8f8f8' }}
            onClick={() => setMenuOpen(false)} aria-label="Fermer le menu">
            <X size={20} />
          </button>

          {[...NAV_LINKS.slice(0,1), ...EXPLORER_LINKS, ...NAV_LINKS.slice(1)].map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
              className="font-serif text-3xl font-semibold transition-colors"
              style={{ color: '#f8f8f8' }}
              onMouseEnter={e => e.currentTarget.style.color = '#c5611a'}
              onMouseLeave={e => e.currentTarget.style.color = '#f8f8f8'}>
              {l.label}
            </Link>
          ))}

          <div className="flex flex-col gap-3 mt-4 w-48">
            {user ? (
              <>
                <Link to="/profil" onClick={() => setMenuOpen(false)} className="btn btn-gold justify-center">Mon profil</Link>
                <Link to="/mes-commandes" onClick={() => setMenuOpen(false)}
                  className="text-center text-sm py-2 transition-colors"
                  style={{ color: 'rgba(248,248,248,0.70)' }}>Mes commandes</Link>
                <Link to="/messages" onClick={() => setMenuOpen(false)}
                  className="text-center text-sm py-2 transition-colors flex items-center justify-center gap-2"
                  style={{ color: 'rgba(248,248,248,0.70)' }}>
                  Messages
                  {unreadMessages > 0 && (
                    <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[0.6rem] font-bold text-white px-1"
                      style={{ backgroundColor: '#25d366' }}>
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  )}
                </Link>
                <button onClick={() => { handleSignOut(); setMenuOpen(false) }}
                  className="text-red-400 text-sm font-medium py-2">Se déconnecter</button>
              </>
            ) : (
              <>
                <Link to="/restaurants" onClick={() => setMenuOpen(false)} className="btn btn-gold justify-center">Trouver à Manger</Link>
                <Link to="/connexion" onClick={() => setMenuOpen(false)}
                  className="text-center text-sm py-2 transition-colors"
                  style={{ color: 'rgba(248,248,248,0.70)' }}>Connexion</Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// Notification dropdown
function NotifDropdown({ onClose, navigate }) {
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
        <span className="text-sm font-semibold" style={{ color: '#f8f8f8' }}>Notifications</span>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="text-xs hover:underline" style={{ color: '#c5611a' }}>
            Tout marquer lu
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Bell size={24} className="mx-auto mb-2" style={{ color: 'rgba(248,248,248,0.20)' }} />
            <p className="text-sm" style={{ color: 'rgba(248,248,248,0.40)' }}>Aucune notification</p>
          </div>
        ) : (
          notifications.slice(0, 10).map(n => {
            const Icon = typeIcons[n.type] || Bell
            return (
              <button
                key={n.id}
                onClick={() => { markAsRead(n.id); if (n.link?.startsWith('/')) navigate(n.link); onClose() }}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-all hover:bg-white/[0.05]"
                style={{ backgroundColor: !n.is_read ? 'rgba(248,248,248,0.03)' : 'transparent' }}
              >
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
                    {new Date(n.created_at).toLocaleString('fr-FR', {
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
          Voir toutes les notifications
        </Link>
      )}
    </div>
  )
}