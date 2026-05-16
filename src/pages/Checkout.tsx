import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { checkoutSchema, flattenErrors } from '../lib/schemas'
import {
  ArrowLeft, ShoppingBag, MapPin, Phone, FileText,
  CreditCard, Smartphone, Banknote, CheckCircle, Clock, Lock,
  Truck, Store, Navigation
} from 'lucide-react'
import AddressAutocomplete from '../components/AddressAutocomplete'

// Haversine distance in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Estimate travel time: ~3 min/km in Casablanca city traffic
function estimateTravelMin(distKm: number) {
  return Math.ceil(distKm * 3)
}

export default function Checkout() {
  const { t } = useTranslation()

  const PAYMENT_METHODS = [
    {
      id: 'cash_on_delivery',
      label: t('checkout.pay_cash'),
      desc: t('checkout.pay_cash_desc'),
      icon: Banknote,
      available: true,
    },
    {
      id: 'card',
      label: t('checkout.pay_card'),
      desc: t('checkout.pay_card_desc'),
      icon: CreditCard,
      available: false,
    },
    {
      id: 'mobile_payment',
      label: t('checkout.pay_mobile'),
      desc: t('checkout.pay_mobile_desc'),
      icon: Smartphone,
      available: false,
    },
  ]

  const {
    cart, itemCount, subtotal, deliveryFee, total,
    deliveryMode, setDeliveryMode, setDeliveryFeeOverride, clearCart
  } = useCart()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: profile?.full_name || '',
    phone: '',
    address: '',
    addressComplement: '',
    notes: '',
  })
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery')
  const [error,        setError]        = useState('')
  const [fieldErrors,  setFieldErrors]  = useState<Record<string, string>>({})
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null)
  const [selectedZone, setSelectedZone] = useState('')

  // GPS & estimated time
  const [clientCoords,     setClientCoords]     = useState<{ lat: number; lng: number } | null>(null)
  const [estimatedTime,    setEstimatedTime]     = useState<{ prep: number; travel: number; total: number; distance: string } | null>(null)
  const [rawQuartier,      setRawQuartier]       = useState<string | null>(null)
  const [rawAddress,       setRawAddress]        = useState('')
  const [detectedQuartier, setDetectedQuartier]  = useState<{ matched: boolean; name?: string; zone: { quartier: string; price: number } | null } | null>(null)

  const isPickup = deliveryMode === 'pickup'
  const queryClient = useQueryClient()

  // ── Place order mutation ──────────────────────────────────────────────────
  const placeOrderMutation = useMutation({
    mutationFn: async ({ orderData, orderItems }: { orderData: Record<string, unknown>; orderItems: Record<string, unknown>[] }) => {
      const { data: order, error: orderErr } = await (supabase.from('orders') as any)
        .insert(orderData)
        .select()
        .single()
      if (orderErr) throw new Error('order')

      const { error: itemsErr } = await (supabase.from('order_items') as any)
        .insert(orderItems.map(item => ({ ...item, order_id: order.id })))
      if (itemsErr) throw new Error('items')

      return order
    },
    onSuccess: (order) => {
      setOrderSuccess(order)
      clearCart()
      queryClient.invalidateQueries({ queryKey: ['profile', 'orders'] })
    },
    onError: (err) => {
      setError(err.message === 'items' ? t('checkout.err_items') : t('checkout.err_order'))
    },
  })

  // ── Delivery zones + restaurant coords + prep times ───────────────────────
  const menuItemIds = cart.items.map(i => i.menuItemId)
  const { data: checkoutData, isLoading: zonesLoading } = useQuery({
    queryKey: ['checkout', cart.restaurantId, menuItemIds],
    queryFn: async () => {
      const [{ data: zonesRaw }, { data: restRaw }, { data: menuRaw }] = await Promise.all([
        supabase.from('delivery_zones').select('*').eq('restaurant_id', cart.restaurantId ?? '').order('quartier'),
        supabase.from('restaurants').select('latitude, longitude').eq('id', cart.restaurantId ?? '').maybeSingle(),
        menuItemIds.length > 0
          ? supabase.from('menu_items').select('id, prep_time_min').in('id', menuItemIds)
          : { data: [] },
      ])
      type ZoneRow = { quartier: string; price: number }
      type RestRow = { latitude: number | null; longitude: number | null }
      type MenuRow = { id: string; prep_time_min: number }
      const zones = (zonesRaw || []) as ZoneRow[]
      const rest = restRaw as RestRow | null
      const menuArr = (menuRaw || []) as MenuRow[]
      const restaurantCoords = rest?.latitude && rest?.longitude
        ? { lat: Number(rest.latitude), lng: Number(rest.longitude) }
        : null
      const maxPrepTime = menuArr.length > 0
        ? Math.max(...menuArr.map(m => m.prep_time_min || 15))
        : 15
      return { zones, restaurantCoords, maxPrepTime }
    },
    enabled: !!cart.restaurantId,
  })

  const deliveryZones    = checkoutData?.zones          ?? []
  const restaurantCoords = checkoutData?.restaurantCoords ?? null
  const maxPrepTime      = checkoutData?.maxPrepTime      ?? 15

  // Update delivery fee when zone changes
  useEffect(() => {
    if (isPickup) {
      setDeliveryFeeOverride(null)
      setDetectedQuartier(null)
      return
    }
    if (detectedQuartier?.matched && detectedQuartier.zone) {
      setDeliveryFeeOverride(Number(detectedQuartier.zone.price))
      setSelectedZone(detectedQuartier.zone.quartier)
    } else {
      setDeliveryFeeOverride(null)
      setSelectedZone('')
    }
  }, [detectedQuartier, isPickup, setDeliveryFeeOverride])

  // Compute estimated time when we have both coordinates
  useEffect(() => {
    if (!clientCoords || !restaurantCoords) { setEstimatedTime(null); return }
    const distKm = haversineKm(restaurantCoords.lat, restaurantCoords.lng, clientCoords.lat, clientCoords.lng)
    const travelMin = estimateTravelMin(distKm)
    setEstimatedTime({ prep: maxPrepTime, travel: travelMin, total: maxPrepTime + travelMin, distance: distKm.toFixed(1) })
  }, [clientCoords, restaurantCoords, maxPrepTime])

  // handlePlaceSelect only stores raw data — no matching here
  const handlePlaceSelect = useCallback((place: { lat: number; lng: number; quartier?: string; address?: string }) => {
    setClientCoords({ lat: place.lat, lng: place.lng })
    setRawQuartier(place.quartier || '')
    setRawAddress(place.address || '')
  }, [])

  // Match quartier against delivery zones — runs whenever zones or quartier changes
  useEffect(() => {
    if (rawQuartier === null) return // no address selected yet

    function norm(s: string) {
      return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, '')
    }

    if (deliveryZones.length > 0) {
      const haystack = norm(rawAddress + ' ' + rawQuartier)
      const match = deliveryZones.find(z => {
        const needle = norm(z.quartier)
        return haystack.includes(needle) || norm(rawQuartier).includes(needle)
      })
      setDetectedQuartier({
        name: rawQuartier,
        matched: !!match,
        zone: match || null,
      })
    } else {
      setDetectedQuartier({ name: rawQuartier, matched: false, zone: null })
    }
  }, [rawQuartier, rawAddress, deliveryZones])

  function updateForm(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) { navigate('/connexion'); return }
    if (itemCount === 0) return

    setError('')
    setFieldErrors({})
    const cleanPhone = form.phone.replace(/[\s\-\.]/g, '')
    const result = checkoutSchema.safeParse({
      name:              form.name,
      phone:             cleanPhone,
      address:           form.address,
      addressComplement: form.addressComplement,
      notes:             form.notes,
      deliveryMode,
    })
    if (!result.success) {
      setFieldErrors(flattenErrors(result.error))
      setError(t('checkout.err_fields'))
      return
    }

    if (!supabase) {
      setOrderSuccess({ id: 'demo-' + Date.now(), status: 'pending', delivery_mode: deliveryMode })
      clearCart()
      return
    }

    placeOrderMutation.mutate({
      orderData: {
        customer_id:      user.id,
        restaurant_id:    cart.restaurantId,
        payment_method:   paymentMethod,
        delivery_mode:    deliveryMode,
        subtotal,
        delivery_fee:     deliveryFee,
        total,
        delivery_address: isPickup ? 'Retrait sur place' : `${form.address} — ${form.addressComplement}`,
        delivery_phone:   form.phone,
        delivery_notes:   form.notes,
        customer_name:    form.name,
        delivery_zone:    selectedZone || null,
        estimated_time:   estimatedTime?.total || null,
      },
      orderItems: cart.items.map(item => ({
        menu_item_id: item.menuItemId,
        name:         item.name,
        price:        item.price,
        quantity:     item.quantity,
      })),
    })
  }

  // Success screen
  if (orderSuccess) {
    const estLabel = orderSuccess.estimated_time
      ? `${orderSuccess.estimated_time} min`
      : orderSuccess.delivery_mode === 'pickup'
        ? '15-25 min'
        : '30-45 min'

    return (
      <div className="min-h-screen bg-cream pt-24 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-black/[0.05] max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-dark mb-2">{t('checkout.success_title')}</h1>
          <p className="text-muted text-sm mb-2">
            {t('checkout.success_sub', { id: orderSuccess.id.slice(0, 8) })}
          </p>
          <p className="text-muted text-sm mb-6">
            {orderSuccess.delivery_mode === 'pickup'
              ? t('checkout.success_pickup')
              : t('checkout.success_delivery')
            }
          </p>

          <div className="bg-cream rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-dark">
              <Clock size={16} className="text-gold" />
              <span className="font-semibold">{t('checkout.est_label', { time: estLabel })}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Link to="/mes-commandes" className="btn btn-gold flex-1 justify-center text-sm">
              {t('checkout.track')}
            </Link>
            <Link to="/restaurants" className="btn btn-dark flex-1 justify-center text-sm">
              {t('checkout.continue')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Empty cart
  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-cream pt-24 flex items-center justify-center px-6">
        <div className="text-center">
          <ShoppingBag size={56} className="text-muted/30 mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-bold text-dark mb-2">{t('checkout.empty_title')}</h1>
          <p className="text-muted text-sm mb-6">{t('checkout.empty_sub')}</p>
          <Link to="/restaurants" className="btn btn-gold text-sm">
            {t('checkout.explore')}
          </Link>
        </div>
      </div>
    )
  }

  const hasZones = deliveryZones.length > 0
  const zonePrice = hasZones && selectedZone
    ? deliveryZones.find(z => z.quartier === selectedZone)?.price
    : null

  return (
    <div className="bg-cream min-h-screen pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <Link to="/restaurants" className="text-muted text-sm hover:text-dark transition-colors flex items-center gap-1 mb-4">
            <ArrowLeft size={16} /> {t('checkout.back')}
          </Link>
          <h1 className="font-serif text-3xl font-bold text-dark">{t('checkout.title')}</h1>
          <p className="text-muted text-sm mt-1">{t('checkout.order_at', { name: cart.restaurantName })}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Form */}
            <div className="lg:col-span-2 space-y-6">

              {/* Delivery mode selector */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/[0.05]">
                <h2 className="font-serif font-bold text-dark text-lg mb-5 flex items-center gap-2">
                  <Truck size={18} className="text-gold" /> {t('checkout.delivery_mode')}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('delivery')}
                    className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${deliveryMode === 'delivery'
                      ? 'border-gold bg-gold/5'
                      : 'border-gray-100 hover:border-gold/50'
                      }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${deliveryMode === 'delivery' ? 'bg-gold/20' : 'bg-cream'
                      }`}>
                      <Truck size={24} className={deliveryMode === 'delivery' ? 'text-gold-dark' : 'text-muted'} />
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-bold ${deliveryMode === 'delivery' ? 'text-dark' : 'text-muted'}`}>
                        {t('checkout.delivery')}
                      </p>
                      <p className="text-xs text-muted mt-0.5">{t('checkout.delivery_desc')}</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode('pickup')}
                    className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${deliveryMode === 'pickup'
                      ? 'border-gold bg-gold/5'
                      : 'border-gray-100 hover:border-gold/50'
                      }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${deliveryMode === 'pickup' ? 'bg-gold/20' : 'bg-cream'
                      }`}>
                      <Store size={24} className={deliveryMode === 'pickup' ? 'text-gold-dark' : 'text-muted'} />
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-bold ${deliveryMode === 'pickup' ? 'text-dark' : 'text-muted'}`}>
                        {t('checkout.pickup')}
                      </p>
                      <p className="text-xs text-muted mt-0.5">{t('checkout.pickup_desc')}</p>
                      <p className="text-xs font-semibold text-green-600 mt-1">{t('checkout.free')}</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* No delivery zones — vendor will contact */}
              {!isPickup && !hasZones && !zonesLoading && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
                  <Phone size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">{t('checkout.no_zones_title')}</p>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      {t('checkout.no_zones_desc')}
                    </p>
                  </div>
                </div>
              )}

              {/* Delivery / Contact info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/[0.05]">
                <h2 className="font-serif font-bold text-dark text-lg mb-5 flex items-center gap-2">
                  {isPickup
                    ? <><Phone size={18} className="text-gold" /> {t('checkout.contact_info')}</>
                    : <><MapPin size={18} className="text-gold" /> {t('checkout.delivery_info')}</>
                  }
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {t('checkout.full_name')} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => updateForm('name', e.target.value)}
                      placeholder={t('checkout.full_name')}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                    {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {t('checkout.phone')} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => updateForm('phone', e.target.value)}
                      placeholder="+212 6XX XX XX XX"
                      required
                      className={`w-full border rounded-xl px-4 py-3 text-sm text-dark focus:outline-none focus:ring-2 ${form.phone && !/^(\+212|0)(5|6|7)\d{8}$/.test(form.phone.replace(/[\s\-\.]/g, ''))
                          ? 'border-red-300 focus:ring-red-300'
                          : 'border-gray-200 focus:ring-gold/50'
                        }`}
                    />
                    {(form.phone && !/^(\+212|0)(5|6|7)\d{8}$/.test(form.phone.replace(/[\s\-\.]/g, ''))) || fieldErrors.phone ? (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.phone || t('checkout.phone_format_hint')}</p>
                    ) : null}
                  </div>

                  {!isPickup && (
                    <>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          {t('checkout.address')} <span className="text-red-400">*</span>
                        </label>
                        <AddressAutocomplete
                          value={form.address}
                          onChange={val => updateForm('address', val)}
                          onPlaceSelect={handlePlaceSelect}
                        />
                        {fieldErrors.address && <p className="text-red-500 text-xs mt-1">{fieldErrors.address}</p>}
                        <p className="text-xs text-muted mt-1.5 flex items-center gap-1">
                          <Navigation size={10} /> {t('checkout.phone_hint')}
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          {t('checkout.address_complement')} <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.addressComplement}
                          onChange={e => updateForm('addressComplement', e.target.value)}
                          placeholder={t('checkout.address_complement_placeholder')}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-gold/50"
                        />
                        {fieldErrors.addressComplement && (
                          <p className="text-red-500 text-xs mt-1">{fieldErrors.addressComplement}</p>
                        )}
                      </div>

                      {/* Auto-detected zone feedback */}
                      {detectedQuartier && hasZones && (
                        <div className="md:col-span-2">
                          {detectedQuartier.matched ? (
                            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-green-600 mt-0.5">{t('checkout.zone_available')}</p>
                                </div>
                              </div>
                              <span className="text-sm font-bold text-green-700">
                                {Number(detectedQuartier.zone?.price).toFixed(2)} MAD
                              </span>
                            </div>
                          ) : (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                              <Phone size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-semibold text-amber-800">
                                  {detectedQuartier.name
                                    ? t('checkout.zone_out', { name: `"${detectedQuartier.name}"` })
                                    : t('checkout.zone_out_anon')
                                  }
                                </p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                  {t('checkout.zone_out_desc')}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {isPickup && (
                    <div className="md:col-span-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
                      <Store size={18} className="text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-green-800">{t('checkout.pickup_ready', { name: cart.restaurantName })}</p>
                        <p className="text-xs text-green-600 mt-0.5">{t('checkout.pickup_ready_desc')}</p>
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      <FileText size={12} className="inline mr-1" /> {t('checkout.notes')}
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={e => updateForm('notes', e.target.value)}
                      placeholder={isPickup
                        ? t('checkout.notes_pickup')
                        : t('checkout.notes_delivery')
                      }
                      rows={2}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Estimated time card */}
              {!isPickup && estimatedTime && (
                <div className="bg-gradient-to-r from-gold/10 to-gold/5 rounded-2xl p-5 border border-gold/20">
                  <h3 className="font-serif font-bold text-dark text-sm mb-3 flex items-center gap-2">
                    <Clock size={16} className="text-gold" /> {t('checkout.est_time_title')}
                  </h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-lg font-bold text-dark">{estimatedTime.prep} min</p>
                      <p className="text-xs text-muted">{t('checkout.prep')}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-lg font-bold text-dark">{estimatedTime.travel} min</p>
                      <p className="text-xs text-muted">{t('checkout.travel', { distance: estimatedTime.distance })}</p>
                    </div>
                    <div className="bg-gold/20 rounded-xl p-3">
                      <p className="text-lg font-bold text-gold-dark">{estimatedTime.total} min</p>
                      <p className="text-xs text-gold-dark font-semibold">{t('checkout.total_estimated')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment methods */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/[0.05]">
                <h2 className="font-serif font-bold text-dark text-lg mb-5 flex items-center gap-2">
                  <CreditCard size={18} className="text-gold" /> {t('checkout.payment_title')}
                </h2>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map(method => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${!method.available
                        ? 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50'
                        : paymentMethod === method.id
                          ? 'border-gold bg-gold/5'
                          : 'border-gray-100 hover:border-gold/50'
                        }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => method.available && setPaymentMethod(method.id)}
                        disabled={!method.available}
                        className="accent-gold w-4 h-4"
                      />
                      <div className="w-10 h-10 rounded-lg bg-cream flex items-center justify-center flex-shrink-0">
                        <method.icon size={20} className={method.available ? 'text-gold' : 'text-gray-300'} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-dark">{method.label}</span>
                          {!method.available && (
                            <span className="bg-dark/10 text-dark/50 text-[0.6rem] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                              <Lock size={8} /> {t('checkout.coming_soon')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5">{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Order summary */}
            <div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/[0.05] sticky top-24">
                <h2 className="font-serif font-bold text-dark text-lg mb-5">{t('checkout.summary')}</h2>

                {/* Mode badge */}
                <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg text-xs font-bold ${isPickup ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                  {isPickup ? <Store size={14} /> : <Truck size={14} />}
                  {isPickup
                    ? t('checkout.mode_pickup')
                    : detectedQuartier?.matched
                      ? t('checkout.mode_delivery_zone', { zone: detectedQuartier.zone?.quartier })
                      : t('checkout.mode_delivery')
                  }
                </div>

                <div className="space-y-3 mb-5">
                  {cart.items.map(item => (
                    <div key={item.menuItemId} className="flex justify-between text-sm">
                      <span className="text-dark">
                        <span className="font-semibold">{item.quantity}x</span> {item.name}
                      </span>
                      <span className="text-dark font-semibold flex-shrink-0 ml-3">
                        {(item.price * item.quantity).toFixed(2)} MAD
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-black/[0.06] pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">{t('checkout.subtotal')}</span>
                    <span className="text-dark">{subtotal.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">
                      {isPickup ? t('checkout.pickup_fee') : t('checkout.delivery_fee')}
                    </span>
                    <span className={`font-semibold ${isPickup ? 'text-green-600' : detectedQuartier?.matched ? 'text-dark' : 'text-amber-600'}`}>
                      {isPickup
                        ? t('checkout.free')
                        : detectedQuartier?.matched
                          ? `${deliveryFee.toFixed(2)} MAD`
                          : t('checkout.to_confirm')
                      }
                    </span>
                  </div>

                  {/* Estimated time in summary */}
                  {!isPickup && estimatedTime && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted flex items-center gap-1"><Clock size={12} /> {t('checkout.estimated')}</span>
                      <span className="text-dark font-semibold">{estimatedTime.total} min</span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg pt-2 border-t border-black/[0.06]">
                    <span className="font-bold text-dark">{t('checkout.total')}</span>
                    <span className="font-bold text-gold-dark">{total.toFixed(2)} MAD</span>
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-xs mt-3">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={placeOrderMutation.isPending}
                  className="btn btn-gold w-full justify-center text-sm mt-5 disabled:opacity-50"
                >
                  {placeOrderMutation.isPending ? t('checkout.confirming') : t('checkout.confirm')}
                </button>

                <p className="text-center text-xs text-muted mt-3">
                  {t('checkout.terms')}
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
