import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { RestaurantDetail, MenuItem, MenuByCategory, ReviewWithAuthor } from '../types/supabase'

// Single round-trip: restaurant + reviews (with author names) + menu items
export async function fetchVendeurDetail(id: string): Promise<RestaurantDetail> {
  const { data, error } = await supabase
    .from('restaurants')
    .select(`
      *,
      reviews(id, rating, text, created_at, profiles(full_name)),
      menu_items(id, name, description, price, category, prep_time_min, image_url, is_available)
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  const rawReviews = (data as unknown as { reviews: Array<{
    id: string; rating: number; text: string | null; created_at: string
    profiles: { full_name: string | null } | null
  }> }).reviews || []

  const reviews: ReviewWithAuthor[] = rawReviews
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20)
    .map(rv => ({
      id:            rv.id,
      restaurant_id: id,
      user_id:       null,
      rating:        rv.rating,
      text:          rv.text,
      created_at:    rv.created_at,
      profiles:      rv.profiles,
      initials: (rv.profiles?.full_name || 'U')
        .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
      name: rv.profiles?.full_name || 'Utilisateur',
      date: new Date(rv.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
      }),
    }))

  const rawMenuItems = (data as unknown as { menu_items: MenuItem[] }).menu_items || []
  const menu_items: MenuItem[] = rawMenuItems
    .filter((m: MenuItem) => m.is_available)
    .sort((a: MenuItem, b: MenuItem) => (a.category || '').localeCompare(b.category || ''))

  return { ...(data as unknown as RestaurantDetail), reviews, menu_items }
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
