import { useState } from 'react'
import { X, Bike, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { supabase, callEdgeFunction } from '../lib/supabase'
import { useDeliveryDrivers, VEHICLE_LABEL } from '../hooks/useDeliveryDrivers'

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

  async function assign(driverId: string, driverName: string) {
    setAssigning(driverId)
    setError(null)
    try {
      const { error: dbErr } = await supabase
        .from('orders')
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
      await supabase.from('orders').update({ driver_id: null }).eq('id', orderId)
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
