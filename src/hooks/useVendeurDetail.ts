import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { RestaurantDetail, MenuItem, MenuByCategory } from '../types/supabase'

// Single round-trip: restaurant (incl. trigger-maintained rating/reviews
// count) + menu items. Review *details* are fetched separately and
// paginated via useAvis — embedding them here used to pull every review
// row for the restaurant over the wire just to show the latest 20.
export async function fetchVendeurDetail(id: string): Promise<RestaurantDetail> {
  const { data, error } = await supabase
    .from('restaurants')
    .select(`
      *,
      menu_items(id, name, description, price, category, prep_time_min, image_url, is_available)
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  const rawMenuItems = (data as unknown as { menu_items: MenuItem[] }).menu_items || []
  const menu_items: MenuItem[] = rawMenuItems
    .filter((m: MenuItem) => m.is_available)
    .sort((a: MenuItem, b: MenuItem) => (a.category || '').localeCompare(b.category || ''))

  return { ...(data as unknown as RestaurantDetail), menu_items }
}

export function useVendeurDetail(id: string | null | undefined) {
  const query = useQuery({
    queryKey: ['vendeur', id, 'detail'],
    queryFn:  () => fetchVendeurDetail(id as string),
    enabled:  !!id,
  })

  const menuByCategory = useMemo<MenuByCategory>(() => {
    return (query.data?.menu_items || []).reduce<MenuByCategory>((acc, item) => {
      const cat = item.category || 'Plats Principaux'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item)
      return acc
    }, {})
  }, [query.data?.menu_items])

  return { ...query, menuByCategory }
}
