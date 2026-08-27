import { useState, useEffect } from 'react'
import type React from 'react'
import { supabase, callEdgeFunction } from '../../lib/supabase'
import { Bike, Plus, Phone, CheckCircle, Clock, X, AlertCircle, Camera, FileText, PauseCircle, PlayCircle, Trash2, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { VEHICLE_LABEL } from '../../hooks/useDeliveryDrivers'
import { useConfirm } from '../../context/ConfirmContext'

type DocKey = 'license' | 'front' | 'back' | 'left' | 'right'

interface Driver {
  id: string
  full_name: string
  phone: string | null
  vehicle_type: string | null
  is_available: boolean
  is_active: boolean
  is_suspended: boolean
  license_number: string | null
  license_photo_url: string | null
  vehicle_brand: string | null
  vehicle_plate: string | null
  photo_front: string | null
  photo_back: string | null
  photo_left: string | null
  photo_right: string | null
}

function PhotoPicker({ label, preview, onChange, compact }: {
  label: string; preview?: string | null; onChange: (f: File | null) => void; compact?: boolean
}) {
  const inputId = 'vendor-driver-doc-' + label.replace(/\s+/g, '-').toLowerCase()
  return (
    <div>
      {!compact && (
        <label className="block text-xs font-semibold text-dark/60 mb-1.5 uppercase tracking-wide">{label}</label>
      )}
      <label htmlFor={inputId}
        className="relative flex flex-col items-center justify-center rounded-xl border border-dashed cursor-pointer overflow-hidden transition-all hover:border-[#c5611a]/50 border-black/15 bg-black/[0.02]"
        style={{ height: compact ? 80 : 100 }}>
        {preview ? (
          <img src={preview} alt={label} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <>
            {compact ? <Camera size={16} className="text-gray-300" /> : <FileText size={20} className="text-gray-300" />}
            {compact && <span className="text-[0.6rem] mt-1 text-gray-400">{label}</span>}
          </>
        )}
        <input id={inputId} type="file" accept="image/*" className="hidden"
          onChange={e => onChange(e.target.files?.[0] || null)} />
      </label>
    </div>
  )
}

export default function VendorDrivers({ restaurantId }: { restaurantId: string }) {
  const confirm = useConfirm()
  const [drivers, setDrivers]   = useState<Driver[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [toggling, setToggling] = useState<string | null>(null)

  const [form, setForm] = useState({
    full_name: '', phone: '', vehicle_type: 'moto',
    vehicle_brand: '', vehicle_plate: '', license_number: '',
    email: '', password: '',
  })
  const [showPwd, setShowPwd] = useState(false)
  const [files, setFiles] = useState<Record<DocKey, File | null>>({
    license: null, front: null, back: null, left: null, right: null,
  })
  const [previews, setPreviews] = useState<Partial<Record<DocKey, string>>>({})

  useEffect(() => { load() }, [restaurantId])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('delivery_drivers')
      .select('id, full_name, phone, vehicle_type, is_available, is_active, is_suspended, license_number, license_photo_url, vehicle_brand, vehicle_plate, photo_front, photo_back, photo_left, photo_right')
      .eq('restaurant_id', restaurantId)
      .eq('type', 'restaurant')
      .order('full_name')
    setDrivers((data || []) as Driver[])
    setLoading(false)
  }

  function pick(key: DocKey, file: File | null) {
    setFiles(prev => ({ ...prev, [key]: file }))
    if (file) setPreviews(prev => ({ ...prev, [key]: URL.createObjectURL(file) }))
  }

  async function uploadDoc(tempId: string, key: DocKey, file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const path = `${tempId}/${key}_${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('driver-documents').upload(path, file, { upsert: true })
    if (upErr) throw upErr
    const { data } = supabase.storage.from('driver-documents').getPublicUrl(path)
    return data?.publicUrl || ''
  }

  async function addDriver(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.full_name.trim())      return setError('Le nom est requis.')
    if (!form.email.trim())          return setError('L\'adresse email est requise — elle servira à la connexion du livreur.')
    if (form.password.length < 6)    return setError('Le mot de passe doit contenir au moins 6 caractères.')
    if (!form.vehicle_brand.trim())  return setError('La marque du véhicule est requise.')
    if (!form.vehicle_plate.trim())  return setError("La plaque d'immatriculation est requise.")
    if (!form.license_number.trim()) return setError('Le numéro de permis est requis.')
    if (!files.license) return setError('La photo du permis de conduire est requise.')
    if (!files.front || !files.back || !files.left || !files.right) {
      return setError('Les 4 photos du véhicule (avant, arrière, gauche, droite) sont requises.')
    }

    setSaving(true)
    try {
      const tempId = crypto.randomUUID()
      const [license_photo_url, photo_front, photo_back, photo_left, photo_right] = await Promise.all([
        uploadDoc(tempId, 'license', files.license),
        uploadDoc(tempId, 'front', files.front),
        uploadDoc(tempId, 'back', files.back),
        uploadDoc(tempId, 'left', files.left),
        uploadDoc(tempId, 'right', files.right),
      ])

      const { data: { session } } = await supabase.auth.getSession()
      const res = await callEdgeFunction('create-internal-driver', {
        restaurant_id: restaurantId,
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim(),
        password: form.password,
        vehicle_type: form.vehicle_type,
        vehicle_brand: form.vehicle_brand.trim(),
        vehicle_plate: form.vehicle_plate.trim(),
        license_number: form.license_number.trim(),
        license_photo_url, photo_front, photo_back, photo_left, photo_right,
      }, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création du livreur.')

      setForm({ full_name: '', phone: '', vehicle_type: 'moto', vehicle_brand: '', vehicle_plate: '', license_number: '', email: '', password: '' })
      setFiles({ license: null, front: null, back: null, left: null, right: null })
      setPreviews({})
      setShowForm(false)
      load()
    } catch (err) {
      setError((err as Error).message || 'Une erreur est survenue.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleAvailable(id: string, current: boolean) {
    setToggling(id)
    await (supabase.from('delivery_drivers') as any).update({ is_available: !current }).eq('id', id)
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, is_available: !current } : d))
    setToggling(null)
  }

  async function toggleSuspend(id: string, current: boolean) {
    setToggling(id + '_susp')
    await (supabase.from('delivery_drivers') as any).update({ is_suspended: !current }).eq('id', id)
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, is_suspended: !current } : d))
    setToggling(null)
  }

  async function deleteDriver(id: string, name: string) {
    if (!(await confirm(`Supprimer définitivement ${name} ? Il ne pourra plus se connecter. Cette action est irréversible.`))) return
    setToggling(id + '_del')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await callEdgeFunction('delete-internal-driver', { driver_id: id }, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression.')
      setDrivers(prev => prev.filter(d => d.id !== id))
    } catch (err) {
      setError((err as Error).message || 'Une erreur est survenue.')
    } finally {
      setToggling(null)
    }
  }

  const inputCls = 'w-full border border-black/[0.10] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#c5611a]/60 transition-all'
  const photoSlots: { key: DocKey; label: string }[] = [
    { key: 'front', label: 'Avant' },
    { key: 'back',  label: 'Arrière' },
    { key: 'left',  label: 'Gauche' },
    { key: 'right', label: 'Droite' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-serif font-bold text-dark flex items-center gap-2">
          <Bike size={24} className="text-[#c5611a]" /> Mes livreurs
        </h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 bg-[#c5611a] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#d9722a] transition-colors"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Annuler' : 'Ajouter un livreur'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={addDriver} className="bg-white rounded-xl border border-black/[0.06] p-5 space-y-4 shadow-sm">
          <h3 className="font-semibold text-dark text-sm">Nouveau livreur rattaché</h3>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2.5">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-dark/60 mb-1.5 uppercase tracking-wide">Nom complet *</label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Ex : Karim Alaoui"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/60 mb-1.5 uppercase tracking-wide">Téléphone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+212 6XX XXX XXX"
                className={inputCls}
              />
            </div>
          </div>

          <div className="bg-black/[0.02] border border-black/[0.06] rounded-xl p-3.5 space-y-3">
            <p className="text-xs font-semibold text-dark/60 uppercase tracking-wide">Identifiants de connexion du livreur</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-dark/60 mb-1.5 uppercase tracking-wide">Email *</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="livreur@email.com"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark/60 mb-1.5 uppercase tracking-wide">Mot de passe *</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                    className={`${inputCls} pl-9 pr-9`}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[0.7rem] text-gray-400">Le livreur utilisera cet email et ce mot de passe pour se connecter à son espace livreur.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark/60 mb-2 uppercase tracking-wide">Véhicule</label>
            <div className="inline-flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border border-black/10 bg-black/[0.02] text-dark/60">
              <Bike size={15} /> Moto
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-dark/60 mb-1.5 uppercase tracking-wide">Marque du véhicule *</label>
              <input
                type="text"
                value={form.vehicle_brand}
                onChange={e => setForm(p => ({ ...p, vehicle_brand: e.target.value }))}
                placeholder="Ex : Honda"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/60 mb-1.5 uppercase tracking-wide">Plaque d'immatriculation *</label>
              <input
                type="text"
                value={form.vehicle_plate}
                onChange={e => setForm(p => ({ ...p, vehicle_plate: e.target.value }))}
                placeholder="Ex : 12345-A-6"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark/60 mb-1.5 uppercase tracking-wide">Numéro de permis de conduire *</label>
            <input
              type="text"
              value={form.license_number}
              onChange={e => setForm(p => ({ ...p, license_number: e.target.value }))}
              placeholder="Ex : B123456"
              className={inputCls}
            />
          </div>

          <PhotoPicker
            label="Photo du permis de conduire *"
            preview={previews.license}
            onChange={f => pick('license', f)}
          />

          <div>
            <label className="block text-xs font-semibold text-dark/60 mb-2 uppercase tracking-wide">Photos du véhicule (4 angles) *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {photoSlots.map(s => (
                <PhotoPicker key={s.key} label={s.label} compact
                  preview={previews[s.key]}
                  onChange={f => pick(s.key, f)} />
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl px-3 py-2.5">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            <span>Ce livreur sera créé inactif — il ne recevra des courses qu'une fois validé par l'équipe DiaTable.</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-[#c5611a] text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-[#d9722a] transition-colors disabled:opacity-60"
          >
            {saving ? 'Ajout…' : 'Ajouter'}
          </button>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-black/[0.04] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : drivers.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-black/[0.06]">
          <Bike size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-dark mb-1">Aucun livreur rattaché</p>
          <p className="text-sm text-gray-400">Ajoutez des livreurs internes à votre restaurant.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {drivers.map(d => (
            <div key={d.id} className={`bg-white rounded-xl border p-4 flex items-center gap-3 ${
              d.is_active && !d.is_suspended ? 'border-black/[0.06]' : 'border-black/[0.04] opacity-60'
            }`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                d.is_available && d.is_active && !d.is_suspended ? 'bg-green-100 text-green-700' : 'bg-black/[0.06] text-gray-400'
              }`}>
                {d.full_name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark truncate">{d.full_name}</p>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  {d.phone && (
                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                      <Phone size={10} /> {d.phone}
                    </span>
                  )}
                  {d.vehicle_type && (
                    <span className="text-xs text-gray-400">{VEHICLE_LABEL[d.vehicle_type] ?? d.vehicle_type}</span>
                  )}
                  {d.is_suspended ? (
                    <span className="text-[0.62rem] font-bold flex items-center gap-0.5 text-red-600">
                      <PauseCircle size={9} /> Suspendu
                    </span>
                  ) : d.is_active ? (
                    <span className={`text-[0.62rem] font-bold flex items-center gap-0.5 ${
                      d.is_available ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {d.is_available ? <><CheckCircle size={9} /> Disponible</> : <><Clock size={9} /> Occupé</>}
                    </span>
                  ) : (
                    <span className="text-[0.62rem] font-bold flex items-center gap-0.5 text-amber-600">
                      <Clock size={9} /> En attente de validation
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-center">
                  <p className="text-[0.58rem] font-semibold text-gray-400 mb-1">Dispo</p>
                  <button
                    onClick={() => toggleAvailable(d.id, d.is_available)}
                    disabled={!!toggling || !d.is_active || d.is_suspended}
                    className={`relative w-9 h-5 rounded-full transition-colors disabled:opacity-40 ${
                      d.is_available ? 'bg-green-500' : 'bg-black/15'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                      d.is_available ? 'left-[calc(100%-1.125rem)]' : 'left-0.5'
                    }`} />
                  </button>
                </div>

                <button
                  onClick={() => toggleSuspend(d.id, d.is_suspended)}
                  disabled={toggling === d.id + '_susp'}
                  title={d.is_suspended ? 'Réactiver' : 'Suspendre'}
                  className={`p-2 rounded-lg border transition-all disabled:opacity-40 ${
                    d.is_suspended
                      ? 'border-green-200 text-green-600 hover:bg-green-50'
                      : 'border-amber-200 text-amber-600 hover:bg-amber-50'
                  }`}
                >
                  {d.is_suspended ? <PlayCircle size={15} /> : <PauseCircle size={15} />}
                </button>

                <button
                  onClick={() => deleteDriver(d.id, d.full_name)}
                  disabled={toggling === d.id + '_del'}
                  title="Supprimer"
                  className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all disabled:opacity-40"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
