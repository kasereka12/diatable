import { useState, useEffect } from 'react'
import type React from 'react'
import { supabase } from '../../lib/supabase'
import { Bike, Plus, Phone, CheckCircle, Clock, X, AlertCircle } from 'lucide-react'
import { VEHICLE_LABEL } from '../../hooks/useDeliveryDrivers'

const VEHICLE_OPTIONS = [
  { value: 'moto',    label: '🛵 Moto' },
  { value: 'voiture', label: '🚗 Voiture' },
  { value: 'velo',    label: '🚲 Vélo' },
  { value: 'pieton',  label: '🚶 Piéton' },
]

interface Driver {
  id: string
  full_name: string
  phone: string | null
  vehicle_type: string | null
  is_available: boolean
  is_active: boolean
}

export default function VendorDrivers({ restaurantId }: { restaurantId: string }) {
  const [drivers, setDrivers]   = useState<Driver[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [toggling, setToggling] = useState<string | null>(null)

  const [form, setForm] = useState({ full_name: '', phone: '', vehicle_type: 'moto' })

  useEffect(() => { load() }, [restaurantId])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('delivery_drivers')
      .select('id, full_name, phone, vehicle_type, is_available, is_active')
      .eq('restaurant_id', restaurantId)
      .eq('type', 'restaurant')
      .order('full_name')
    setDrivers((data || []) as Driver[])
    setLoading(false)
  }

  async function addDriver(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.full_name.trim()) return setError('Le nom est requis.')
    setSaving(true)
    const { error: dbErr } = await supabase.from('delivery_drivers').insert({
      type: 'restaurant',
      restaurant_id: restaurantId,
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      vehicle_type: form.vehicle_type,
      is_active: true,
      is_available: true,
    })
    setSaving(false)
    if (dbErr) return setError(dbErr.message)
    setForm({ full_name: '', phone: '', vehicle_type: 'moto' })
    setShowForm(false)
    load()
  }

  async function toggleAvailable(id: string, current: boolean) {
    setToggling(id)
    await supabase.from('delivery_drivers').update({ is_available: !current }).eq('id', id)
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, is_available: !current } : d))
    setToggling(null)
  }

  async function toggleActive(id: string, current: boolean) {
    setToggling(id + '_a')
    await supabase.from('delivery_drivers').update({ is_active: !current }).eq('id', id)
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, is_active: !current } : d))
    setToggling(null)
  }

  const inputCls = 'w-full border border-black/[0.10] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#c5611a]/60 transition-all'

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

          <div>
            <label className="block text-xs font-semibold text-dark/60 mb-2 uppercase tracking-wide">Véhicule</label>
            <div className="flex gap-2 flex-wrap">
              {VEHICLE_OPTIONS.map(v => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, vehicle_type: v.value }))}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                    form.vehicle_type === v.value
                      ? 'bg-[#c5611a] border-[#c5611a] text-white'
                      : 'border-black/10 text-dark/60 hover:border-black/20'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
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
              d.is_active ? 'border-black/[0.06]' : 'border-black/[0.04] opacity-55'
            }`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                d.is_available && d.is_active ? 'bg-green-100 text-green-700' : 'bg-black/[0.06] text-gray-400'
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
                  <span className={`text-[0.62rem] font-bold flex items-center gap-0.5 ${
                    d.is_available ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {d.is_available ? <><CheckCircle size={9} /> Disponible</> : <><Clock size={9} /> Occupé</>}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-center">
                  <p className="text-[0.58rem] font-semibold text-gray-400 mb-1">Dispo</p>
                  <button
                    onClick={() => toggleAvailable(d.id, d.is_available)}
                    disabled={!!toggling || !d.is_active}
                    className={`relative w-9 h-5 rounded-full transition-colors disabled:opacity-40 ${
                      d.is_available ? 'bg-green-500' : 'bg-black/15'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                      d.is_available ? 'left-[calc(100%-1.125rem)]' : 'left-0.5'
                    }`} />
                  </button>
                </div>
                <div className="text-center">
                  <p className="text-[0.58rem] font-semibold text-gray-400 mb-1">Actif</p>
                  <button
                    onClick={() => toggleActive(d.id, d.is_active)}
                    disabled={!!toggling}
                    className={`relative w-9 h-5 rounded-full transition-colors disabled:opacity-40 ${
                      d.is_active ? 'bg-[#c5611a]' : 'bg-black/15'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                      d.is_active ? 'left-[calc(100%-1.125rem)]' : 'left-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
