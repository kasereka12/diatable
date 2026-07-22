import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface DeliveryDriver {
  id: string
  full_name: string
  phone: string | null
  vehicle_type: 'moto' | 'voiture' | 'velo' | 'pieton' | null
  type: 'external' | 'restaurant'
  restaurant_id: string | null
  is_available: boolean
  is_active: boolean
}

const VEHICLE_LABEL: Record<string, string> = {
  moto:    '🛵 Moto',
  voiture: '🚗 Voiture',
  velo:    '🚲 Vélo',
  pieton:  '🚶 Piéton',
}
export { VEHICLE_LABEL }

export function useDeliveryDrivers(restaurantId: string | null) {
  const [drivers, setDrivers]   = useState<DeliveryDriver[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!restaurantId) { setLoading(false); return }

    supabase
      .from('delivery_drivers')
      .select('*')
      .eq('is_active', true)
      .or(`restaurant_id.eq.${restaurantId},type.eq.external`)
      .order('is_available', { ascending: false })
      .order('full_name')
      .then(({ data }) => {
        setDrivers((data || []) as DeliveryDriver[])
        setLoading(false)
      })
  }, [restaurantId])

  return { drivers, loading }
}
