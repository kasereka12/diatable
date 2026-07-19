import { useState } from 'react'
import { X, Bike, CheckCircle, Clock, AlertCircle, Zap, Send } from 'lucide-react'
import { supabase, callEdgeFunction } from '../lib/supabase'
import { useDeliveryDrivers, VEHICLE_LABEL } from '../hooks/useDeliveryDrivers'
import { autoAssignDriver, type AssignResult } from '../lib/driverAssignment'

interface Props {
  orderId: string
  restaurantId: string
  currentDriverId?: string | null
  onClose: () => void
  onAssigned: (driverId: string, driverName: string) => void
}

export default function AssignDriverModal({ orderId, restaurantId, currentDriverId, onClose, onAssigned }: Props) {
  const { drivers, loading } = useDeliveryDrivers(restaurantId)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [autoLoading, setAutoLoading] = useState(false)
  const [autoResult, setAutoResult] = useState<AssignResult | null>(null)

  async function runAutoAssign() {
    setAutoLoading(true)
    setError(null)
    setAutoResult(null)
    try {
      const result = await autoAssignDriver(orderId, restaurantId)
      setAutoResult(result)
      if (result.method === 'restaurant') {
        onAssigned(result.driver.id, result.driver.full_name)
        // Laisse le vendeur voir la confirmation avant de fermer
        setTimeout(onClose, 1400)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setAutoLoading(false)
    }
  }

  async function assign(driverId: string, driverName: string) {
    setAssigning(driverId)
    setError(null)
    try {
      const { error: dbErr } = await (supabase
        .from('orders') as any)
        .update({ driver_id: driverId })
        .eq('id', orderId)

      if (dbErr) throw new Error(dbErr.message)

      // Recalcule l'ETA avec le nouveau livreur
      await callEdgeFunction('estimate-delivery', { order_id: orderId })

      onAssigned(driverId, driverName)
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setAssigning(null)
    }
  }

  async function unassign() {
    setAssigning('unassign')
    setError(null)
    try {
      await (supabase.from('orders') as any).update({ driver_id: null }).eq('id', orderId)
      onAssigned('', '')
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setAssigning(null)
    }
  }

  const available = drivers.filter(d => d.is_available)
  const busy      = drivers.filter(d => !d.is_available)

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: 'fadeInUp 0.25s ease both' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c5611a]/10 flex items-center justify-center">
              <Bike size={16} className="text-[#c5611a]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-dark text-base">Assigner un livreur</h3>
              <p className="text-xs text-muted">Commande #{orderId.slice(0, 8)}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-black/[0.06] flex items-center justify-center text-muted transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2.5 mb-4">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Attribution automatique */}
          {!currentDriverId && (
            <div className="mb-4">
              <button
                onClick={runAutoAssign}
                disabled={autoLoading || loading}
                className="w-full flex items-center justify-center gap-2 bg-[#c5611a] hover:bg-[#d9722a] text-white text-sm font-bold py-3 rounded-xl transition-all disabled:opacity-60"
              >
                <Zap size={16} />
                {autoLoading ? 'Attribution en cours…' : 'Attribuer automatiquement'}
              </button>

              {/* Résultat de l'algo */}
              {autoResult?.method === 'restaurant' && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-3 py-2.5 mt-3">
                  <CheckCircle size={15} className="shrink-0" />
                  <span><strong>{autoResult.driver.full_name}</strong> (rattaché) a été assigné automatiquement
                    {autoResult.distanceKm != null && <> — {autoResult.distanceKm.toFixed(1)} km du restaurant</>}.
                  </span>
                </div>
              )}
              {autoResult?.method === 'external_offer' && (
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-xl px-3 py-2.5 mt-3">
                  <Send size={15} className="shrink-0 mt-0.5" />
                  <span>Aucun livreur rattaché disponible. Proposition envoyée à{' '}
                    <strong>{autoResult.offered.length} livreur{autoResult.offered.length > 1 ? 's' : ''} externe{autoResult.offered.length > 1 ? 's' : ''}</strong>.
                    Le premier qui accepte sera assigné.
                  </span>
                </div>
              )}
              {autoResult?.method === 'none' && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-3 py-2.5 mt-3">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>Aucun livreur disponible pour le moment. Réessayez plus tard.</span>
                </div>
              )}

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-black/[0.08]" />
                <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted">ou manuellement</span>
                <div className="flex-1 h-px bg-black/[0.08]" />
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-black/[0.04] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-8">
              <Bike size={36} className="text-black/20 mx-auto mb-2" />
              <p className="text-sm font-semibold text-dark mb-1">Aucun livreur disponible</p>
              <p className="text-xs text-muted">Ajoutez des livreurs depuis le tableau de bord admin.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {available.length > 0 && (
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-green-600 mb-2">
                    Disponibles ({available.length})
                  </p>
                  <div className="space-y-2">
                    {available.map(d => (
                      <DriverRow
                        key={d.id}
                        driver={d}
                        isCurrent={d.id === currentDriverId}
                        assigning={assigning}
                        onAssign={assign}
                      />
                    ))}
                  </div>
                </div>
              )}

              {busy.length > 0 && (
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted mb-2">
                    Occupés ({busy.length})
                  </p>
                  <div className="space-y-2">
                    {busy.map(d => (
                      <DriverRow
                        key={d.id}
                        driver={d}
                        isCurrent={d.id === currentDriverId}
                        assigning={assigning}
                        onAssign={assign}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {currentDriverId && (
          <div className="px-6 py-3 border-t border-black/[0.06] bg-black/[0.02]">
            <button
              onClick={unassign}
              disabled={assigning === 'unassign'}
              className="w-full text-sm text-red-500 hover:text-red-600 font-semibold py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {assigning === 'unassign' ? 'Retrait…' : 'Retirer le livreur assigné'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function DriverRow({ driver, isCurrent, assigning, onAssign }: {
  driver: ReturnType<typeof useDeliveryDrivers>['drivers'][number]
  isCurrent: boolean
  assigning: string | null
  onAssign: (id: string, name: string) => void
}) {
  const isLoading = assigning === driver.id

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
      isCurrent
        ? 'border-[#c5611a]/40 bg-[#c5611a]/[0.04]'
        : 'border-black/[0.06] hover:border-black/15 hover:bg-black/[0.02]'
    }`}>
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
        driver.is_available ? 'bg-green-100 text-green-700' : 'bg-black/[0.06] text-muted'
      }`}>
        {driver.full_name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-dark truncate">
          {driver.full_name}
          {isCurrent && <span className="ml-1.5 text-[0.6rem] font-bold text-[#c5611a] bg-[#c5611a]/10 px-1.5 py-0.5 rounded-full">assigné</span>}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {driver.vehicle_type && (
            <span className="text-[0.68rem] text-muted">{VEHICLE_LABEL[driver.vehicle_type]}</span>
          )}
          <span className={`text-[0.62rem] font-bold flex items-center gap-0.5 ${
            driver.is_available ? 'text-green-600' : 'text-muted'
          }`}>
            {driver.is_available
              ? <><CheckCircle size={9} /> Disponible</>
              : <><Clock size={9} /> Occupé</>
            }
          </span>
          <span className="text-[0.62rem] text-muted/60">
            {driver.type === 'external' ? 'Externe' : 'Restaurant'}
          </span>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => onAssign(driver.id, driver.full_name)}
        disabled={!!assigning}
        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
          isCurrent
            ? 'bg-[#c5611a] text-white'
            : 'bg-dark text-white hover:bg-[#c5611a]'
        }`}
      >
        {isLoading ? '…' : isCurrent ? 'Réassigner' : 'Assigner'}
      </button>
    </div>
  )
}
