import { useVendeurDetail } from './useVendeurDetail'
import type { RestaurantDetail, MenuByCategory } from '../types/supabase'

// Single embedded query: restaurant + menu_items in one round-trip.
// Review details are fetched separately (paginated) via useAvis.
export function useRestaurantDetail(id: string | null | undefined): {
  restaurant:     RestaurantDetail | null
  menuByCategory: MenuByCategory
  loading:        boolean
  error:          string | null
} {
  const { data, menuByCategory, isLoading: loading, error } = useVendeurDetail(id)
  return {
    restaurant:     data ?? null,
    menuByCategory,
    loading,
    error: error?.message ?? null,
  }
}
