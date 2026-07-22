import { Clock, MapPin, Bike, CheckCircle, ChefHat, AlertCircle } from 'lucide-react'
import { useDeliveryETA } from '../hooks/useDeliveryETA'

const STATUS_STEPS = ['confirmed', 'preparing', 'ready', 'delivered'] as const

const STATUS_LABEL: Record<string, string> = {
  pending:    'En attente',
  confirmed:  'Confirmée',
  preparing:  'En préparation',
  ready:      'Prête — en route',
  delivered:  'Livrée',
  cancelled:  'Annulée',
}

interface Props {
  orderId: string
  className?: string
}

export default function DeliveryETA({ orderId, className = '' }: Props) {
  const { eta_min, prep_left_min, travel_min, distance_text,
          estimated_at, status, has_traffic, loading, error } = useDeliveryETA(orderId)

  if (status === 'cancelled') return null

  const stepIdx    = STATUS_STEPS.indexOf(status as typeof STATUS_STEPS[number])
  const isDelivered = status === 'delivered'

  return (
    <div className={`bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden ${className}`}>

      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg,#1f1f1f 0%,#2a2520 100%)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#c5611a]/20 flex items-center justify-center">
            {isDelivered
              ? <CheckCircle size={16} className="text-green-400" />
              : <Clock size={16} className="text-[#f4a828]" />
            }
          </div>
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white/40">
              Estimation de livraison
            </p>
            <p className="text-sm font-semibold text-white">
              {STATUS_LABEL[status] ?? status}
            </p>
          </div>
        </div>

        {/* ETA badge */}
        {!isDelivered && !loading && !error && eta_min > 0 && (
          <div
            className="px-3 py-1.5 rounded-full text-dark font-bold text-sm"
            style={{ backgroundColor: '#f4a828' }}
          >
            ~{eta_min} min
          </div>
        )}
        {loading && (
          <div className="w-7 h-7 rounded-full border-2 border-[#c5611a]/30 border-t-[#c5611a] animate-spin" />
        )}
      </div>

      {error ? (
        <div className="flex items-center gap-2 px-5 py-4 text-sm text-red-500">
          <AlertCircle size={15} /> {error}
        </div>
      ) : isDelivered ? (
        <div className="px-5 py-4 flex items-center gap-2 text-green-600 text-sm font-semibold">
          <CheckCircle size={16} /> Commande livrée avec succès
        </div>
      ) : (
        <>
          {/* Timeline statuts */}
          <div className="px-5 pt-4 pb-3">
            <div className="flex items-center gap-0">
              {STATUS_STEPS.map((s, i) => {
                const done    = i <= stepIdx
                const current = i === stepIdx
                return (
                  <div key={s} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                          done
                            ? 'bg-[#c5611a] border-[#c5611a]'
                            : 'bg-transparent border-black/15'
                        } ${current ? 'ring-2 ring-[#c5611a]/30 ring-offset-1' : ''}`}
                      >
                        {i === 0 && <CheckCircle size={12} className={done ? 'text-white' : 'text-black/20'} />}
                        {i === 1 && <ChefHat     size={12} className={done ? 'text-white' : 'text-black/20'} />}
                        {i === 2 && <Bike        size={12} className={done ? 'text-white' : 'text-black/20'} />}
                        {i === 3 && <CheckCircle size={12} className={done ? 'text-white' : 'text-black/20'} />}
                      </div>
                      <span className={`text-[0.58rem] font-medium whitespace-nowrap ${done ? 'text-[#c5611a]' : 'text-black/30'}`}>
                        {STATUS_LABEL[s]}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mb-4 mx-1 rounded-full transition-all ${i < stepIdx ? 'bg-[#c5611a]' : 'bg-black/10'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Détail prépa + trajet */}
          {!loading && (eta_min > 0 || distance_text) && (
            <div
              className="mx-5 mb-4 rounded-xl p-3 flex items-center gap-4 text-xs"
              style={{ backgroundColor: '#f5f3ef' }}
            >
              {prep_left_min > 0 && (
                <div className="flex items-center gap-1.5 text-[#80716a]">
                  <ChefHat size={13} className="text-[#c5611a]" />
                  <span>Prépa <strong className="text-dark">{prep_left_min} min</strong></span>
                </div>
              )}
              {travel_min > 0 && (
                <div className="flex items-center gap-1.5 text-[#80716a]">
                  <Bike size={13} className="text-[#c5611a]" />
                  <span>Trajet <strong className="text-dark">{travel_min} min</strong></span>
                  {has_traffic && (
                    <span className="text-[0.6rem] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-semibold">
                      trafic
                    </span>
                  )}
                </div>
              )}
              {distance_text && (
                <div className="flex items-center gap-1.5 text-[#80716a] ml-auto">
                  <MapPin size={13} className="text-[#c5611a]" />
                  <span>{distance_text}</span>
                </div>
              )}
            </div>
          )}

          {/* Heure estimée */}
          {estimated_at && !loading && (
            <p className="px-5 pb-4 text-[0.72rem] text-[#80716a]">
              Livraison estimée à{' '}
              <strong className="text-dark">
                {new Date(estimated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </strong>
              {has_traffic && ' (trafic pris en compte)'}
            </p>
          )}
        </>
      )}
    </div>
  )
}
