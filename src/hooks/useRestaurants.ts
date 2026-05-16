import { useVendeurs } from './useVendeurs'
import type { RestaurantWithPlan } from '../types/supabase'

interface RestaurantsFilters { cuisine?: string }

// Thin compatibility wrapper — delegates to useVendeurs (TanStack Query)
export function useRestaurants(filters: RestaurantsFilters = {}): {
  restaurants: RestaurantWithPlan[]
  loading:     boolean
  error:       string | null
} {
  const { data: restaurants = [], isLoading: loading, error } = useVendeurs(filters)
  return { restaurants, loading, error: error?.message ?? null }
}
