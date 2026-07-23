import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { useRestaurantDetail } from '../hooks/useRestaurantDetail'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'
import { getGradient } from '../lib/gradients'
import StarRating from '../components/ui/StarRating'
import { getCuisineIcon } from '../lib/cuisineIcons'
import type { MenuItem as MenuItemType, ReviewWithAuthor } from '../types/supabase'
import {
  ArrowLeft, MapPin, Clock, CreditCard,
  MessageCircle, ShieldCheck, Star, Facebook, Instagram, Utensils,
  Heart, Send, Pencil, Trash2, Plus, Check, ZoomIn, Power, X
} from 'lucide-react'
import { getEffectivelyOpen, getClosedReason } from '../lib/scheduleParser'
import AdBanner from '../components/AdBanner'

interface LightboxData { src: string; alt: string }

function Lightbox({ src, alt, onClose }: LightboxData & { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={onClose} aria-label="Fermer">
        <X size={24} />
      </button>
      <img src={src} alt={alt} className="max-w-[90vw] max-h-[90vh] rounded-xl object-contain" />
    </div>
  )
}

interface MenuItemProps { item: MenuItemType; onAddToCart: (item: MenuItemType) => void; restaurantClosed: boolean; onImageClick: (src: string, alt: string) => void }

function MenuItem({ item, onAddToCart, restaurantClosed, onImageClick }: MenuItemProps) {
  const { t } = useTranslation()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    if (restaurantClosed) return
    onAddToCart(item)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="flex items-start gap-3 py-4 last:border-0" style={{ borderBottom: '1px solid rgba(80,70,64,0.07)' }}>
      {item.image_url && (
        <button
          onClick={() => onImageClick(item.image_url!, item.name)}
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
              {t('rd.popular')}
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
          disabled={restaurantClosed}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
          style={restaurantClosed ? {
            backgroundColor: 'rgba(80,70,64,0.08)',
            color: '#80716a',
            cursor: 'not-allowed',
          } : added ? {
            backgroundColor: '#22c55e',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(34,197,94,0.3)',
          } : {
            backgroundColor: '#c5611a',
            color: '#f8f8f8',
            boxShadow: '0 2px 8px rgba(197,97,26,0.3)',
          }}
          onMouseEnter={e => { if (!added && !restaurantClosed) e.currentTarget.style.backgroundColor = '#d9722a' }}
          onMouseLeave={e => { if (!added && !restaurantClosed) e.currentTarget.style.backgroundColor = '#c5611a' }}
          aria-label={restaurantClosed ? t('rd.restaurant_closed') : t('rd.add_to_cart', { name: item.name })}
        >
          {restaurantClosed ? t('rd.closed') : added ? <><Check size={14} /> {t('rd.added')}</> : <><Plus size={14} /> {t('rd.add')}</>}
        </button>
      </div>
    </div>
  )
}

function ReviewCard({ review }: { review: ReviewWithAuthor }) {
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

function StarSelector({ value, hover, onRate, onHover, onLeave }: { value: number; hover: number; onRate: (n: number) => void; onHover: (n: number) => void; onLeave: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex gap-1" onMouseLeave={onLeave}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onRate(n)}
          onMouseEnter={() => onHover(n)}
          className="transition-transform hover:scale-110"
          aria-label={t('rd.star', { count: n })}
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
  const { t } = useTranslation()
  const { id } = useParams()
  const { user } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const { restaurant, menuByCategory, reviews, loading } = useRestaurantDetail(id)
  const queryClient = useQueryClient()
  const ref = useScrollReveal()
  const [activeCategory, setActiveCategory] = useState(0)
  const [lightbox, setLightbox] = useState<LightboxData | null>(null)

  const [reviewForm, setReviewForm] = useState({ rating: 0, text: '' })
  const [reviewHover, setReviewHover] = useState(0)
  const [submitMsg, setSubmitMsg] = useState('')
  const [editingReview, setEditingReview] = useState(false)

  const categories = Object.keys(menuByCategory)
  const currentItems = menuByCategory[categories[activeCategory]] || []

  // ── Likes ────────────────────────────────────────────────────────────────
  const { data: likesData = { count: 0, userLiked: false } } = useQuery({
    queryKey: ['vendeur', id, 'likes', user?.id ?? null],
    queryFn: async () => {
      const [{ count }, userLikeResult] = await Promise.all([
        supabase.from('restaurant_likes')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', id ?? ''),
        user
          ? supabase.from('restaurant_likes').select('id')
              .eq('restaurant_id', id ?? '').eq('user_id', user.id).maybeSingle()
          : { data: null },
      ])
      return { count: count || 0, userLiked: !!userLikeResult.data }
    },
    enabled: !!id,
  })
  const likesCount = likesData.count
  const userLiked  = likesData.userLiked

  // ── Avis de l'utilisateur courant ────────────────────────────────────────
  const { data: userReview = null } = useQuery({
    queryKey: ['vendeur', id, 'userReview', user?.id ?? null],
    queryFn: async () => {
      const { data } = await supabase.from('reviews').select('*')
        .eq('restaurant_id', id ?? '').eq('user_id', user!.id).maybeSingle()
      return (data as any) || null
    },
    enabled: !!id && !!user,
  })


  function handleAddToCart(item: MenuItemType) {
    addItem(restaurant!.id, restaurant!.name, {
      menuItemId: item.id,
      name: item.name,
      price: Number(item.price),
    })
  }

  async function startConversation() {
    if (!user || !restaurant) return
    const { data: existingRaw } = await supabase
      .from('conversations').select('id')
      .eq('customer_id', user.id).eq('restaurant_id', restaurant.id).maybeSingle()
    const existing = existingRaw as { id: string } | null
    if (existing) { navigate('/messages?conv=' + existing.id); return }
    const { data: createdRaw } = await (supabase.from('conversations') as any).insert({
      customer_id: user.id,
      vendor_id: restaurant.owner_id,
      restaurant_id: restaurant.id,
    }).select('id').single()
    const created = createdRaw as { id: string } | null
    navigate('/messages?conv=' + (created?.id || ''))
  }

  // ── Mutations ─────────────────────────────────────────────────────────────
  const invalidateLikes = () =>
    queryClient.invalidateQueries({ queryKey: ['vendeur', id, 'likes'] })
  const invalidateAvis = () => {
    queryClient.invalidateQueries({ queryKey: ['vendeur', id, 'avis'] })
    queryClient.invalidateQueries({ queryKey: ['vendeur', id, 'userReview'] })
    queryClient.invalidateQueries({ queryKey: ['vendeur', id] })
  }

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (userLiked) {
        const { error } = await supabase.from('restaurant_likes').delete()
          .eq('restaurant_id', id ?? '').eq('user_id', user!.id)
        if (error) throw error
      } else {
        const { error } = await (supabase.from('restaurant_likes') as any)
          .insert({ restaurant_id: id, user_id: user!.id })
        if (error) throw error
      }
    },
    onSuccess: () => {
      invalidateLikes()
      queryClient.invalidateQueries({ queryKey: ['profile', 'favorites'] })
    },
  })

  const submitReviewMutation = useMutation({
    mutationFn: async ({ isEditing }: { isEditing: boolean }) => {
      if (isEditing && userReview) {
        const { error } = await (supabase.from('reviews') as any)
          .update({ rating: reviewForm.rating, text: reviewForm.text })
          .eq('id', (userReview as any).id)
        if (error) throw error
      } else {
        const { error } = await (supabase.from('reviews') as any).insert({
          restaurant_id: id,
          user_id: user!.id,
          rating: reviewForm.rating,
          text: reviewForm.text,
        })
        if (error) throw error
      }
    },
    onSuccess: (_, { isEditing }: { isEditing: boolean }) => {
      setEditingReview(false)
      setSubmitMsg(isEditing ? t('rd.review_updated') : t('rd.review_published'))
      invalidateAvis()
    },
    onError: (err) => setSubmitMsg(t('rd.error_prefix') + err.message),
  })

  const deleteReviewMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('reviews').delete().eq('id', (userReview as any).id)
      if (error) throw error
    },
    onSuccess: () => {
      setReviewForm({ rating: 0, text: '' })
      setEditingReview(false)
      setSubmitMsg('')
      invalidateAvis()
    },
  })

  // Aliases for JSX (unchanged surface API)
  const likeLoading = toggleLikeMutation.isPending
  const submitting  = submitReviewMutation.isPending

  function toggleLike()    { if (user) toggleLikeMutation.mutate(); else navigate('/connexion') }
  function submitReview()  { if (reviewForm.rating === 0) return; submitReviewMutation.mutate({ isEditing: editingReview }) }
  function deleteReview()  { if (userReview) deleteReviewMutation.mutate() }

  const isOwner = user && restaurant && restaurant.owner_id === user.id
  const canReview = user && !isOwner
  // TEMP TEST OVERRIDE — bypass the "closed" gate to test YouCan Pay checkout.
  // Revert to `getEffectivelyOpen(restaurant)` once done testing.
  const effectivelyOpen = true || getEffectivelyOpen(restaurant)
  const closedReason = getClosedReason(restaurant)

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
        <p className="font-serif text-xl" style={{ color: '#f8f8f8' }}>{t('rd.not_found')}</p>
        <Link to="/restaurants" className="mt-4 inline-flex items-center gap-1" style={{ color: '#c5611a' }}>
          <ArrowLeft size={16} /> {t('rd.back_to_list')}
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
              <ArrowLeft size={16} /> {t('rd.all_restaurants')}
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
                  {restaurant.reviews.length > 0 ? (
                    <span className="flex items-center gap-1.5 text-sm">
                      <StarRating rating={restaurant.rating ?? 0} />
                      <span className="font-semibold" style={{ color: '#f8f8f8' }}>{restaurant.rating}</span>
                      <span style={{ color: 'rgba(248,248,248,0.60)' }}>({t('rd.reviews_count', { count: restaurant.reviews.length })})</span>
                    </span>
                  ) : (
                    <span className="text-sm italic" style={{ color: 'rgba(248,248,248,0.50)' }}>{t('rd.no_reviews_yet')}</span>
                  )}
                  {restaurant.is_verified && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                      style={{ backgroundColor: 'rgba(34,197,94,0.20)', border: '1px solid rgba(34,197,94,0.40)', color: '#4ade80' }}>
                      <ShieldCheck size={12} /> {t('rd.verified')}
                    </span>
                  )}
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5"
                    style={effectivelyOpen ? {
                      backgroundColor: 'rgba(34,197,94,0.20)',
                      border: '1px solid rgba(34,197,94,0.40)',
                      color: '#4ade80',
                    } : {
                      backgroundColor: 'rgba(239,68,68,0.20)',
                      border: '1px solid rgba(239,68,68,0.40)',
                      color: '#fca5a5',
                    }}>
                    <span className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: effectivelyOpen ? '#4ade80' : '#fca5a5' }} />
                    {effectivelyOpen ? t('rd.open') : t('rd.closed')}
                  </span>
                </div>
              </div>
              <div className="flex gap-2.5 flex-wrap">
                <button
                  onClick={toggleLike}
                  disabled={likeLoading}
                  title={user ? (userLiked ? t('rd.unlike') : t('rd.like')) : t('rd.login_to_like')}
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
                  aria-label={user ? (userLiked ? t('rd.unlike') : t('rd.like')) : t('rd.login_to_like')}
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
                  aria-label={t('rd.contact_vendor')}
                >
                  <MessageCircle size={16} /> {t('rd.message')}
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
            <h2 className="font-serif text-2xl font-bold mb-6" style={{ color: '#1f1f1f' }} data-reveal>{t('rd.our_menu')}</h2>

            {!effectivelyOpen && (
              <div className="mb-6 rounded-xl px-4 py-4 flex items-start gap-3"
                style={{ backgroundColor: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.20)' }}
                data-reveal>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
                  <Power size={15} style={{ color: '#dc2626' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#dc2626' }}>
                    {t('rd.currently_closed')}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#ef4444' }}>
                    {closedReason === 'manuel'
                      ? t('rd.closed_manual')
                      : t('rd.closed_hours', { hours: restaurant.hours || t('rd.not_specified') })}
                  </p>
                </div>
              </div>
            )}

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
                  <MenuItem key={item.id} item={item} onAddToCart={handleAddToCart} restaurantClosed={!effectivelyOpen} onImageClick={(src, alt) => setLightbox({ src, alt })} />
                ))
              ) : (
                <p className="text-sm text-center py-6" style={{ color: '#80716a' }}>{t('rd.no_dishes')}</p>
              )}
            </div>

            {/* Reviews */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-6" data-reveal>
                <h2 className="font-serif text-2xl font-bold" style={{ color: '#1f1f1f' }}>{t('rd.customer_reviews')}</h2>
                {restaurant.reviews.length > 0 && (
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
                  <p className="text-sm" style={{ color: '#80716a' }}>{t('rd.no_reviews_be_first')}</p>
                </div>
              )}

              {/* Review form */}
              <div className="mt-8" data-reveal>
                {!user ? (
                  <div className="rounded-2xl p-6 shadow-sm text-center"
                    style={{ backgroundColor: '#f8f8f8', border: '1px solid rgba(80,70,64,0.06)' }}>
                    <Star size={28} className="mx-auto mb-3" style={{ color: '#c5611a' }} />
                    <p className="font-semibold mb-1" style={{ color: '#1f1f1f' }}>{t('rd.share_experience')}</p>
                    <p className="text-sm mb-4" style={{ color: '#80716a' }}>{t('rd.login_to_review')}</p>
                    <Link to="/connexion" className="btn btn-gold px-6 py-2.5 text-sm inline-flex items-center gap-1.5">
                      {t('rd.sign_in')}
                    </Link>
                  </div>
                ) : isOwner ? null : (userReview && !editingReview) ? (
                  <div className="rounded-2xl p-5"
                    style={{ backgroundColor: 'rgba(234,229,217,0.7)', border: '1px solid rgba(197,97,26,0.20)' }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#a04d12' }}>{t('rd.your_review')}</p>
                        <StarRating rating={userReview.rating} />
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingReview(true); setReviewForm({ rating: userReview.rating, text: userReview.text || '' }) }}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: '#a04d12' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(197,97,26,0.12)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          title={t('rd.edit')} aria-label={t('rd.edit_review')}>
                          <Pencil size={15} />
                        </button>
                        <button onClick={deleteReview}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                          title={t('rd.delete')} aria-label={t('rd.delete_review')}>
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
                      {editingReview ? t('rd.edit_review') : t('rd.leave_review')}
                    </h3>
                    <div className="mb-4">
                      <p className="text-xs mb-2" style={{ color: '#80716a' }}>{t('rd.your_rating')}</p>
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
                      placeholder={t('rd.review_placeholder')}
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
                        {submitting ? t('rd.submitting') : editingReview ? t('rd.update') : t('rd.publish')}
                      </button>
                      {editingReview && (
                        <button
                          onClick={() => {
                            setEditingReview(false)
                            setReviewForm({ rating: userReview?.rating ?? 0, text: userReview?.text || '' })
                          }}
                          className="text-sm transition-colors"
                          style={{ color: '#80716a' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#1f1f1f'}
                          onMouseLeave={e => e.currentTarget.style.color = '#80716a'}
                        >
                          {t('rd.cancel')}
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
              <h3 className="font-serif font-bold text-base mb-4" style={{ color: '#1f1f1f' }}>{t('rd.info')}</h3>
              <div className="space-y-3 text-sm">
                {[
                  { icon: MapPin, label: t('rd.address'), value: address },
                  { icon: Clock, label: t('rd.hours'), value: hours },
                  { icon: CreditCard, label: t('rd.payment'), value: t('rd.payment_value') },
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
                  aria-label={t('rd.contact_vendor')}
                >
                  <MessageCircle size={16} /> {t('rd.contact_vendor')}
                </button>
              </div>
            </div>

            <div className="rounded-2xl p-5 shadow-sm"
              style={{ backgroundColor: '#f8f8f8', border: '1px solid rgba(80,70,64,0.06)' }} data-reveal>
              <h3 className="font-serif font-bold text-sm mb-3" style={{ color: '#1f1f1f' }}>{t('rd.share')}</h3>
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
                    aria-label={t('rd.share_on', { platform: label })}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AdBanner />

      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}
    </div>
  )
}
