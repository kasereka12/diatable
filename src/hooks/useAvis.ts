import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Review, ReviewWithAuthor } from '../types/supabase'

type ReviewWithProfile = Review & { profiles?: { full_name: string | null } | null }

export async function fetchAvis(restaurantId: string): Promise<ReviewWithAuthor[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(full_name)')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error

  return ((data || []) as ReviewWithProfile[]).map(review => ({
    ...review,
    initials: (review.profiles?.full_name || 'U')
      .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
    name: review.profiles?.full_name || 'Utilisateur',
    date: new Date(review.created_at).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    }),
  }))
}

export function useAvis(restaurantId: string | null | undefined) {
  return useQuery({
    queryKey: ['vendeur', restaurantId, 'avis'],
    queryFn:  () => fetchAvis(restaurantId as string),
    enabled:  !!restaurantId,
  })
}
