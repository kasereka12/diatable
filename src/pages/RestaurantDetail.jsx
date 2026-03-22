import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { useRestaurants } from '../hooks/useRestaurants'
import { MENUS, DEFAULT_MENU, REVIEWS } from '../data/menuItems'
import StarRating from '../components/ui/StarRating'
import { getCuisineIcon } from '../lib/cuisineIcons'
import {
  ArrowLeft, MapPin, Clock, Phone, CreditCard,
  MessageCircle, ShieldCheck, Star, Facebook, Instagram, Utensils
} from 'lucide-react'

const GRAD_STYLES = {
  'grad-senegal':   'linear-gradient(135deg,#e8521a,#c8841a 50%,#f4a828)',
  'grad-chinese':   'linear-gradient(135deg,#b71c1c,#e53935)',
  'grad-lebanese':  'linear-gradient(135deg,#1b5e20,#43a047)',
  'grad-syrian':    'linear-gradient(135deg,#4a148c,#7b1fa2)',
  'grad-french':    'linear-gradient(135deg,#0d47a1,#1565c0)',
  'grad-italian':   'linear-gradient(135deg,#c62828,#1b5e20)',
  'grad-nigerian':  'linear-gradient(135deg,#1b5e20,#f9a825)',
  'grad-indian':    'linear-gradient(135deg,#e65100,#fbc02d)',
  'grad-brazilian': 'linear-gradient(135deg,#1b5e20,#0d47a1)',
}

function MenuItem({ item }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-black/[0.06] last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-dark text-sm">{item.name}</span>
          {item.popular && (
            <span className="bg-gold/15 text-gold-dark text-[0.65rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Populaire
            </span>
          )}
        </div>
        {item.desc && <p className="text-muted text-xs leading-relaxed">{item.desc}</p>}
      </div>
      <span className="font-bold text-dark text-sm flex-shrink-0">{item.price} MAD</span>
    </div>
  )
}

function ReviewCard({ review }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-black/[0.05]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-dark text-xs font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#f4a828,#c8841a)' }}>
          {review.initials}
        </div>
        <div>
          <div className="font-semibold text-dark text-sm">{review.name}</div>
          <div className="flex items-center gap-1.5">
            <StarRating rating={review.rating} />
            <span className="text-muted text-xs">{review.date}</span>
          </div>
        </div>
      </div>
      <p className="text-dark/70 text-sm leading-relaxed">{review.text}</p>
    </div>
  )
}

export default function RestaurantDetail() {
  const { id }  = useParams()
  const { restaurants } = useRestaurants()
  const ref     = useScrollReveal()
  const [activeCategory, setActiveCategory] = useState(0)

  const restaurant = restaurants.find(r => String(r.id) === id) || restaurants[0]
  const menu = MENUS[parseInt(id)] || DEFAULT_MENU

  if (!restaurant) return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Utensils size={56} className="text-gold" />
        </div>
        <p className="text-white font-serif text-xl">Restaurant introuvable</p>
        <Link to="/restaurants" className="text-gold mt-4 inline-flex items-center gap-1">
          <ArrowLeft size={16} /> Retour aux restaurants
        </Link>
      </div>
    </div>
  )

  const CuisineIcon = getCuisineIcon(restaurant.cuisine)

  return (
    <div className="bg-cream min-h-screen" ref={ref}>
      {/* Hero banner */}
      <div className="relative h-72 md:h-96 overflow-hidden"
        style={{ background: GRAD_STYLES[restaurant.gradient] }}>
        <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <CuisineIcon size={96} className="text-white/90 drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]" />
        </div>
        {/* Breadcrumb */}
        <div className="absolute top-28 left-0 right-0 px-6">
          <div className="max-w-5xl mx-auto">
            <Link to="/restaurants" className="text-white/70 text-sm hover:text-white transition-colors flex items-center gap-1 w-fit">
              <ArrowLeft size={16} /> Tous les restaurants
            </Link>
          </div>
        </div>
        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <div className="text-gold text-xs font-bold tracking-widest uppercase mb-1">
                  {restaurant.flag} {restaurant.cuisine_label}
                </div>
                <h1 className="font-serif text-2xl md:text-3xl font-black text-white leading-tight">
                  {restaurant.name}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-white/80 text-sm flex items-center gap-1">
                    <MapPin size={14} /> {restaurant.location}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm">
                    <StarRating rating={restaurant.rating} />
                    <span className="text-white font-semibold">{restaurant.rating}</span>
                    <span className="text-white/60">({restaurant.reviews} avis)</span>
                  </span>
                  {restaurant.is_verified && (
                    <span className="bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <ShieldCheck size={12} /> Vérifié
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <a href="https://wa.me/212600000000" target="_blank" rel="noreferrer"
                  className="btn bg-green-500 hover:bg-green-400 text-white text-sm px-5 py-2.5 flex items-center gap-2">
                  <MessageCircle size={16} /> WhatsApp
                </a>
                <a href="tel:+212600000000"
                  className="btn bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 text-sm px-5 py-2.5 flex items-center gap-2">
                  <Phone size={16} /> Appeler
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Menu */}
          <div className="lg:col-span-2">
            <h2 className="font-serif text-2xl font-bold text-dark mb-6" data-reveal>Notre Carte</h2>

            {/* Category tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1" data-reveal>
              {menu.categories.map((cat, i) => (
                <button key={i} onClick={() => setActiveCategory(i)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap
                    border-2 transition-all duration-200 flex-shrink-0
                    ${activeCategory === i
                      ? 'bg-gold text-dark border-gold shadow-[0_4px_12px_rgba(244,168,40,0.3)]'
                      : 'bg-white text-dark3 border-transparent shadow-sm hover:border-gold/50'}`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/[0.05]" data-reveal>
              {menu.categories[activeCategory].items.map(item => (
                <MenuItem key={item.id} item={item} />
              ))}
            </div>

            {/* Reviews */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-6" data-reveal>
                <h2 className="font-serif text-2xl font-bold text-dark">Avis clients</h2>
                <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-sm border border-black/[0.05]">
                  <Star size={18} className="text-gold fill-gold" />
                  <span className="font-bold text-dark">{restaurant.rating}</span>
                  <span className="text-muted text-sm">/ 5</span>
                </div>
              </div>
              <div className="space-y-4">
                {REVIEWS.map((r, i) => (
                  <div key={r.id} data-reveal data-delay={`${i * 0.1}s`}>
                    <ReviewCard review={r} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Info card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/[0.05] sticky top-24" data-reveal>
              <h3 className="font-serif font-bold text-dark text-base mb-4">Informations</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-dark">Adresse</div>
                    <div className="text-muted">123 Rue Mohammed V, {restaurant.location}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-dark">Horaires</div>
                    <div className="text-muted">Lun–Sam : 11h30 – 22h00</div>
                    <div className="text-muted">Dim : 12h00 – 21h00</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={16} className="text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-dark">Téléphone</div>
                    <div className="text-muted">+212 6 00 00 00 00</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard size={16} className="text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-dark">Paiement</div>
                    <div className="text-muted">Espèces, carte bancaire</div>
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-black/[0.06] space-y-2.5">
                <a href="https://wa.me/212600000000" target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold text-sm transition-all">
                  <MessageCircle size={16} /> Commander via WhatsApp
                </a>
                <a href="tel:+212600000000"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-dark hover:bg-dark2 text-white font-semibold text-sm transition-all">
                  <Phone size={16} /> Réserver une table
                </a>
              </div>
            </div>

            {/* Share */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/[0.05]" data-reveal>
              <h3 className="font-serif font-bold text-dark text-sm mb-3">Partager</h3>
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-lg bg-cream text-xs font-medium text-dark hover:bg-gold/10 transition-all flex items-center justify-center gap-1">
                  <Facebook size={14} /> Facebook
                </button>
                <button className="flex-1 py-2 rounded-lg bg-cream text-xs font-medium text-dark hover:bg-gold/10 transition-all flex items-center justify-center gap-1">
                  <Instagram size={14} /> Instagram
                </button>
                <button className="flex-1 py-2 rounded-lg bg-cream text-xs font-medium text-dark hover:bg-gold/10 transition-all flex items-center justify-center gap-1">
                  <MessageCircle size={14} /> WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
