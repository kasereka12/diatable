import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { MenuItem, MenuByCategory } from '../types/supabase'

export async function fetchPlats(restaurantId: string): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_available', true)
    .order('category')
  if (error) throw error
  return data || []
}

export function usePlats(restaurantId: string | null | undefined) {
  const query = useQuery({
    queryKey: ['vendeur', restaurantId, 'plats'],
    queryFn:  () => fetchPlats(restaurantId as string),
    enabled:  !!restaurantId,
  })

  const menuByCategory = useMemo<MenuByCategory>(() => {
    return (query.data || []).reduce<MenuByCategory>((acc, item) => {
      const cat = item.category || 'Plats Principaux'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item)
      return acc
    }, {})
  }, [query.data])

  return { ...query, menuByCategory }
}
