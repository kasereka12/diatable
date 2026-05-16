import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Restaurant } from '../types/supabase'

export async function fetchVendeur(id: string): Promise<Restaurant> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export function useVendeur(id: string | null | undefined) {
  return useQuery({
    queryKey: ['vendeur', id],
    queryFn:  () => fetchVendeur(id as string),
    enabled:  !!id,
  })
}
