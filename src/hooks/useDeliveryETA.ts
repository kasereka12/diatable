import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase, callEdgeFunction } from '../lib/supabase'

export interface DeliveryETA {
  eta_min:       number
  prep_left_min: number
  travel_min:    number
  distance_text: string
  estimated_at:  string
  status:        string
  has_traffic:   boolean
  loading:       boolean
  error:         string | null
}

const REFRESH_INTERVAL_MS = 2 * 60 * 1000  // recalcul toutes les 2 min (trafic évolue)

// Statuts qui bénéficient d'un rafraîchissement périodique du trafic
const LIVE_STATUSES = new Set(['confirmed', 'preparing', 'ready'])

export function useDeliveryETA(orderId: string | null): DeliveryETA {
  const [eta, setEta] = useState<Omit<DeliveryETA, 'loading' | 'error'> | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error,   setError]     = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetch = useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    setError(null)
    try {
      const res  = await callEdgeFunction('estimate-delivery', { order_id: orderId })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur estimation')
      setEta(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  // Appel initial + écoute Realtime sur le statut de la commande
  useEffect(() => {
    if (!orderId) return

    fetch()

    const channel = supabase
      .channel(`order-eta-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          // Recalcule l'ETA à chaque changement de statut
          if (payload.new.status !== payload.old.status) fetch()
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orderId, fetch])

  // Rafraîchissement périodique pendant que la commande est en route
  useEffect(() => {
    if (!eta || !LIVE_STATUSES.has(eta.status)) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(fetch, REFRESH_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [eta?.status, fetch])

  return {
    ...(eta ?? {
      eta_min: 0, prep_left_min: 0, travel_min: 0,
      distance_text: '', estimated_at: '', status: '', has_traffic: false,
    }),
    loading,
    error,
  }
}
