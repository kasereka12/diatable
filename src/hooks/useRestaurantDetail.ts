import { useVendeurDetail } from './useVendeurDetail'
import type { RestaurantDetail, MenuByCategory, ReviewWithAuthor } from '../types/supabase'

// Single embedded query: restaurant + reviews + menu_items in one round-trip
export function useRestaurantDetail(id: string | null | undefined): {
  restaurant:     RestaurantDetail | null
  menuByCategory: MenuByCategory
  reviews:        ReviewWithAuthor[]
  loading:        boolean
  error:          string | null
} {
  const { data, menuByCategory, isLoading: loading, error } = useVendeurDetail(id)
  return {
    restaurant:     data          ?? null,
    menuByCategory,
    reviews:        data?.reviews ?? [],
    loading,
    error:          error?.message ?? null,
  }
}
