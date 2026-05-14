import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const PLAN_ORDER = { premium: 2, pro: 1, free: 0 }

export function useRestaurants(filters = {}) {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      setError('Supabase non configuré.')
      return
    }

    setLoading(true)
    setError(null)

    let query = supabase
      .from('restaurants')
      .select('*, reviews(rating)')
      .eq('is_active', true)

    if (filters.cuisine) query = query.eq('cuisine', filters.cuisine)

    query.then(async ({ data, error: err }) => {
      if (err) { setError(err.message); setLoading(false); return }

      const rests = data || []

      // Fetch subscriptions actives pour tous les owners
      const ownerIds = [...new Set(rests.map(r => r.owner_id).filter(Boolean))]
      let planMap = {}
      if (ownerIds.length > 0) {
        const { data: subs } = await supabase
          .from('subscriptions')
          .select('vendor_id, plan')
          .in('vendor_id', ownerIds)
          .eq('status', 'active')
        if (subs) subs.forEach(s => { planMap[s.vendor_id] = s.plan })
      }

      const enriched = rests.map(r => {
        const revs  = r.reviews || []
        const count = revs.length
        const avg   = count > 0
          ? Math.round(revs.reduce((s, rv) => s + rv.rating, 0) / count * 10) / 10
          : null
        const plan  = planMap[r.owner_id] || 'free'
        return { ...r, rating: avg, reviews: count, plan }
      })

      // Tri : Premium > Pro > Gratuit, puis par nombre d'avis
      enriched.sort((a, b) => {
        const planDiff = (PLAN_ORDER[b.plan] || 0) - (PLAN_ORDER[a.plan] || 0)
        return planDiff !== 0 ? planDiff : b.reviews - a.reviews
      })

      setRestaurants(enriched)
      setLoading(false)
    })
  }, [filters.cuisine])

  return { restaurants, loading, error }
}
