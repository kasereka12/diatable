import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useNotifications } from '../context/NotificationContext'
import {
  Globe, X, ChevronDown, LogOut, User, BarChart2, Utensils,
  ShieldCheck, Image, MapPin, ShoppingBag, MessageCircle, Bell,
  Package
} from 'lucide-react'

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
  const [scrolled,    setScrolled]   = useState(false)
  const [menuOpen,    setMenuOpen]   = useState(false)
  const [userMenu,    setUserMenu]   = useState(false)
  const [explorerOpen, setExplorerOpen] = useState(false)
  const [notifOpen,   setNotifOpen]  = useState(false)
  const explorerRef = useRef(null)
  const notifRef = useRef(null)
  const navigate = useNavigate()

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

  // Close menus on outside click
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
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-dark/95 backdrop-blur-md shadow-[0_2px_24px_rgba(0,0,0,0.3)]'
          : 'bg-dark/75 backdrop-blur-sm'
      }`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between py-5">
          {/* Logo */}
          <Link to="/" className="font-serif text-2xl font-bold text-white tracking-tight flex items-center gap-1.5">
            Dia<span className="text-gold">Table</span>
            <Globe size={20} className="text-gold" />
          </Link>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-1 list-none">
            {NAV_LINKS.slice(0, 1).map((l) => (
              <li key={l.to}>
                <NavLink to={l.to}
                  className={({ isActive }) =>
                    `text-sm font-medium px-3.5 py-2 rounded-lg transition-all duration-200
                     ${isActive ? 'text-white bg-white/10' : 'text-white/80 hover:text-white hover:bg-white/10'}`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}

            {/* Explorer dropdown */}
            <li ref={explorerRef} className="relative">
              <button
                onClick={() => setExplorerOpen(v => !v)}
                className={`flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg transition-all duration-200
                  ${explorerOpen ? 'text-white bg-white/10' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                Explorer
                <ChevronDown size={14} className={`transition-transform duration-200 ${explorerOpen ? 'rotate-180' : ''}`} />
              </button>
              {explorerOpen && (
                <div className="absolute top-full left-0 mt-2 w-52 bg-dark2 border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden z-50">
                  {EXPLORER_LINKS.map(({ label, to, icon: Icon, desc }) => (
                    <NavLink key={to} to={to}
                      onClick={() => setExplorerOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 transition-all
                         ${isActive ? 'bg-white/10 text-white' : 'text-white/80 hover:text-white hover:bg-white/[0.06]'}`
                      }
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/[0.07] flex items-center justify-center flex-shrink-0">
                        <Icon size={15} className="text-gold" />
                      </div>
                      <div>
                        <div className="text-sm font-medium leading-none mb-0.5">{label}</div>
                        <div className="text-xs text-white/40">{desc}</div>
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
                     ${isActive ? 'text-white bg-white/10' : 'text-white/80 hover:text-white hover:bg-white/10'}`
                  }
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
                {/* Cart button */}
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                  aria-label="Ouvrir le panier"
                >
                  <ShoppingBag size={18} />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-gold text-dark text-[0.6rem] font-bold w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </button>

                {/* Messages button */}
                <Link
                  to="/messages"
                  className="relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                  aria-label="Messages"
                >
                  <MessageCircle size={18} />
                </Link>

                {/* Notifications */}
                <div ref={notifRef} className="relative">
                  <button
                    onClick={() => setNotifOpen(v => !v)}
                    className="relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
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
                    className="flex items-center gap-2 bg-white/[0.07] hover:bg-white/10 border border-white/10 rounded-full pl-2 pr-3 py-1.5 transition-all">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-dark text-xs font-black"
                      style={{ background: 'linear-gradient(135deg,#f4a828,#c8841a)' }}>
                      {initials}
                    </div>
                    <span className="text-white text-xs font-medium max-w-[80px] truncate">{displayName}</span>
                    <ChevronDown size={14} className="text-white/50" />
                  </button>
                  {userMenu && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-dark2 border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-white/[0.07]">
                        <div className="text-white text-sm font-semibold truncate">{displayName}</div>
                        <div className="text-muted text-xs truncate">{user.email}</div>
                      </div>
                      <div className="py-1">
                        <Link to="/profil" onClick={() => setUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-white/80 text-sm hover:text-white hover:bg-white/[0.06] transition-all">
                          <User size={15} /> Mon profil
                        </Link>
                        <Link to="/mes-commandes" onClick={() => setUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-white/80 text-sm hover:text-white hover:bg-white/[0.06] transition-all">
                          <Package size={15} /> Mes commandes
                        </Link>
                        <Link to="/messages" onClick={() => setUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-white/80 text-sm hover:text-white hover:bg-white/[0.06] transition-all">
                          <MessageCircle size={15} /> Messages
                        </Link>
                        {profile?.role === 'vendor' && (
                          <Link to="/tableau-de-bord" onClick={() => setUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-white/80 text-sm hover:text-white hover:bg-white/[0.06] transition-all">
                            <BarChart2 size={15} /> Tableau de bord
                          </Link>
                        )}
                        {isAdmin && (
                          <Link to="/admin" onClick={() => setUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-gold text-sm hover:text-white hover:bg-gold/10 transition-all">
                            <ShieldCheck size={15} /> Administration
                          </Link>
                        )}
                        <Link to="/restaurants" onClick={() => setUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-white/80 text-sm hover:text-white hover:bg-white/[0.06] transition-all">
                          <Utensils size={15} /> Restaurants
                        </Link>
                      </div>
                      <div className="border-t border-white/[0.07] py-1">
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
                {/* Cart button for non-logged users too */}
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                  aria-label="Ouvrir le panier"
                >
                  <ShoppingBag size={18} />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-gold text-dark text-[0.6rem] font-bold min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </button>
                <Link to="/connexion"
                  className="text-white/80 text-sm font-medium px-4 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-all">
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
            {/* Mobile cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-lg text-white/70 hover:text-white transition-all"
              aria-label="Ouvrir le panier"
            >
              <ShoppingBag size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-gold text-dark text-[0.6rem] font-bold min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
            <button className="flex flex-col gap-1.5 p-2"
              onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu">
              {[0, 1, 2].map((i) => (
                <span key={i} className="block w-6 h-0.5 bg-white rounded-full" />
              ))}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[999] bg-dark flex flex-col items-center justify-center gap-7" role="dialog" aria-modal="true" aria-label="Menu de navigation">
          <button className="absolute top-6 right-6 text-white flex items-center justify-center"
            onClick={() => setMenuOpen(false)} aria-label="Fermer le menu">
            <X size={20} />
          </button>

          {[...NAV_LINKS.slice(0,1), ...EXPLORER_LINKS, ...NAV_LINKS.slice(1)].map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
              className="font-serif text-3xl text-white font-semibold hover:text-gold transition-colors">
              {l.label}
            </Link>
          ))}

          <div className="flex flex-col gap-3 mt-4 w-48">
            {user ? (
              <>
                <Link to="/profil" onClick={() => setMenuOpen(false)} className="btn btn-gold justify-center">Mon profil</Link>
                <Link to="/mes-commandes" onClick={() => setMenuOpen(false)} className="text-center text-white/70 text-sm py-2 hover:text-white transition-colors">Mes commandes</Link>
                <Link to="/messages" onClick={() => setMenuOpen(false)} className="text-center text-white/70 text-sm py-2 hover:text-white transition-colors">Messages</Link>
                <button onClick={() => { handleSignOut(); setMenuOpen(false) }}
                  className="text-red-400 text-sm font-medium py-2">Se déconnecter</button>
              </>
            ) : (
              <>
                <Link to="/restaurants" onClick={() => setMenuOpen(false)} className="btn btn-gold justify-center">Trouver à Manger</Link>
                <Link to="/connexion" onClick={() => setMenuOpen(false)}
                  className="text-center text-white/70 text-sm py-2 hover:text-white transition-colors">Connexion</Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// Notification dropdown component
function NotifDropdown({ onClose, navigate }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  const typeIcons = {
    order: Package,
    message: MessageCircle,
    review: Bell,
    system: Bell,
    info: Bell,
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-dark2 border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden z-50">
      <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between">
        <span className="text-white text-sm font-semibold">Notifications</span>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-gold text-xs hover:underline"
          >
            Tout marquer lu
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Bell size={24} className="text-white/20 mx-auto mb-2" />
            <p className="text-white/40 text-sm">Aucune notification</p>
          </div>
        ) : (
          notifications.slice(0, 10).map(n => {
            const Icon = typeIcons[n.type] || Bell
            return (
              <button
                key={n.id}
                onClick={() => { markAsRead(n.id); if (n.link && n.link.startsWith('/')) navigate(n.link); onClose() }}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all hover:bg-white/[0.05] ${
                  !n.is_read ? 'bg-white/[0.03]' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  !n.is_read ? 'bg-gold/20' : 'bg-white/[0.05]'
                }`}>
                  <Icon size={14} className={!n.is_read ? 'text-gold' : 'text-white/40'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.is_read ? 'text-white font-medium' : 'text-white/60'}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-xs text-white/40 mt-0.5 truncate">{n.body}</p>
                  )}
                  <p className="text-[0.6rem] text-white/30 mt-1">
                    {new Date(n.created_at).toLocaleString('fr-FR', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                {!n.is_read && (
                  <span className="w-2 h-2 rounded-full bg-gold flex-shrink-0 mt-2" />
                )}
              </button>
            )
          })
        )}
      </div>
      {notifications.length > 0 && (
        <Link
          to="/profil"
          onClick={onClose}
          className="block text-center py-2.5 text-xs text-gold hover:bg-white/[0.03] border-t border-white/[0.07] transition-all"
        >
          Voir toutes les notifications
        </Link>
      )}
    </div>
  )
}
