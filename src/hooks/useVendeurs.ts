import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Restaurant, RestaurantWithPlan, VendeurStats } from '../types/supabase'

type SubRow = { vendor_id: string | null; plan: string }

const PLAN_ORDER: Record<string, number> = { premium: 2, pro: 1, free: 0 }

export async function fetchVendeurs(cuisine?: string): Promise<RestaurantWithPlan[]> {
  const [restResult, subsResult, statsResult] = await Promise.all([
    (() => {
      let q = supabase.from('restaurants').select('*').eq('is_active', true)
      if (cuisine) q = q.eq('cuisine', cuisine)
      return q
    })(),
    supabase.from('subscriptions').select('vendor_id, plan').eq('status', 'active'),
    supabase.from('vendeurs_stats').select('restaurant_id, review_count, avg_rating'),
  ])

  if (restResult.error) throw restResult.error

  const rests    = (restResult.data  || []) as Restaurant[]
  const planMap  = Object.fromEntries(((subsResult.data  || []) as SubRow[]).map(s => [s.vendor_id, s.plan]))
  const statsMap = Object.fromEntries(((statsResult.data || []) as VendeurStats[]).map(s => [s.restaurant_id, s]))

  return rests
    .map(r => {
      const stats = statsMap[r.id] as { review_count: number; avg_rating: number | null } | undefined
      const plan  = (planMap[r.owner_id ?? ''] as RestaurantWithPlan['plan']) || 'free'
      return { ...r, rating: stats?.avg_rating ?? null, reviews: stats?.review_count ?? 0, plan }
    })
    .sort((a, b) => {
      const planDiff = (PLAN_ORDER[b.plan] || 0) - (PLAN_ORDER[a.plan] || 0)
      return planDiff !== 0 ? planDiff : b.reviews - a.reviews
    })
}

interface VendeursFilters { cuisine?: string }

export function useVendeurs(filters: VendeursFilters = {}) {
  const cuisine = filters.cuisine && filters.cuisine !== 'all' ? filters.cuisine : undefined
  return useQuery({
    queryKey: ['vendeurs', { cuisine }],
    queryFn:  () => fetchVendeurs(cuisine),
  })
}
