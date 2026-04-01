import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft, ShoppingBag, MapPin, Phone, FileText,
  CreditCard, Smartphone, Banknote, CheckCircle, Clock, Lock,
  Truck, Store
} from 'lucide-react'
import AddressAutocomplete from '../components/AddressAutocomplete'

const PAYMENT_METHODS = [
  {
    id: 'cash_on_delivery',
    label: 'Paiement à la livraison / au retrait',
    desc: 'Payez en espèces à la réception',
    icon: Banknote,
    available: true,
  },
  {
    id: 'card',
    label: 'Carte bancaire',
    desc: 'Visa, Mastercard, CMI',
    icon: CreditCard,
    available: false,
  },
  {
    id: 'mobile_payment',
    label: 'Paiement mobile',
    desc: 'CashPlus, Wafacash, Orange Money',
    icon: Smartphone,
    available: false,
  },
]

// Haversine distance in km
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Estimate travel time: ~3 min/km in Casablanca city traffic
function estimateTravelMin(distKm) {
  return Math.ceil(distKm * 3)
}

export default function Checkout() {
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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [orderSuccess, setOrderSuccess] = useState(null)

  // Delivery zones from restaurant
  const [deliveryZones, setDeliveryZones] = useState([])
  const [selectedZone, setSelectedZone] = useState('')
  const [zonesLoading, setZonesLoading] = useState(false)

  // GPS & estimated time
  const [clientCoords, setClientCoords] = useState(null)
  const [restaurantCoords, setRestaurantCoords] = useState(null)
  const [estimatedTime, setEstimatedTime] = useState(null)
  const [rawQuartier, setRawQuartier] = useState(null) // raw quartier name from Google
  const [rawAddress, setRawAddress] = useState('')
  const [detectedQuartier, setDetectedQuartier] = useState(null) // { name, matched, zone }

  const isPickup = deliveryMode === 'pickup'

  // Max prep time from cart items
  const [maxPrepTime, setMaxPrepTime] = useState(15)

  // Load delivery zones, restaurant coords, and prep times
  useEffect(() => {
    if (!supabase || !cart.restaurantId) return

    async function loadData() {
      setZonesLoading(true)
      const menuItemIds = cart.items.map(i => i.menuItemId)
      const [{ data: zones }, { data: rest }, { data: menuData }] = await Promise.all([
        supabase.from('delivery_zones').select('*').eq('restaurant_id', cart.restaurantId).order('quartier'),
        supabase.from('restaurants').select('latitude, longitude').eq('id', cart.restaurantId).maybeSingle(),
        menuItemIds.length > 0
          ? supabase.from('menu_items').select('id, prep_time_min').in('id', menuItemIds)
          : { data: [] },
      ])
      setDeliveryZones(zones || [])
      if (rest?.latitude && rest?.longitude) {
        setRestaurantCoords({ lat: Number(rest.latitude), lng: Number(rest.longitude) })
      }
      if (menuData && menuData.length > 0) {
        const maxPrep = Math.max(...menuData.map(m => m.prep_time_min || 15))
        setMaxPrepTime(maxPrep)
      }
      setZonesLoading(false)
    }
    loadData()
  }, [cart.restaurantId, cart.items])

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
  const handlePlaceSelect = useCallback((place) => {
    setClientCoords({ lat: place.lat, lng: place.lng })
    setRawQuartier(place.quartier || '')
    setRawAddress(place.address || '')
  }, [])

  // Match quartier against delivery zones — runs whenever zones or quartier changes
  useEffect(() => {
    if (rawQuartier === null) return // no address selected yet

    function norm(s) {
      return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '')
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

  function updateForm(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) { navigate('/connexion'); return }
    if (itemCount === 0) return

    if (!form.name.trim() || !form.phone.trim()) {
      setError('Veuillez remplir votre nom et téléphone.')
      return
    }
    // Validate Moroccan phone number: 06/07/05 or +212 6/7/5
    const cleanPhone = form.phone.replace(/[\s\-\.]/g, '')
    if (!/^(\+212|0)(5|6|7)\d{8}$/.test(cleanPhone)) {
      setError('Numéro de téléphone invalide. Format attendu : 06 XX XX XX XX ou +212 6XX XX XX XX')
      return
    }
    if (!isPickup && !form.address.trim()) {
      setError('Veuillez remplir l\'adresse de livraison.')
      return
    }
    if (!isPickup && !form.addressComplement.trim()) {
      setError('Veuillez compléter votre adresse (bâtiment, étage, etc.).')
      return
    }

    setSubmitting(true)
    setError('')

    if (!supabase) {
      setOrderSuccess({ id: 'demo-' + Date.now(), status: 'pending', delivery_mode: deliveryMode })
      clearCart()
      setSubmitting(false)
      return
    }

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        customer_id: user.id,
        restaurant_id: cart.restaurantId,
        payment_method: paymentMethod,
        delivery_mode: deliveryMode,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        delivery_address: isPickup ? 'Retrait sur place' : `${form.address} — ${form.addressComplement}`,
        delivery_phone: form.phone,
        delivery_notes: form.notes,
        customer_name: form.name,
        delivery_zone: selectedZone || null,
        estimated_time: estimatedTime?.total || null,
      })
      .select()
      .single()

    if (orderErr) {
      setError('Impossible de passer la commande. Vérifiez votre connexion et réessayez.')
      setSubmitting(false)
      return
    }

    const orderItems = cart.items.map(item => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }))

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsErr) {
      setError('Votre commande a été créée mais un problème est survenu avec les détails. Contactez le restaurant.')
      setSubmitting(false)
      return
    }

    setOrderSuccess(order)
    clearCart()
    setSubmitting(false)
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
          <h1 className="font-serif text-2xl font-bold text-dark mb-2">Commande confirmée !</h1>
          <p className="text-muted text-sm mb-2">
            Votre commande #{orderSuccess.id.slice(0, 8)} a été envoyée au restaurant.
          </p>
          <p className="text-muted text-sm mb-6">
            {orderSuccess.delivery_mode === 'pickup'
              ? 'Retrait sur place — le restaurant vous préviendra quand ce sera prêt.'
              : 'Paiement à la livraison — le vendeur vous contactera pour confirmer.'
            }
          </p>

          <div className="bg-cream rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-dark">
              <Clock size={16} className="text-gold" />
              <span className="font-semibold">Temps estimé : {estLabel}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Link to="/mes-commandes" className="btn btn-gold flex-1 justify-center text-sm">
              Suivre ma commande
            </Link>
            <Link to="/restaurants" className="btn btn-dark flex-1 justify-center text-sm">
              Continuer
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
          <h1 className="font-serif text-2xl font-bold text-dark mb-2">Votre panier est vide</h1>
          <p className="text-muted text-sm mb-6">Ajoutez des plats depuis un restaurant</p>
          <Link to="/restaurants" className="btn btn-gold text-sm">
            Explorer les restaurants
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
            <ArrowLeft size={16} /> Continuer les achats
          </Link>
          <h1 className="font-serif text-3xl font-bold text-dark">Finaliser la commande</h1>
          <p className="text-muted text-sm mt-1">Commande chez {cart.restaurantName}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Form */}
            <div className="lg:col-span-2 space-y-6">

              {/* Delivery mode selector */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/[0.05]">
                <h2 className="font-serif font-bold text-dark text-lg mb-5 flex items-center gap-2">
                  <Truck size={18} className="text-gold" /> Mode de réception
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
                        Livraison
                      </p>
                      <p className="text-xs text-muted mt-0.5">Le vendeur livre chez vous</p>
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
                        Retrait sur place
                      </p>
                      <p className="text-xs text-muted mt-0.5">Récupérez au restaurant</p>
                      <p className="text-xs font-semibold text-green-600 mt-1">Gratuit</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* No delivery zones — vendor will contact */}
              {!isPickup && !hasZones && !zonesLoading && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
                  <Phone size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Frais de livraison non renseignés</p>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      Ce restaurant n'a pas encore configuré ses tarifs de livraison. Vous serez contacté par le restaurant pour confirmer les frais et les détails de livraison.
                    </p>
                  </div>
                </div>
              )}

              {/* Delivery / Contact info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/[0.05]">
                <h2 className="font-serif font-bold text-dark text-lg mb-5 flex items-center gap-2">
                  {isPickup
                    ? <><Phone size={18} className="text-gold" /> Vos coordonnées</>
                    : <><MapPin size={18} className="text-gold" /> Informations de livraison</>
                  }
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Nom complet <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => updateForm('name', e.target.value)}
                      placeholder="Votre nom"
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Téléphone <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => updateForm('phone', e.target.value)}
                      placeholder="+212 6XX XX XX XX"
                      required
                      className={`w-full border rounded-xl px-4 py-3 text-sm text-dark focus:outline-none focus:ring-2 ${
                        form.phone && !/^(\+212|0)(5|6|7)\d{8}$/.test(form.phone.replace(/[\s\-\.]/g, ''))
                          ? 'border-red-300 focus:ring-red-300'
                          : 'border-gray-200 focus:ring-gold/50'
                      }`}
                    />
                    {form.phone && !/^(\+212|0)(5|6|7)\d{8}$/.test(form.phone.replace(/[\s\-\.]/g, '')) && (
                      <p className="text-red-500 text-xs mt-1">Format : 06 XX XX XX XX ou +212 6XX XX XX XX</p>
                    )}
                  </div>

                  {!isPickup && (
                    <>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Adresse <span className="text-red-400">*</span>
                        </label>
                        <AddressAutocomplete
                          value={form.address}
                          onChange={val => updateForm('address', val)}
                          onPlaceSelect={handlePlaceSelect}
                        />
                        <p className="text-xs text-muted mt-1.5 flex items-center gap-1">
                          <Navigation size={10} /> Commencez à taper pour rechercher via Google Maps
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Complément d'adresse <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.addressComplement}
                          onChange={e => updateForm('addressComplement', e.target.value)}
                          placeholder="N° bâtiment, étage, appartement, résidence, code interphone..."
                          required
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-gold/50"
                        />
                      </div>

                      {/* Auto-detected zone feedback */}
                      {detectedQuartier && hasZones && (
                        <div className="md:col-span-2">
                          {detectedQuartier.matched ? (
                            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                                <div>

                                  <p className="text-xs text-green-600 mt-0.5">Livraison disponible dans votre zone</p>
                                </div>
                              </div>
                              <span className="text-sm font-bold text-green-700">
                                {Number(detectedQuartier.zone.price).toFixed(2)} MAD
                              </span>
                            </div>
                          ) : (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                              <Phone size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-semibold text-amber-800">
                                  Quartier {detectedQuartier.name ? `"${detectedQuartier.name}"` : 'non reconnu'} — hors zone configurée
                                </p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                  Le restaurant vous contactera pour confirmer la disponibilité et les frais de livraison.
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
                        <p className="text-sm font-semibold text-green-800">Retrait chez {cart.restaurantName}</p>
                        <p className="text-xs text-green-600 mt-0.5">Vous recevrez une notification quand votre commande sera prête</p>
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      <FileText size={12} className="inline mr-1" /> Notes (optionnel)
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={e => updateForm('notes', e.target.value)}
                      placeholder={isPickup
                        ? "Heure de retrait souhaitée, allergies..."
                        : "Instructions spéciales, code d'accès, étage..."
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
                    <Clock size={16} className="text-gold" /> Temps estimé de livraison
                  </h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-lg font-bold text-dark">{estimatedTime.prep} min</p>
                      <p className="text-xs text-muted">Préparation</p>
                    </div>
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-lg font-bold text-dark">{estimatedTime.travel} min</p>
                      <p className="text-xs text-muted">Trajet ({estimatedTime.distance} km)</p>
                    </div>
                    <div className="bg-gold/20 rounded-xl p-3">
                      <p className="text-lg font-bold text-gold-dark">{estimatedTime.total} min</p>
                      <p className="text-xs text-gold-dark font-semibold">Total estimé</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment methods */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/[0.05]">
                <h2 className="font-serif font-bold text-dark text-lg mb-5 flex items-center gap-2">
                  <CreditCard size={18} className="text-gold" /> Mode de paiement
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
                              <Lock size={8} /> Coming soon
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
                <h2 className="font-serif font-bold text-dark text-lg mb-5">Résumé</h2>

                {/* Mode badge */}
                <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg text-xs font-bold ${isPickup ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                  {isPickup ? <Store size={14} /> : <Truck size={14} />}
                  {isPickup ? 'Retrait sur place' : detectedQuartier?.matched ? `Livraison — ${detectedQuartier.zone.quartier}` : 'Livraison à domicile'}
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
                    <span className="text-muted">Sous-total</span>
                    <span className="text-dark">{subtotal.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">
                      {isPickup ? 'Retrait' : 'Livraison'}
                    </span>
                    <span className={`font-semibold ${isPickup ? 'text-green-600' : detectedQuartier?.matched ? 'text-dark' : 'text-amber-600'}`}>
                      {isPickup
                        ? 'Gratuit'
                        : detectedQuartier?.matched
                          ? `${deliveryFee.toFixed(2)} MAD`
                          : 'À confirmer'
                      }
                    </span>
                  </div>

                  {/* Estimated time in summary */}
                  {!isPickup && estimatedTime && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted flex items-center gap-1"><Clock size={12} /> Estimé</span>
                      <span className="text-dark font-semibold">{estimatedTime.total} min</span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg pt-2 border-t border-black/[0.06]">
                    <span className="font-bold text-dark">Total</span>
                    <span className="font-bold text-gold-dark">{total.toFixed(2)} MAD</span>
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-xs mt-3">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-gold w-full justify-center text-sm mt-5 disabled:opacity-50"
                >
                  {submitting ? 'Envoi en cours...' : 'Confirmer la commande'}
                </button>

                <p className="text-center text-xs text-muted mt-3">
                  En confirmant, vous acceptez nos conditions de service
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
