import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Globe, X, ChevronDown, LogOut, User, BarChart2, Utensils } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Accueil',      to: '/' },
  { label: 'Restaurants',  to: '/restaurants' },
  { label: 'Cuisines',     to: '/cuisines' },
  { label: 'Galerie',      to: '/galerie' },
  { label: 'À propos',     to: '/a-propos' },
  { label: 'Contact',      to: '/contact' },
]

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const [scrolled,   setScrolled]  = useState(false)
  const [menuOpen,   setMenuOpen]  = useState(false)
  const [userMenu,   setUserMenu]  = useState(false)
  const navigate = useNavigate()

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  const initials    = displayName ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : '?'

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenu) return
    const close = () => setUserMenu(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [userMenu])

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
            {NAV_LINKS.map((l) => (
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
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative" onMouseDown={e => e.stopPropagation()}>
                <button onClick={() => setUserMenu(v => !v)}
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
                      {profile?.role === 'vendor' && (
                        <Link to="/tableau-de-bord" onClick={() => setUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-white/80 text-sm hover:text-white hover:bg-white/[0.06] transition-all">
                          <BarChart2 size={15} /> Tableau de bord
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
            ) : (
              <>
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
          <button className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu">
            {[0, 1, 2].map((i) => (
              <span key={i} className="block w-6 h-0.5 bg-white rounded-full" />
            ))}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[999] bg-dark flex flex-col items-center justify-center gap-7">
          <button className="absolute top-6 right-6 text-white flex items-center justify-center"
            onClick={() => setMenuOpen(false)} aria-label="Fermer le menu">
            <X size={20} />
          </button>

          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
              className="font-serif text-3xl text-white font-semibold hover:text-gold transition-colors">
              {l.label}
            </Link>
          ))}

          <div className="flex flex-col gap-3 mt-4 w-48">
            {user ? (
              <>
                <Link to="/profil" onClick={() => setMenuOpen(false)} className="btn btn-gold justify-center">Mon profil</Link>
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
