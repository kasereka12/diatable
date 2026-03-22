import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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

    query.then(({ data, error: err }) => {
      if (err) {
        setError(err.message)
      } else {
        // Calcul réel note + compteur depuis la table reviews (comme VendorDashboard)
        const enriched = (data || []).map(r => {
          const revs = r.reviews || []
          const count = revs.length
          const avg = count > 0
            ? Math.round(revs.reduce((s, rv) => s + rv.rating, 0) / count * 10) / 10
            : null
          return { ...r, rating: avg, reviews: count }
        })
        // Tri : plus d'avis en premier
        enriched.sort((a, b) => b.reviews - a.reviews)
        setRestaurants(enriched)
      }
      setLoading(false)
    })
  }, [filters.cuisine])

  return { restaurants, loading, error }
}
