import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { useRestaurantDetail } from '../hooks/useRestaurantDetail'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'
import { getGradient } from '../lib/gradients'
import StarRating from '../components/ui/StarRating'
import { getCuisineIcon } from '../lib/cuisineIcons'
import {
  ArrowLeft, MapPin, Clock, CreditCard,
  MessageCircle, ShieldCheck, Star, Facebook, Instagram, Utensils,
  Heart, Send, Pencil, Trash2, Plus, Check, ZoomIn
} from 'lucide-react'

function MenuItem({ item, onAddToCart }) {
  const [added, setAdded] = useState(false)

  function handleAdd() {
    onAddToCart(item)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="flex items-start gap-3 py-4 last:border-0" style={{ borderBottom: '1px solid rgba(80,70,64,0.07)' }}>
      {item.image_url && (
        <button
          onClick={() => onImageClick(item.image_url, item.name)}
          className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 group"
          title="Agrandir"
        >
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
            <ZoomIn size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="font-semibold text-sm" style={{ color: '#1f1f1f' }}>{item.name}</span>
          {item.is_popular && (
            <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={{ backgroundColor: 'rgba(197,97,26,0.12)', color: '#a04d12' }}>
              Populaire
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-xs leading-relaxed" style={{ color: '#80716a' }}>{item.description}</p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="font-bold text-sm" style={{ color: '#1f1f1f' }}>{item.price} MAD</span>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
          style={added ? {
            backgroundColor: '#22c55e',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(34,197,94,0.3)',
          } : {
            backgroundColor: '#c5611a',
            color: '#f8f8f8',
            boxShadow: '0 2px 8px rgba(197,97,26,0.3)',
          }}
          onMouseEnter={e => { if (!added) e.currentTarget.style.backgroundColor = '#d9722a' }}
          onMouseLeave={e => { if (!added) e.currentTarget.style.backgroundColor = '#c5611a' }}
          aria-label={`Ajouter ${item.name} au panier`}
        >
          {added ? <><Check size={14} /> Ajouté</> : <><Plus size={14} /> Ajouter</>}
        </button>
      </div>
    </div>
  )
}

function ReviewCard({ review }) {
  return (
    <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#f8f8f8', border: '1px solid rgba(80,70,64,0.07)' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#c5611a,#a04d12)', color: '#f8f8f8' }}>
          {review.initials}
        </div>
        <div>
          <div className="font-semibold text-sm" style={{ color: '#1f1f1f' }}>{review.name}</div>
          <div className="flex items-center gap-1.5">
            <StarRating rating={review.rating} />
            <span className="text-xs" style={{ color: '#80716a' }}>{review.date}</span>
          </div>
        </div>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: 'rgba(31,31,31,0.70)' }}>{review.text}</p>
    </div>
  )
}

function StarSelector({ value, hover, onRate, onHover, onLeave }) {
  return (
    <div className="flex gap-1" onMouseLeave={onLeave}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onRate(n)}
          onMouseEnter={() => onHover(n)}
          className="transition-transform hover:scale-110"
          aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
        >
          <Star
            size={28}
            className={n <= (hover || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
          />
        </button>
      ))}
    </div>
  )
}

export default function RestaurantDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const { restaurant, menuByCategory, reviews, loading } = useRestaurantDetail(id)
  const ref = useScrollReveal()
  const [activeCategory, setActiveCategory] = useState(0)
  const [lightbox, setLightbox] = useState(null)

  const [likesCount, setLikesCount] = useState(0)
  const [userLiked, setUserLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)

  const [userReview, setUserReview] = useState(null)
  const [reviewForm, setReviewForm] = useState({ rating: 0, text: '' })
  const [reviewHover, setReviewHover] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState('')
  const [editingReview, setEditingReview] = useState(false)

  const categories = Object.keys(menuByCategory)
  const currentItems = menuByCategory[categories[activeCategory]] || []

  useEffect(() => {
    if (!id || !supabase) return
    if (user) {
      supabase
        .from('reviews')
        .select('*')
        .eq('restaurant_id', id)
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setUserReview(data)
            setReviewForm({ rating: data.rating, text: data.text || '' })
          }
        })
    }
  }, [id, user])

  function handleAddToCart(item) {
    addItem(restaurant.id, restaurant.name, {
      menuItemId: item.id,
      name: item.name,
      price: Number(item.price),
    })
  }

  async function startConversation() {
    if (!user || !supabase || !restaurant) return
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('customer_id', user.id)
      .eq('restaurant_id', restaurant.id)
      .maybeSingle()
    if (existing) { navigate('/messages'); return }
    await supabase.from('conversations').insert({
      customer_id: user.id,
      vendor_id: restaurant.owner_id,
      restaurant_id: restaurant.id,
    })
    navigate('/messages')
  }

  async function toggleLike() {
    if (!user || !supabase) return
    setLikeLoading(true)
    if (userLiked) {
      await supabase.from('restaurant_likes').delete().eq('restaurant_id', id).eq('user_id', user.id)
      setUserLiked(false)
      setLikesCount(c => Math.max(0, c - 1))
    } else {
      await supabase.from('restaurant_likes').insert({ restaurant_id: id, user_id: user.id })
      setUserLiked(true)
      setLikesCount(c => c + 1)
    }
    setLikeLoading(false)
  }

  async function submitReview() {
    if (!user || !supabase || reviewForm.rating === 0) return
    setSubmitting(true)
    setSubmitMsg('')
    if (editingReview && userReview) {
      const { error } = await supabase.from('reviews').update({
        rating: reviewForm.rating,
        text: reviewForm.text,
      }).eq('id', userReview.id)
      if (!error) {
        setUserReview(prev => ({ ...prev, rating: reviewForm.rating, text: reviewForm.text }))
        setEditingReview(false)
        setSubmitMsg('Votre avis a été mis à jour.')
      }
    } else {
      const { data, error } = await supabase.from('reviews').insert({
        restaurant_id: id,
        user_id: user.id,
        rating: reviewForm.rating,
        text: reviewForm.text,
      }).select().single()
      if (!error && data) {
        setUserReview(data)
        setSubmitMsg('Merci ! Votre avis a été publié.')
      } else if (error) {
        setSubmitMsg('Erreur : ' + error.message)
      }
    }
    setSubmitting(false)
  }

  async function deleteReview() {
    if (!userReview || !supabase) return
    await supabase.from('reviews').delete().eq('id', userReview.id)
    setUserReview(null)
    setReviewForm({ rating: 0, text: '' })
    setEditingReview(false)
    setSubmitMsg('')
  }

  const isOwner = user && restaurant && restaurant.owner_id === user.id
  const canReview = user && !isOwner

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1f1f1f' }}>
        <div className="w-12 h-12 rounded-full animate-spin"
          style={{ border: '4px solid rgba(197,97,26,0.25)', borderTopColor: '#c5611a' }} />
      </div>
    )
  }

  if (!restaurant) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1f1f1f' }}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Utensils size={56} style={{ color: '#c5611a' }} />
        </div>
        <p className="font-serif text-xl" style={{ color: '#f8f8f8' }}>Restaurant introuvable</p>
        <Link to="/restaurants" className="mt-4 inline-flex items-center gap-1" style={{ color: '#c5611a' }}>
          <ArrowLeft size={16} /> Retour aux restaurants
        </Link>
      </div>
    </div>
  )

  const CuisineIcon = getCuisineIcon(restaurant.cuisine)
  const address = restaurant.address || 'Casablanca, Maroc'
  const hours = restaurant.hours || 'Lun–Sam : 11h30 – 22h00'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#eae5d9' }} ref={ref}>
      {/* Hero banner */}
      <div className="relative h-72 md:h-96 overflow-hidden"
        style={!restaurant.image_url ? { background: getGradient(restaurant.gradient) } : {}}>
        {restaurant.image_url ? (
          <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <CuisineIcon size={96} className="text-white/90 drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]" />
          </div>
        )}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(31,31,31,0.85) 0%, rgba(31,31,31,0.18) 50%, transparent 100%)' }} />

        {/* Breadcrumb */}
        <div className="absolute top-28 left-0 right-0 px-6">
          <div className="max-w-5xl mx-auto">
            <Link to="/restaurants"
              className="text-sm flex items-center gap-1 w-fit transition-colors"
              style={{ color: 'rgba(248,248,248,0.70)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f8f8f8'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(248,248,248,0.70)'}>
              <ArrowLeft size={16} /> Tous les restaurants
            </Link>
          </div>
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#c5611a' }}>
                  {restaurant.flag} {restaurant.cuisine_label}
                </div>
                <h1 className="font-serif text-2xl md:text-3xl font-black leading-tight" style={{ color: '#f8f8f8' }}>
                  {restaurant.name}
                </h1>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <span className="text-sm flex items-center gap-1" style={{ color: 'rgba(248,248,248,0.80)' }}>
                    <MapPin size={14} /> {restaurant.location}
                  </span>
                  {restaurant.reviews > 0 ? (
                    <span className="flex items-center gap-1.5 text-sm">
                      <StarRating rating={restaurant.rating} />
                      <span className="font-semibold" style={{ color: '#f8f8f8' }}>{restaurant.rating}</span>
                      <span style={{ color: 'rgba(248,248,248,0.60)' }}>({restaurant.reviews} avis)</span>
                    </span>
                  ) : (
                    <span className="text-sm italic" style={{ color: 'rgba(248,248,248,0.50)' }}>Aucun avis pour l'instant</span>
                  )}
                  {restaurant.is_verified && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                      style={{ backgroundColor: 'rgba(34,197,94,0.20)', border: '1px solid rgba(34,197,94,0.40)', color: '#4ade80' }}>
                      <ShieldCheck size={12} /> Vérifié
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2.5 flex-wrap">
                <button
                  onClick={toggleLike}
                  disabled={likeLoading}
                  title={user ? (userLiked ? 'Ne plus aimer' : "J'aime") : 'Connectez-vous pour aimer'}
                  className="btn text-sm px-4 py-2.5 flex items-center gap-2 transition-all"
                  style={userLiked ? {
                    backgroundColor: 'rgba(236,72,153,0.20)',
                    border: '1px solid rgba(236,72,153,0.40)',
                    color: '#f472b6',
                  } : {
                    backgroundColor: 'rgba(248,248,248,0.10)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(248,248,248,0.20)',
                    color: '#f8f8f8',
                  }}
                  aria-label={userLiked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  <Heart size={16} className={userLiked ? 'fill-pink-400' : ''} />
                  {likesCount > 0 && <span>{likesCount}</span>}
                </button>
                <button
                  onClick={user ? startConversation : () => navigate('/connexion')}
                  className="btn text-sm px-5 py-2.5 flex items-center gap-2 transition-all"
                  style={{
                    backgroundColor: 'rgba(248,248,248,0.10)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(248,248,248,0.20)',
                    color: '#f8f8f8',
                  }}
                  aria-label="Contacter le vendeur"
                >
                  <MessageCircle size={16} /> Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Menu + Reviews */}
          <div className="lg:col-span-2">
            <h2 className="font-serif text-2xl font-bold mb-6" style={{ color: '#1f1f1f' }} data-reveal>Notre Carte</h2>

            {categories.length > 0 && (
              <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1" data-reveal>
                {categories.map((cat, i) => (
                  <button key={cat} onClick={() => setActiveCategory(i)}
                    className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border-2 transition-all duration-200 flex-shrink-0"
                    style={activeCategory === i ? {
                      backgroundColor: '#c5611a',
                      color: '#f8f8f8',
                      borderColor: '#c5611a',
                      boxShadow: '0 4px 12px rgba(197,97,26,0.30)',
                    } : {
                      backgroundColor: '#f8f8f8',
                      color: '#1f1f1f',
                      borderColor: 'transparent',
                      boxShadow: '0 1px 4px rgba(80,70,64,0.08)',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#f8f8f8', border: '1px solid rgba(80,70,64,0.06)' }} data-reveal>
              {currentItems.length > 0 ? (
                currentItems.map(item => (
                  <MenuItem key={item.id} item={item} onAddToCart={handleAddToCart} />
                ))
              ) : (
                <p className="text-sm text-center py-6" style={{ color: '#80716a' }}>Aucun plat dans cette catégorie.</p>
              )}
            </div>

            {/* Reviews */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-6" data-reveal>
                <h2 className="font-serif text-2xl font-bold" style={{ color: '#1f1f1f' }}>Avis clients</h2>
                {restaurant.reviews > 0 && (
                  <div className="flex items-center gap-2 rounded-xl px-4 py-2 shadow-sm"
                    style={{ backgroundColor: '#f8f8f8', border: '1px solid rgba(80,70,64,0.06)' }}>
                    <Star size={18} style={{ color: '#c5611a', fill: '#c5611a' }} />
                    <span className="font-bold" style={{ color: '#1f1f1f' }}>{restaurant.rating}</span>
                    <span className="text-sm" style={{ color: '#80716a' }}>/ 5</span>
                  </div>
                )}
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((r, i) => (
                    <div key={r.id || i} data-reveal data-delay={`${i * 0.1}s`}>
                      <ReviewCard review={r} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl p-8 text-center shadow-sm"
                  style={{ backgroundColor: '#f8f8f8', border: '1px solid rgba(80,70,64,0.06)' }}>
                  <Star size={32} className="mx-auto mb-3" style={{ color: '#c5611a' }} />
                  <p className="text-sm" style={{ color: '#80716a' }}>Aucun avis pour l'instant. Soyez le premier !</p>
                </div>
              )}

              {/* Review form */}
              <div className="mt-8" data-reveal>
                {!user ? (
                  <div className="rounded-2xl p-6 shadow-sm text-center"
                    style={{ backgroundColor: '#f8f8f8', border: '1px solid rgba(80,70,64,0.06)' }}>
                    <Star size={28} className="mx-auto mb-3" style={{ color: '#c5611a' }} />
                    <p className="font-semibold mb-1" style={{ color: '#1f1f1f' }}>Partagez votre expérience</p>
                    <p className="text-sm mb-4" style={{ color: '#80716a' }}>Connectez-vous pour laisser un avis</p>
                    <Link to="/connexion" className="btn btn-gold px-6 py-2.5 text-sm inline-flex items-center gap-1.5">
                      Se connecter
                    </Link>
                  </div>
                ) : isOwner ? null : (userReview && !editingReview) ? (
                  <div className="rounded-2xl p-5"
                    style={{ backgroundColor: 'rgba(234,229,217,0.7)', border: '1px solid rgba(197,97,26,0.20)' }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#a04d12' }}>Votre avis</p>
                        <StarRating rating={userReview.rating} />
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditingReview(true)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: '#a04d12' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(197,97,26,0.12)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          title="Modifier" aria-label="Modifier votre avis">
                          <Pencil size={15} />
                        </button>
                        <button onClick={deleteReview}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                          title="Supprimer" aria-label="Supprimer votre avis">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    {userReview.text && (
                      <p className="text-sm mt-2 leading-relaxed" style={{ color: 'rgba(31,31,31,0.70)' }}>"{userReview.text}"</p>
                    )}
                    {submitMsg && <p className="text-xs text-green-600 mt-2">{submitMsg}</p>}
                  </div>
                ) : canReview ? (
                  <div className="rounded-2xl p-6 shadow-sm"
                    style={{ backgroundColor: '#f8f8f8', border: '1px solid rgba(80,70,64,0.06)' }}>
                    <h3 className="font-semibold mb-4" style={{ color: '#1f1f1f' }}>
                      {editingReview ? 'Modifier votre avis' : 'Laisser un avis'}
                    </h3>
                    <div className="mb-4">
                      <p className="text-xs mb-2" style={{ color: '#80716a' }}>Votre note</p>
                      <StarSelector
                        value={reviewForm.rating}
                        hover={reviewHover}
                        onRate={n => setReviewForm(f => ({ ...f, rating: n }))}
                        onHover={setReviewHover}
                        onLeave={() => setReviewHover(0)}
                      />
                    </div>
                    <textarea
                      value={reviewForm.text}
                      onChange={e => setReviewForm(f => ({ ...f, text: e.target.value }))}
                      placeholder="Décrivez votre expérience (optionnel)..."
                      rows={3}
                      className="w-full rounded-xl px-4 py-3 text-sm resize-none mb-3 focus:outline-none focus:ring-2"
                      style={{
                        border: '1px solid rgba(80,70,64,0.18)',
                        color: '#1f1f1f',
                        // focus ring via inline not possible, handled by Tailwind below
                      }}
                    />
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={submitReview}
                        disabled={submitting || reviewForm.rating === 0}
                        className="btn btn-gold px-5 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={14} />
                        {submitting ? 'Envoi…' : editingReview ? 'Mettre à jour' : 'Publier'}
                      </button>
                      {editingReview && (
                        <button
                          onClick={() => {
                            setEditingReview(false)
                            setReviewForm({ rating: userReview.rating, text: userReview.text || '' })
                          }}
                          className="text-sm transition-colors"
                          style={{ color: '#80716a' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#1f1f1f'}
                          onMouseLeave={e => e.currentTarget.style.color = '#80716a'}
                        >
                          Annuler
                        </button>
                      )}
                      {submitMsg && <p className="text-xs text-green-600">{submitMsg}</p>}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="rounded-2xl p-5 shadow-sm sticky top-24"
              style={{ backgroundColor: '#f8f8f8', border: '1px solid rgba(80,70,64,0.06)' }} data-reveal>
              <h3 className="font-serif font-bold text-base mb-4" style={{ color: '#1f1f1f' }}>Informations</h3>
              <div className="space-y-3 text-sm">
                {[
                  { icon: MapPin, label: 'Adresse', value: address },
                  { icon: Clock, label: 'Horaires', value: hours },
                  { icon: CreditCard, label: 'Paiement', value: 'Espèces à la livraison' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#c5611a' }} />
                    <div>
                      <div className="font-semibold" style={{ color: '#1f1f1f' }}>{label}</div>
                      <div style={{ color: '#80716a' }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 space-y-2.5" style={{ borderTop: '1px solid rgba(80,70,64,0.08)' }}>
                <button
                  onClick={user ? startConversation : () => navigate('/connexion')}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{ backgroundColor: '#c5611a', color: '#f8f8f8' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#d9722a'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#c5611a'}
                >
                  <MessageCircle size={16} /> Contacter le vendeur
                </button>
              </div>
            </div>

            <div className="rounded-2xl p-5 shadow-sm"
              style={{ backgroundColor: '#f8f8f8', border: '1px solid rgba(80,70,64,0.06)' }} data-reveal>
              <h3 className="font-serif font-bold text-sm mb-3" style={{ color: '#1f1f1f' }}>Partager</h3>
              <div className="flex gap-2">
                {[
                  { icon: Facebook, label: 'Facebook' },
                  { icon: Instagram, label: 'Instagram' },
                  { icon: MessageCircle, label: 'WhatsApp' },
                ].map(({ icon: Icon, label }) => (
                  <button key={label}
                    className="flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1"
                    style={{ backgroundColor: '#eae5d9', color: '#1f1f1f' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(197,97,26,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#eae5d9'}
                    aria-label={`Partager sur ${label}`}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}
    </div>
  )
}