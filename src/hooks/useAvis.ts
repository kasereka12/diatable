import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Review, ReviewWithAuthor } from '../types/supabase'

type ReviewWithProfile = Review & { profiles?: { full_name: string | null } | null }

export const AVIS_PAGE_SIZE = 10

export async function fetchAvis(restaurantId: string, page = 0): Promise<{ data: ReviewWithAuthor[]; count: number }> {
  const from = page * AVIS_PAGE_SIZE
  const to = from + AVIS_PAGE_SIZE - 1
  const { data, error, count } = await supabase
    .from('reviews')
    .select('*, profiles(full_name)', { count: 'exact' })
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error) throw error

  return {
    data: ((data || []) as ReviewWithProfile[]).map(review => ({
      ...review,
      initials: (review.profiles?.full_name || 'U')
        .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
      name: review.profiles?.full_name || 'Utilisateur',
      date: new Date(review.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
      }),
    })),
    count: count ?? 0,
  }
}

export function useAvis(restaurantId: string | null | undefined, page = 0) {
  return useQuery({
    queryKey: ['vendeur', restaurantId, 'avis', page],
    queryFn:  () => fetchAvis(restaurantId as string, page),
    enabled:  !!restaurantId,
    placeholderData: keepPreviousData,
  })
}
