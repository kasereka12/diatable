import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import { getCuisineIcon } from '../lib/cuisineIcons'
import { getGradient } from '../lib/gradients'
import { editProfileSchema, changePasswordSchema, flattenErrors } from '../lib/schemas'
import { FormInput } from '../components/ui/FormInput'
import PaginationControls from '../components/ui/PaginationControls'
import {
  Package, Heart, Settings, MapPin, Check, ChefHat, Utensils,
  MessageCircle, Clock, ArrowRight, ShoppingBag, X
} from 'lucide-react'

const FAVORITES_PAGE_SIZE = 9

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  confirmed: 'bg-blue-50 text-blue-600',
  preparing: 'bg-orange-50 text-orange-600',
  ready: 'bg-purple-50 text-purple-600',
  delivered: 'bg-green-50 text-green-600',
  cancelled: 'bg-red-50 text-red-600',
}

export default function Profile() {
  const { t, i18n } = useTranslation()
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const isCustomer = !profile?.role || profile?.role === 'client'
  const [activeTab, setActiveTab] = useState(isCustomer ? 'commandes' : 'favoris')
  const [editInfoOpen, setEditInfoOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  const STATUS_LABELS = {
    pending: t('profile.status_pending'),
    confirmed: t('profile.status_confirmed'),
    preparing: t('profile.status_preparing'),
    ready: t('profile.status_ready'),
    delivered: t('profile.status_delivered'),
    cancelled: t('profile.status_cancelled'),
  }

  const TABS = [
    ...(isCustomer ? [{ id: 'commandes', label: t('profile.tab_orders'), Icon: Package }] : []),
    { id: 'favoris', label: t('profile.tab_favorites'), Icon: Heart },
    { id: 'compte', label: t('profile.tab_account'), Icon: Settings },
  ]

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || t('profile.default_user')
  const initials    = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const dateLocale = i18n.language?.startsWith('en') ? 'en-US' : 'fr-FR'

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['profile', 'orders', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, restaurant:restaurants(name, cuisine, cuisine_label, flag)')
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10)
      return (data || []) as any[]
    },
    enabled: !!user,
  })

  const [favoritesPage, setFavoritesPage] = useState(0)
  const { data: favoritesResult, isLoading: loadingFavorites } = useQuery({
    queryKey: ['profile', 'favorites', user?.id, favoritesPage],
    queryFn: async () => {
      const from = favoritesPage * FAVORITES_PAGE_SIZE
      const to = from + FAVORITES_PAGE_SIZE - 1
      const { data, count } = await supabase
        .from('restaurant_likes')
        .select('*, restaurant:restaurants(id, name, cuisine, cuisine_label, flag, gradient, location, image_url)', { count: 'exact' })
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .range(from, to)
      return {
        data: ((data || []) as any[]).map((l: any) => l.restaurant).filter(Boolean),
        count: count ?? 0,
      }
    },
    enabled: !!user,
    placeholderData: keepPreviousData,
  })
  const favorites = favoritesResult?.data ?? []
  const favoritesTotalPages = Math.max(1, Math.ceil((favoritesResult?.count ?? 0) / FAVORITES_PAGE_SIZE))

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="bg-cream min-h-screen pt-24">
      {/* Header */}
      <div className="bg-dark pt-12 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 zellige-pattern opacity-30" />
        <div className="relative max-w-4xl mx-auto px-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center font-serif text-2xl font-black text-dark flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#f4a828,#c8841a)' }}>
            {initials}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-white">{displayName}</h1>
            <p className="text-muted text-sm mt-0.5">{user?.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 bg-gold/15 border border-gold/30 text-gold text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {profile?.role === 'vendor'
                ? <><ChefHat size={12} /> {t('profile.role_vendor')}</>
                : profile?.role === 'admin'
                ? <><Settings size={12} /> {t('profile.role_admin')}</>
                : <><Utensils size={12} /> {t('profile.role_client')}</>
              }
            </span>
          </div>
          <div className="ml-auto flex gap-2">
            {profile?.role === 'vendor' && (
              <Link to="/tableau-de-bord" className="btn btn-gold text-sm">
                {t('profile.dashboard')}
              </Link>
            )}
            {profile?.role === 'admin' && (
              <Link to="/admin" className="btn btn-gold text-sm">
                {t('profile.admin_dashboard')}
              </Link>
            )}
            <Link to="/messages" className="btn btn-outline text-sm px-4 py-2.5 flex items-center gap-1.5">
              <MessageCircle size={14} /> Messages
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-4">
        {/* Nav tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/[0.05] p-1.5 flex gap-1 mb-8">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5
                ${activeTab === tab.id ? 'bg-gold text-dark shadow-sm' : 'text-muted hover:text-dark'}`}>
              <tab.Icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Commandes */}
        {activeTab === 'commandes' && isCustomer && (
          <div className="space-y-4 pb-12">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-dark">{t('profile.last_orders')}</h2>
              <Link to="/mes-commandes" className="text-gold text-sm font-semibold flex items-center gap-1 hover:underline">
                {t('profile.see_all')} <ArrowRight size={14} />
              </Link>
            </div>

            {loadingOrders ? (
              <div className="text-center py-12 text-muted text-sm">{t('profile.loading')}</div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-black/[0.05]">
                <ShoppingBag size={40} className="text-muted/20 mx-auto mb-3" />
                <p className="font-serif font-bold text-dark mb-2">{t('profile.no_orders')}</p>
                <p className="text-muted text-sm mb-5">{t('profile.no_orders_sub')}</p>
                <Link to="/restaurants" className="btn btn-gold text-sm">
                  {t('profile.explore_restaurants')}
                </Link>
              </div>
            ) : (
              orders.map(o => {
                const OrderIcon = getCuisineIcon(o.restaurant?.cuisine)
                const statusColor = STATUS_COLORS[o.status] || STATUS_COLORS.pending
                const statusLabel = (STATUS_LABELS as Record<string, string>)[o.status] || o.status

                return (
                  <Link
                    key={o.id}
                    to="/mes-commandes"
                    className="bg-white rounded-2xl p-5 shadow-sm border border-black/[0.05] flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md transition-all block"
                  >
                    <div className="w-14 h-14 rounded-xl bg-cream flex items-center justify-center flex-shrink-0">
                      <OrderIcon size={28} className="text-gold" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-dark text-sm">{o.restaurant?.name || 'Restaurant'}</div>
                      <div className="text-muted text-xs mt-0.5">
                        {new Date(o.created_at).toLocaleDateString(dateLocale, {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })} · #{o.id.slice(0, 8)}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-dark">{Number(o.total).toFixed(2)} MAD</div>
                      <span className={`inline-flex items-center gap-1 mt-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${statusColor}`}>
                        {o.status === 'delivered' ? <Check size={10} /> : <Clock size={10} />}
                        {statusLabel}
                      </span>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        )}

        {/* Favoris */}
        {activeTab === 'favoris' && (
          <div className="pb-12">
            <h2 className="font-serif text-xl font-bold text-dark mb-6">{t('profile.my_favorites')}</h2>

            {loadingFavorites ? (
              <div className="text-center py-12 text-muted text-sm">{t('profile.loading')}</div>
            ) : favorites.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-black/[0.05]">
                <Heart size={40} className="text-muted/20 mx-auto mb-3" />
                <p className="font-serif font-bold text-dark mb-2">{t('profile.no_favorites')}</p>
                <p className="text-muted text-sm mb-5">{t('profile.no_favorites_sub')}</p>
                <Link to="/restaurants" className="btn btn-gold text-sm">
                  {t('profile.explore_restaurants')}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {favorites.map(r => {
                  const FavIcon = getCuisineIcon(r.cuisine)
                  return (
                    <Link key={r.id} to={`/restaurants/${r.id}`}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-black/[0.05] hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                      <div className="h-32 relative overflow-hidden"
                        style={!r.image_url ? { background: getGradient(r.gradient) } : {}}>
                        {r.image_url ? (
                          <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <FavIcon size={40} className="text-white/90" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 text-red-400">
                          <Heart size={18} className="fill-red-400" />
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-serif font-bold text-sm text-dark mb-1 leading-snug">{r.name}</h3>
                        <p className="text-muted text-xs flex items-center gap-1">
                          <MapPin size={10} /> {r.location}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {!loadingFavorites && (
              <PaginationControls page={favoritesPage} totalPages={favoritesTotalPages} onPageChange={setFavoritesPage} className="mt-8" />
            )}
          </div>
        )}

        {/* Compte */}
        {activeTab === 'compte' && (
          <div className="pb-12 space-y-5">
            <h2 className="font-serif text-xl font-bold text-dark">{t('profile.account_info')}</h2>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/[0.05]">
              <div className="space-y-5">
                {[
                  { label: t('profile.field_name'), value: displayName },
                  { label: t('profile.field_email'), value: user?.email },
                  { label: t('profile.field_role'), value: profile?.role === 'vendor' ? t('profile.role_vendor') : t('profile.role_client') },
                  { label: t('profile.field_member_since'), value: profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' })
                    : 'Mars 2026'
                  },
                ].map(f => (
                  <div key={f.label} className="flex items-center justify-between py-3 border-b border-black/[0.05] last:border-0">
                    <span className="text-muted text-sm">{f.label}</span>
                    <span className="font-semibold text-dark text-sm">{f.value}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setEditInfoOpen(true)}
                className="mt-5 w-full py-3 rounded-xl border-2 border-gold text-gold-dark font-semibold text-sm hover:bg-gold hover:text-dark transition-all">
                {t('profile.edit_info')}
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/[0.05]">
              <h3 className="font-serif font-bold text-dark mb-4">{t('profile.security')}</h3>
              <button onClick={() => setChangePasswordOpen(true)}
                className="w-full py-3 rounded-xl border border-black/10 text-dark text-sm font-medium hover:bg-cream transition-all mb-3">
                {t('profile.change_password')}
              </button>
              <button onClick={handleSignOut}
                className="w-full py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-100 transition-all">
                {t('profile.sign_out')}
              </button>
            </div>
          </div>
        )}
      </div>

      {editInfoOpen && <EditInfoModal onClose={() => setEditInfoOpen(false)} />}
      {changePasswordOpen && <ChangePasswordModal onClose={() => setChangePasswordOpen(false)} />}
    </div>
  )
}

function EditInfoModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { user, profile, refreshProfile } = useAuth()
  const toast = useToast()
  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const result = editProfileSchema.safeParse({ fullName })
    if (!result.success) {
      setErrors(flattenErrors(result.error))
      return
    }
    setErrors({})
    setSaving(true)
    const { error } = await (supabase.from('profiles') as any).update({ full_name: result.data.fullName }).eq('id', user!.id)
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    await refreshProfile()
    toast.success(t('profile.save_success'))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition" aria-label={t('common.close')}>
          <X size={18} className="text-gray-400" />
        </button>

        <h3 className="font-serif font-bold text-dark text-lg mb-5">{t('profile.edit_info_title')}</h3>

        <FormInput
          label={t('profile.full_name_label')}
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          required
          className="mb-1"
        />
        {errors.fullName && <p className="text-red-500 text-xs mb-4">{errors.fullName}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            {t('common.cancel')}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gold text-white text-sm font-medium hover:bg-gold/90 transition disabled:opacity-60">
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { updatePassword } = useAuth()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const result = changePasswordSchema.safeParse({ password, confirm })
    if (!result.success) {
      setErrors(flattenErrors(result.error))
      return
    }
    setErrors({})
    setSaving(true)
    const { error } = await updatePassword(result.data.password)
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(t('profile.password_updated'))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition" aria-label={t('common.close')}>
          <X size={18} className="text-gray-400" />
        </button>

        <h3 className="font-serif font-bold text-dark text-lg mb-5">{t('profile.change_password_title')}</h3>

        <FormInput
          label={t('profile.new_password_label')}
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="mb-1"
        />
        {errors.password && <p className="text-red-500 text-xs mb-3">{errors.password}</p>}

        <FormInput
          label={t('profile.confirm_password_label')}
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
          className="mb-1 mt-4"
        />
        {errors.confirm && <p className="text-red-500 text-xs mb-4">{errors.confirm}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            {t('common.cancel')}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gold text-white text-sm font-medium hover:bg-gold/90 transition disabled:opacity-60">
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
