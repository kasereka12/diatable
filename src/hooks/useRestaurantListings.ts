import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { RestaurantWithPlan } from '../types/supabase'

export const PAGE_SIZE = 24

export interface RestaurantListingsFilters {
  cuisine?: string
  city?: string
  minRating?: number
  search?: string
  type?: 'restaurant' | 'homecook' | 'popup'
}

// Server-side filtered + paginated restaurant listing, backed by the
// restaurant_listings view (restaurants pre-joined with current plan +
// review stats, see migration 20260806). Replaces the old
// fetch-everything-then-filter-in-JS approach in useVendeurs, which doesn't
// scale past a small handful of restaurants.
export async function fetchRestaurantListings(
  filters: RestaurantListingsFilters,
  page: number,
): Promise<{ data: RestaurantWithPlan[]; count: number }> {
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('restaurant_listings')
    .select('*', { count: 'exact' })

  if (filters.type) query = query.eq('type', filters.type)
  if (filters.cuisine && filters.cuisine !== 'all') query = query.eq('cuisine', filters.cuisine)
  if (filters.city) query = query.eq('location', filters.city)
  if (filters.minRating) query = query.gte('rating', filters.minRating)
  if (filters.search) {
    const term = `%${filters.search.replace(/[%_]/g, '')}%`
    query = query.or(`name.ilike.${term},cuisine_label.ilike.${term}`)
  }

  const { data, error, count } = await query
    .order('plan_rank', { ascending: false })
    .order('reviews', { ascending: false })
    .range(from, to)

  if (error) throw error
  return { data: (data || []) as unknown as RestaurantWithPlan[], count: count ?? 0 }
}

export function useRestaurantListings(filters: RestaurantListingsFilters, page: number) {
  return useQuery({
    queryKey: ['restaurant-listings', filters, page],
    queryFn: () => fetchRestaurantListings(filters, page),
    // Keeps the previous page's rows on screen while the next page loads,
    // instead of flashing back to a loading skeleton on every click.
    placeholderData: keepPreviousData,
  })
}
