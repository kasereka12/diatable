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
  ArrowLeft, MapPin, Clock, Phone, CreditCard,
  MessageCircle, ShieldCheck, Star, Facebook, Instagram, Utensils,
  Heart, Send, Pencil, Trash2, ShoppingBag, Plus, Check
} from 'lucide-react'

function MenuItem({ item, onAddToCart }) {
  const [added, setAdded] = useState(false)

  function handleAdd() {
    onAddToCart(item)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-black/[0.06] last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-dark text-sm">{item.name}</span>
          {item.is_popular && (
            <span className="bg-gold/15 text-gold-dark text-[0.65rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Populaire
            </span>
          )}
        </div>
        {item.description && <p className="text-muted text-xs leading-relaxed">{item.description}</p>}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="font-bold text-dark text-sm">{item.price} MAD</span>
        <button
          onClick={handleAdd}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${added
            ? 'bg-green-500 text-white shadow-[0_2px_8px_rgba(34,197,94,0.3)]'
            : 'bg-gold text-dark hover:bg-gold-light shadow-[0_2px_8px_rgba(244,168,40,0.3)]'
            }`}
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

  // Likes
  const [likesCount, setLikesCount] = useState(0)
  const [userLiked, setUserLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)

  // Reviews
  const [userReview, setUserReview] = useState(null)
  const [reviewForm, setReviewForm] = useState({ rating: 0, text: '' })
  const [reviewHover, setReviewHover] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState('')
  const [editingReview, setEditingReview] = useState(false)

  const categories = Object.keys(menuByCategory)
  const currentItems = menuByCategory[categories[activeCategory]] || []

  // Track page view
  /* useEffect(() => {
     if (!id || !supabase) return
     supabase.from('restaurant_views').insert({ restaurant_id: id })
   }, [id])*/

  // Fetch likes count + user-specific data
  useEffect(() => {
    if (!id || !supabase) return

    /*supabase
      .from('restaurant_likes')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', id)
      .then(({ count }) => setLikesCount(count || 0))*/

    if (user) {
      /*supabase
        .from('restaurant_likes')
        .select('id')
        .eq('restaurant_id', id)
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => setUserLiked(!!data))
      */
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
    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('customer_id', user.id)
      .eq('restaurant_id', restaurant.id)
      .maybeSingle()

    if (existing) {
      navigate('/messages')
      return
    }

    // Create new conversation
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
      await supabase.from('restaurant_likes').delete()
        .eq('restaurant_id', id).eq('user_id', user.id)
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
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-gold/30 border-t-gold animate-spin" />
      </div>
    )
  }

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
  const address = restaurant.address || 'Casablanca, Maroc'
  const hours = restaurant.hours || 'Lun–Sam : 11h30 – 22h00'

  return (
    <div className="bg-cream min-h-screen" ref={ref}>
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
        <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/20 to-transparent" />

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
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <span className="text-white/80 text-sm flex items-center gap-1">
                    <MapPin size={14} /> {restaurant.location}
                  </span>
                  {restaurant.reviews > 0 ? (
                    <span className="flex items-center gap-1.5 text-sm">
                      <StarRating rating={restaurant.rating} />
                      <span className="text-white font-semibold">{restaurant.rating}</span>
                      <span className="text-white/60">({restaurant.reviews} avis)</span>
                    </span>
                  ) : (
                    <span className="text-white/50 text-sm italic">Aucun avis pour l'instant</span>
                  )}
                  {restaurant.is_verified && (
                    <span className="bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <ShieldCheck size={12} /> Vérifié
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2.5 flex-wrap">
                {/* Like button */}
                <button
                  onClick={toggleLike}
                  disabled={likeLoading}
                  title={user ? (userLiked ? 'Ne plus aimer' : "J'aime") : 'Connectez-vous pour aimer'}
                  className={`btn text-sm px-4 py-2.5 flex items-center gap-2 transition-all
                    ${userLiked
                      ? 'bg-pink-500/20 border border-pink-500/40 text-pink-400 hover:bg-pink-500/30'
                      : 'bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20'
                    }`}
                  aria-label={userLiked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  <Heart size={16} className={userLiked ? 'fill-pink-400' : ''} />
                  {likesCount > 0 && <span>{likesCount}</span>}
                </button>
                {/* Message vendor */}
                <button
                  onClick={user ? startConversation : () => navigate('/connexion')}
                  className="btn bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 text-sm px-5 py-2.5 flex items-center gap-2"
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
            <h2 className="font-serif text-2xl font-bold text-dark mb-6" data-reveal>Notre Carte</h2>

            {categories.length > 0 && (
              <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1" data-reveal>
                {categories.map((cat, i) => (
                  <button key={cat} onClick={() => setActiveCategory(i)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap
                      border-2 transition-all duration-200 flex-shrink-0
                      ${activeCategory === i
                        ? 'bg-gold text-dark border-gold shadow-[0_4px_12px_rgba(244,168,40,0.3)]'
                        : 'bg-white text-dark border-transparent shadow-sm hover:border-gold/50'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/[0.05]" data-reveal>
              {currentItems.length > 0 ? (
                currentItems.map(item => (
                  <MenuItem key={item.id} item={item} onAddToCart={handleAddToCart} />
                ))
              ) : (
                <p className="text-muted text-sm text-center py-6">Aucun plat dans cette catégorie.</p>
              )}
            </div>

            {/* Reviews list */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-6" data-reveal>
                <h2 className="font-serif text-2xl font-bold text-dark">Avis clients</h2>
                {restaurant.reviews > 0 && (
                  <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-sm border border-black/[0.05]">
                    <Star size={18} className="text-gold fill-gold" />
                    <span className="font-bold text-dark">{restaurant.rating}</span>
                    <span className="text-muted text-sm">/ 5</span>
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
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-black/[0.05]">
                  <Star size={32} className="text-gold mx-auto mb-3" />
                  <p className="text-muted text-sm">Aucun avis pour l'instant. Soyez le premier !</p>
                </div>
              )}

              {/* Review form */}
              <div className="mt-8" data-reveal>
                {!user ? (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/[0.05] text-center">
                    <Star size={28} className="text-gold mx-auto mb-3" />
                    <p className="text-dark font-semibold mb-1">Partagez votre expérience</p>
                    <p className="text-muted text-sm mb-4">Connectez-vous pour laisser un avis</p>
                    <Link to="/connexion" className="btn btn-gold px-6 py-2.5 text-sm inline-flex items-center gap-1.5">
                      Se connecter
                    </Link>
                  </div>
                ) : isOwner ? null : (userReview && !editingReview) ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">Votre avis</p>
                        <StarRating rating={userReview.rating} />
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditingReview(true)}
                          className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-700 transition-colors"
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
                      <p className="text-sm text-dark/70 mt-2 leading-relaxed">"{userReview.text}"</p>
                    )}
                    {submitMsg && <p className="text-xs text-green-600 mt-2">{submitMsg}</p>}
                  </div>
                ) : canReview ? (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/[0.05]">
                    <h3 className="font-semibold text-dark mb-4">
                      {editingReview ? 'Modifier votre avis' : 'Laisser un avis'}
                    </h3>
                    <div className="mb-4">
                      <p className="text-xs text-muted mb-2">Votre note</p>
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
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none mb-3"
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
                          className="text-sm text-muted hover:text-dark"
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
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/[0.05] sticky top-24" data-reveal>
              <h3 className="font-serif font-bold text-dark text-base mb-4">Informations</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-dark">Adresse</div>
                    <div className="text-muted">{address}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-dark">Horaires</div>
                    <div className="text-muted">{hours}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CreditCard size={16} className="text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-dark">Paiement</div>
                    <div className="text-muted">Espèces à la livraison</div>
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-black/[0.06] space-y-2.5">
                <button
                  onClick={user ? startConversation : () => navigate('/connexion')}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gold hover:bg-gold-light text-dark font-semibold text-sm transition-all"
                >
                  <MessageCircle size={16} /> Contacter le vendeur
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/[0.05]" data-reveal>
              <h3 className="font-serif font-bold text-dark text-sm mb-3">Partager</h3>
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-lg bg-cream text-xs font-medium text-dark hover:bg-gold/10 transition-all flex items-center justify-center gap-1"
                  aria-label="Partager sur Facebook">
                  <Facebook size={14} /> Facebook
                </button>
                <button className="flex-1 py-2 rounded-lg bg-cream text-xs font-medium text-dark hover:bg-gold/10 transition-all flex items-center justify-center gap-1"
                  aria-label="Partager sur Instagram">
                  <Instagram size={14} /> Instagram
                </button>
                <button className="flex-1 py-2 rounded-lg bg-cream text-xs font-medium text-dark hover:bg-gold/10 transition-all flex items-center justify-center gap-1"
                  aria-label="Partager sur WhatsApp">
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
